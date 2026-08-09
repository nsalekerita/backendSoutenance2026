const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/company.controller');

router.use(requireAuth, requireRole('entreprise'));

router.get('/me', ctrl.getMyCompany);
router.put('/me', ctrl.updateMyCompany);
router.get('/students', ctrl.searchStudents);

module.exports = router;
