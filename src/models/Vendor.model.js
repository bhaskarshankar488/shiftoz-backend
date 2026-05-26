import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
    },

    ownerName: String,

    email: String,

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    passwordHash: String,

    GSTNumber: String,

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

export default mongoose.model("Vendor", vendorSchema);