const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

router.use(requireAuth, requireRole('admin'));

router.get('/users', ctrl.listUsers);
router.patch('/users/:id/status', ctrl.updateUserStatus);
router.get('/referentials/:type', ctrl.listReferential);
router.post('/referentials/:type', ctrl.createReferential);
router.get('/stats', ctrl.globalStats);
router.get('/ai-scores', ctrl.aiScoresOverview);

module.exports = router;
