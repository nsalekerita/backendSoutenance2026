"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
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
const service = __importStar(require("./profils.service"));

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
    const { competence_nom, niveau } = req.body ?? {};
    if (!competence_nom || !niveau)
        return (0, response_1.fail)(res, 'competence_nom et niveau requis', 422);
    const data = await service.addCompetence(etudiantId, competence_nom, niveau);
    return (0, response_1.ok)(res, data, 201);
});

exports.ajouterInteret = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const etudiantId = requireEtudiant(req, res);
    if (!etudiantId)
        return;
    const { domaine } = req.body ?? {};
    if (!domaine)
        return (0, response_1.fail)(res, 'domaine requis', 422);
    const data = await service.addInteret(etudiantId, domaine);
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
    const { etape, question_id, reponse } = req.body ?? {};
    if (etape === undefined || !question_id || reponse === undefined) {
        return (0, response_1.fail)(res, 'etape, question_id et reponse requis', 422);
    }
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