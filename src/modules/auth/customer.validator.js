import ApiError from "../../shared/utils/ApiError.js";

const phoneRegex = /^[0-9+\-\s]{8,15}$/;

export const validateSendCustomerOtp = (req, _res, next) => {
  const { phone } = req.body;
  const errors = [];

  if (!phone || !phoneRegex.test(phone)) {
    errors.push({ field: "phone", message: "Valid phone number is required" });
  }

  if (errors.length > 0) return next(new ApiError(400, "Send OTP validation failed", errors));
  return next();
};

export const validateVerifyCustomerOtp = (req, _res, next) => {
  const { phone, otp } = req.body;
  const errors = [];

  if (!phone || !phoneRegex.test(phone)) {
    errors.push({ field: "phone", message: "Valid phone number is required" });
  }

  if (!otp || !/^\d{4,8}$/.test(String(otp))) {
    errors.push({ field: "otp", message: "Valid OTP is required" });
  }

  if (errors.length > 0) return next(new ApiError(400, "Verify OTP validation failed", errors));
  return next();
};
