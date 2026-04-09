const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { verifyJWT, optionalAuth } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
  getAllCompanies, getCompanyById, createCompany,
  updateCompany, updateStage, deleteCompany, getCompanyStats,
  bulkCompanyActions, getWorkflowOverview,
} = require('../controllers/company.controller');

const companyValidators = [
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('sector').notEmpty().withMessage('Sector is required'),
  body('type').isIn(['product', 'service', 'startup', 'psu', 'mnc']).withMessage('Invalid type'),
];

const stageValidator = [
  body('stage')
    .isIn(['draft', 'announced', 'ppt', 'test', 'interview', 'offer', 'closed'])
    .withMessage('Invalid stage'),
];

// Public / all authenticated
router.get('/',        verifyJWT, getAllCompanies);
router.get('/stats',   verifyJWT, authorizeRoles('coordinator'), getCompanyStats);
router.get('/workflow/overview', verifyJWT, authorizeRoles('coordinator'), getWorkflowOverview);
router.get('/:id',     verifyJWT, getCompanyById);

// Coordinator only
router.post('/',           verifyJWT, authorizeRoles('coordinator'), companyValidators, createCompany);
router.put('/:id',         verifyJWT, authorizeRoles('coordinator'), updateCompany);
router.patch('/:id/stage', verifyJWT, authorizeRoles('coordinator'), stageValidator, updateStage);
router.post('/bulk-actions', verifyJWT, authorizeRoles('coordinator'), bulkCompanyActions);
router.delete('/:id',      verifyJWT, authorizeRoles('coordinator'), deleteCompany);

module.exports = router;
