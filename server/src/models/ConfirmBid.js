import mongoose from "mongoose";

const confirmBidSchema = new mongoose.Schema(
  {
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ["Confirmed", "Rejected", "Review"],
      default: "Review"
    }
  },
  { timestamps: true }
);

confirmBidSchema.index({ bidId: 1 });
confirmBidSchema.index({ phone: 1 });
confirmBidSchema.index({ createdAt: -1 });

export default mongoose.model("ConfirmBid", confirmBidSchema);
