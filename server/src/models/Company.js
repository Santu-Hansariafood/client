import mongoose from "mongoose";

const formatName = (name) => {
  if (!name) return name;

  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const companyCommodityParameterSchema = new mongoose.Schema(
  {
    parameterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QualityParameter",
      required: true,
    },
    value: { type: String, default: "" },
  },
  { _id: false }
);

const companyCommoditySchema = new mongoose.Schema(
  {
    commodityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commodity",
      required: true,
    },
    brokerage: { type: Number, default: 0 },
    parameters: { type: [companyCommodityParameterSchema], default: [] },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      set: formatName,
    },
    location: { type: String, trim: true },
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    pinCode: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    companyEmail: { type: String, trim: true, lowercase: true },
    consigneeIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Consignee",
      default: [],
    },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    commodities: { type: [companyCommoditySchema], default: [] },
    mandiLicense: { type: String, trim: true, default: "" },
    activeStatus: { type: Boolean, default: true },
  },
  { timestamps: true }
);

companySchema.index({ companyName: 1 });
companySchema.index({ groupId: 1 });
companySchema.index({ consigneeIds: 1 });

export default mongoose.model("Company", companySchema);
