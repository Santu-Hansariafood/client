import mongoose from "mongoose";
import bcrypt from "bcrypt";

const transporterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    vehicleDetails: {
      number: { type: String },
      type: { type: String },
      ownerName: { type: String },
    },
    driverDetails: {
      name: { type: String },
      licenseNumber: { type: String },
      phoneNumber: { type: String },
    },
    bankDetails: {
      accountHolderName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
      branchName: { type: String },
    },
    role: { type: String, default: "Transporter" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true },
);

transporterSchema.pre("save", async function (next) {
  if (this.mobile) {
    const match = String(this.mobile)
      .trim()
      .match(/^(?:\+91|0)?([6-9]\d{9})$/);
    if (match) {
      this.mobile = match[1];
    }
  }
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

transporterSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

transporterSchema.index({ email: 1 });
transporterSchema.index({ mobile: 1 });

export default mongoose.model("Transporter", transporterSchema);
