import mongoose from "mongoose";

const confirmBidSchema = new mongoose.Schema(
  {
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ["Confirmed", "Rejected", "Review"],
      default: "Review"
    },
    participationId: { type: mongoose.Schema.Types.ObjectId, ref: "ParticipateBid", default: null },
    acceptanceRate: { type: Number, default: null },
    acceptanceQuantity: { type: Number, default: null },
    acceptanceAmount: { type: Number, default: null },
    acceptedAt: { type: Date, default: null },
    acceptedByMobile: { type: String, default: "" },
    acceptedByRole: { type: String, enum: ["Admin", "Employee", "Buyer", "Seller", ""], default: "" }
  },
  { timestamps: true }
);

confirmBidSchema.index({ bidId: 1 });
confirmBidSchema.index({ phone: 1 });
confirmBidSchema.index({ createdAt: -1 });

export default mongoose.model("ConfirmBid", confirmBidSchema);
