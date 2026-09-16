"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refuser = exports.accepter = void 0;
exports.postuler = postuler;
exports.mesCandidatures = mesCandidatures;
exports.candidaturesPourOffre = candidaturesPourOffre;
exports.getSignedUploadUrl = getSignedUploadUrl;
exports.getPublicUrl = getPublicUrl;
exports.candidaturesPourEntreprise = candidaturesPourEntreprise;
const supabase_1 = require("../config/supabase");
const notifications_1 = require("../notifications/notifications.service");
const BUCKETS_CANDIDATURE = new Set(['cvs', 'lettres-motivation', 'recommandations']);
function assertBucket(bucket) {
    if (!BUCKETS_CANDIDATURE.has(bucket)) {
        const err = new Error('Type de document non autorisé'); err.status = 422; throw err;
    }
}
async function getSignedUploadUrl(etudiantId, bucket, fileName) {
    assertBucket(bucket);
    const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${etudiantId}/${Date.now()}-${safeName}`;
    const { data, error } = await supabase_1.supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw error;
    return { upload_url: data.signedUrl, cle_fichier: path };
}
function getPublicUrl(etudiantId, bucket, path) {
    assertBucket(bucket);
    if (!String(path).startsWith(`${etudiantId}/`)) {
        const err = new Error('Document non autorisé'); err.status = 403; throw err;
    }
    const { data } = supabase_1.supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl };
}
async function postuler(etudiantId, offreId, cv_url, message, documents = {}) {
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
        .insert({ offre_id: offreId, etudiant_id: etudiantId, cv_url, message, statut: 'envoyee', ...documents })
        .select('*, offres(titre, entreprise_id)')
        .single();
    if (error)
        throw error;
    if (data.offres) {
        await notifications_1.notifierEntrepriseDeOffre(data.offres.entreprise_id, {
            titre: 'Nouvelle candidature',
            corps: `Un étudiant a postulé à votre offre "${data.offres.titre}".`,
            type: 'candidature_recue',
            data: { candidatureId: data.id, offreId },
        });
    }
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
        .select('*, etudiants(id, nom, prenom, filiere, specialite)')
        .eq('offre_id', offreId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
async function candidaturesPourEntreprise(entrepriseId) {
    const { data, error } = await supabase_1.supabaseAdmin.from('candidatures')
        .select('*, etudiants(id, user_id, nom, prenom, filiere, specialite, photo_url), offres!inner(id, titre, entreprise_id)')
        .eq('offres.entreprise_id', entrepriseId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
}
const LIBELLES_STATUT = {
    vue: 'a été vue par le recruteur',
    acceptee: 'a été acceptée',
    refusee: "n'a pas été retenue",
};
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
        .select('*, offres(titre)')
        .single();
    if (error)
        throw error;
    await notifications_1.notifierEtudiantDeCandidature(data.etudiant_id, {
        titre: 'Mise à jour de votre candidature',
        corps: `Votre candidature pour "${data.offres?.titre ?? 'une offre'}" ${LIBELLES_STATUT[statut] ?? `est passée à "${statut}"`}.`,
        type: 'candidature_statut',
        data: { candidatureId, statut },
    });
    return data;
}
const accepter = (candidatureId, entrepriseId) => changerStatut(candidatureId, 'acceptee', entrepriseId);
exports.accepter = accepter;
const refuser = (candidatureId, entrepriseId) => changerStatut(candidatureId, 'refusee', entrepriseId);
exports.refuser = refuser;
