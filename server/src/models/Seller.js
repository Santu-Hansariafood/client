import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    sellerName: { type: String, required: true },
    password: { type: String, required: true },
    phoneNumbers: [{ value: String }],
    emails: [{ value: String }],
    companies: [String],
    commodities: [{ name: String }],
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  { timestamps: true }
);

sellerSchema.index({ sellerName: 1 });
sellerSchema.index({ "phoneNumbers.value": 1 });
sellerSchema.index({ "emails.value": 1 });
sellerSchema.index({ companies: 1 });

export default mongoose.model("Seller", sellerSchema);
