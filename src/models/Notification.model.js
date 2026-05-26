import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    receiverId: mongoose.Schema.Types.ObjectId,

    receiverType: {
      type: String,
      enum: ["user", "vendor", "admin"],
    },

    title: String,

    message: String,

    type: String,

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);