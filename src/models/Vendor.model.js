import mongoose from "mongoose";
import { VENDOR_STATUS_VALUES, VENDOR_STATUSES } from "../shared/constants/auth.constants.js";

const kycDocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: ["gst", "pan", "aadhaar", "business_registration", "address_proof", "other"],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: String,
    mimeType: String,
    size: Number,
    path: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    tokenHash: {
      type: String,
      select: false,
    },
    userAgent: String,
    deviceName: String,
    ip: String,
    lastIp: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUsedAt: Date,
    expiresAt: Date,
    revokedAt: Date,
    replacedAt: Date,
  },
  { _id: false },
);

const vendorSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
    },

    ownerName: String,

    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    GSTNumber: String,

    businessAddress: {
      fullAddress: String,
      city: String,
      state: String,
      pincode: String,
    },

    vendorStatus: {
      type: String,
      enum: VENDOR_STATUS_VALUES,
      default: VENDOR_STATUSES.TEMPORARY,
      index: true,
    },

    kycDocuments: [kycDocumentSchema],

    rejectionReason: String,

    approvedAt: Date,

    reviewedAt: Date,

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    refreshTokenHash: {
      type: String,
      select: false,
    },

    refreshTokens: [sessionSchema],

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,

    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],

    citiesServed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
      },
    ],

    rating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    completedBookings: {
      type: Number,
      default: 0,
    },

    KYCStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: Date,

    leadStats: {
      totalLeads: {
        type: Number,
        default: 0,
      },

      respondedLeads: {
        type: Number,
        default: 0,
      },

      convertedBookings: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ services: 1 });
vendorSchema.index({ citiesServed: 1 });
vendorSchema.index({ rating: -1 });
vendorSchema.index({ lockUntil: 1 });
vendorSchema.index({ "refreshTokens.sessionId": 1 });

export default mongoose.model("Vendor", vendorSchema);
