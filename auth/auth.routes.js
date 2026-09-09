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
module.exports = router;
