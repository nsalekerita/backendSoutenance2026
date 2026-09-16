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

const { query } = require("../config/database");
const { getMessaging } = require("../config/firebase");

async function enregistrerToken(userId, token, plateforme) {
    await query(
        `INSERT INTO device_tokens (user_id, token, plateforme, last_used_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (user_id, token) DO UPDATE SET plateforme = EXCLUDED.plateforme, last_used_at = EXCLUDED.last_used_at`,
        [userId, token, plateforme]
    );
    return { message: 'Token enregistré.' };
}

async function supprimerToken(userId, token) {
    await query(`DELETE FROM device_tokens WHERE user_id = $1 AND token = $2`, [userId, token]);
    return { message: 'Token supprimé.' };
}

async function mesNotifications(userId) {
    const { rows } = await query(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
    );
    return rows;
}

async function marquerLue(userId, notificationId) {
    const { rows } = await query(
        `UPDATE notifications SET lue = true WHERE id = $1 AND user_id = $2 RETURNING *`,
        [notificationId, userId]
    );
    return rows[0] ?? null;
}

/** Retire de device_tokens les tokens que FCM signale comme invalides/expirés
 * (l'appli a été désinstallée, ou le token a été renouvelé côté client). */
async function purgerTokensInvalides(tokens, reponses) {
    const tokensInvalides = reponses
        .map((r, i) => ({ r, token: tokens[i] }))
        .filter(({ r }) => r.error?.code === 'messaging/registration-token-not-registered' || r.error?.code === 'messaging/invalid-registration-token')
        .map(({ token }) => token);
    if (tokensInvalides.length) {
        await query(`DELETE FROM device_tokens WHERE token = ANY($1)`, [tokensInvalides]);
    }
}

/** Enregistre la notification en base (visible dans l'historique in-app) et
 * l'envoie en push sur tous les appareils connus de l'utilisateur. Ne lève
 * jamais d'erreur si Firebase n'est pas configuré ou si l'envoi échoue :
 * la notification reste consultable dans l'app même sans push. */
async function envoyerNotification(userId, { titre, corps, type, data }) {
    await query(
        `INSERT INTO notifications (user_id, titre, corps, type, data) VALUES ($1, $2, $3, $4, $5)`,
        [userId, titre, corps, type, data ? JSON.stringify(data) : null]
    );

    const messaging = getMessaging();
    if (!messaging) return;

    const { rows: appareils } = await query(`SELECT token FROM device_tokens WHERE user_id = $1`, [userId]);
    const tokens = appareils.map((a) => a.token);
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
    const { rows } = await query(`SELECT user_id FROM etudiants WHERE id = $1`, [etudiantId]);
    return rows[0]?.user_id ?? null;
}

async function userIdFromEntreprise(entrepriseId) {
    const { rows } = await query(`SELECT user_id FROM entreprises WHERE id = $1`, [entrepriseId]);
    return rows[0]?.user_id ?? null;
}

async function tousLesAdminUserIds() {
    const { rows } = await query(`SELECT user_id FROM administrateurs`);
    return rows.map((a) => a.user_id);
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
