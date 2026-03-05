import mongoose from "mongoose";

const selfOrderSchema = new mongoose.Schema(
  {
    supplier: { type: String, required: true },
    consignee: { type: String, required: true }
  },
  { timestamps: true }
);

selfOrderSchema.index({ supplier: 1 });
selfOrderSchema.index({ consignee: 1 });
selfOrderSchema.index({ createdAt: -1 });

export default mongoose.model("SelfOrder", selfOrderSchema);
