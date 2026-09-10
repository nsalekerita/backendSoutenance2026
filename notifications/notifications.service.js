"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enregistrerToken = enregistrerToken;
exports.supprimerToken = supprimerToken;
exports.mesNotifications = mesNotifications;
exports.marquerLue = marquerLue;
exports.envoyerNotification = envoyerNotification;
exports.notifierEntrepriseDeOffre = notifierEntrepriseDeOffre;
exports.notifierEtudiantDeCandidature = notifierEtudiantDeCandidature;
exports.notifierAdminsNouvelleOffre = notifierAdminsNouvelleOffre;

const { supabaseAdmin } = require("../config/supabase");
const { getMessaging } = require("../config/firebase");

async function enregistrerToken(userId, token, plateforme) {
    const { error } = await supabaseAdmin
        .from('device_tokens')
        .upsert({ user_id: userId, token, plateforme, last_used_at: new Date().toISOString() }, { onConflict: 'user_id,token' });
    if (error) throw error;
    return { message: 'Token enregistré.' };
}

async function supprimerToken(userId, token) {
    await supabaseAdmin.from('device_tokens').delete().eq('user_id', userId).eq('token', token);
    return { message: 'Token supprimé.' };
}

async function mesNotifications(userId) {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) throw error;
    return data ?? [];
}

async function marquerLue(userId, notificationId) {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ lue: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .maybeSingle();
    if (error) throw error;
    return data;
}

/** Retire de device_tokens les tokens que FCM signale comme invalides/expirés
 * (l'appli a été désinstallée, ou le token a été renouvelé côté client). */
async function purgerTokensInvalides(tokens, reponses) {
    const tokensInvalides = reponses
        .map((r, i) => ({ r, token: tokens[i] }))
        .filter(({ r }) => r.error?.code === 'messaging/registration-token-not-registered' || r.error?.code === 'messaging/invalid-registration-token')
        .map(({ token }) => token);
    if (tokensInvalides.length) {
        await supabaseAdmin.from('device_tokens').delete().in('token', tokensInvalides);
    }
}

/** Enregistre la notification en base (visible dans l'historique in-app) et
 * l'envoie en push sur tous les appareils connus de l'utilisateur. Ne lève
 * jamais d'erreur si Firebase n'est pas configuré ou si l'envoi échoue :
 * la notification reste consultable dans l'app même sans push. */
async function envoyerNotification(userId, { titre, corps, type, data }) {
    await supabaseAdmin.from('notifications').insert({ user_id: userId, titre, corps, type, data: data ?? null });

    const messaging = getMessaging();
    if (!messaging) return;

    const { data: appareils } = await supabaseAdmin.from('device_tokens').select('token').eq('user_id', userId);
    const tokens = (appareils ?? []).map((a) => a.token);
    if (!tokens.length) return;

    try {
        const reponse = await messaging.sendEachForMulticast({
            tokens,
            notification: { title: titre, body: corps ?? '' },
            data: Object.fromEntries(Object.entries(data ?? {}).map(([k, v]) => [k, String(v)])),
        });
        await purgerTokensInvalides(tokens, reponse.responses);
    } catch (err) {
        console.error('[notifications] Échec envoi push:', err.message);
    }
}

async function userIdFromEtudiant(etudiantId) {
    const { data } = await supabaseAdmin.from('etudiants').select('user_id').eq('id', etudiantId).maybeSingle();
    return data?.user_id ?? null;
}

async function userIdFromEntreprise(entrepriseId) {
    const { data } = await supabaseAdmin.from('entreprises').select('user_id').eq('id', entrepriseId).maybeSingle();
    return data?.user_id ?? null;
}

async function tousLesAdminUserIds() {
    const { data } = await supabaseAdmin.from('administrateurs').select('user_id');
    return (data ?? []).map((a) => a.user_id);
}

/** Nouvelle candidature reçue sur une offre : notifie l'entreprise propriétaire. */
async function notifierEntrepriseDeOffre(entrepriseId, { titre, corps, type, data }) {
    const userId = await userIdFromEntreprise(entrepriseId);
    if (userId) await envoyerNotification(userId, { titre, corps, type, data });
}

/** Changement de statut d'une candidature (vue/acceptée/refusée) : notifie l'étudiant. */
async function notifierEtudiantDeCandidature(etudiantId, { titre, corps, type, data }) {
    const userId = await userIdFromEtudiant(etudiantId);
    if (userId) await envoyerNotification(userId, { titre, corps, type, data });
}

/** Nouvelle offre publiée par une entreprise, en attente de validation : notifie tous les admins. */
async function notifierAdminsNouvelleOffre({ titre, corps, type, data }) {
    const userIds = await tousLesAdminUserIds();
    await Promise.all(userIds.map((userId) => envoyerNotification(userId, { titre, corps, type, data })));
}
