const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/application.controller');

router.post('/', requireAuth, requireRole('etudiant'), ctrl.apply);
router.get('/me', requireAuth, requireRole('etudiant'), ctrl.myApplications);
router.get('/offer/:offreId', requireAuth, requireRole('entreprise', 'admin'), ctrl.applicationsForOffer);
router.patch('/:id/accept', requireAuth, requireRole('entreprise'), ctrl.accept);
router.patch('/:id/refuse', requireAuth, requireRole('entreprise'), ctrl.refuse);

module.exports = router;
