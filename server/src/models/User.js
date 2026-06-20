import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Employee", "Buyer", "Seller", "Transporter"],
    },
    email: { type: String },
    mobile: { type: String },
    phone: { type: String },
    password: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (this.mobile) {
    const match = String(this.mobile)
      .trim()
      .match(/^(?:\+91|0)?([6-9]\d{9})$/);
    if (match) {
      this.mobile = match[1];
    }
  }
  if (this.phone) {
    const match = String(this.phone)
      .trim()
      .match(/^(?:\+91|0)?([6-9]\d{9})$/);
    if (match) {
      this.phone = match[1];
    }
  }
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ role: 1, mobile: 1 });
userSchema.index({ role: 1, phone: 1 });

export default mongoose.model("User", userSchema);
