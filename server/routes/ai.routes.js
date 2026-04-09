const express = require('express');
const router  = express.Router();
const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
  generatePrep,
  getRateLimitStatus,
  getAIHistory,
  trackPrepGeneration,
  trackMockInterview,
  markPrepFeedback,
} = require('../controllers/ai.controller');

// Students only — AI prep is a student feature
router.post('/interview-prep', verifyJWT, authorizeRoles('student'), generatePrep);
router.get('/rate-limit', verifyJWT, authorizeRoles('student'), getRateLimitStatus);

// AI History
router.get('/history', verifyJWT, authorizeRoles('student'), getAIHistory);
router.post('/history/prep', verifyJWT, authorizeRoles('student'), trackPrepGeneration);
router.post('/history/mock-interview', verifyJWT, authorizeRoles('student'), trackMockInterview);
router.patch('/history/:historyId/feedback', verifyJWT, authorizeRoles('student'), markPrepFeedback);

module.exports = router;