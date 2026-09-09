"use strict";
exports.demandeUploadCv = exports.terminerWizard = exports.repondreWizard = exports.ajouterInteret = exports.ajouterCompetence = exports.updateMonProfil = exports.getMonProfil = void 0;
exports.supprimerCompetence = void 0;
exports.supprimerInteret = void 0;
exports.confirmerCv = void 0;
exports.demandeUploadPhoto = void 0;
exports.confirmerPhoto = void 0;
exports.demandeUploadNote = void 0;
exports.confirmerNote = void 0;
exports.mettreAJourNote = void 0;
exports.supprimerNote = void 0;
exports.getRecommandations = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = require("./profils.service");
const { z } = require("zod");

const competenceSchema = z.object({
    competence_nom: z.string().min(1).max(200),
    niveau: z.enum(['debutant', 'intermediaire', 'avance']),
});
const interetSchema = z.object({
    domaine: z.string().min(1).max(200),
});
const wizardReponseSchema = z.object({
    etape: z.number().int().nonnegative(),
    question_id: z.string().min(1),
    reponse: z.unknown(),
});

function requireEtudiant(req, res) {
    if (req.user?.role !== 'etudiant' || !req.user.profileId) {
        (0, response_1.fail)(res, "Réservé aux étudiants", 403);
        return null;
    }
    return req.user.profileId;
}

exports.getMonProfil = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const profil = await service.getProfilComplet(etudiantId);
    return (0, response_1.ok)(res, profil);
});

exports.updateMonProfil = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const data = await service.updateProfil(etudiantId, req.body);
    return (0, response_1.ok)(res, data);
});

exports.ajouterCompetence = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const parsed = competenceSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const data = await service.addCompetence(etudiantId, parsed.data.competence_nom, parsed.data.niveau);
    return (0, response_1.ok)(res, data, 201);
});

exports.ajouterInteret = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const parsed = interetSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const data = await service.addInteret(etudiantId, parsed.data.domaine);
    return (0, response_1.ok)(res, data, 201);
});

exports.supprimerCompetence = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const { id } = req.params;
    if (!id)
        return (0, response_1.fail)(res, 'id requis', 422);
    const data = await service.deleteCompetence(etudiantId, id);
    return (0, response_1.ok)(res, data);
});

exports.supprimerInteret = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const { id } = req.params;
    if (!id)
        return (0, response_1.fail)(res, 'id requis', 422);
    const data = await service.deleteInteret(etudiantId, id);
    return (0, response_1.ok)(res, data);
});

exports.repondreWizard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const parsed = wizardReponseSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const { etape, question_id, reponse } = parsed.data;
    const data = await service.enregistrerReponseWizard(etudiantId, etape, question_id, reponse);
    return (0, response_1.ok)(res, data);
});

exports.terminerWizard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    await service.terminerWizard(etudiantId);
    return (0, response_1.ok)(res, { statut: 'termine' });
});

// Le client Flutter envoie 'nom_fichier'. On accepte aussi 'fileName' pour
// rester compatible si un autre client utilise l'ancien nom de champ.
function extraireFileName(body) {
    return body?.fileName ?? body?.nom_fichier;
}

exports.demandeUploadCv = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const fileName = extraireFileName(req.body);
    if (!fileName)
        return (0, response_1.fail)(res, 'fileName (ou nom_fichier) requis', 422);
    const data = await service.getSignedCvUploadUrl(etudiantId, fileName);
    return (0, response_1.ok)(res, data);
});

exports.confirmerCv = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const { cle_fichier, nom_fichier } = req.body ?? {};
    if (!cle_fichier)
        return (0, response_1.fail)(res, 'cle_fichier requis', 422);
    const data = await service.confirmerCv(etudiantId, cle_fichier, nom_fichier ?? null);
    return (0, response_1.ok)(res, data);
});

exports.demandeUploadPhoto = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const fileName = extraireFileName(req.body);
    if (!fileName)
        return (0, response_1.fail)(res, 'fileName (ou nom_fichier) requis', 422);
    const data = await service.getSignedPhotoUploadUrl(etudiantId, fileName);
    return (0, response_1.ok)(res, data);
});

exports.confirmerPhoto = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const { cle_fichier } = req.body ?? {};
    if (!cle_fichier)
        return (0, response_1.fail)(res, 'cle_fichier requis', 422);
    const data = await service.confirmerPhoto(etudiantId, cle_fichier);
    return (0, response_1.ok)(res, data);
});

// -------------------------------------------------------------------------
// Notes (images de bulletins) : CRUD complet, même principe que le CV.
// -------------------------------------------------------------------------

exports.demandeUploadNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const fileName = extraireFileName(req.body);
    if (!fileName)
        return (0, response_1.fail)(res, 'fileName (ou nom_fichier) requis', 422);
    const data = await service.getSignedNoteUploadUrl(etudiantId, fileName);
    return (0, response_1.ok)(res, data);
});

exports.confirmerNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const { cle_fichier, nom_fichier, semestre } = req.body ?? {};
    if (!cle_fichier)
        return (0, response_1.fail)(res, 'cle_fichier requis', 422);
    const data = await service.confirmerNote(etudiantId, cle_fichier, nom_fichier ?? null, semestre ?? null);
    return (0, response_1.ok)(res, data, 201);
});

exports.mettreAJourNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const { id } = req.params;
    if (!id)
        return (0, response_1.fail)(res, 'id requis', 422);
    const { cle_fichier, nom_fichier, semestre } = req.body ?? {};
    const data = await service.updateNote(etudiantId, id, { cle_fichier, nom_fichier, semestre });
    return (0, response_1.ok)(res, data);
});

exports.supprimerNote = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const { id } = req.params;
    if (!id)
        return (0, response_1.fail)(res, 'id requis', 422);
    const data = await service.deleteNote(etudiantId, id);
    return (0, response_1.ok)(res, data);
});

exports.getRecommandations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const recommandations = await service.getRecommandations(etudiantId);
    // Flutter attend { recommandations: [...] }, pas un tableau brut.
    return (0, response_1.ok)(res, { recommandations });
});