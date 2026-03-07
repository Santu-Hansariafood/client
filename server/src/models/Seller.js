import mongoose from "mongoose";

/* ------------------ Helpers ------------------ */

const formatName = (name) => {
  if (!name) return name;
  return name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const formatPhone = (phone) => {
  if (!phone) return phone;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) {
    throw new Error("Phone number must be 10 digits");
  }
  return cleaned;
};

const upperCase = (val) => {
  if (!val) return val;
  return val.toUpperCase();
};

/* ------------------ Schemas ------------------ */

const phoneSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      set: formatPhone,
    },
  },
  { _id: false }
);

const emailSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { _id: false }
);

const commoditySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brokerage: { type: Number, default: 0 },
  },
  { _id: false }
);

const buyerSchema = new mongoose.Schema(
  {
    name: { type: String, set: formatName },
  },
  { _id: false }
);

/* ------------------ Seller Schema ------------------ */

const sellerSchema = new mongoose.Schema(
  {
    sellerName: {
      type: String,
      required: true,
      set: formatName,
      trim: true,
    },

    password: { type: String, required: true },

    phoneNumbers: [phoneSchema],

    emails: [emailSchema],

    companies: [
      {
        type: String,
        set: formatName,
      },
    ],

    commodities: [commoditySchema],

    buyers: [buyerSchema],

    gstNumber: {
      type: String,
      set: upperCase,
    },

    ifscCode: {
      type: String,
      set: upperCase,
    },

    bankName: {
      type: String,
      set: upperCase,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

sellerSchema.index({ sellerName: 1 });
sellerSchema.index({ "phoneNumbers.value": 1 });
sellerSchema.index({ "emails.value": 1 });
sellerSchema.index({ companies: 1 });

export default mongoose.model("Seller", sellerSchema);