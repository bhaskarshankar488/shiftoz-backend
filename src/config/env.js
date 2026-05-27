import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ["true", "1", "yes"].includes(String(value).toLowerCase());
};

const requiredEnv = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0 && process.env.NODE_ENV !== "test") {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  jwt: Object.freeze({
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  }),
  cookies: Object.freeze({
    accessTokenName: process.env.ACCESS_TOKEN_COOKIE_NAME || "accessToken",
    refreshTokenName: process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken",
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: toBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === "production"),
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
  }),
  otp: Object.freeze({
    length: toNumber(process.env.OTP_LENGTH, 6),
    expiresInMinutes: toNumber(process.env.OTP_EXPIRES_IN_MINUTES, 10),
    saltRounds: toNumber(process.env.OTP_SALT_ROUNDS, 10),
  }),
  rateLimit: Object.freeze({
    authWindowMs: toNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    authMax: toNumber(process.env.AUTH_RATE_LIMIT_MAX, 10),
    apiWindowMs: toNumber(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    apiMax: toNumber(process.env.API_RATE_LIMIT_MAX, 100),
  }),
});

export default env;
