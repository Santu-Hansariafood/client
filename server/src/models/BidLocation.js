import mongoose from "mongoose";

const bidLocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }
  },
  { timestamps: true }
);

bidLocationSchema.index({ name: 1 });

export default mongoose.model("BidLocation", bidLocationSchema);
