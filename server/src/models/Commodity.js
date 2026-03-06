import mongoose from "mongoose";

const commoditySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    hsnCode: {
      type: String,
      required: true,
      trim: true
    },

    parameters: [
      {
        parameter: {
          type: String,
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

commoditySchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Commodity", commoditySchema);