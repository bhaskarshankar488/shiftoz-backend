import { Router } from "express";
import { USER_ROLES } from "../../shared/constants/auth.constants.js";
import { authenticateUser } from "../../shared/middleware/authenticateUser.middleware.js";
import { authorizeRoles } from "../../shared/middleware/authorizeRoles.middleware.js";
import { authRateLimiter, strictAuthRateLimiter } from "../../shared/middleware/rateLimit.middleware.js";
import {
  getCustomerProfileController,
  logoutCustomerController,
  sendCustomerOtpController,
  verifyCustomerOtpController,
} from "./customer.controller.js";
import {
  validateSendCustomerOtp,
  validateVerifyCustomerOtp,
} from "./customer.validator.js";

const router = Router();

router.post("/send-otp", authRateLimiter, validateSendCustomerOtp, sendCustomerOtpController);
router.post("/verify-otp", strictAuthRateLimiter, validateVerifyCustomerOtp, verifyCustomerOtpController);

router.post(
  "/logout",
  authenticateUser,
  authorizeRoles(USER_ROLES.CUSTOMER),
  logoutCustomerController,
);

router.get(
  "/profile",
  authenticateUser,
  authorizeRoles(USER_ROLES.CUSTOMER),
  getCustomerProfileController,
);

export default router;
