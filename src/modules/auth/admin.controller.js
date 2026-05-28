import ApiResponse from "../../shared/utils/ApiResponse.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import env from "../../config/env.js";
import { attachAuthCookies, clearAuthCookies } from "../../shared/helpers/cookieToken.helper.js";
import { getRequestSecurityMeta } from "../../shared/helpers/requestSecurity.helper.js";
import {
  createAdminAccount,
  getAdminProfile,
  loginAdmin,
  logoutAdmin,
  verifyAdminTwoFactor,
} from "./admin.service.js";

const getRequestMeta = (req) => ({
  ...getRequestSecurityMeta(req),
});

export const adminLoginController = asyncHandler(async (req, res) => {
  const result = await loginAdmin(req.body, getRequestMeta(req));
  const data = {
    admin: result.admin,
    twoFactorRequired: result.twoFactorRequired,
  };

  if (!env.isProduction) {
    data.devTwoFactorOtp = result.otp;
  }

  return res.status(200).json(
    new ApiResponse(200, data, "2FA OTP generated for admin login"),
  );
});

export const adminVerifyTwoFactorController = asyncHandler(async (req, res) => {
  const result = await verifyAdminTwoFactor(req.body, getRequestMeta(req));
  attachAuthCookies(res, result.tokens);

  return res.status(200).json(new ApiResponse(200, result, "Admin authenticated successfully"));
});

export const adminLogoutController = asyncHandler(async (req, res) => {
  await logoutAdmin({
    adminId: req.auth.id,
    role: req.auth.role,
    sessionId: req.auth.sessionId,
    refreshToken: req.body.refreshToken || req.cookies?.refreshToken,
    reqMeta: getRequestMeta(req),
  });
  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, null, "Admin logged out successfully"));
});

export const createAdminController = asyncHandler(async (req, res) => {
  const admin = await createAdminAccount(req.body);

  return res.status(201).json(new ApiResponse(201, admin, "Admin account created successfully"));
});

export const getAdminProfileController = asyncHandler(async (req, res) => {
  const admin = await getAdminProfile(req.auth.id);

  return res.status(200).json(new ApiResponse(200, admin, "Admin profile fetched successfully"));
});
