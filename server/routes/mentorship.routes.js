const express = require('express');
const router = express.Router();

const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
  createRequest,
  listStudentRequests,
  listAlumniInbox,
  getMentorshipById,
  updateMentorshipStatus,
  updateMilestoneStatus,
  addSessionUpdate,
  cancelStudentRequest,
  deleteRequest,
} = require('../controllers/mentorship.controller');

router.post('/request', verifyJWT, authorizeRoles('student'), createRequest);
router.get('/mine', verifyJWT, authorizeRoles('student'), listStudentRequests);
router.patch('/:id/cancel', verifyJWT, authorizeRoles('student'), cancelStudentRequest);
router.delete('/:id', verifyJWT, authorizeRoles('student'), deleteRequest);

router.get('/inbox', verifyJWT, authorizeRoles('alumni'), listAlumniInbox);
router.patch('/:id/status', verifyJWT, authorizeRoles('alumni'), updateMentorshipStatus);
router.patch('/:id/milestones/:milestoneId', verifyJWT, authorizeRoles('alumni'), updateMilestoneStatus);
router.post('/:id/updates', verifyJWT, authorizeRoles('student', 'alumni'), addSessionUpdate);
router.get('/:id', verifyJWT, authorizeRoles('student', 'alumni', 'coordinator'), getMentorshipById);

module.exports = router;
