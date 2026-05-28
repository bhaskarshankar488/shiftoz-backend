import env from "../../config/env.js";
import { generateAuthTokens } from "../utils/jwt.util.js";

const parseExpiryToMs = (expiresIn) => {
  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  if (!match) return 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

export const getTokenCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: env.cookies.secure,
  sameSite: env.cookies.sameSite,
  domain: env.cookies.domain,
  maxAge,
});

export const attachAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(
    env.cookies.accessTokenName,
    accessToken,
    getTokenCookieOptions(parseExpiryToMs(env.jwt.accessExpiresIn)),
  );

  res.cookie(
    env.cookies.refreshTokenName,
    refreshToken,
    getTokenCookieOptions(parseExpiryToMs(env.jwt.refreshExpiresIn)),
  );

  return res;
};

export const clearAuthCookies = (res) => {
  res.clearCookie(env.cookies.accessTokenName, getTokenCookieOptions(0));
  res.clearCookie(env.cookies.refreshTokenName, getTokenCookieOptions(0));
  return res;
};

export const sendTokenResponse = (res, statusCode, authPayload, responseBody = {}) => {
  const tokens = generateAuthTokens(authPayload);
  attachAuthCookies(res, tokens);

  return res.status(statusCode).json({
    success: true,
    ...responseBody,
    tokens,
  });
};
