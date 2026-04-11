import mongoose from "mongoose";

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
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true },
);

employeeSchema.pre("save", function (next) {
  if (this.mobile) {
    const match = String(this.mobile)
      .trim()
      .match(/^(?:\+91|0)?([6-9]\d{9})$/);
    if (match) {
      this.mobile = match[1];
    }
  }
  next();
});

employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ mobile: 1 });

export default mongoose.model("Employee", employeeSchema);
