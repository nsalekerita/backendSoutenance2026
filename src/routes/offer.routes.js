const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/offer.controller');

router.get('/', ctrl.listOffers);
router.get('/:id', ctrl.getOffer);

router.post('/', requireAuth, requireRole('entreprise'), ctrl.createOffer);
router.put('/:id', requireAuth, requireRole('entreprise'), ctrl.updateOffer);
router.delete('/:id', requireAuth, requireRole('entreprise', 'admin'), ctrl.deleteOffer);
router.get('/:id/matches', requireAuth, requireRole('entreprise', 'admin'), ctrl.getOfferMatches);

module.exports = router;
