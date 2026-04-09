const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiResponse.error(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return apiResponse.error(res, 'Token expired', 401);
    }
    return apiResponse.error(res, 'Invalid token', 401);
  }

  req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
  next();
});

// Optional auth — attaches user if token present but does not block
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
  } catch {}
  next();
});

module.exports = { verifyJWT, optionalAuth };
