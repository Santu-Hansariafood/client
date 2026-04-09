import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["buyer", "seller"], default: "buyer" },
    group: { type: String, required: true },
    consignee: { type: String, required: true },
    origin: { type: String, required: true },
    commodity: { type: String, required: true },
    parameters: { type: Map, of: String, default: {} },
    notes: { type: String, default: "" },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    bidDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    paymentTerms: { type: String, default: "" },
    delivery: { type: String, default: "" },
    company: { type: String, default: "" },
    unit: { type: String, default: "" },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    closedAt: { type: Date, default: null },
    createdByMobile: { type: String, default: "" },
    createdByRole: { type: String, enum: ["Admin", "Employee", "Buyer", "Seller", ""], default: "" }
  },
  { timestamps: true }
);

bidSchema.index({ createdAt: -1 });
bidSchema.index({ commodity: 1 });
bidSchema.index({ group: 1 });
bidSchema.index({ status: 1, bidDate: -1 });
bidSchema.index({ type: 1 });
bidSchema.index({ consignee: 1 });
bidSchema.index({ origin: 1 });

export default mongoose.model("Bid", bidSchema);
