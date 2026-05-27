import env from "../../config/env.js";
import { ACCOUNT_TYPES, AUDIT_EVENTS, USER_ROLES } from "../../shared/constants/auth.constants.js";
import ApiError from "../../shared/utils/ApiError.js";
import { createOtpChallenge, isOtpExpired, verifyOtp } from "../../shared/utils/otp.util.js";
import { createSession, revokeSession } from "../../shared/services/session.service.js";
import { writeAuditLog } from "../../shared/services/auditLog.service.js";
import {
  createCustomer,
  findCustomerById,
  findCustomerByPhone,
  updateCustomerById,
} from "./customer.repository.js";

const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

const sanitizeCustomer = (customer) => {
  const doc = customer?.toObject ? customer.toObject() : customer;
  if (!doc) return null;

  delete doc.passwordHash;
  delete doc.refreshTokens;
  delete doc.adminAuth;
  delete doc.customerAuth;
  return doc;
};

const maskPhone = (phone) => `${phone.slice(0, 2)}******${phone.slice(-2)}`;

const buildCustomerTokenPayload = (customer) => ({
  id: customer._id.toString(),
  role: USER_ROLES.CUSTOMER,
});

const buildDefaultCustomerName = (phone) => `Customer ${phone.slice(-4)}`;

export const sendCustomerOtp = async ({ phone }, reqMeta = {}) => {
  let customer = await findCustomerByPhone(phone, "+customerAuth.otpHash");
  let isNewCustomer = false;

  if (!customer) {
    customer = await createCustomer({
      name: buildDefaultCustomerName(phone),
      phone,
      role: USER_ROLES.CUSTOMER,
      isVerified: false,
      isPhoneVerified: false,
    });
    isNewCustomer = true;
  }

  if (customer.isBlocked) {
    throw new ApiError(403, "Customer account is blocked");
  }

  const lastRequestedAt = customer.customerAuth?.otpRequestedAt?.getTime();

  if (lastRequestedAt && Date.now() - lastRequestedAt < OTP_RESEND_COOLDOWN_MS) {
    throw new ApiError(429, "Please wait before requesting another OTP");
  }

  const challenge = await createOtpChallenge(env.otp.expiresInMinutes);

  const updatedCustomer = await updateCustomerById(customer._id, {
    "customerAuth.otpHash": challenge.hashedOtp,
    "customerAuth.otpExpiresAt": challenge.expiresAt,
    "customerAuth.otpRequestedAt": new Date(),
    "customerAuth.otpAttempts": 0,
  });

  await writeAuditLog({
    accountId: customer._id,
    accountType: ACCOUNT_TYPES.USER,
    role: USER_ROLES.CUSTOMER,
    event: isNewCustomer ? AUDIT_EVENTS.CUSTOMER_AUTO_REGISTERED : AUDIT_EVENTS.CUSTOMER_OTP_SENT,
    status: "success",
    ...reqMeta,
    metadata: { phone: maskPhone(phone), otpExpiresAt: challenge.expiresAt },
  });

  return {
    customer: sanitizeCustomer(updatedCustomer),
    isNewCustomer,
    otpExpiresAt: challenge.expiresAt,
    otp: challenge.otp,
  };
};

export const verifyCustomerOtp = async ({ phone, otp }, reqMeta = {}) => {
  const customer = await findCustomerByPhone(phone, "+customerAuth.otpHash +refreshTokens.tokenHash");

  if (!customer) {
    throw new ApiError(404, "Please request an OTP before verification");
  }

  if (customer.isBlocked) {
    throw new ApiError(403, "Customer account is blocked");
  }

  const otpHash = customer.customerAuth?.otpHash;
  const otpExpiresAt = customer.customerAuth?.otpExpiresAt;

  if (!otpHash || isOtpExpired(otpExpiresAt)) {
    throw new ApiError(401, "OTP is invalid or expired");
  }

  const isOtpValid = await verifyOtp({ otp, hashedOtp: otpHash, expiresAt: otpExpiresAt });

  if (!isOtpValid) {
    const nextAttempts = (customer.customerAuth?.otpAttempts || 0) + 1;
    const shouldBlockOtp = nextAttempts >= MAX_OTP_ATTEMPTS;

    await updateCustomerById(customer._id, {
      "customerAuth.otpAttempts": nextAttempts,
      ...(shouldBlockOtp ? { "customerAuth.otpExpiresAt": new Date(0) } : {}),
    });

    await writeAuditLog({
      accountId: customer._id,
      accountType: ACCOUNT_TYPES.USER,
      role: USER_ROLES.CUSTOMER,
      event: AUDIT_EVENTS.CUSTOMER_OTP_FAILED,
      status: "failure",
      ...reqMeta,
      metadata: { attempts: nextAttempts },
    });

    throw new ApiError(401, "OTP is invalid or expired");
  }

  const verifiedCustomer = await updateCustomerById(customer._id, {
    isVerified: true,
    isPhoneVerified: true,
    lastLoginAt: new Date(),
    "customerAuth.otpAttempts": 0,
    $unset: {
      "customerAuth.otpHash": 1,
      "customerAuth.otpExpiresAt": 1,
      "customerAuth.otpRequestedAt": 1,
    },
  });

  const session = await createSession({
    account: verifiedCustomer,
    accountType: ACCOUNT_TYPES.USER,
    role: USER_ROLES.CUSTOMER,
    tokenPayload: buildCustomerTokenPayload(verifiedCustomer),
    reqMeta,
  });

  return {
    customer: sanitizeCustomer(verifiedCustomer),
    tokens: session.tokens,
    session: session.session,
    suspiciousLogin: session.suspiciousLogin,
  };
};

export const logoutCustomer = async ({ customerId, sessionId, refreshToken, reqMeta = {} }) => {
  await revokeSession({
    accountId: customerId,
    role: USER_ROLES.CUSTOMER,
    sessionId,
    refreshToken,
    reqMeta,
  });
};

export const getCustomerProfile = async (customerId) => {
  const customer = await findCustomerById(customerId, "-passwordHash -refreshTokens -adminAuth -customerAuth");

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  return sanitizeCustomer(customer);
};
