import ApiError from "../utils/ApiError.js";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCK_TIME_MS = 15 * 60 * 1000;

export const assertAccountIsNotLocked = (account, message = "Account is temporarily locked") => {
  if (!account || account.isBlocked || account.isActive === false) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (account.lockUntil && account.lockUntil.getTime() > Date.now()) {
    throw new ApiError(423, message);
  }
};

export const buildFailedLoginUpdate = (
  account,
  {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    lockTimeMs = DEFAULT_LOCK_TIME_MS,
  } = {},
) => {
  const nextAttempts = (account.loginAttempts || 0) + 1;

  return {
    loginAttempts: nextAttempts,
    lockUntil: nextAttempts >= maxAttempts ? new Date(Date.now() + lockTimeMs) : account.lockUntil,
    locked: nextAttempts >= maxAttempts,
  };
};

export const buildSuccessfulLoginUpdate = () => ({
  loginAttempts: 0,
  $unset: { lockUntil: 1 },
  lastLoginAt: new Date(),
});
