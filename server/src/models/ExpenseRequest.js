import mongoose from "mongoose";

const expenseRequestSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "ExpenseCategory", required: true },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ExpenseRequest", expenseRequestSchema);
