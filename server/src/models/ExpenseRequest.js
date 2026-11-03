import mongoose from "mongoose";
import Counter from "./Counter.js";

const expenseRequestSchema = new mongoose.Schema(
  {
    voucherNumber: { type: Number, unique: true, sparse: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
    sellerName: { type: String, trim: true },
    sellerCompany: { type: String, trim: true },
    receivedFrom: {
      type: String,
      enum: ["Seller", "Office"],
    },
    lineItems: [
      {
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ExpenseCategory",
          required: true,
        },
        description: { type: String, trim: true },
        quantity: { type: Number, required: true, min: 0.01, default: 1 },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "employeeModel",
      required: true,
    },
    employeeModel: {
      type: String,
      required: true,
      enum: ["User", "Employee"],
      default: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
    },
    createdByModel: {
      type: String,
      enum: ["User", "Employee"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { timestamps: true },
);

expenseRequestSchema.pre("validate", async function () {
  if (this.isNew && !this.voucherNumber) {
    let counter = await Counter.findOneAndUpdate(
      { id: "expenseVoucherNumber" },
      { $inc: { seq: 1 } },
      { new: true },
    );

    if (!counter) {
      try {
        counter = await Counter.create({ id: "expenseVoucherNumber", seq: 1 });
      } catch (error) {
        if (error.code !== 11000) throw error;
        counter = await Counter.findOneAndUpdate(
          { id: "expenseVoucherNumber" },
          { $inc: { seq: 1 } },
          { new: true },
        );
      }
    }

    this.voucherNumber = counter.seq;
  }
});

export default mongoose.model("ExpenseRequest", expenseRequestSchema);
