const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Company = require('../models/Company.model');
const Referral = require('../models/Referral.model');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiResponse.error(res, 'Validation failed', 400, errors.array());
  }

  const { name, email, password, role, college, batch, branch } = req.body;

  // Check duplicate
  const existing = await User.findOne({ email });
  if (existing) {
    return apiResponse.error(res, 'Email already registered', 409);
  }

  const user = await User.create({ name, email, password, role, college, batch, branch });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token hash to DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  return apiResponse.success(
    res,
    { user, accessToken },
    'Account created successfully',
    201
  );
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiResponse.error(res, 'Validation failed', 400, errors.array());
  }

  const { email, password } = req.body;

  // Explicitly select password (it's select:false in model)
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) {
    return apiResponse.error(res, 'Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return apiResponse.error(res, 'Invalid email or password', 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  // Remove password from output
  user.password = undefined;

  return apiResponse.success(res, { user, accessToken }, 'Login successful');
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    // Clear token from DB
    await User.findOneAndUpdate(
      { refreshToken },
      { $unset: { refreshToken: 1 } }
    );
  }

  clearRefreshCookie(res);
  return apiResponse.success(res, {}, 'Logged out successfully');
});

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return apiResponse.error(res, 'No refresh token', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    clearRefreshCookie(res);
    return apiResponse.error(res, 'Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    clearRefreshCookie(res);
    return apiResponse.error(res, 'Refresh token reuse detected', 401);
  }

  // Rotate refresh token
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, newRefreshToken);

  return apiResponse.success(res, { accessToken: newAccessToken }, 'Token refreshed');
});

// ─── GET ME ───────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return apiResponse.error(res, 'User not found', 404);
  return apiResponse.success(res, { user }, 'User fetched');
});

// ─── FORGOT PASSWORD (OTP) ────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiResponse.error(res, 'Validation failed', 400, errors.array());
  }

  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return apiResponse.success(res, {}, 'If that email exists, an OTP has been sent');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  user.resetOTP = otp;
  user.resetOTPExpiry = otpExpiry;
  await user.save({ validateBeforeSave: false });

  // In production, send via Nodemailer. For now, log it.
  console.log(`🔑 OTP for ${email}: ${otp} (expires in 10 min)`);

  // TODO Part 7: send via email service
  // await emailService.sendOTP(email, otp);

  return apiResponse.success(res, {}, 'If that email exists, an OTP has been sent');
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiResponse.error(res, 'Validation failed', 400, errors.array());
  }

  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+resetOTP +resetOTPExpiry');
  if (!user) {
    return apiResponse.error(res, 'Invalid OTP or email', 400);
  }

  if (!user.resetOTP || user.resetOTP !== otp) {
    return apiResponse.error(res, 'Invalid OTP', 400);
  }

  if (!user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
    return apiResponse.error(res, 'OTP has expired', 400);
  }

  user.password = newPassword;
  user.resetOTP = undefined;
  user.resetOTPExpiry = undefined;
  user.refreshToken = undefined;
  await user.save();

  clearRefreshCookie(res);
  return apiResponse.success(res, {}, 'Password reset successful. Please login again.');
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    college,
    batch,
    branch,
    profilePic,
    alumniProfile,
    coordinatorProfile,
    placementProfile,
  } = req.body;

  const updates = { name, college, batch, branch, profilePic };

  if (placementProfile && typeof placementProfile === 'object') {
    updates.placementProfile = {
      phoneNumber: placementProfile.phoneNumber || '',
      resumeUrl: placementProfile.resumeUrl || '',
      linkedin: placementProfile.linkedin || '',
      skills: Array.isArray(placementProfile.skills)
        ? placementProfile.skills
        : [],
      preferredRoles: Array.isArray(placementProfile.preferredRoles)
        ? placementProfile.preferredRoles
        : [],
      preferredLocations: Array.isArray(placementProfile.preferredLocations)
        ? placementProfile.preferredLocations
        : [],
      placementGoals: placementProfile.placementGoals || '',
      hideFromCommunity: placementProfile.hideFromCommunity ?? false,
    };
  }

  if (alumniProfile && typeof alumniProfile === 'object') {
    updates.alumniProfile = {
      currentCompany: alumniProfile.currentCompany || '',
      currentRole: alumniProfile.currentRole || '',
      graduationYear: alumniProfile.graduationYear || null,
      linkedin: alumniProfile.linkedin || '',
      bio: alumniProfile.bio || '',
      expertiseTags: Array.isArray(alumniProfile.expertiseTags)
        ? alumniProfile.expertiseTags
        : [],
      availability: {
        referralRequests: alumniProfile.availability?.referralRequests ?? true,
        mentorship: alumniProfile.availability?.mentorship ?? true,
        resumeReview: alumniProfile.availability?.resumeReview ?? false,
      },
    };
  }

  if (coordinatorProfile && typeof coordinatorProfile === 'object') {
    updates.coordinatorProfile = {
      managedCollege: coordinatorProfile.managedCollege || updates.college || '',
      managedBranches: Array.isArray(coordinatorProfile.managedBranches)
        ? coordinatorProfile.managedBranches
        : [],
      managedBatches: Array.isArray(coordinatorProfile.managedBatches)
        ? coordinatorProfile.managedBatches
        : [],
      capabilities: Array.isArray(coordinatorProfile.capabilities)
        ? coordinatorProfile.capabilities
        : [],
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  return apiResponse.success(res, { user }, 'Profile updated');
});

// ─── GET SAVED COMPANIES ─────────────────────────────────────────────────────
const getSavedCompanies = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('savedCompanies').lean();
  const savedIds = user?.savedCompanies || [];

  if (!savedIds.length) {
    return apiResponse.success(res, { companies: [], savedCompanyIds: [] });
  }

  const companies = await Company.find({ _id: { $in: savedIds } })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return apiResponse.success(res, {
    companies,
    savedCompanyIds: savedIds.map((id) => id.toString()),
  });
});

// ─── TOGGLE SAVED COMPANY ────────────────────────────────────────────────────
const toggleSavedCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    return apiResponse.error(res, 'Invalid company id', 400);
  }

  const company = await Company.findById(companyId).select('_id name logo sector type currentStage applicationDeadline location').lean();
  if (!company) return apiResponse.error(res, 'Company not found', 404);

  const user = await User.findById(req.user.id).select('savedCompanies');
  if (!user) return apiResponse.error(res, 'User not found', 404);

  const savedIds = user.savedCompanies.map((id) => id.toString());
  const isSaved = savedIds.includes(companyId);

  if (isSaved) {
    user.savedCompanies = user.savedCompanies.filter((id) => id.toString() !== companyId);
  } else {
    user.savedCompanies.push(companyId);
  }

  await user.save({ validateBeforeSave: false });

  const companies = await Company.find({ _id: { $in: user.savedCompanies } })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return apiResponse.success(res, {
    saved: !isSaved,
    savedCompanyIds: user.savedCompanies.map((id) => id.toString()),
    companies,
    company,
  }, isSaved ? 'Company removed from saved list' : 'Company saved');
});

// ─── GET REFERRAL PREFERENCES ───────────────────────────────────────────────
const getReferralPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('savedReferrals hiddenReferrals').lean();
  return apiResponse.success(res, {
    savedReferralIds: (user?.savedReferrals || []).map((id) => id.toString()),
    hiddenReferralIds: (user?.hiddenReferrals || []).map((id) => id.toString()),
  });
});

// ─── TOGGLE REFERRAL SAVE/HIDE ───────────────────────────────────────────────
const toggleReferralPreference = asyncHandler(async (req, res) => {
  const { referralId } = req.params;
  const { action } = req.body;

  if (!mongoose.Types.ObjectId.isValid(referralId)) {
    return apiResponse.error(res, 'Invalid referral id', 400);
  }
  if (!['save', 'hide'].includes(action)) {
    return apiResponse.error(res, 'Invalid action', 400);
  }

  const referral = await Referral.findById(referralId).select('_id company role').lean();
  if (!referral) return apiResponse.error(res, 'Referral not found', 404);

  const user = await User.findById(req.user.id).select('savedReferrals hiddenReferrals');
  if (!user) return apiResponse.error(res, 'User not found', 404);

  const savedIds = user.savedReferrals.map((id) => id.toString());
  const hiddenIds = user.hiddenReferrals.map((id) => id.toString());

  if (action === 'save') {
    const isSaved = savedIds.includes(referralId);
    user.savedReferrals = isSaved
      ? user.savedReferrals.filter((id) => id.toString() !== referralId)
      : [...user.savedReferrals, referralId];
    await user.save({ validateBeforeSave: false });
    return apiResponse.success(res, {
      saved: !isSaved,
      savedReferralIds: user.savedReferrals.map((id) => id.toString()),
      hiddenReferralIds: hiddenIds,
      referral,
    }, isSaved ? 'Referral removed from saved list' : 'Referral saved');
  }

  const isHidden = hiddenIds.includes(referralId);
  user.hiddenReferrals = isHidden
    ? user.hiddenReferrals.filter((id) => id.toString() !== referralId)
    : [...user.hiddenReferrals, referralId];
  await user.save({ validateBeforeSave: false });

  return apiResponse.success(res, {
    hidden: !isHidden,
    savedReferralIds: savedIds,
    hiddenReferralIds: user.hiddenReferrals.map((id) => id.toString()),
    referral,
  }, isHidden ? 'Referral unhidden' : 'Referral hidden');
});

module.exports = {
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
};
