import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import { TOKEN_TYPES } from "../constants/auth.constants.js";
import ApiError from "./ApiError.js";

const signToken = (payload, secret, expiresIn, type, options = {}) =>
  jwt.sign({ ...payload, type }, secret, {
    expiresIn,
    ...options,
  });

export const generateAccessToken = (payload, options = {}) =>
  signToken(payload, env.jwt.accessSecret, env.jwt.accessExpiresIn, TOKEN_TYPES.ACCESS, options);

export const generateRefreshToken = (payload, options = {}) =>
  signToken(payload, env.jwt.refreshSecret, env.jwt.refreshExpiresIn, TOKEN_TYPES.REFRESH, options);

export const generateAuthTokens = (payload) => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload),
});

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);

    if (decoded.type && decoded.type !== TOKEN_TYPES.ACCESS) {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret);

    if (decoded.type && decoded.type !== TOKEN_TYPES.REFRESH) {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
};
