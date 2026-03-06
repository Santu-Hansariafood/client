import mongoose from "mongoose";

const formatName = (name) => {
  if (!name) return name;

  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      set: formatName
    }
  },
  { timestamps: true }
);

companySchema.index({ companyName: 1 });

export default mongoose.model("Company", companySchema);