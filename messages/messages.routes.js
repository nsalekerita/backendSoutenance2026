"use strict";
const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const controller = require('./messages.controller');
const router = Router();
router.use(requireAuth, requireRole('entreprise'));
router.get('/conversation/:etudiantId', controller.historique);
router.post('/', controller.envoyer);
module.exports = router;
