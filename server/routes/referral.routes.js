const express = require('express');
const router = express.Router();

const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
  createReferral,
  listReferrals,
  getMyReferrals,
  updateReferral,
  deleteReferral,
  trackReferralClick,
  trackReferralIntent,
} = require('../controllers/referral.controller');

router.get('/', verifyJWT, listReferrals);
router.get('/mine', verifyJWT, authorizeRoles('alumni'), getMyReferrals);

router.post('/', verifyJWT, authorizeRoles('alumni'), createReferral);
router.patch('/:id', verifyJWT, authorizeRoles('alumni', 'coordinator'), updateReferral);
router.delete('/:id', verifyJWT, authorizeRoles('alumni', 'coordinator'), deleteReferral);

router.post('/:id/track-click', verifyJWT, authorizeRoles('student'), trackReferralClick);
router.post('/:id/track-intent', verifyJWT, authorizeRoles('student'), trackReferralIntent);

module.exports = router;
