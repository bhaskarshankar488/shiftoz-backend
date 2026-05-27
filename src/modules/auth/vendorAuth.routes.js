import { Router } from "express";
import { USER_ROLES } from "../../shared/constants/auth.constants.js";
import { authenticateUser } from "../../shared/middleware/authenticateUser.middleware.js";
import { authorizeRoles } from "../../shared/middleware/authorizeRoles.middleware.js";
import { authRateLimiter, strictAuthRateLimiter } from "../../shared/middleware/rateLimit.middleware.js";
import {
  getVendorProfileController,
  loginVendorController,
  logoutVendorController,
  registerVendorController,
  uploadVendorDocumentsController,
} from "./vendor.controller.js";
import { uploadVendorDocumentsMiddleware } from "./vendorDocumentUpload.middleware.js";
import {
  validateVendorDocumentUpload,
  validateVendorLogin,
  validateVendorRegister,
} from "./vendor.validator.js";

const router = Router();

router.post("/register", authRateLimiter, validateVendorRegister, registerVendorController);
router.post("/login", strictAuthRateLimiter, validateVendorLogin, loginVendorController);

router.post(
  "/upload-documents",
  authenticateUser,
  authorizeRoles(USER_ROLES.VENDOR),
  uploadVendorDocumentsMiddleware,
  validateVendorDocumentUpload,
  uploadVendorDocumentsController,
);

router.post("/logout", authenticateUser, authorizeRoles(USER_ROLES.VENDOR), logoutVendorController);
router.get("/profile", authenticateUser, authorizeRoles(USER_ROLES.VENDOR), getVendorProfileController);

export default router;
