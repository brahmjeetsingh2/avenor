const apiResponse = require('../utils/apiResponse');

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return apiResponse.error(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return apiResponse.error(
        res,
        `Role '${req.user.role}' is not authorized to access this resource`,
        403
      );
    }
    next();
  };
};

module.exports = { authorizeRoles };
