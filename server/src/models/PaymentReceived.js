import mongoose from "mongoose";
import Counter from "./Counter.js";

const paymentReceivedSchema = new mongoose.Schema(
  {
    voucherNumber: { type: Number, unique: true },
    sellerBillNo: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    ledgerType: {
      type: String,
      enum: ["Buyer", "Seller"],
      required: true,
    },
    ledgerId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "ledgerType",
      required: true,
    },
    companyId: { type: String },
    buyerCompany: { type: String, default: "" },
    supplierCompany: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    claim: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    unadjustedAmount: { type: Number, default: 0 },
    paymentType: {
      type: String,
      enum: ["Adjustment", "Sauda-wise", "Advance"],
      default: "Sauda-wise",
    },
    paymentMode: {
      type: String,
      enum: ["By Cash", "Bank", "Cheque", "TDS", "GST", "Adjustment", "Claim"],
      required: true,
    },
    entries: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, default: 0 },
        description: { type: String, default: "" },
      },
    ],
    mappings: [
      {
        saudaNo: { type: String },
        loadingEntryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LoadingEntry",
        },
        allocatedAmount: { type: Number, required: true },
        remarks: { type: String, default: "" },
        debitNote: { type: String, default: "" },
        creditNote: { type: String, default: "" },
      },
    ],
    remarks: { type: String, default: "" },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
  },
  { timestamps: true },
);

paymentReceivedSchema.index({ date: -1 });
paymentReceivedSchema.index({ ledgerId: 1 });
paymentReceivedSchema.index({ ledgerType: 1 });
paymentReceivedSchema.index({ createdAt: -1 });
paymentReceivedSchema.index({ voucherNumber: 1 });

// Auto-generate voucherNumber before validation
paymentReceivedSchema.pre("validate", async function (next) {
  if (this.isNew && !this.voucherNumber) {
    let counter = await Counter.findOneAndUpdate(
      { id: "paymentVoucherNumber" },
      { $inc: { seq: 1 } },
      { new: true },
    );

    if (!counter) {
      try {
        counter = await Counter.create({ id: "paymentVoucherNumber", seq: 1 });
      } catch (err) {
        counter = await Counter.findOneAndUpdate(
          { id: "paymentVoucherNumber" },
          { $inc: { seq: 1 } },
          { new: true },
        );
      }
    }

    this.voucherNumber = counter.seq;
  }
  next();
});

export default mongoose.model("PaymentReceived", paymentReceivedSchema);
