const express = require('express');
const salaryRouter = express.Router();
const offerRouter  = express.Router();
const { verifyJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const {
	submitSalary,
	getAggregatedStats,
	getAllSalaries,
	getMySalaries,
	updateSalary,
	verifySalary,
	deleteSalary,
} = require('../controllers/salary.controller');
const { createOffer, getMyOffers, updateOffer, deleteOffer } = require('../controllers/offer.controller');

// ── Salary routes ──────────────────────────────────────────────────────────────
salaryRouter.get('/stats',      verifyJWT, getAggregatedStats);
salaryRouter.get('/',           verifyJWT, authorizeRoles('coordinator'), getAllSalaries);
salaryRouter.get('/mine',       verifyJWT, authorizeRoles('student', 'alumni'), getMySalaries);
salaryRouter.post('/',          verifyJWT, authorizeRoles('student', 'alumni'), submitSalary);
salaryRouter.patch('/:id',      verifyJWT, authorizeRoles('student', 'alumni', 'coordinator'), updateSalary);
salaryRouter.patch('/:id/verify', verifyJWT, authorizeRoles('coordinator'), verifySalary);
salaryRouter.delete('/:id',     verifyJWT, deleteSalary);

// ── Offer routes ───────────────────────────────────────────────────────────────
offerRouter.get('/',           verifyJWT, authorizeRoles('student'), getMyOffers);
offerRouter.post('/',          verifyJWT, authorizeRoles('student'), createOffer);
offerRouter.put('/:id',        verifyJWT, authorizeRoles('student'), updateOffer);
offerRouter.delete('/:id',     verifyJWT, authorizeRoles('student'), deleteOffer);

module.exports = { salaryRouter, offerRouter };
