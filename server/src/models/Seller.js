import mongoose from "mongoose";

const formatName = (name) => {
  if (!name) return name;
  return name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const formatPhone = (phone) => {
  if (!phone) return phone;
  const re = /^(?:\+91|0)?([6-9]\d{9})$/;
  const match = phone.match(re);
  if (!match) {
    throw new Error(
      "Invalid phone number format. Must be 10 digits with optional +91 or 0 prefix.",
    );
  }
  return match[1];
};

const upperCase = (val) => {
  if (!val) return val;
  return val.toUpperCase();
};

const phoneSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      set: formatPhone,
    },
  },
  { _id: false },
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
  { _id: false },
);

const commoditySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brokerage: { type: Number, default: 0 },
  },
  { _id: false },
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, set: formatName },
  },
  { _id: false },
);

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

    groups: [groupSchema],

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
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true },
);

sellerSchema.index({ sellerName: 1 });
sellerSchema.index({ "phoneNumbers.value": 1 }, { unique: true });
sellerSchema.index({ companies: 1 });
sellerSchema.index({ createdAt: -1 });
sellerSchema.index({ "emails.value": 1 });

export default mongoose.model("Seller", sellerSchema);
