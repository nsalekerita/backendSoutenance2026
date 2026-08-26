"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statistiquesGlobales = statistiquesGlobales;
exports.listerComptes = listerComptes;
exports.bloquerCompte = bloquerCompte;
exports.listerOffresPourAdmin = listerOffresPourAdmin;
exports.changerStatutOffre = changerStatutOffre;
exports.validerEntreprise = validerEntreprise;
const supabase_1 = require("../config/supabase");
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
    let query = supabase_1.supabaseAdmin.from('users').select('id, email, role, created_at');
    if (role)
        query = query.eq('role', role);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
async function bloquerCompte(_userId) {
    // NB: la migration fournie n'a pas de colonne "actif"/"bloque" sur users.
    // À ajouter (ex: `alter table users add column actif boolean not null default true;`)
    // avant de pouvoir réellement bloquer un compte. Squelette laissé en place.
    throw Object.assign(new Error("Ajouter une colonne 'actif' à la table users pour activer ce blocage"), {
        status: 501,
    });
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
async function changerStatutOffre(offreId, statut) {
    const { data, error } = await supabase_1.supabaseAdmin.from('offres').update({ statut }).eq('id', offreId).select().single();
    if (error)
        throw error;
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
