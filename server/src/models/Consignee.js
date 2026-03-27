import mongoose from "mongoose";

const consigneeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [
        /^(?:\+91|0)?[6-9]\d{9}$/,
        "Please enter a valid Indian mobile number",
      ],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },

    gst: {
      type: String,
      trim: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/i,
        "Invalid GST number",
      ],
    },

    pan: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN number"],
    },

    state: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    pin: {
      type: String,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, "Invalid PIN code"],
    },

    contactPerson: {
      type: String,
      trim: true,
    },

    mandiLicense: {
      type: String,
      trim: true,
    },

    activeStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

function formatName(name) {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

consigneeSchema.pre("save", function (next) {
  if (this.name) {
    this.name = formatName(this.name);
  }

  if (this.contactPerson) {
    this.contactPerson = formatName(this.contactPerson);
  }

  if (this.gst) {
    this.gst = this.gst.toUpperCase();
  }

  if (this.pan) {
    this.pan = this.pan.toUpperCase();
  }

  next();
});

consigneeSchema.index({ name: 1 });
consigneeSchema.index({ phone: 1 });
consigneeSchema.index({ gst: 1 });

export default mongoose.model("Consignee", consigneeSchema);
