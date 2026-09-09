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
/** Vérifie que l'offre appartient bien à l'entreprise authentifiée ; lève une 403/404 sinon. */
async function assertOffreAppartientAEntreprise(offreId, entrepriseId) {
    const { data: offre, error } = await supabase_1.supabaseAdmin
        .from('offres')
        .select('id, entreprise_id')
        .eq('id', offreId)
        .maybeSingle();
    if (error)
        throw error;
    if (!offre) {
        const err = new Error("Offre introuvable");
        err.status = 404;
        throw err;
    }
    if (offre.entreprise_id !== entrepriseId) {
        const err = new Error("Cette offre n'appartient pas à votre entreprise");
        err.status = 403;
        throw err;
    }
}
/** Vérifie que la candidature appartient bien (via son offre) à l'entreprise authentifiée. */
async function getCandidatureAvecOffre(candidatureId) {
    const { data: candidature, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .select('id, offre_id, offres(entreprise_id)')
        .eq('id', candidatureId)
        .maybeSingle();
    if (error)
        throw error;
    if (!candidature) {
        const err = new Error('Candidature introuvable');
        err.status = 404;
        throw err;
    }
    return candidature;
}
async function candidaturesPourOffre(offreId, entrepriseId) {
    await assertOffreAppartientAEntreprise(offreId, entrepriseId);
    const { data, error } = await supabase_1.supabaseAdmin
        .from('candidatures')
        .select('*, etudiants(nom, prenom)')
        .eq('offre_id', offreId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
async function changerStatut(candidatureId, statut, entrepriseId) {
    const candidature = await getCandidatureAvecOffre(candidatureId);
    if (candidature.offres?.entreprise_id !== entrepriseId) {
        const err = new Error("Cette candidature n'appartient pas à votre entreprise");
        err.status = 403;
        throw err;
    }
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
const accepter = (candidatureId, entrepriseId) => changerStatut(candidatureId, 'acceptee', entrepriseId);
exports.accepter = accepter;
const refuser = (candidatureId, entrepriseId) => changerStatut(candidatureId, 'refusee', entrepriseId);
exports.refuser = refuser;
