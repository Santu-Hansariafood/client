import mongoose from "mongoose";

const buyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    companyIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Company",
      default: [],
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    mobile: { type: [String], default: [] },
    email: { type: [String], default: [] },
    password: { type: String, default: "" },
    commodityIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Commodity",
      default: [],
    },
    consigneeIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Consignee",
      default: [],
    },
    brokerage: { type: Map, of: Number, default: {} },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true },
);

buyerSchema.pre("save", function (next) {
  if (this.mobile && Array.isArray(this.mobile)) {
    this.mobile = this.mobile.map((phone) => {
      const match = String(phone).trim().match(/^(?:\+91|0)?([6-9]\d{9})$/);
      return match ? match[1] : phone;
    });
  }
  next();
});

buyerSchema.index({ name: 1 });
buyerSchema.index({ companyIds: 1 });
buyerSchema.index({ groupId: 1 });
buyerSchema.index({ mobile: 1 });

export default mongoose.model("Buyer", buyerSchema);
