import mongoose from "mongoose";

const financerSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sellerCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerCompany",
      required: true,
    },
  },
  { timestamps: true },
);

financerSchema.index({ groupId: 1, sellerCompanyId: 1 }, { unique: true });
financerSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model("Financer", financerSchema);
