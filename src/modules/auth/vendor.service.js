import bcrypt from "bcryptjs";
import { ACCOUNT_TYPES, AUDIT_EVENTS, VENDOR_STATUSES, USER_ROLES } from "../../shared/constants/auth.constants.js";
import ApiError from "../../shared/utils/ApiError.js";
import { assertAccountIsNotLocked, buildFailedLoginUpdate } from "../../shared/services/accountSecurity.service.js";
import { createSession, revokeSession } from "../../shared/services/session.service.js";
import { writeAuditLog } from "../../shared/services/auditLog.service.js";
import {
  createVendor,
  findVendorByEmailOrPhone,
  findVendorById,
  updateVendorById,
} from "./vendor.repository.js";

const sanitizeVendor = (vendor) => {
  const doc = vendor?.toObject ? vendor.toObject() : vendor;
  if (!doc) return null;

  delete doc.passwordHash;
  delete doc.refreshTokenHash;
  delete doc.refreshTokens;
  return doc;
};

const buildVendorTokenPayload = (vendor) => ({
  id: vendor._id.toString(),
  role: USER_ROLES.VENDOR,
  vendorStatus: vendor.vendorStatus,
});

export const registerVendor = async (payload, reqMeta = {}) => {
  const existingVendor = await findVendorByEmailOrPhone({
    email: payload.email,
    phone: payload.phone,
  });

  if (existingVendor) {
    throw new ApiError(409, "Vendor already exists with this email or phone");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const vendor = await createVendor({
    businessName: payload.businessName,
    ownerName: payload.ownerName,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    GSTNumber: payload.GSTNumber,
    businessAddress: payload.businessAddress,
    vendorStatus: VENDOR_STATUSES.TEMPORARY,
    KYCStatus: "pending",
    isApproved: false,
    isActive: true,
  });

  const session = await createSession({
    account: vendor,
    accountType: ACCOUNT_TYPES.VENDOR,
    role: USER_ROLES.VENDOR,
    tokenPayload: buildVendorTokenPayload(vendor),
    reqMeta,
  });

  await writeAuditLog({
    accountId: vendor._id,
    accountType: ACCOUNT_TYPES.VENDOR,
    role: USER_ROLES.VENDOR,
    event: AUDIT_EVENTS.VENDOR_REGISTERED,
    status: "success",
    sessionId: session.session.sessionId,
    ...reqMeta,
  });

  return {
    vendor: sanitizeVendor(vendor),
    tokens: session.tokens,
    session: session.session,
    suspiciousLogin: session.suspiciousLogin,
  };
};

export const loginVendor = async ({ identifier, password }, reqMeta = {}) => {
  const lookup = identifier.includes("@")
    ? { email: identifier.toLowerCase(), phone: undefined }
    : { email: undefined, phone: identifier };

  const vendor = await findVendorByEmailOrPhone(lookup, "+passwordHash +refreshTokens.tokenHash");

  if (!vendor || !vendor.passwordHash) {
    throw new ApiError(401, "Invalid vendor credentials");
  }

  assertAccountIsNotLocked(vendor, "Vendor account is temporarily locked. Try again later.");

  const isPasswordValid = await bcrypt.compare(password, vendor.passwordHash);

  if (!isPasswordValid) {
    const failedLogin = buildFailedLoginUpdate(vendor);
    await updateVendorById(vendor._id, {
      loginAttempts: failedLogin.loginAttempts,
      ...(failedLogin.lockUntil ? { lockUntil: failedLogin.lockUntil } : {}),
    });
    await writeAuditLog({
      accountId: vendor._id,
      accountType: ACCOUNT_TYPES.VENDOR,
      role: USER_ROLES.VENDOR,
      event: failedLogin.locked ? AUDIT_EVENTS.ACCOUNT_LOCKED : AUDIT_EVENTS.LOGIN_PASSWORD_FAILED,
      status: "failure",
      ...reqMeta,
    });
    throw new ApiError(401, "Invalid vendor credentials");
  }

  if (vendor.vendorStatus === VENDOR_STATUSES.SUSPENDED || vendor.isActive === false) {
    throw new ApiError(403, "Vendor account is suspended");
  }

  await updateVendorById(vendor._id, {
    loginAttempts: 0,
    lastLoginAt: new Date(),
    $unset: { lockUntil: 1 },
  });

  await writeAuditLog({
    accountId: vendor._id,
    accountType: ACCOUNT_TYPES.VENDOR,
    role: USER_ROLES.VENDOR,
    event: AUDIT_EVENTS.LOGIN_PASSWORD_SUCCESS,
    status: "success",
    ...reqMeta,
  });

  const session = await createSession({
    account: vendor,
    accountType: ACCOUNT_TYPES.VENDOR,
    role: USER_ROLES.VENDOR,
    tokenPayload: buildVendorTokenPayload(vendor),
    reqMeta,
  });

  return {
    vendor: sanitizeVendor(vendor),
    tokens: session.tokens,
    session: session.session,
    suspiciousLogin: session.suspiciousLogin,
  };
};

export const uploadVendorDocuments = async (vendorId, files) => {
  const vendor = await findVendorById(vendorId);

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  if ([VENDOR_STATUSES.APPROVED, VENDOR_STATUSES.SUSPENDED].includes(vendor.vendorStatus)) {
    throw new ApiError(409, "Documents cannot be updated for this vendor status");
  }

  const documents = files.map((file) => ({
    documentType: file.fieldname,
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
  }));

  const updatedVendor = await updateVendorById(vendorId, {
    $push: { kycDocuments: { $each: documents } },
    vendorStatus: VENDOR_STATUSES.UNDER_REVIEW,
    KYCStatus: "pending",
  });

  return sanitizeVendor(updatedVendor);
};

export const logoutVendor = async ({ vendorId, sessionId, refreshToken, reqMeta = {} }) => {
  await revokeSession({
    accountId: vendorId,
    role: USER_ROLES.VENDOR,
    sessionId,
    refreshToken,
    reqMeta,
  });
};

export const getVendorProfile = async (vendorId) => {
  const vendor = await findVendorById(vendorId, "-passwordHash -refreshTokenHash");

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return sanitizeVendor(vendor);
};
