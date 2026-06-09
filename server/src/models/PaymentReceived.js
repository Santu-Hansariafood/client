import mongoose from "mongoose";

const paymentReceivedSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    ledgerType: { 
      type: String, 
      enum: ["Buyer", "Seller"], 
      required: true 
    },
    ledgerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'ledgerType', 
      required: true 
    },
    companyId: { type: String }, // Buyer's company ID (ObjectId) or Seller's company name
    buyerCompany: { type: String, default: "" },
    supplierCompany: { type: String, default: "" },
    amount: { type: Number, required: true },
    claim: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    unadjustedAmount: { type: Number, default: 0 },
    paymentType: { 
      type: String, 
      enum: ["Adjustment", "Sauda-wise", "Advance"], 
      default: "Sauda-wise"
    },
    paymentMode: { 
      type: String, 
      enum: ["By Cash", "Bank", "Cheque", "TDS", "GST", "Adjustment", "Claim"], 
      required: true 
    },
    mappings: [
      {
        saudaNo: { type: String },
        loadingEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "LoadingEntry" },
        allocatedAmount: { type: Number, required: true },
        remarks: { type: String, default: "" },
      }
    ],
    remarks: { type: String, default: "" },
  },
  { timestamps: true }
);

paymentReceivedSchema.index({ date: -1 });
paymentReceivedSchema.index({ ledgerId: 1 });
paymentReceivedSchema.index({ ledgerType: 1 });
paymentReceivedSchema.index({ createdAt: -1 });

export default mongoose.model("PaymentReceived", paymentReceivedSchema);
