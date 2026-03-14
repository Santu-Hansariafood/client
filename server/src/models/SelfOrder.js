import mongoose from "mongoose";

const buyerBrokerageSchema = new mongoose.Schema(
  {
    brokerageBuyer: { type: Number, default: 0 },
    brokerageSupplier: { type: Number, default: 0 }
  },
  { _id: false }
);

const selfOrderSchema = new mongoose.Schema(
  {
    buyer: { type: String, required: true },
    buyerCompany: { type: String, default: "" },
    consignee: { type: String, required: true },
    buyerEmail: { type: String, default: "" },
    buyerCommodity: { type: [String], default: [] },
    buyerBrokerage: { type: buyerBrokerageSchema, default: () => ({}) },
    commodity: { type: String, default: "" },
    parameters: { type: [mongoose.Schema.Types.Mixed], default: [] },
    poNumber: { type: String, default: "" },
    poDate: { type: Date },
    state: { type: String, default: "" },
    location: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    pendingQuantity: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    cd: { type: Number, default: 0 },
    weight: { type: String, default: "" },
    supplier: { type: String, default: "" },
    supplierCompany: { type: String, default: "" },
    paymentTerms: { type: String, default: "" },
    deliveryDate: { type: Date },
    loadingDate: { type: Date },
    notes: { type: [String], default: [] },
    broker: { type: String, default: "" },
    agentName: { type: String, default: "" },
    buyerEmails: { type: [String], default: [] },
    sellerEmails: { type: [String], default: [] },
    sendPOToBuyer: { type: String, default: "" },
    sendPOToSupplier: { type: String, default: "" },
    billTo: { type: String, default: "" },
    saudaNo: { type: String, default: "" }
  },
  { timestamps: true }
);

selfOrderSchema.index({ supplier: 1 });
selfOrderSchema.index({ consignee: 1 });
selfOrderSchema.index({ createdAt: -1 });
selfOrderSchema.index({ saudaNo: 1 });

export default mongoose.model("SelfOrder", selfOrderSchema);
