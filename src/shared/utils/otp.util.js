import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import env from "../../config/env.js";

export const generateOtp = (length = env.otp.length) => {
  const digits = "0123456789";
  let otp = "";

  for (let index = 0; index < length; index += 1) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }

  return otp;
};

export const hashOtp = async (otp) => bcrypt.hash(String(otp), env.otp.saltRounds);

export const verifyOtpHash = async (otp, hashedOtp) => {
  if (!otp || !hashedOtp) return false;
  return bcrypt.compare(String(otp), hashedOtp);
};

export const getOtpExpiry = (minutes = env.otp.expiresInMinutes) =>
  new Date(Date.now() + minutes * 60 * 1000);

export const isOtpExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
};

export const verifyOtp = async ({ otp, hashedOtp, expiresAt }) => {
  if (isOtpExpired(expiresAt)) return false;
  return verifyOtpHash(otp, hashedOtp);
};

export const createOtpChallenge = async (expiresInMinutes = env.otp.expiresInMinutes, length = env.otp.length) => {
  const otp = generateOtp(length);
  const hashedOtp = await hashOtp(otp);
  const expiresAt = getOtpExpiry(expiresInMinutes);

  return { otp, hashedOtp, expiresAt };
};
