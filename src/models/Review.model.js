import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    review: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Review", reviewSchema);