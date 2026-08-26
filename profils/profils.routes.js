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
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const controller = __importStar(require("./profils.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);

router.get('/moi', controller.getMonProfil);
router.patch('/moi', controller.updateMonProfil);
router.put('/moi', controller.updateMonProfil); // alias : le client Flutter appelle _api.put(...)

router.post('/moi/competences', controller.ajouterCompetence);
router.delete('/moi/competences/:id', controller.supprimerCompetence);

router.post('/moi/interets', controller.ajouterInteret);
router.delete('/moi/interets/:id', controller.supprimerInteret);

router.post('/moi/wizard/reponse', controller.repondreWizard);
router.post('/moi/wizard/terminer', controller.terminerWizard);

router.post('/moi/cv/upload-url', controller.demandeUploadCv);
router.post('/moi/cv/confirmer', controller.confirmerCv);

router.post('/moi/photo/upload-url', controller.demandeUploadPhoto);
router.post('/moi/photo/confirmer', controller.confirmerPhoto);

// Notes = images de bulletins, CRUD complet (même principe que le CV, plus
// la mise à jour et la suppression).
router.post('/moi/notes/upload-url', controller.demandeUploadNote);
router.post('/moi/notes/confirmer', controller.confirmerNote);
router.put('/moi/notes/:id', controller.mettreAJourNote);
router.delete('/moi/notes/:id', controller.supprimerNote);

router.get('/moi/recommandations', controller.getRecommandations);

exports.default = router;