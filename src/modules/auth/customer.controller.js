import env from "../../config/env.js";
import ApiResponse from "../../shared/utils/ApiResponse.js";
import ApiError from "../../shared/utils/ApiError.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { attachAuthCookies, clearAuthCookies } from "../../shared/helpers/cookieToken.helper.js";
import { getRequestSecurityMeta } from "../../shared/helpers/requestSecurity.helper.js";
import {
  getCustomerProfile,
  logoutCustomer,
  sendCustomerOtp,
  verifyCustomerOtp,
} from "./customer.service.js";

const getRefreshToken = (req) =>
  req.body?.refreshToken || req.cookies?.[env.cookies.refreshTokenName] || null;

export const sendCustomerOtpController = asyncHandler(async (req, res) => {
  const result = await sendCustomerOtp(req.body, getRequestSecurityMeta(req));
  const data = {
    customer: result.customer,
    isNewCustomer: result.isNewCustomer,
    otpExpiresAt: result.otpExpiresAt,
  };

  if (!env.isProduction) {
    data.devOtp = result.otp;
  }

  return res.status(200).json(new ApiResponse(200, data, "OTP sent successfully"));
});

export const verifyCustomerOtpController = asyncHandler(async (req, res) => {
  const result = await verifyCustomerOtp(req.body, getRequestSecurityMeta(req));
  attachAuthCookies(res, result.tokens);

  return res.status(200).json(new ApiResponse(200, result, "Customer authenticated successfully"));
});

export const logoutCustomerController = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshToken(req);

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required to logout");
  }

  await logoutCustomer({
    customerId: req.auth.id,
    sessionId: req.auth.sessionId,
    refreshToken,
    reqMeta: getRequestSecurityMeta(req),
  });
  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, null, "Customer logged out successfully"));
});

export const getCustomerProfileController = asyncHandler(async (req, res) => {
  const customer = await getCustomerProfile(req.auth.id);

  return res.status(200).json(new ApiResponse(200, customer, "Customer profile fetched successfully"));
});
