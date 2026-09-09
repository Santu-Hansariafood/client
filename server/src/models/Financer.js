import mongoose from "mongoose";

const financerSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    financerType: {
      type: String,
      enum: ["Buyer", "Seller"],
      default: "Buyer",
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: false,
    },
    sellerCompany: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

financerSchema.index(
  { groupId: 1, buyerId: 1, companyId: 1 },
  { unique: true, partialFilterExpression: { financerType: "Buyer" } },
);
financerSchema.index(
  { groupId: 1, sellerId: 1, sellerCompany: 1 },
  { unique: true, partialFilterExpression: { financerType: "Seller" } },
);
financerSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model("Financer", financerSchema);
