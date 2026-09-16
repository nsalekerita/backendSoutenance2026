"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfilComplet = getProfilComplet;
exports.updateProfil = updateProfil;
exports.addCompetence = addCompetence;
exports.addInteret = addInteret;
exports.deleteCompetence = deleteCompetence;
exports.deleteInteret = deleteInteret;
exports.enregistrerReponseWizard = enregistrerReponseWizard;
exports.terminerWizard = terminerWizard;
exports.getSignedCvUploadUrl = getSignedCvUploadUrl;
exports.confirmerCv = confirmerCv;
exports.getSignedPhotoUploadUrl = getSignedPhotoUploadUrl;
exports.confirmerPhoto = confirmerPhoto;
exports.getSignedNoteUploadUrl = getSignedNoteUploadUrl;
exports.confirmerNote = confirmerNote;
exports.updateNote = updateNote;
exports.deleteNote = deleteNote;
exports.getRecommandations = getRecommandations;
const { query } = require("../config/database");
const { storage } = require("../config/storage");

/**
 * Colonnes réelles de la table "etudiants" chargées pour l'écran de profil.
 * IMPORTANT : "filiere" et "specialite" sont ici des colonnes texte libres
 * (et non plus filiere_actuelle_id + jointure), pour matcher les TextField
 * du formulaire Flutter (student_profile_screen._openEditDialog).
 * Si un jour tu veux revenir à une table de référence "filieres", il
 * faudra aussi changer le TextField Flutter en Dropdown.
 *
 * "notes" est désormais une liste d'images de bulletins (table
 * "etudiant_notes"), et non plus des triplets matiere/note/semestre saisis
 * manuellement — voir getSignedNoteUploadUrl / confirmerNote / updateNote /
 * deleteNote plus bas.
 */
async function getProfilComplet(etudiantId) {
    const [{ rows: etudiantRows }, { rows: competences }, { rows: interets }, { rows: wizardRows }, { rows: notes }] = await Promise.all([
        query(
            `SELECT id, nom, prenom, niveau, filiere, specialite, photo_url, cv_chemin, cv_nom_fichier
             FROM etudiants WHERE id = $1`,
            [etudiantId]
        ),
        query('SELECT * FROM etudiant_competences WHERE etudiant_id = $1', [etudiantId]),
        query('SELECT * FROM etudiant_interets WHERE etudiant_id = $1', [etudiantId]),
        query('SELECT * FROM profils_wizard WHERE etudiant_id = $1', [etudiantId]),
        query('SELECT * FROM etudiant_notes WHERE etudiant_id = $1 ORDER BY created_at DESC', [etudiantId]),
    ]);
    const etudiant = etudiantRows[0] ?? null;

    const cv = etudiant?.cv_nom_fichier
        ? { nom_fichier: etudiant.cv_nom_fichier, chemin: etudiant.cv_chemin }
        : null;

    return {
        etudiant,
        competences,
        interets,
        wizard: wizardRows[0] ?? null,
        cv,
        notes,
    };
}

/**
 * Liste blanche des champs modifiables via PUT /profils/moi.
 * Évite qu'un champ absent du schéma (ex: un ancien "filiere_actuelle_id")
 * fasse échouer silencieusement tout l'update PostgREST.
 */
const CHAMPS_MODIFIABLES = ['prenom', 'nom', 'filiere', 'specialite', 'niveau'];

async function updateProfil(etudiantId, updates) {
    const colonnes = [];
    const valeurs = [];
    for (const champ of CHAMPS_MODIFIABLES) {
        if (updates?.[champ] !== undefined) {
            colonnes.push(champ);
            valeurs.push(updates[champ]);
        }
    }
    valeurs.push(etudiantId);
    const setSql = colonnes.map((c, i) => `${c} = $${i + 1}`).join(',');
    const { rows } = await query(
        `UPDATE etudiants SET ${setSql} WHERE id = $${valeurs.length} RETURNING *`,
        valeurs
    );
    return rows[0];
}

async function addCompetence(etudiantId, competence_nom, niveau) {
    const { rows } = await query(
        `INSERT INTO etudiant_competences (etudiant_id, competence_nom, niveau) VALUES ($1, $2, $3) RETURNING *`,
        [etudiantId, competence_nom, niveau]
    );
    return rows[0];
}

async function addInteret(etudiantId, domaine) {
    const { rows } = await query(
        `INSERT INTO etudiant_interets (etudiant_id, domaine) VALUES ($1, $2) RETURNING *`,
        [etudiantId, domaine]
    );
    return rows[0];
}

/** Supprime une compétence, en s'assurant qu'elle appartient bien à l'étudiant authentifié. */
async function deleteCompetence(etudiantId, competenceId) {
    await query(
        `DELETE FROM etudiant_competences WHERE id = $1 AND etudiant_id = $2`,
        [competenceId, etudiantId]
    );
    return { id: competenceId };
}

/** Supprime un centre d'intérêt, en s'assurant qu'il appartient bien à l'étudiant authentifié. */
async function deleteInteret(etudiantId, interetId) {
    await query(
        `DELETE FROM etudiant_interets WHERE id = $1 AND etudiant_id = $2`,
        [interetId, etudiantId]
    );
    return { id: interetId };
}

/** Enregistre une réponse d'étape du wizard d'orientation et avance etape_courante */
async function enregistrerReponseWizard(etudiantId, etape, question_id, reponse) {
    const { rows: wizardRows } = await query(
        `SELECT id, etape_courante FROM profils_wizard WHERE etudiant_id = $1`,
        [etudiantId]
    );
    const wizard = wizardRows[0];
    if (!wizard) {
        const err = new Error('Wizard introuvable pour cet étudiant');
        err.status = 404;
        throw err;
    }
    await query(
        `INSERT INTO wizard_reponses (profil_wizard_id, etape, question_id, reponse) VALUES ($1, $2, $3, $4)`,
        [wizard.id, etape, question_id, JSON.stringify(reponse)]
    );
    const etapeCourante = Math.max(wizard.etape_courante, etape + 1);
    await query(`UPDATE profils_wizard SET etape_courante = $1 WHERE id = $2`, [etapeCourante, wizard.id]);
    return { etape_courante: etapeCourante };
}

async function terminerWizard(etudiantId) {
    await query(`UPDATE profils_wizard SET statut = 'termine' WHERE etudiant_id = $1`, [etudiantId]);
}

/**
 * Upload de CV : stockage privé dans le préfixe "cvs/" de kerita-media.
 * Les clés de retour (upload_url / cle_fichier) matchent ce qu'attend le
 * client Flutter — ne pas renommer sans mettre à jour student_profile_screen.dart.
 */
async function getSignedCvUploadUrl(etudiantId, fileName) {
    const path = `${etudiantId}/${Date.now()}-${fileName}`;
    const { data, error } = await storage.from('cvs').createSignedUploadUrl(path);
    if (error)
        throw error;
    return { upload_url: data.signedUrl, cle_fichier: path };
}

/** Rattache le CV uploadé au profil étudiant (appelé après l'upload effectif vers l'URL signée). */
async function confirmerCv(etudiantId, cheminFichier, nomFichier) {
    const { rows } = await query(
        `UPDATE etudiants SET cv_chemin = $1, cv_nom_fichier = $2 WHERE id = $3 RETURNING *`,
        [cheminFichier, nomFichier, etudiantId]
    );
    return rows[0];
}

/**
 * Upload de photo : stockage privé dans "photos/" et lecture via CloudFront.
 */
async function getSignedPhotoUploadUrl(etudiantId, fileName) {
    const path = `${etudiantId}/${Date.now()}-${fileName}`;
    const { data, error } = await storage.from('photos').createSignedUploadUrl(path);
    if (error)
        throw error;
    return { upload_url: data.signedUrl, cle_fichier: path };
}

/** Rattache la photo uploadée au profil étudiant (appelé après l'upload effectif vers l'URL signée). */
async function confirmerPhoto(etudiantId, cheminFichier) {
    const { data: publicUrlData } = storage.from('photos').getPublicUrl(cheminFichier);
    const { rows } = await query(
        `UPDATE etudiants SET photo_url = $1 WHERE id = $2 RETURNING *`,
        [publicUrlData.publicUrl, etudiantId]
    );
    return rows[0];
}

/**
 * Notes = images de bulletins/relevés, stockées dans "notes-bulletins/" du
 * bucket S3 privé et distribuées via CloudFront. Chaque note
 * est une ligne de la table "etudiant_notes" : id, etudiant_id,
 * chemin_fichier, nom_fichier, url, semestre, created_at.
 */
async function getSignedNoteUploadUrl(etudiantId, fileName) {
    const path = `${etudiantId}/${Date.now()}-${fileName}`;
    const { data, error } = await storage.from('notes-bulletins').createSignedUploadUrl(path);
    if (error)
        throw error;
    return { upload_url: data.signedUrl, cle_fichier: path };
}

/** Crée une nouvelle note (image de bulletin) après upload effectif vers l'URL signée. */
async function confirmerNote(etudiantId, cheminFichier, nomFichier, semestre) {
    const { data: publicUrlData } = storage.from('notes-bulletins').getPublicUrl(cheminFichier);
    const { rows } = await query(
        `INSERT INTO etudiant_notes (etudiant_id, chemin_fichier, nom_fichier, url, semestre)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [etudiantId, cheminFichier, nomFichier ?? null, publicUrlData.publicUrl, semestre ?? null]
    );
    return rows[0];
}

/**
 * Met à jour une note existante : remplace l'image (si cle_fichier est
 * fourni) et/ou le libellé "semestre". Supprime l'ancien fichier du storage
 * quand l'image est remplacée, pour éviter d'accumuler des fichiers
 * orphelins. Vérifie que la note appartient bien à l'étudiant authentifié.
 */
async function updateNote(etudiantId, noteId, { cle_fichier, nom_fichier, semestre } = {}) {
    const { rows: existanteRows } = await query(
        `SELECT chemin_fichier FROM etudiant_notes WHERE id = $1 AND etudiant_id = $2`,
        [noteId, etudiantId]
    );
    const existante = existanteRows[0];
    if (!existante) {
        const err = new Error('Note introuvable');
        err.status = 404;
        throw err;
    }

    const colonnes = [];
    const valeurs = [];
    if (semestre !== undefined) {
        colonnes.push('semestre');
        valeurs.push(semestre);
    }

    if (cle_fichier) {
        const { data: publicUrlData } = storage.from('notes-bulletins').getPublicUrl(cle_fichier);
        colonnes.push('chemin_fichier', 'nom_fichier', 'url');
        valeurs.push(cle_fichier, nom_fichier ?? null, publicUrlData.publicUrl);
    }

    valeurs.push(noteId, etudiantId);
    const setSql = colonnes.map((c, i) => `${c} = $${i + 1}`).join(',');
    const { rows } = await query(
        `UPDATE etudiant_notes SET ${setSql} WHERE id = $${valeurs.length - 1} AND etudiant_id = $${valeurs.length} RETURNING *`,
        valeurs
    );

    if (cle_fichier && existante.chemin_fichier) {
        await storage.from('notes-bulletins').remove([existante.chemin_fichier]);
    }
    return rows[0];
}

/** Supprime une note (ligne + fichier associé dans le storage), en s'assurant qu'elle appartient bien à l'étudiant authentifié. */
async function deleteNote(etudiantId, noteId) {
    const { rows: existanteRows } = await query(
        `SELECT chemin_fichier FROM etudiant_notes WHERE id = $1 AND etudiant_id = $2`,
        [noteId, etudiantId]
    );
    const existante = existanteRows[0];
    if (!existante) {
        const err = new Error('Note introuvable');
        err.status = 404;
        throw err;
    }

    await query(`DELETE FROM etudiant_notes WHERE id = $1 AND etudiant_id = $2`, [noteId, etudiantId]);

    if (existante.chemin_fichier) {
        await storage.from('notes-bulletins').remove([existante.chemin_fichier]);
    }
    return { id: noteId };
}

/**
 * Recommandations d'offres pour l'étudiant, basées sur un score simple de
 * correspondance entre ses compétences/centres d'intérêt et les offres
 * validées. Adapte les noms de colonnes ('statut', 'competences_requises')
 * si ton schéma "offres" diffère.
 */
async function getRecommandations(etudiantId) {
    const [{ rows: competences }, { rows: interets }, { rows: offres }] = await Promise.all([
        query('SELECT competence_nom FROM etudiant_competences WHERE etudiant_id = $1', [etudiantId]),
        query('SELECT domaine FROM etudiant_interets WHERE etudiant_id = $1', [etudiantId]),
        query(`SELECT * FROM offres WHERE statut = 'validee'`),
    ]);

    const mesCompetences = competences.map((c) => c.competence_nom.toLowerCase());
    const mesInterets = interets.map((i) => i.domaine.toLowerCase());

    const scored = offres.map((offre) => {
        const offreCompetences = Array.isArray(offre.competences_requises)
            ? offre.competences_requises.map((c) => String(c).toLowerCase())
            : [];
        const matchCompetences = offreCompetences.filter((c) => mesCompetences.includes(c)).length;
        const matchInteret = mesInterets.some((i) =>
            (offre.titre ?? '').toLowerCase().includes(i) || (offre.description ?? '').toLowerCase().includes(i)
        ) ? 1 : 0;
        const score = matchCompetences * 2 + matchInteret;
        return { offre, score };
    });

    // NOTE : ceci ne recommande que des offres (métiers/stages) faute d'un
    // référentiel de spécialités/technologies/certifications/formations en
    // base. Le champ "type" reste 'metier' pour matcher l'icône attendue
    // côté Flutter (student_profile_screen._iconForType). Si tu as (ou
    // ajoutes) des tables dédiées aux spécialités, technologies,
    // certifications et formations, il faudra étendre cette fonction pour
    // les interroger et construire les autres types de recommandations.
    return scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((s) => ({
            type: 'metier',
            titre: s.offre.titre,
            offre_id: s.offre.id,
            score_matching: s.score,
        }));
}
