import mongoose from "mongoose";

const bankDetailSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    branchName: { type: String, required: true },
    bankName: { type: String, required: true },
  },
  { _id: false },
);

const sellerCompanySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    gstNo: { type: String, required: true, trim: true },
    panNo: { type: String, required: true, trim: true },
    aadhaarNo: { type: String, default: "", trim: true },
    address: { type: String, required: true, trim: true },
    mobileNo: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    pinNo: { type: String, default: "", trim: true },
    msmeNo: { type: String, default: "", trim: true },
    bankDetails: { type: [bankDetailSchema], default: [] },
  },
  { timestamps: true },
);

sellerCompanySchema.index({ companyName: 1 });

export default mongoose.model("SellerCompany", sellerCompanySchema);
