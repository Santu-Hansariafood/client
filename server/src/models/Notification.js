import mongoose from "mongoose";
import { emitNotification } from "../lib/socket.js";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: true },
    recipientRole: {
      type: String,
      enum: ["Admin", "Employee", "Seller", "Buyer"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["BidParticipation", "BidConfirmation", "BidRejection"],
      required: true,
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ recipientRole: 1 });
notificationSchema.index({ isRead: 1 });

notificationSchema.post("save", function (doc) {
  emitNotification(doc);
});

notificationSchema.post("insertMany", function (docs) {
  docs.forEach((doc) => emitNotification(doc));
});

export default mongoose.model("Notification", notificationSchema);
