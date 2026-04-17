import mongoose from "mongoose";

const vendorCodeSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    vendorCode: { type: String, required: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

// Unique index for the combination of group, buyer, and seller
vendorCodeSchema.index({ group: 1, buyer: 1, seller: 1 }, { unique: true });

export default mongoose.model("VendorCode", vendorCodeSchema);
