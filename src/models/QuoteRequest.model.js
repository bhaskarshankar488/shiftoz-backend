import mongoose from "mongoose";

const quoteRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    serviceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },

    pickupAddress: {
      fullAddress: String,
      city: String,
      state: String,
      pincode: String,
    },

    dropAddress: {
      fullAddress: String,
      city: String,
      state: String,
      pincode: String,
    },

    shiftingDate: Date,

    inventoryDetails: String,

    estimatedWeight: Number,

    assignedVendorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
      },
    ],

    quotationCount: {
      type: Number,
      default: 0,
    },

    selectedQuotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "quoted",
        "booked",
        "cancelled",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

quoteRequestSchema.index({ status: 1 });
quoteRequestSchema.index({ createdAt: -1 });

export default mongoose.model("QuoteRequest", quoteRequestSchema);