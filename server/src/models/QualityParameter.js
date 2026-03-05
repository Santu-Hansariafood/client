
import mongoose from "mongoose";

const qualityParameterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("QualityParameter", qualityParameterSchema);
