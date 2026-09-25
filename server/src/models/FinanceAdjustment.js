import mongoose from "mongoose";

const financeAdjustmentSchema = new mongoose.Schema(
  {
    saudaNo: { type: String, required: true, trim: true },
    adjustmentGroupId: { type: String, default: "", trim: true },
    adjustedWithSaudaNos: { type: [String], default: [] },
    sellerCompany: { type: String, required: true, trim: true },
    consignee: { type: String, default: "", trim: true },
    purchaseQuantity: { type: Number, default: 0, min: 0 },
    loadedQuantity: { type: Number, default: 0, min: 0 },
    pendingQuantity: { type: Number, default: 0, min: 0 },
    adjustmentQuantity: { type: Number, required: true, min: 0 },
    adjustmentDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

financeAdjustmentSchema.index({ adjustmentDate: -1 });
financeAdjustmentSchema.index({ saudaNo: 1, sellerCompany: 1 });

export default mongoose.model("FinanceAdjustment", financeAdjustmentSchema);