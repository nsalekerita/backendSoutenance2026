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
async function supprimerCompte(userId, adminUserId) {
    if (userId === adminUserId) {
        const err = new Error('Vous ne pouvez pas supprimer votre propre compte');
        err.status = 409;
        throw err;
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
