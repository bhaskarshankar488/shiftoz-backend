import mongoose from "mongoose";
import { ACCOUNT_TYPES } from "../shared/constants/auth.constants.js";

const authAuditLogSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    accountType: {
      type: String,
      enum: Object.values(ACCOUNT_TYPES),
      required: true,
      index: true,
    },
    role: String,
    event: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["success", "failure", "warning"],
      required: true,
    },
    sessionId: String,
    ip: String,
    userAgent: String,
    deviceName: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

authAuditLogSchema.index({ accountId: 1, createdAt: -1 });
authAuditLogSchema.index({ event: 1, createdAt: -1 });
authAuditLogSchema.index({ ip: 1, createdAt: -1 });

export default mongoose.model("AuthAuditLog", authAuditLogSchema);
