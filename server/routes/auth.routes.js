const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  register,
  login,
  logout,
  refreshAccessToken,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  getSavedCompanies,
  toggleSavedCompany,
  getReferralPreferences,
  toggleReferralPreference,
} = require('../controllers/auth.controller');

const { verifyJWT } = require('../middleware/auth.middleware');

// ─── Auth rate limiter (stricter) ─────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

// ─── Validators ───────────────────────────────────────────────────────────────
const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'coordinator', 'alumni']).withMessage('Invalid role'),
];

const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetValidators = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────
router.post('/register', authLimiter, registerValidators, register);
router.post('/login',    authLimiter, loginValidators,    login);
router.post('/logout',   logout);
router.post('/refresh',  refreshAccessToken);
router.get('/me',        verifyJWT, getMe);
router.put('/profile',   verifyJWT, updateProfile);
router.get('/saved-companies', verifyJWT, getSavedCompanies);
router.patch('/saved-companies/:companyId/toggle', verifyJWT, toggleSavedCompany);
router.get('/referral-preferences', verifyJWT, getReferralPreferences);
router.patch('/referrals/:referralId/preference', verifyJWT, toggleReferralPreference);
router.post('/forgot-password', authLimiter, forgotValidators, forgotPassword);
router.post('/reset-password',  authLimiter, resetValidators,  resetPassword);

module.exports = router;
