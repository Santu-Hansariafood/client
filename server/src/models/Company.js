import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true }
  },
  { timestamps: true }
);

companySchema.index({ companyName: 1 });

export default mongoose.model("Company", companySchema);
