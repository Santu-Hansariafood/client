import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: (v) =>
        v
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()),
    },
  },
  { timestamps: true }
);

agentSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Agent", agentSchema);