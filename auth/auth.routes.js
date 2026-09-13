"use strict";
const { Router } = require("express");
const controller = require("./auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const router = Router();
// Correspond au cas d'utilisation "Créer un compte" (étudiant / entreprise)
router.post('/register/etudiant', controller.registerEtudiant);
router.post('/register/entreprise', controller.registerEntreprise);
router.post('/login', controller.login);
router.post('/google', controller.googleAuth);
router.get('/me', requireAuth, controller.me);
// Vérification d'e-mail par code OTP (inscription) et réinitialisation du mot de passe
router.post('/otp/renvoyer', controller.renvoyerCodeInscription);
router.post('/otp/verifier', controller.verifierCodeInscription);
router.post('/mot-de-passe/oublie', controller.demanderReinitialisationMotDePasse);
router.post('/mot-de-passe/reinitialiser', controller.reinitialiserMotDePasse);
module.exports = router;
