import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import User from "../../models/User.model.js";
import Vendor from "../../models/Vendor.model.js";
import env from "../../config/env.js";
import { ACCOUNT_TYPES, AUDIT_EVENTS, USER_ROLES } from "../constants/auth.constants.js";
import ApiError from "../utils/ApiError.js";
import { generateAuthTokens, verifyRefreshToken } from "../utils/jwt.util.js";
import { writeAuditLog } from "./auditLog.service.js";
import { detectSuspiciousLogin } from "./suspiciousLogin.service.js";

const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const getAccountTypeByRole = (role) =>
  role === USER_ROLES.VENDOR ? ACCOUNT_TYPES.VENDOR : ACCOUNT_TYPES.USER;

export const getAccountModelByType = (accountType) =>
  accountType === ACCOUNT_TYPES.VENDOR ? Vendor : User;

const sanitizeSession = (session) => ({
  sessionId: session.sessionId,
  userAgent: session.userAgent,
  deviceName: session.deviceName,
  ip: session.ip,
  lastIp: session.lastIp,
  createdAt: session.createdAt,
  lastUsedAt: session.lastUsedAt,
  expiresAt: session.expiresAt,
  revokedAt: session.revokedAt,
});

const buildSession = async ({ refreshToken, sessionId, reqMeta }) => ({
  sessionId,
  tokenHash: await bcrypt.hash(refreshToken, 10),
  userAgent: reqMeta.userAgent,
  deviceName: reqMeta.deviceName,
  ip: reqMeta.ip,
  lastIp: reqMeta.ip,
  createdAt: new Date(),
  lastUsedAt: new Date(),
  expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS),
});

export const createSession = async ({ account, accountType, role, tokenPayload = {}, reqMeta = {} }) => {
  const sessionId = crypto.randomUUID();
  const tokens = generateAuthTokens({
    ...tokenPayload,
    id: account._id.toString(),
    role,
    sessionId,
  });
  const session = await buildSession({ refreshToken: tokens.refreshToken, sessionId, reqMeta });
  const AccountModel = getAccountModelByType(accountType);
  const accountWithSessions = await AccountModel.findById(account._id).select("+refreshTokens.tokenHash");

  const activeSessions = (accountWithSessions?.refreshTokens || [])
    .filter((item) => !item.revokedAt && new Date(item.expiresAt).getTime() > Date.now())
    .slice(-(env.security.sessionMaxDevices - 1));

  await AccountModel.findByIdAndUpdate(account._id, {
    $set: {
      refreshTokens: [...activeSessions, session],
      lastLoginAt: new Date(),
    },
  });

  const suspiciousLogin = await detectSuspiciousLogin({
    accountId: account._id,
    accountType,
    role,
    ip: reqMeta.ip,
    userAgent: reqMeta.userAgent,
    deviceName: reqMeta.deviceName,
    sessionId,
  });

  await writeAuditLog({
    accountId: account._id,
    accountType,
    role,
    event: AUDIT_EVENTS.LOGIN_SUCCESS,
    status: "success",
    sessionId,
    ...reqMeta,
    metadata: { suspiciousLogin },
  });

  return {
    tokens,
    session: sanitizeSession(session),
    suspiciousLogin,
  };
};

export const isSessionActive = (account, sessionId) => {
  if (!sessionId) return true;

  const session = (account.refreshTokens || []).find((item) => item.sessionId === sessionId);
  return Boolean(session && !session.revokedAt && new Date(session.expiresAt).getTime() > Date.now());
};

export const rotateRefreshToken = async (refreshToken, reqMeta = {}) => {
  const decoded = verifyRefreshToken(refreshToken);
  const accountType = getAccountTypeByRole(decoded.role);
  const AccountModel = getAccountModelByType(accountType);
  const account = await AccountModel.findById(decoded.id)
    .select("+refreshTokens.tokenHash")
    .lean(false);

  if (!account) {
    throw new ApiError(401, "Invalid refresh token session");
  }

  const session = (account.refreshTokens || []).find((item) => item.sessionId === decoded.sessionId);

  if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) {
    await writeAuditLog({
      accountId: account._id,
      accountType,
      role: decoded.role,
      event: AUDIT_EVENTS.REFRESH_REUSE_DETECTED,
      status: "warning",
      sessionId: decoded.sessionId,
      ...reqMeta,
    });
    throw new ApiError(401, "Refresh token session is no longer valid");
  }

  const isTokenValid = await bcrypt.compare(refreshToken, session.tokenHash);

  if (!isTokenValid) {
    await AccountModel.findByIdAndUpdate(account._id, {
      $set: { "refreshTokens.$[session].revokedAt": new Date() },
    }, {
      arrayFilters: [{ "session.sessionId": decoded.sessionId }],
    });
    await writeAuditLog({
      accountId: account._id,
      accountType,
      role: decoded.role,
      event: AUDIT_EVENTS.REFRESH_REUSE_DETECTED,
      status: "warning",
      sessionId: decoded.sessionId,
      ...reqMeta,
    });
    throw new ApiError(401, "Refresh token reuse detected");
  }

  const tokens = generateAuthTokens({
    id: account._id.toString(),
    role: decoded.role,
    sessionId: decoded.sessionId,
    vendorStatus: decoded.vendorStatus,
  });
  const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);

  await AccountModel.findByIdAndUpdate(account._id, {
    $set: {
      "refreshTokens.$[session].tokenHash": tokenHash,
      "refreshTokens.$[session].lastUsedAt": new Date(),
      "refreshTokens.$[session].lastIp": reqMeta.ip,
      "refreshTokens.$[session].userAgent": reqMeta.userAgent,
      "refreshTokens.$[session].deviceName": reqMeta.deviceName,
      "refreshTokens.$[session].replacedAt": new Date(),
    },
  }, {
    arrayFilters: [{ "session.sessionId": decoded.sessionId }],
  });

  await writeAuditLog({
    accountId: account._id,
    accountType,
    role: decoded.role,
    event: AUDIT_EVENTS.REFRESH_ROTATED,
    status: "success",
    sessionId: decoded.sessionId,
    ...reqMeta,
  });

  return { tokens };
};

export const revokeSession = async ({ accountId, role, sessionId, refreshToken = null, reqMeta = {} }) => {
  const accountType = getAccountTypeByRole(role);
  const AccountModel = getAccountModelByType(accountType);

  await AccountModel.findByIdAndUpdate(accountId, {
    $set: {
      "refreshTokens.$[session].revokedAt": new Date(),
      "refreshTokens.$[session].lastUsedAt": new Date(),
    },
  }, {
    arrayFilters: [{ "session.sessionId": sessionId }],
  });

  await writeAuditLog({
    accountId,
    accountType,
    role,
    event: AUDIT_EVENTS.LOGOUT,
    status: "success",
    sessionId,
    ...reqMeta,
    metadata: { refreshTokenProvided: Boolean(refreshToken) },
  });
};

export const revokeAllSessions = async ({ accountId, role, reqMeta = {} }) => {
  const accountType = getAccountTypeByRole(role);
  const AccountModel = getAccountModelByType(accountType);

  await AccountModel.findByIdAndUpdate(accountId, {
    $set: {
      "refreshTokens.$[].revokedAt": new Date(),
      "refreshTokens.$[].lastUsedAt": new Date(),
    },
  });

  await writeAuditLog({
    accountId,
    accountType,
    role,
    event: AUDIT_EVENTS.LOGOUT_ALL,
    status: "success",
    ...reqMeta,
  });
};

export const listActiveSessions = async ({ accountId, role }) => {
  const accountType = getAccountTypeByRole(role);
  const AccountModel = getAccountModelByType(accountType);
  const account = await AccountModel.findById(accountId).select("refreshTokens");

  if (!account) throw new ApiError(404, "Account not found");

  return (account.refreshTokens || [])
    .filter((session) => !session.revokedAt && new Date(session.expiresAt).getTime() > Date.now())
    .map(sanitizeSession);
};
