import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullAddress: String,
  city: String,
  state: String,
  pincode: String,
});

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

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
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

    role: {
      type: String,
      enum: ["customer", "vendor", "admin", "super_admin", "support"],
      default: "customer",
    },

    profileImage: String,

    addresses: [addressSchema],

    isVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,

    adminAuth: {
      twoFactorOtpHash: {
        type: String,
        select: false,
      },
      twoFactorOtpExpiresAt: Date,
      twoFactorRequestedAt: Date,
    },

    refreshTokens: [sessionSchema],

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ lockUntil: 1 });
userSchema.index({ "refreshTokens.sessionId": 1 });

export default mongoose.model("User", userSchema);
