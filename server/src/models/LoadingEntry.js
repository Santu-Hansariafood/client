import mongoose from "mongoose";

const formatName = (name) => {
  if (!name) return name;
  return name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const loadingEntrySchema = new mongoose.Schema(
  {
    loadingDate: { type: Date, required: true },
    loadingNo: { type: Number },
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
    supplierCompany: { type: String, default: "", set: formatName },
    consignee: { type: String, required: true },
    buyerCompany: { type: String, default: "" },
    commodity: { type: String, default: "" },
    bags: { type: Number, default: 0 },
    deliveryDate: { type: Date },
    unloadingWeight: { type: Number, default: 0 },
    unloadingDate: { type: Date },
    buyerBrokerage: { type: Number, default: 0 },
    sellerBrokerage: { type: Number, default: 0 },
    loadingFrom: { type: String, default: "" },
    documents: {
      kantaSlip: { type: String, default: "" },
      unloadingChallan: { type: String, default: "" },
      partyBillCopy: { type: String, default: "" },
    },
    qualityClaims: [
      {
        parameterId: { type: String },
        parameterName: { type: String },
        standardValue: { type: Number },
        actualValue: { type: Number },
        claimAmount: { type: Number },
        notes: { type: String },
        paramValues: { type: Array, default: [] },
      },
    ],
    showAllQualityParameters: { type: Boolean, default: false },
    manualClaim: { type: Boolean, default: false },
    manualClaimAmount: { type: Number, default: 0 },
    manualCalculationRate: { type: String, default: "" },
    secondClaim: { type: Number, default: 0 },
    secondClaimRemarks: { type: String, default: "" },
    otherCharges: { type: Number, default: 0 },
    otherChargesRemarks: { type: String, default: "" },
    bankCharges: { type: String, default: "" },
    bankChargesRemarks: { type: String, default: "" },
    tds: { type: Number, default: 0 },
    tdsRemarks: { type: String, default: "" },
    generalRemarks: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["pending", "done"],
      default: "pending",
    },
    paidAmount: { type: Number, default: 0 },
    sentStatus: {
      type: String,
      enum: ["Sent", "Not Sent"],
      default: "Not Sent",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    creatorName: {
      type: String,
      default: "",
    },
    creatorMobile: {
      type: String,
      default: "",
    },
    entryByRole: {
      type: String,
      enum: ["Admin", "Employee", "Seller", "Buyer"],
      default: "Admin",
    },
  },
  { timestamps: true },
);

loadingEntrySchema.index({ saudaNo: 1 });
loadingEntrySchema.index({ supplier: 1 });
loadingEntrySchema.index({ loadingNo: -1 });
loadingEntrySchema.index({ loadingDate: -1 });
loadingEntrySchema.index({ billNumber: 1 });
loadingEntrySchema.index({ lorryNumber: 1 });
loadingEntrySchema.index({ createdAt: -1 });
loadingEntrySchema.index({ supplierCompany: 1 });

export default mongoose.model("LoadingEntry", loadingEntrySchema);
