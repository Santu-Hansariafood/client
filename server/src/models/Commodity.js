import mongoose from "mongoose";

const commoditySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

commoditySchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Commodity", commoditySchema);
