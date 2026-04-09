const express = require('express');
const router  = express.Router();
const { verifyJWT, optionalAuth } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
  createExperience, getExperiences, getExperienceById,
  upvoteExperience, getExperiencesByCompany,
  searchExperiences, deleteExperience, getExperienceStats,
} = require('../controllers/experience.controller');

// All authenticated users can read
router.get('/',              verifyJWT, getExperiences);
router.get('/search',        verifyJWT, searchExperiences);
router.get('/stats',         verifyJWT, getExperienceStats);
router.get('/company/:companyId', verifyJWT, getExperiencesByCompany);
router.get('/:id',           verifyJWT, getExperienceById);

// Students and alumni can post
router.post('/',             verifyJWT, authorizeRoles('student', 'alumni'), createExperience);
router.patch('/:id/upvote',  verifyJWT, upvoteExperience);
router.delete('/:id',        verifyJWT, deleteExperience);

module.exports = router;
