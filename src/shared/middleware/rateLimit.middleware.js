import rateLimit from "express-rate-limit";
import env from "../../config/env.js";

export const authRateLimiter = rateLimit({
  windowMs: env.rateLimit.authWindowMs,
  limit: env.rateLimit.authMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimit.apiWindowMs,
  limit: env.rateLimit.apiMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
