import ApiResponse from "../../shared/utils/ApiResponse.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { attachAuthCookies, clearAuthCookies } from "../../shared/helpers/cookieToken.helper.js";
import { getRequestSecurityMeta } from "../../shared/helpers/requestSecurity.helper.js";
import {
  getVendorProfile,
  loginVendor,
  logoutVendor,
  registerVendor,
  uploadVendorDocuments,
} from "./vendor.service.js";

export const registerVendorController = asyncHandler(async (req, res) => {
  const result = await registerVendor(req.body, getRequestSecurityMeta(req));
  attachAuthCookies(res, result.tokens);

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Vendor registered successfully. Account is temporary."));
});

export const loginVendorController = asyncHandler(async (req, res) => {
  const result = await loginVendor(req.body, getRequestSecurityMeta(req));
  attachAuthCookies(res, result.tokens);

  return res.status(200).json(new ApiResponse(200, result, "Vendor logged in successfully"));
});

export const uploadVendorDocumentsController = asyncHandler(async (req, res) => {
  const vendor = await uploadVendorDocuments(req.auth.id, req.files || []);

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor documents uploaded. Account is under review."));
});

export const logoutVendorController = asyncHandler(async (req, res) => {
  await logoutVendor({
    vendorId: req.auth.id,
    sessionId: req.auth.sessionId,
    refreshToken: req.body.refreshToken || req.cookies?.refreshToken,
    reqMeta: getRequestSecurityMeta(req),
  });
  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, null, "Vendor logged out successfully"));
});

export const getVendorProfileController = asyncHandler(async (req, res) => {
  const vendor = await getVendorProfile(req.auth.id);

  return res.status(200).json(new ApiResponse(200, vendor, "Vendor profile fetched successfully"));
});
