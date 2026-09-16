"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refuser = exports.accepter = void 0;
exports.postuler = postuler;
exports.mesCandidatures = mesCandidatures;
exports.candidaturesPourOffre = candidaturesPourOffre;
exports.getSignedUploadUrl = getSignedUploadUrl;
exports.getPublicUrl = getPublicUrl;
exports.candidaturesPourEntreprise = candidaturesPourEntreprise;
const { storage } = require("../config/storage");
const notifications_1 = require("../notifications/notifications.service");
const { query } = require('../config/database');
function identifier(value) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error(`Identifiant SQL invalide: ${value}`);
    return `"${value}"`;
}
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
    const { data, error } = await storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw error;
    return { upload_url: data.signedUrl, cle_fichier: path };
}
function getPublicUrl(etudiantId, bucket, path) {
    assertBucket(bucket);
    if (!String(path).startsWith(`${etudiantId}/`)) {
        const err = new Error('Document non autorisé'); err.status = 403; throw err;
    }
    const { data } = storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl };
}
async function postuler(etudiantId, offreId, cv_url, message, documents = {}) {
    const { rows: existantes } = await query(
        `SELECT id FROM candidatures WHERE offre_id = $1 AND etudiant_id = $2`,
        [offreId, etudiantId]
    );
    if (existantes.length) {
        const err = new Error('Vous avez déjà postulé à cette offre');
        err.status = 409;
        throw err;
    }
    const colonnesDocuments = Object.keys(documents);
    const colonnes = ['offre_id', 'etudiant_id', 'cv_url', 'message', 'statut', ...colonnesDocuments];
    const valeurs = [offreId, etudiantId, cv_url, message, 'envoyee', ...colonnesDocuments.map((c) => documents[c])];
    const placeholders = valeurs.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await query(
        `INSERT INTO candidatures (${colonnes.map(identifier).join(',')}) VALUES (${placeholders}) RETURNING *`,
        valeurs
    );
    const candidature = rows[0];
    const { rows: offreRows } = await query(
        `SELECT titre, entreprise_id FROM offres WHERE id = $1`,
        [offreId]
    );
    const offre = offreRows[0];
    if (offre) {
        await notifications_1.notifierEntrepriseDeOffre(offre.entreprise_id, {
            titre: 'Nouvelle candidature',
            corps: `Un étudiant a postulé à votre offre "${offre.titre}".`,
            type: 'candidature_recue',
            data: { candidatureId: candidature.id, offreId },
        });
    }
    return { ...candidature, offres: offre ?? null };
}
async function mesCandidatures(etudiantId) {
    const { rows } = await query(
        `SELECT c.*,
           json_build_object('titre', o.titre, 'type', o.type, 'localisation', o.localisation,
             'entreprises', json_build_object('nom', ent.nom)) AS offres
         FROM candidatures c
         JOIN offres o ON o.id = c.offre_id
         JOIN entreprises ent ON ent.id = o.entreprise_id
         WHERE c.etudiant_id = $1
         ORDER BY c.created_at DESC`,
        [etudiantId]
    );
    return rows;
}
/** Vérifie que l'offre appartient bien à l'entreprise authentifiée ; lève une 403/404 sinon. */
async function assertOffreAppartientAEntreprise(offreId, entrepriseId) {
    const { rows } = await query(`SELECT id, entreprise_id FROM offres WHERE id = $1`, [offreId]);
    const offre = rows[0];
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
    const { rows } = await query(
        `SELECT c.id, c.offre_id, c.etudiant_id, json_build_object('entreprise_id', o.entreprise_id, 'titre', o.titre) AS offres
         FROM candidatures c JOIN offres o ON o.id = c.offre_id
         WHERE c.id = $1`,
        [candidatureId]
    );
    const candidature = rows[0];
    if (!candidature) {
        const err = new Error('Candidature introuvable');
        err.status = 404;
        throw err;
    }
    return candidature;
}
async function candidaturesPourOffre(offreId, entrepriseId) {
    await assertOffreAppartientAEntreprise(offreId, entrepriseId);
    const { rows } = await query(
        `SELECT c.*, json_build_object('nom', e.nom, 'prenom', e.prenom, 'id', e.id, 'filiere', e.filiere, 'specialite', e.specialite) AS etudiants
         FROM candidatures c JOIN etudiants e ON e.id = c.etudiant_id
         WHERE c.offre_id = $1
         ORDER BY c.created_at DESC`,
        [offreId]
    );
    return rows;
}
async function candidaturesPourEntreprise(entrepriseId) {
    const { rows } = await query(`
        SELECT c.*,
          json_build_object('id', e.id, 'user_id', e.user_id, 'nom', e.nom, 'prenom', e.prenom,
            'filiere', e.filiere, 'specialite', e.specialite, 'photo_url', e.photo_url) AS etudiants,
          json_build_object('id', o.id, 'titre', o.titre, 'entreprise_id', o.entreprise_id) AS offres
        FROM candidatures c
        JOIN etudiants e ON e.id = c.etudiant_id
        JOIN offres o ON o.id = c.offre_id
        WHERE o.entreprise_id = $1
        ORDER BY c.created_at DESC`, [entrepriseId]);
    return rows;
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
    const { rows } = await query(
        `UPDATE candidatures SET statut = $1 WHERE id = $2 RETURNING *`,
        [statut, candidatureId]
    );
    const data = rows[0];
    await notifications_1.notifierEtudiantDeCandidature(data.etudiant_id, {
        titre: 'Mise à jour de votre candidature',
        corps: `Votre candidature pour "${candidature.offres?.titre ?? 'une offre'}" ${LIBELLES_STATUT[statut] ?? `est passée à "${statut}"`}.`,
        type: 'candidature_statut',
        data: { candidatureId, statut },
    });
    return { ...data, offres: candidature.offres };
}
const accepter = (candidatureId, entrepriseId) => changerStatut(candidatureId, 'acceptee', entrepriseId);
exports.accepter = accepter;
const refuser = (candidatureId, entrepriseId) => changerStatut(candidatureId, 'refusee', entrepriseId);
exports.refuser = refuser;
