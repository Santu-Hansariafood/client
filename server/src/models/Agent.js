import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }
  },
  { timestamps: true }
);

agentSchema.index({ name: 1 });

export default mongoose.model("Agent", agentSchema);
