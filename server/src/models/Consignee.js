
import mongoose from "mongoose";

const consigneeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    gst: { type: String },
    pan: { type: String },
    email: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    mobile: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Consignee", consigneeSchema);
