import { Router } from "express";
import { USER_ROLES } from "../../shared/constants/auth.constants.js";
import { authenticateUser } from "../../shared/middleware/authenticateUser.middleware.js";
import { authorizeRoles } from "../../shared/middleware/authorizeRoles.middleware.js";
import { authRateLimiter, strictAuthRateLimiter } from "../../shared/middleware/rateLimit.middleware.js";
import {
  adminLoginController,
  adminLogoutController,
  adminVerifyTwoFactorController,
  createAdminController,
  getAdminProfileController,
} from "./admin.controller.js";
import {
  validateAdminLogin,
  validateAdminTwoFactor,
  validateCreateAdmin,
} from "./admin.validator.js";

const router = Router();

const adminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SUPPORT];

router.post("/login", authRateLimiter, validateAdminLogin, adminLoginController);
router.post("/verify-2fa", strictAuthRateLimiter, validateAdminTwoFactor, adminVerifyTwoFactorController);

router.post(
  "/logout",
  authenticateUser,
  authorizeRoles(...adminRoles),
  adminLogoutController,
);

router.post(
  "/create-admin",
  authenticateUser,
  authorizeRoles(USER_ROLES.SUPER_ADMIN),
  validateCreateAdmin,
  createAdminController,
);

router.get(
  "/profile",
  authenticateUser,
  authorizeRoles(...adminRoles),
  getAdminProfileController,
);

export default router;
