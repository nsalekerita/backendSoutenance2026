const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/student.controller');

router.use(requireAuth, requireRole('etudiant'));

router.get('/me', ctrl.getMyProfile);
router.put('/me', ctrl.updateMyProfile);
router.post('/me/notes', ctrl.addNote);
router.post('/me/competences', ctrl.addCompetence);
router.post('/me/orientation-test', ctrl.submitOrientationTest);
router.get('/me/recommendations', ctrl.getMyRecommendations);

module.exports = router;
