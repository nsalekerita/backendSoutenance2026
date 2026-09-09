"use strict";
const { Router } = require("express");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const controller = require("./offres.controller");
const router = Router();
router.get('/', controller.listerPubliques); // consultable sans auth stricte (peut être restreint à requireAuth si besoin)
router.get('/:id', controller.getById);
router.post('/', requireAuth, requireRole('entreprise'), controller.publier);
router.get('/entreprise/mes-offres', requireAuth, requireRole('entreprise'), controller.mesOffres);
router.get('/:id/matching', requireAuth, requireRole('entreprise'), controller.matching);
module.exports = router;
