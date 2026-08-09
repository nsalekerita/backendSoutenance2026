const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/ai.controller');

router.use(requireAuth, requireRole('etudiant'));

router.post('/score', ctrl.scoreCompatibility);
router.post('/recommendations', ctrl.recommend);
router.post('/chat', ctrl.chat);

module.exports = router;
