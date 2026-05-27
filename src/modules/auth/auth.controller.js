import ApiResponse from "../../shared/utils/ApiResponse.js";
import ApiError from "../../shared/utils/ApiError.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { attachAuthCookies, clearAuthCookies } from "../../shared/helpers/cookieToken.helper.js";
import { getRequestSecurityMeta } from "../../shared/helpers/requestSecurity.helper.js";
import {
  listActiveSessions,
  revokeAllSessions,
  rotateRefreshToken,
} from "../../shared/services/session.service.js";
import env from "../../config/env.js";

const getRefreshToken = (req) =>
  req.body.refreshToken || req.cookies?.[env.cookies.refreshTokenName] || null;

export const refreshTokenController = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshToken(req);

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const result = await rotateRefreshToken(refreshToken, getRequestSecurityMeta(req));
  attachAuthCookies(res, result.tokens);

  return res.status(200).json(new ApiResponse(200, result, "Refresh token rotated successfully"));
});

export const logoutAllDevicesController = asyncHandler(async (req, res) => {
  await revokeAllSessions({
    accountId: req.auth.id,
    role: req.auth.role,
    reqMeta: getRequestSecurityMeta(req),
  });
  clearAuthCookies(res);

  return res.status(200).json(new ApiResponse(200, null, "Logged out from all devices successfully"));
});

export const listSessionsController = asyncHandler(async (req, res) => {
  const sessions = await listActiveSessions({
    accountId: req.auth.id,
    role: req.auth.role,
  });

  return res.status(200).json(new ApiResponse(200, sessions, "Active sessions fetched successfully"));
});
