"use strict";
const { Router } = require("express");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const controller = require("./offres.controller");
const router = Router();
router.get('/', controller.listerPubliques); // consultable sans auth stricte (peut être restreint à requireAuth si besoin)
router.post('/', requireAuth, requireRole('entreprise'), controller.publier);
router.get('/entreprise/mes-offres', requireAuth, requireRole('entreprise'), controller.mesOffres);
router.delete('/:id', requireAuth, requireRole('entreprise'), controller.supprimer);
router.get('/:id/matching', requireAuth, requireRole('entreprise'), controller.matching);
router.get('/:id', controller.getById);
module.exports = router;
