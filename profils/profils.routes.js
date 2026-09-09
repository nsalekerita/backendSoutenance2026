"use strict";
const { Router } = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const controller = require("./profils.controller");
const router = Router();
router.use(requireAuth);

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

module.exports = router;