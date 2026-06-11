import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
  lastReset: { type: Date },
});

export default mongoose.model("Counter", counterSchema);
