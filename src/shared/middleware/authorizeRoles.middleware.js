import ApiError from "../utils/ApiError.js";

export const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  const role = req.auth?.role || req.user?.role;

  if (!role) {
    return next(new ApiError(401, "Authentication is required"));
  }

  if (!allowedRoles.includes(role)) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  return next();
};

export default authorizeRoles;
