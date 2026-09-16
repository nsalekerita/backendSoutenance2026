"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statistiquesGlobales = statistiquesGlobales;
exports.listerComptes = listerComptes;
exports.bloquerCompte = bloquerCompte;
exports.debloquerCompte = debloquerCompte;
exports.listerOffresPourAdmin = listerOffresPourAdmin;
exports.changerStatutOffre = changerStatutOffre;
exports.validerEntreprise = validerEntreprise;
exports.supprimerCompte = supprimerCompte;
const supabase_1 = require("../config/supabase");
const notifications_1 = require("../notifications/notifications.service");
async function statistiquesGlobales() {
    const [{ count: nbEtudiants }, { count: nbEntreprises }, { count: nbOffres }, { count: nbCandidatures }] = await Promise.all([
        supabase_1.supabaseAdmin.from('etudiants').select('*', { count: 'exact', head: true }),
        supabase_1.supabaseAdmin.from('entreprises').select('*', { count: 'exact', head: true }),
        supabase_1.supabaseAdmin.from('offres').select('*', { count: 'exact', head: true }),
        supabase_1.supabaseAdmin.from('candidatures').select('*', { count: 'exact', head: true }),
    ]);
    const { data: offresParStatut } = await supabase_1.supabaseAdmin.from('offres').select('statut');
    const repartitionStatuts = (offresParStatut ?? []).reduce((acc, o) => {
        acc[o.statut] = (acc[o.statut] ?? 0) + 1;
        return acc;
    }, {});
    return {
        nbEtudiants: nbEtudiants ?? 0,
        nbEntreprises: nbEntreprises ?? 0,
        nbOffres: nbOffres ?? 0,
        nbCandidatures: nbCandidatures ?? 0,
        repartitionStatutsOffres: repartitionStatuts,
    };
}
async function listerComptes(role) {
    let query = supabase_1.supabaseAdmin.from('users').select('id, email, role, actif, created_at');
    if (role)
        query = query.eq('role', role);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
async function setCompteActif(userId, actif) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('users')
        .update({ actif })
        .eq('id', userId)
        .select('id, email, role, actif')
        .maybeSingle();
    if (error)
        throw error;
    if (!data) {
        const err = new Error('Compte introuvable');
        err.status = 404;
        throw err;
    }
    return data;
}
async function bloquerCompte(userId) {
    return setCompteActif(userId, false);
}
async function debloquerCompte(userId) {
    return setCompteActif(userId, true);
}
// Supprime "à la main" toutes les données qui dépendent du compte avant de
// supprimer la ligne users elle-même : certaines tables ajoutées après la
// migration initiale (device_tokens, notifications, entreprise_conversations,
// etudiant_notes...) ne sont pas forcément en "on delete cascade" sur la base
// réelle, ce qui faisait échouer la suppression avec une violation de
// contrainte de clé étrangère (le blocage, qui ne fait qu'un update, n'est
// lui jamais concerné).
async function nettoyerDependancesEtudiant(etudiantId) {
    const { data: recommandations } = await supabase_1.supabaseAdmin
        .from('recommandations').select('id').eq('etudiant_id', etudiantId);
    const recommandationIds = (recommandations ?? []).map((r) => r.id);
    if (recommandationIds.length) {
        await supabase_1.supabaseAdmin.from('scores_filieres').delete().in('recommandation_id', recommandationIds);
    }
    const { data: profilsWizard } = await supabase_1.supabaseAdmin
        .from('profils_wizard').select('id').eq('etudiant_id', etudiantId);
    const profilsWizardIds = (profilsWizard ?? []).map((p) => p.id);
    if (profilsWizardIds.length) {
        await supabase_1.supabaseAdmin.from('wizard_reponses').delete().in('profil_wizard_id', profilsWizardIds);
    }
    const { data: conversations } = await supabase_1.supabaseAdmin
        .from('conversations').select('id').eq('etudiant_id', etudiantId);
    const conversationIds = (conversations ?? []).map((c) => c.id);
    if (conversationIds.length) {
        await supabase_1.supabaseAdmin.from('messages').delete().in('conversation_id', conversationIds);
    }
    const { data: entrepriseConversations } = await supabase_1.supabaseAdmin
        .from('entreprise_conversations').select('id').eq('etudiant_id', etudiantId);
    const entrepriseConversationIds = (entrepriseConversations ?? []).map((c) => c.id);
    if (entrepriseConversationIds.length) {
        await supabase_1.supabaseAdmin.from('entreprise_messages').delete().in('conversation_id', entrepriseConversationIds);
    }
    await Promise.all([
        supabase_1.supabaseAdmin.from('profils_wizard').delete().eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_competences').delete().eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_interets').delete().eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('recommandations').delete().eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('candidatures').delete().eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('conversations').delete().eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_notes').delete().eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('entreprise_conversations').delete().eq('etudiant_id', etudiantId),
    ]);
}
async function nettoyerDependancesEntreprise(entrepriseId) {
    const { data: offres } = await supabase_1.supabaseAdmin
        .from('offres').select('id').eq('entreprise_id', entrepriseId);
    const offreIds = (offres ?? []).map((o) => o.id);
    if (offreIds.length) {
        await supabase_1.supabaseAdmin.from('candidatures').delete().in('offre_id', offreIds);
    }
    const { data: entrepriseConversations } = await supabase_1.supabaseAdmin
        .from('entreprise_conversations').select('id').eq('entreprise_id', entrepriseId);
    const entrepriseConversationIds = (entrepriseConversations ?? []).map((c) => c.id);
    if (entrepriseConversationIds.length) {
        await supabase_1.supabaseAdmin.from('entreprise_messages').delete().in('conversation_id', entrepriseConversationIds);
    }
    await Promise.all([
        supabase_1.supabaseAdmin.from('offres').delete().eq('entreprise_id', entrepriseId),
        supabase_1.supabaseAdmin.from('entreprise_conversations').delete().eq('entreprise_id', entrepriseId),
    ]);
}
async function supprimerCompte(userId, adminUserId) {
    if (userId === adminUserId) {
        const err = new Error('Vous ne pouvez pas supprimer votre propre compte');
        err.status = 409;
        throw err;
    }
    const { data: compte, error: erreurCompte } = await supabase_1.supabaseAdmin
        .from('users').select('id, role').eq('id', userId).maybeSingle();
    if (erreurCompte) throw erreurCompte;
    if (!compte) {
        const err = new Error('Compte introuvable'); err.status = 404; throw err;
    }
    await supabase_1.supabaseAdmin.from('device_tokens').delete().eq('user_id', userId);
    await supabase_1.supabaseAdmin.from('notifications').delete().eq('user_id', userId);
    if (compte.role === 'etudiant') {
        const { data: etudiant } = await supabase_1.supabaseAdmin
            .from('etudiants').select('id').eq('user_id', userId).maybeSingle();
        if (etudiant) await nettoyerDependancesEtudiant(etudiant.id);
    }
    else if (compte.role === 'entreprise') {
        const { data: entreprise } = await supabase_1.supabaseAdmin
            .from('entreprises').select('id').eq('user_id', userId).maybeSingle();
        if (entreprise) await nettoyerDependancesEntreprise(entreprise.id);
    }
    const { data, error } = await supabase_1.supabaseAdmin.from('users').delete()
        .eq('id', userId).select('id').maybeSingle();
    if (error) throw error;
    if (!data) {
        const err = new Error('Compte introuvable'); err.status = 404; throw err;
    }
    return data;
}
async function listerOffresPourAdmin(statut) {
    let query = supabase_1.supabaseAdmin.from('offres').select('*, entreprises(nom)');
    if (statut)
        query = query.eq('statut', statut);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
const LIBELLES_STATUT_OFFRE = {
    validee: 'a été validée et est désormais visible par les étudiants',
    rejetee: 'a été rejetée',
    cloturee: 'a été clôturée',
};
async function changerStatutOffre(offreId, statut) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('offres')
        .update({ statut })
        .eq('id', offreId)
        .select('*, entreprises(id)')
        .single();
    if (error)
        throw error;
    if (data.entreprises) {
        await notifications_1.notifierEntrepriseDeOffre(data.entreprises.id, {
            titre: 'Statut de votre offre mis à jour',
            corps: `Votre offre "${data.titre}" ${LIBELLES_STATUT_OFFRE[statut] ?? `est passée au statut "${statut}"`}.`,
            type: 'offre_statut',
            data: { offreId, statut },
        });
    }
    return data;
}
async function validerEntreprise(entrepriseId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('entreprises')
        .update({ statut_verification: 'validee' })
        .eq('id', entrepriseId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
