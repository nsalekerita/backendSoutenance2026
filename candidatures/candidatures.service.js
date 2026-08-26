"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refuser = exports.accepter = void 0;
exports.postuler = postuler;
exports.mesCandidatures = mesCandidatures;
exports.candidaturesPourOffre = candidaturesPourOffre;
const supabase_1 = require("../config/supabase");
async function postuler(etudiantId, offreId, cv_url, message) {
    const { data: existante } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .select('id')
        .eq('offre_id', offreId)
        .eq('etudiant_id', etudiantId)
        .maybeSingle();
    if (existante) {
        const err = new Error('Vous avez déjà postulé à cette offre');
        err.status = 409;
        throw err;
    }
    const { data, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .insert({ offre_id: offreId, etudiant_id: etudiantId, cv_url, message, statut: 'envoyee' })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function mesCandidatures(etudiantId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .select('*, offres(titre, type, localisation, entreprises(nom))')
        .eq('etudiant_id', etudiantId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
async function candidaturesPourOffre(offreId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .select('*, etudiants(nom, prenom)')
        .eq('offre_id', offreId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
async function changerStatut(candidatureId, statut) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .update({ statut })
        .eq('id', candidatureId)
        .select()
        .single();
    if (error)
        throw error;
    // TODO: notifier l'étudiant (email / notification push) que sa candidature a changé de statut.
    return data;
}
const accepter = (candidatureId) => changerStatut(candidatureId, 'acceptee');
exports.accepter = accepter;
const refuser = (candidatureId) => changerStatut(candidatureId, 'refusee');
exports.refuser = refuser;
