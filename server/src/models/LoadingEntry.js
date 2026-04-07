import mongoose from "mongoose";

const loadingEntrySchema = new mongoose.Schema(
  {
    loadingDate: { type: Date, required: true },
    loadingWeight: { type: Number, required: true },
    lorryNumber: { type: String, required: true },
    addedTransport: { type: String, default: "" },
    driverName: { type: String, default: "" },
    driverPhoneNumber: { type: String, required: true },
    freightRate: { type: Number, default: 0 },
    totalFreight: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    billNumber: { type: String, default: "" },
    dateOfIssue: { type: Date },
    documentUrl: { type: String, default: "" },
    saudaNo: { type: String, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    supplierCompany: { type: String, default: "" },
    consignee: { type: String, required: true },
    commodity: { type: String, default: "" },
    bags: { type: Number, default: 0 },
  },
  { timestamps: true }
);

loadingEntrySchema.index({ saudaNo: 1 });
loadingEntrySchema.index({ supplier: 1 });
loadingEntrySchema.index({ loadingDate: -1 });

export default mongoose.model("LoadingEntry", loadingEntrySchema);
