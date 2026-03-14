import { Router } from "express";
import mongoose from "mongoose";
import Buyer from "../models/Buyer.js";
import Company from "../models/Company.js";
import Group from "../models/Group.js";
import Commodity from "../models/Commodity.js";
import Consignee from "../models/Consignee.js";

const router = Router();

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const normalizeObjectIdArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((v) => toObjectId(v)).filter(Boolean);
};

const mapBuyerForClient = (buyer) => {
  const companyId = buyer.companyId?._id || buyer.companyId || null;
  const groupId = buyer.groupId?._id || buyer.groupId || null;
  const commodityIds = (buyer.commodityIds || []).map((c) => c?._id || c).filter(Boolean);
  const consigneeIds = (buyer.consigneeIds || []).map((c) => c?._id || c).filter(Boolean);

  const brokerageByName = {};
  if (buyer.brokerage) {
    const rawBrokerage = buyer.brokerage;
    (buyer.commodityIds || []).forEach((c) => {
      if (c && c.name) {
        const cid = c._id ? c._id.toString() : c.toString();
        // Handle both Mongoose Map (with .get) and plain object (lean)
        const value = typeof rawBrokerage.get === "function" 
          ? rawBrokerage.get(cid) 
          : rawBrokerage[cid];
        brokerageByName[c.name] = value || 0;
      }
    });
  }

  return {
    _id: buyer._id,
    name: buyer.name,
    mobile: normalizeStringArray(buyer.mobile),
    email: normalizeStringArray(buyer.email),
    password: buyer.password || "",
    status: buyer.status || "Active",
    brokerage: buyer.brokerage || {},
    brokerageByName,

    companyId,
    groupId,
    commodityIds,
    consigneeIds,

    companyName: buyer.companyId?.companyName || buyer.companyName || "",
    group: buyer.groupId?.groupName || buyer.group || "",
    commodity: (buyer.commodityIds || [])
      .map((c) => c?.name || c?.toString?.() || "")
      .filter(Boolean),
    consignee: (buyer.consigneeIds || []).map((c) => ({
      value: c?._id || c,
      label: c?.name || "",
    })),
  };
};

const buyerPopulate = [
  { path: "companyId", select: "companyName companyEmail groupId consigneeIds" },
  { path: "groupId", select: "groupName" },
  { path: "commodityIds", select: "name" },
  { path: "consigneeIds", select: "name" },
];

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (page > 0 && limit > 0) {
      const items = await Buyer.find()
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(buyerPopulate)
        .lean();
      const total = await Buyer.countDocuments();
      return res.json({ data: items.map(mapBuyerForClient), total });
    }

    const items = await Buyer.find().sort({ name: 1 }).populate(buyerPopulate).lean();
    res.json(items.map(mapBuyerForClient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id).populate(buyerPopulate).lean();
    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    res.json(mapBuyerForClient(buyer));
  } catch (error) {
    res.status(400).json({ message: "Invalid ID" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    let companyId = toObjectId(body.companyId);
    let groupId = toObjectId(body.groupId);
    let commodityIds = normalizeObjectIdArray(body.commodityIds);
    let consigneeIds = normalizeObjectIdArray(body.consigneeIds);

    if (!companyId && body.companyName) {
      const company = await Company.findOne({ companyName: body.companyName }).select("_id").lean();
      companyId = company?._id || null;
    }
    if (!groupId && body.group) {
      const group = await Group.findOne({ groupName: body.group }).select("_id").lean();
      groupId = group?._id || null;
    }
    if (commodityIds.length === 0 && Array.isArray(body.commodity)) {
      const commodities = await Commodity.find({ name: { $in: body.commodity } })
        .select("_id")
        .lean();
      commodityIds = commodities.map((c) => c._id);
    }
    if (consigneeIds.length === 0 && Array.isArray(body.consignee)) {
      const names = body.consignee
        .map((c) => (typeof c === "string" ? c : c?.label || c?.name || ""))
        .filter(Boolean);
      const consignees = await Consignee.find({ name: { $in: names } }).select("_id name").lean();
      consigneeIds = consignees.map((c) => c._id);
    }

    const item = await Buyer.create({
      name: body.name,
      mobile: normalizeStringArray(body.mobile),
      email: normalizeStringArray(body.email),
      password: body.password || "",
      status: body.status || "Active",
      brokerage: body.brokerage || {},
      companyId,
      groupId,
      commodityIds,
      consigneeIds,
    });

    const created = await Buyer.findById(item._id).populate(buyerPopulate).lean();
    res.status(201).json(mapBuyerForClient(created));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    let { companyId, groupId, commodityIds, consigneeIds } = body;

    // Resolve companyId from companyName if needed
    if (!toObjectId(companyId) && body.companyName) {
      const company = await Company.findOne({ companyName: body.companyName })
        .select("_id")
        .lean();
      companyId = company?._id || null;
    }

    // Resolve groupId from group name if needed
    if (!toObjectId(groupId) && body.group) {
      const group = await Group.findOne({ groupName: body.group })
        .select("_id")
        .lean();
      groupId = group?._id || null;
    }

    // Resolve commodityIds from commodity names if needed
    if (Array.isArray(body.commodity)) {
      if (body.commodity.length === 0) {
        commodityIds = [];
      } else {
        const commodities = await Commodity.find({ name: { $in: body.commodity } })
          .select("_id")
          .lean();
        commodityIds = commodities.map((c) => c._id);
      }
    }

    // Resolve consigneeIds from consignee objects/names if needed
    if (Array.isArray(body.consignee)) {
      if (body.consignee.length === 0) {
        consigneeIds = [];
      } else {
        const names = body.consignee
          .map((c) => (typeof c === "string" ? c : c?.label || c?.name || ""))
          .filter(Boolean);
        const foundConsignees = await Consignee.find({ name: { $in: names } })
          .select("_id")
          .lean();
        consigneeIds = foundConsignees.map((c) => c._id);
      }
    }

    const update = {
      name: body.name,
      mobile: normalizeStringArray(body.mobile),
      email: normalizeStringArray(body.email),
      password: body.password || "",
      status: body.status || "Active",
      brokerage: body.brokerage || {},
      companyId: toObjectId(companyId) || null,
      groupId: toObjectId(groupId) || null,
      commodityIds: normalizeObjectIdArray(commodityIds),
      consigneeIds: normalizeObjectIdArray(consigneeIds),
    };

    const updated = await Buyer.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate(buyerPopulate)
      .lean();

    if (!updated) return res.status(404).json({ message: "Buyer not found" });
    res.json(mapBuyerForClient(updated));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Buyer.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: "Buyer not found" });
    res.json({ message: "Buyer deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid ID" });
  }
});

export default router;
