import { Router } from "express";
import {
  listSessionsController,
  logoutAllDevicesController,
  refreshTokenController,
} from "../modules/auth/auth.controller.js";
import adminAuthRoutes from "../modules/auth/adminAuth.routes.js";
import customerAuthRoutes from "../modules/auth/customerAuth.routes.js";
import vendorAuthRoutes from "../modules/auth/vendorAuth.routes.js";
import { authenticateUser } from "../shared/middleware/authenticateUser.middleware.js";
import { strictAuthRateLimiter } from "../shared/middleware/rateLimit.middleware.js";

const router = Router();

router.post("/refresh-token", strictAuthRateLimiter, refreshTokenController);
router.post("/logout-all", authenticateUser, logoutAllDevicesController);
router.get("/sessions", authenticateUser, listSessionsController);
router.use("/admin", adminAuthRoutes);
router.use("/customer", customerAuthRoutes);
router.use("/vendor", vendorAuthRoutes);

export default router;
