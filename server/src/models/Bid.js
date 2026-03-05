import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    commodity: { type: String, required: true }
  },
  { timestamps: true }
);

bidSchema.index({ createdAt: -1 });
bidSchema.index({ commodity: 1 });

export default mongoose.model("Bid", bidSchema);
