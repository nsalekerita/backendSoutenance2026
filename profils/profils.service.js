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
const supabase_1 = require("../config/supabase");

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
    const [{ data: etudiant }, { data: competences }, { data: interets }, { data: wizard }, { data: notes }] = await Promise.all([
        supabase_1.supabaseAdmin
            .from('etudiants')
            .select('id, nom, prenom, niveau, filiere, specialite, photo_url, cv_chemin, cv_nom_fichier')
            .eq('id', etudiantId)
            .single(),
        supabase_1.supabaseAdmin.from('etudiant_competences').select('*').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_interets').select('*').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('profils_wizard').select('*').eq('etudiant_id', etudiantId).maybeSingle(),
        supabase_1.supabaseAdmin
            .from('etudiant_notes')
            .select('*')
            .eq('etudiant_id', etudiantId)
            .order('created_at', { ascending: false }),
    ]);

    const cv = etudiant?.cv_nom_fichier
        ? { nom_fichier: etudiant.cv_nom_fichier, chemin: etudiant.cv_chemin }
        : null;

    return {
        etudiant,
        competences: competences ?? [],
        interets: interets ?? [],
        wizard,
        cv,
        notes: notes ?? [],
    };
}

/**
 * Liste blanche des champs modifiables via PUT /profils/moi.
 * Évite qu'un champ absent du schéma (ex: un ancien "filiere_actuelle_id")
 * fasse échouer silencieusement tout l'update PostgREST.
 */
const CHAMPS_MODIFIABLES = ['prenom', 'nom', 'filiere', 'specialite', 'niveau'];

async function updateProfil(etudiantId, updates) {
    const payload = {};
    for (const champ of CHAMPS_MODIFIABLES) {
        if (updates?.[champ] !== undefined) {
            payload[champ] = updates[champ];
        }
    }

    const { data, error } = await supabase_1.supabaseAdmin
        .from('etudiants')
        .update(payload)
        .eq('id', etudiantId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}

async function addCompetence(etudiantId, competence_nom, niveau) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('etudiant_competences')
        .insert({ etudiant_id: etudiantId, competence_nom, niveau })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}

async function addInteret(etudiantId, domaine) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('etudiant_interets')
        .insert({ etudiant_id: etudiantId, domaine })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}

/** Supprime une compétence, en s'assurant qu'elle appartient bien à l'étudiant authentifié. */
async function deleteCompetence(etudiantId, competenceId) {
    const { error } = await supabase_1.supabaseAdmin
        .from('etudiant_competences')
        .delete()
        .eq('id', competenceId)
        .eq('etudiant_id', etudiantId);
    if (error)
        throw error;
    return { id: competenceId };
}

/** Supprime un centre d'intérêt, en s'assurant qu'il appartient bien à l'étudiant authentifié. */
async function deleteInteret(etudiantId, interetId) {
    const { error } = await supabase_1.supabaseAdmin
        .from('etudiant_interets')
        .delete()
        .eq('id', interetId)
        .eq('etudiant_id', etudiantId);
    if (error)
        throw error;
    return { id: interetId };
}

/** Enregistre une réponse d'étape du wizard d'orientation et avance etape_courante */
async function enregistrerReponseWizard(etudiantId, etape, question_id, reponse) {
    const { data: wizard, error: wizardError } = await supabase_1.supabaseAdmin
        .from('profils_wizard')
        .select('id, etape_courante')
        .eq('etudiant_id', etudiantId)
        .single();
    if (wizardError)
        throw wizardError;
    await supabase_1.supabaseAdmin.from('wizard_reponses').insert({
        profil_wizard_id: wizard.id,
        etape,
        question_id,
        reponse,
    });
    const etapeCourante = Math.max(wizard.etape_courante, etape + 1);
    await supabase_1.supabaseAdmin.from('profils_wizard').update({ etape_courante: etapeCourante }).eq('id', wizard.id);
    return { etape_courante: etapeCourante };
}

async function terminerWizard(etudiantId) {
    const { error } = await supabase_1.supabaseAdmin
        .from('profils_wizard')
        .update({ statut: 'termine' })
        .eq('etudiant_id', etudiantId);
    if (error)
        throw error;
}

/**
 * Upload de CV : on stocke le fichier dans le bucket Supabase Storage "cvs".
 * Les clés de retour (upload_url / cle_fichier) matchent ce qu'attend le
 * client Flutter — ne pas renommer sans mettre à jour student_profile_screen.dart.
 */
async function getSignedCvUploadUrl(etudiantId, fileName) {
    const path = `${etudiantId}/${Date.now()}-${fileName}`;
    const { data, error } = await supabase_1.supabaseAdmin.storage.from('cvs').createSignedUploadUrl(path);
    if (error)
        throw error;
    return { upload_url: data.signedUrl, cle_fichier: path };
}

/** Rattache le CV uploadé au profil étudiant (appelé après l'upload effectif vers l'URL signée). */
async function confirmerCv(etudiantId, cheminFichier, nomFichier) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('etudiants')
        .update({ cv_chemin: cheminFichier, cv_nom_fichier: nomFichier })
        .eq('id', etudiantId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}

/**
 * Upload de photo de profil : on stocke le fichier dans le bucket Supabase
 * Storage "photos". Le bucket doit exister côté Supabase (Storage > New bucket)
 * et être configuré en public pour que photo_url soit directement affichable
 * via Image.network côté Flutter.
 */
async function getSignedPhotoUploadUrl(etudiantId, fileName) {
    const path = `${etudiantId}/${Date.now()}-${fileName}`;
    const { data, error } = await supabase_1.supabaseAdmin.storage.from('photos').createSignedUploadUrl(path);
    if (error)
        throw error;
    return { upload_url: data.signedUrl, cle_fichier: path };
}

/** Rattache la photo uploadée au profil étudiant (appelé après l'upload effectif vers l'URL signée). */
async function confirmerPhoto(etudiantId, cheminFichier) {
    const { data: publicUrlData } = supabase_1.supabaseAdmin.storage.from('photos').getPublicUrl(cheminFichier);
    const { data, error } = await supabase_1.supabaseAdmin
        .from('etudiants')
        .update({ photo_url: publicUrlData.publicUrl })
        .eq('id', etudiantId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}

/**
 * Notes = images de bulletins/relevés, stockées dans le bucket Supabase
 * Storage "notes-bulletins" (à créer côté Supabase, en public pour que l'URL
 * soit directement affichable via Image.network côté Flutter). Chaque note
 * est une ligne de la table "etudiant_notes" : id, etudiant_id,
 * chemin_fichier, nom_fichier, url, semestre, created_at.
 */
async function getSignedNoteUploadUrl(etudiantId, fileName) {
    const path = `${etudiantId}/${Date.now()}-${fileName}`;
    const { data, error } = await supabase_1.supabaseAdmin.storage.from('notes-bulletins').createSignedUploadUrl(path);
    if (error)
        throw error;
    return { upload_url: data.signedUrl, cle_fichier: path };
}

/** Crée une nouvelle note (image de bulletin) après upload effectif vers l'URL signée. */
async function confirmerNote(etudiantId, cheminFichier, nomFichier, semestre) {
    const { data: publicUrlData } = supabase_1.supabaseAdmin.storage.from('notes-bulletins').getPublicUrl(cheminFichier);
    const { data, error } = await supabase_1.supabaseAdmin
        .from('etudiant_notes')
        .insert({
            etudiant_id: etudiantId,
            chemin_fichier: cheminFichier,
            nom_fichier: nomFichier ?? null,
            url: publicUrlData.publicUrl,
            semestre: semestre ?? null,
        })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}

/**
 * Met à jour une note existante : remplace l'image (si cle_fichier est
 * fourni) et/ou le libellé "semestre". Supprime l'ancien fichier du storage
 * quand l'image est remplacée, pour éviter d'accumuler des fichiers
 * orphelins. Vérifie que la note appartient bien à l'étudiant authentifié.
 */
async function updateNote(etudiantId, noteId, { cle_fichier, nom_fichier, semestre } = {}) {
    const { data: existante, error: fetchError } = await supabase_1.supabaseAdmin
        .from('etudiant_notes')
        .select('chemin_fichier')
        .eq('id', noteId)
        .eq('etudiant_id', etudiantId)
        .single();
    if (fetchError)
        throw fetchError;

    const payload = {};
    if (semestre !== undefined)
        payload.semestre = semestre;

    if (cle_fichier) {
        const { data: publicUrlData } = supabase_1.supabaseAdmin.storage.from('notes-bulletins').getPublicUrl(cle_fichier);
        payload.chemin_fichier = cle_fichier;
        payload.nom_fichier = nom_fichier ?? null;
        payload.url = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase_1.supabaseAdmin
        .from('etudiant_notes')
        .update(payload)
        .eq('id', noteId)
        .eq('etudiant_id', etudiantId)
        .select()
        .single();
    if (error)
        throw error;

    if (cle_fichier && existante?.chemin_fichier) {
        await supabase_1.supabaseAdmin.storage.from('notes-bulletins').remove([existante.chemin_fichier]);
    }
    return data;
}

/** Supprime une note (ligne + fichier associé dans le storage), en s'assurant qu'elle appartient bien à l'étudiant authentifié. */
async function deleteNote(etudiantId, noteId) {
    const { data: existante, error: fetchError } = await supabase_1.supabaseAdmin
        .from('etudiant_notes')
        .select('chemin_fichier')
        .eq('id', noteId)
        .eq('etudiant_id', etudiantId)
        .single();
    if (fetchError)
        throw fetchError;

    const { error } = await supabase_1.supabaseAdmin
        .from('etudiant_notes')
        .delete()
        .eq('id', noteId)
        .eq('etudiant_id', etudiantId);
    if (error)
        throw error;

    if (existante?.chemin_fichier) {
        await supabase_1.supabaseAdmin.storage.from('notes-bulletins').remove([existante.chemin_fichier]);
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
    const [{ data: competences }, { data: interets }, { data: offres, error: offresError }] = await Promise.all([
        supabase_1.supabaseAdmin.from('etudiant_competences').select('competence_nom').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_interets').select('domaine').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('offres').select('*').eq('statut', 'validee'),
    ]);
    if (offresError)
        throw offresError;

    const mesCompetences = (competences ?? []).map((c) => c.competence_nom.toLowerCase());
    const mesInterets = (interets ?? []).map((i) => i.domaine.toLowerCase());

    const scored = (offres ?? []).map((offre) => {
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