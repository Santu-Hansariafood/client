import mongoose from "mongoose";

const commodityParameterSchema = new mongoose.Schema(
  {
    parameterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QualityParameter",
      required: true
    }
  },
  { _id: false }
);

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
        ...commodityParameterSchema.obj
      }
    ]
  },
  { timestamps: true }
);

commoditySchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Commodity", commoditySchema);
