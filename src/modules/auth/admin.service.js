import bcrypt from "bcryptjs";
import { ACCOUNT_TYPES, AUDIT_EVENTS, USER_ROLES } from "../../shared/constants/auth.constants.js";
import ApiError from "../../shared/utils/ApiError.js";
import { createOtpChallenge, verifyOtp } from "../../shared/utils/otp.util.js";
import { createSession, revokeSession } from "../../shared/services/session.service.js";
import { writeAuditLog } from "../../shared/services/auditLog.service.js";
import {
  createAdminUser,
  findAdminByEmail,
  findAdminById,
  incrementAdminLoginAttempts,
  resetAdminLoginSecurity,
  updateAdminById,
} from "./admin.repository.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;
const ADMIN_2FA_EXPIRES_IN_MINUTES = 5;

const sanitizeAdmin = (admin) => {
  const doc = admin?.toObject ? admin.toObject() : admin;
  if (!doc) return null;

  delete doc.passwordHash;
  delete doc.refreshTokens;
  delete doc.adminAuth;
  return doc;
};

const assertAdminCanLogin = (admin) => {
  if (!admin || admin.isBlocked) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  if (admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
    throw new ApiError(423, "Admin account is temporarily locked. Try again later.");
  }
};

const buildAdminTokenPayload = (admin) => ({
  id: admin._id.toString(),
  role: admin.role,
});

export const loginAdmin = async ({ email, password }, reqMeta = {}) => {
  const admin = await findAdminByEmail(email, "+passwordHash +adminAuth.twoFactorOtpHash");

  assertAdminCanLogin(admin);

  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

  if (!isPasswordValid) {
    const shouldLock = (admin.loginAttempts || 0) + 1 >= MAX_LOGIN_ATTEMPTS;
    await incrementAdminLoginAttempts(
      admin._id,
      shouldLock ? new Date(Date.now() + LOCK_TIME_MS) : null,
    );
    await writeAuditLog({
      accountId: admin._id,
      accountType: ACCOUNT_TYPES.USER,
      role: admin.role,
      event: shouldLock ? AUDIT_EVENTS.ACCOUNT_LOCKED : AUDIT_EVENTS.LOGIN_PASSWORD_FAILED,
      status: "failure",
      ...reqMeta,
    });

    throw new ApiError(401, "Invalid admin credentials");
  }

  const challenge = await createOtpChallenge(ADMIN_2FA_EXPIRES_IN_MINUTES);

  await updateAdminById(admin._id, {
    loginAttempts: 0,
    $unset: { lockUntil: 1 },
    "adminAuth.twoFactorOtpHash": challenge.hashedOtp,
    "adminAuth.twoFactorOtpExpiresAt": challenge.expiresAt,
    "adminAuth.twoFactorRequestedAt": new Date(),
  });

  await writeAuditLog({
    accountId: admin._id,
    accountType: ACCOUNT_TYPES.USER,
    role: admin.role,
    event: AUDIT_EVENTS.TWO_FACTOR_SENT,
    status: "success",
    ...reqMeta,
  });

  return {
    admin: sanitizeAdmin(admin),
    twoFactorRequired: true,
    otp: challenge.otp,
  };
};

export const verifyAdminTwoFactor = async ({ email, otp }, reqMeta = {}) => {
  const admin = await findAdminByEmail(email, "+adminAuth.twoFactorOtpHash +refreshTokens.tokenHash");

  assertAdminCanLogin(admin);

  const isOtpValid = await verifyOtp({
    otp,
    hashedOtp: admin.adminAuth?.twoFactorOtpHash,
    expiresAt: admin.adminAuth?.twoFactorOtpExpiresAt,
  });

  if (!isOtpValid) {
    await writeAuditLog({
      accountId: admin._id,
      accountType: ACCOUNT_TYPES.USER,
      role: admin.role,
      event: AUDIT_EVENTS.TWO_FACTOR_FAILED,
      status: "failure",
      ...reqMeta,
    });
    throw new ApiError(401, "Invalid or expired 2FA OTP");
  }

  const session = await createSession({
    account: admin,
    accountType: ACCOUNT_TYPES.USER,
    role: admin.role,
    tokenPayload: buildAdminTokenPayload(admin),
    reqMeta,
  });

  const updatedAdmin = await updateAdminById(admin._id, {
    isVerified: true,
    isEmailVerified: true,
    lastLoginAt: new Date(),
    $unset: {
      "adminAuth.twoFactorOtpHash": 1,
      "adminAuth.twoFactorOtpExpiresAt": 1,
      "adminAuth.twoFactorRequestedAt": 1,
    },
  });

  return {
    admin: sanitizeAdmin(updatedAdmin),
    tokens: session.tokens,
    session: session.session,
    suspiciousLogin: session.suspiciousLogin,
  };
};

export const createAdminAccount = async (payload) => {
  const existingAdmin = await findAdminByEmail(payload.email);

  if (existingAdmin) {
    throw new ApiError(409, "An admin account already exists with this email");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const admin = await createAdminUser({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    role: payload.role,
    isVerified: true,
    isEmailVerified: true,
    isPhoneVerified: false,
  });

  await writeAuditLog({
    accountId: admin._id,
    accountType: ACCOUNT_TYPES.USER,
    role: admin.role,
    event: AUDIT_EVENTS.ADMIN_CREATED,
    status: "success",
    metadata: { createdRole: payload.role },
  });

  return sanitizeAdmin(admin);
};

export const logoutAdmin = async ({ adminId, role, sessionId, refreshToken = null, reqMeta = {} }) => {
  await revokeSession({
    accountId: adminId,
    role,
    sessionId,
    refreshToken,
    reqMeta,
  });
};

export const getAdminProfile = async (adminId) => {
  const admin = await findAdminById(adminId, "-passwordHash -refreshTokens -adminAuth");

  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }

  return sanitizeAdmin(admin);
};
