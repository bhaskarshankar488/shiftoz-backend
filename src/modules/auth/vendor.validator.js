import ApiError from "../../shared/utils/ApiError.js";

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value) => /^[0-9+\-\s]{8,15}$/.test(value);

export const validateVendorRegister = (req, _res, next) => {
  const { businessName, ownerName, email, phone, password } = req.body;
  const errors = [];

  if (!businessName?.trim()) errors.push({ field: "businessName", message: "Business name is required" });
  if (!ownerName?.trim()) errors.push({ field: "ownerName", message: "Owner name is required" });
  if (!phone || !isPhone(phone)) errors.push({ field: "phone", message: "Valid phone number is required" });
  if (email && !isEmail(email)) errors.push({ field: "email", message: "Valid email is required" });
  if (!password || password.length < 8) {
    errors.push({ field: "password", message: "Password must be at least 8 characters" });
  }

  if (errors.length > 0) return next(new ApiError(400, "Vendor registration validation failed", errors));
  return next();
};

export const validateVendorLogin = (req, _res, next) => {
  const { identifier, password } = req.body;
  const errors = [];

  if (!identifier?.trim()) {
    errors.push({ field: "identifier", message: "Email or phone is required" });
  }

  if (!password) {
    errors.push({ field: "password", message: "Password is required" });
  }

  if (errors.length > 0) return next(new ApiError(400, "Vendor login validation failed", errors));
  return next();
};

export const validateVendorDocumentUpload = (req, _res, next) => {
  const files = req.files || [];

  if (files.length === 0) {
    return next(new ApiError(400, "At least one KYC document is required"));
  }

  return next();
};
