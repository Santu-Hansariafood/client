import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ["Admin", "Employee", "Buyer", "Seller", "Transporter"] },
    mobile: { type: String },
    phone: { type: String },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, mobile: 1 });
userSchema.index({ role: 1, phone: 1 });

export default mongoose.model("User", userSchema);
