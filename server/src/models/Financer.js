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
      required: true,
    },
  },
  { timestamps: true },
);

financerSchema.index({ groupId: 1, buyerId: 1, companyId: 1 }, { unique: true });
financerSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model("Financer", financerSchema);
