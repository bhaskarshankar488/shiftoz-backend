import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    serviceName: String,

    slug: String,

    icon: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Service", serviceSchema);