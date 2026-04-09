const express = require('express');
const router  = express.Router();
const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
  getPlacementStats, getCompanyFunnel, getBatchStats,
  getTimelineData, getRecentActivity, exportData, getAlumniImpact,
  getCoordinatorOperations,
} = require('../controllers/dashboard.controller');

const coord = [verifyJWT, authorizeRoles('coordinator')];

router.get('/stats',    ...coord, getPlacementStats);
router.get('/funnel',   ...coord, getCompanyFunnel);
router.get('/branches', ...coord, getBatchStats);
router.get('/timeline', ...coord, getTimelineData);
router.get('/activity', ...coord, getRecentActivity);
router.get('/operations', ...coord, getCoordinatorOperations);
router.get('/export',   ...coord, exportData);
router.get('/alumni-impact', verifyJWT, authorizeRoles('alumni'), getAlumniImpact);

module.exports = router;
