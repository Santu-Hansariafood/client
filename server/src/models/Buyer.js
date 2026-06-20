import mongoose from "mongoose";
import bcrypt from "bcrypt";

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

buyerSchema.pre("save", async function (next) {
  if (this.mobile && Array.isArray(this.mobile)) {
    this.mobile = this.mobile.map((phone) => {
      const match = String(phone)
        .trim()
        .match(/^(?:\+91|0)?([6-9]\d{9})$/);
      return match ? match[1] : phone;
    });
  }
  if (!this.isModified("password")) {
    return next();
  }
  if (this.password) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

buyerSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

buyerSchema.index({ name: 1 });
buyerSchema.index({ companyIds: 1 });
buyerSchema.index({ groupId: 1 });
buyerSchema.index({ mobile: 1 });

export default mongoose.model("Buyer", buyerSchema);
