import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullAddress: String,
  city: String,
  state: String,
  pincode: String,
});

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
    },

    role: {
      type: String,
      enum: ["customer", "vendor", "admin", "support"],
      default: "customer",
    },

    profileImage: String,

    addresses: [addressSchema],

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

export default mongoose.model("User", userSchema);