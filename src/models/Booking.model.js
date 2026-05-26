import mongoose from "mongoose";

const trackingSchema = new mongoose.Schema({
  status: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },

    quoteRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuoteRequest",
    },

    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
    },

    bookingAmount: Number,

    commissionAmount: Number,

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    bookingStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    movingDate: Date,

    trackingTimeline: [trackingSchema],
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ bookingNumber: 1 });

export default mongoose.model("Booking", bookingSchema);