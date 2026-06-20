import mongoose from "mongoose";
import bcrypt from "bcrypt";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    sex: { type: String, enum: ["Male", "Female", "Other"] },
    password: { type: String, required: true },
    role: { type: String, default: "Employee" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    allowedPermissions: { type: [String], default: [] },
    profileImage: { type: String, default: "" },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true },
);

employeeSchema.pre("save", async function (next) {
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

employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ mobile: 1 });

export default mongoose.model("Employee", employeeSchema);
