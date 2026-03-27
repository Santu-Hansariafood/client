import mongoose from "mongoose";

const participateBidSchema = new mongoose.Schema(
  {
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
    mobile: { type: String, required: true },
    rate: { type: Number, required: true },
    quantity: { type: Number, required: true },
    loadingFrom: { type: String, default: "" },
    remarks: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true },
);

participateBidSchema.index({ bidId: 1, mobile: 1 });
participateBidSchema.index({ createdAt: -1 });

export default mongoose.model("ParticipateBid", participateBidSchema);
