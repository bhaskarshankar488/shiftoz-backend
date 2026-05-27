import { USER_ROLES } from "../../shared/constants/auth.constants.js";
import ApiError from "../../shared/utils/ApiError.js";

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const creatableAdminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPPORT];

export const validateAdminLogin = (req, _res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !isEmail(email)) errors.push({ field: "email", message: "Valid email is required" });
  if (!password) errors.push({ field: "password", message: "Password is required" });

  if (errors.length > 0) return next(new ApiError(400, "Admin login validation failed", errors));
  return next();
};

export const validateAdminTwoFactor = (req, _res, next) => {
  const { email, otp } = req.body;
  const errors = [];

  if (!email || !isEmail(email)) errors.push({ field: "email", message: "Valid email is required" });
  if (!otp || !/^\d{6}$/.test(String(otp))) {
    errors.push({ field: "otp", message: "Valid 6 digit OTP is required" });
  }

  if (errors.length > 0) return next(new ApiError(400, "2FA validation failed", errors));
  return next();
};

export const validateCreateAdmin = (req, _res, next) => {
  const { name, email, phone, password, role } = req.body;
  const errors = [];

  if (!name?.trim()) errors.push({ field: "name", message: "Name is required" });
  if (!email || !isEmail(email)) errors.push({ field: "email", message: "Valid email is required" });
  if (!phone?.trim()) errors.push({ field: "phone", message: "Phone is required" });
  if (!password || password.length < 10) {
    errors.push({ field: "password", message: "Password must be at least 10 characters" });
  }
  if (!creatableAdminRoles.includes(role)) {
    errors.push({ field: "role", message: "Role must be admin or support" });
  }

  if (errors.length > 0) return next(new ApiError(400, "Create admin validation failed", errors));
  return next();
};
