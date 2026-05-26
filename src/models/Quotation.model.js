import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    quoteRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuoteRequest",
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },

    quotedPrice: Number,

    estimatedDays: Number,

    notes: String,

    includedServices: [String],

    excludedServices: [String],

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

quotationSchema.index({ vendorId: 1 });
quotationSchema.index({ quoteRequestId: 1 });

export default mongoose.model("Quotation", quotationSchema);