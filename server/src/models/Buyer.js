import mongoose from "mongoose";

const buyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String },
    mobile: { type: String },
    email: { type: String }
  },
  { timestamps: true }
);

buyerSchema.index({ name: 1 });
buyerSchema.index({ companyName: 1 });
buyerSchema.index({ mobile: 1 });

export default mongoose.model("Buyer", buyerSchema);
