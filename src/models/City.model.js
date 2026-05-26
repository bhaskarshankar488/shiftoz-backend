import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    cityName: String,

    state: String,

    slug: String,

    seoTitle: String,

    seoDescription: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("City", citySchema);