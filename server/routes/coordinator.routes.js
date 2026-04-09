const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
  getDashboardStats,
  getApplicationFunnel,
  updateApplicationStatus,
  sendBulkMessage,
  getPlacementCycles,
  createPlacementCycle,
  updatePlacementCycle,
  getScheduledInterviews,
} = require('../controllers/coordinator.controller');

// All routes require coordinator role
router.use(verifyJWT, authorizeRoles('coordinator'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/applications/funnel', getApplicationFunnel);
router.patch('/applications/:applicationId/status', updateApplicationStatus);

// Messaging
router.post('/messages/bulk', sendBulkMessage);

// Placement cycles
router.get('/cycles', getPlacementCycles);
router.post('/cycles', createPlacementCycle);
router.patch('/cycles/:cycleId', updatePlacementCycle);

// Interview scheduling
router.get('/interviews/scheduled', getScheduledInterviews);

module.exports = router;
