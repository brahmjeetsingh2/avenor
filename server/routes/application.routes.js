const express = require('express');
const router  = express.Router();
const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
  applyToCompany, getMyApplications, getApplicationById,
  getApplicationsByCompany, updateApplicationStatus,
  bulkUpdateStatus, bookInterviewSlot, updateCoordinatorNotes, withdrawApplication,
  getMyStats, getCompanyStats,
} = require('../controllers/application.controller');

// Student
router.post('/',            verifyJWT, authorizeRoles('student'), applyToCompany);
router.get('/my',           verifyJWT, authorizeRoles('student'), getMyApplications);
router.get('/my/stats',     verifyJWT, authorizeRoles('student'), getMyStats);
router.delete('/:id',       verifyJWT, authorizeRoles('student'), withdrawApplication);

// Shared (student owns, coordinator has access)
router.get('/:id',          verifyJWT, getApplicationById);

// Coordinator
router.get('/company/:companyId',       verifyJWT, authorizeRoles('coordinator'), getApplicationsByCompany);
router.get('/company/:companyId/stats', verifyJWT, authorizeRoles('coordinator'), getCompanyStats);
router.patch('/:id/status',             verifyJWT, authorizeRoles('coordinator'), updateApplicationStatus);
router.patch('/:id/notes',              verifyJWT, authorizeRoles('coordinator'), updateCoordinatorNotes);
router.post('/bulk-status',             verifyJWT, authorizeRoles('coordinator'), bulkUpdateStatus);
router.post('/bulk-slot',               verifyJWT, authorizeRoles('coordinator'), bookInterviewSlot);

module.exports = router;
