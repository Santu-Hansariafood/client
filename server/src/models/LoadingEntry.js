import mongoose from "mongoose";

const loadingEntrySchema = new mongoose.Schema(
  {
    loadingDate: { type: Date, required: true },
    loadingWeight: { type: Number, required: true },
    lorryNumber: { type: String, required: true },
    transporterId: { type: mongoose.Schema.Types.ObjectId, ref: "Transporter" },
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
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    supplierCompany: { type: String, default: "" },
    consignee: { type: String, required: true },
    buyerCompany: { type: String, default: "" },
    commodity: { type: String, default: "" },
    bags: { type: Number, default: 0 },
    deliveryDate: { type: Date },
    unloadingWeight: { type: Number, default: 0 },
    unloadingDate: { type: Date },
    buyerBrokerage: { type: Number, default: 0 },
    sellerBrokerage: { type: Number, default: 0 },
    documents: {
      kantaSlip: { type: String, default: "" },
      unloadingChallan: { type: String, default: "" },
      partyBillCopy: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

loadingEntrySchema.index({ saudaNo: 1 });
loadingEntrySchema.index({ supplier: 1 });
loadingEntrySchema.index({ loadingDate: -1 });
loadingEntrySchema.index({ billNumber: 1 });
loadingEntrySchema.index({ lorryNumber: 1 });
loadingEntrySchema.index({ createdAt: -1 });

export default mongoose.model("LoadingEntry", loadingEntrySchema);
