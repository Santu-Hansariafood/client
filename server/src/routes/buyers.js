import { Router } from "express";
import mongoose from "mongoose";
import Buyer from "../models/Buyer.js";
import Company from "../models/Company.js";
import Group from "../models/Group.js";
import Commodity from "../models/Commodity.js";
import Consignee from "../models/Consignee.js";

const router = Router();

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

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
  const companyIds = (buyer.companyIds || [])
    .map((c) => c?._id || c)
    .filter(Boolean);
  const groupId = buyer.groupId?._id || buyer.groupId || null;
  const commodityIds = (buyer.commodityIds || [])
    .map((c) => c?._id || c)
    .filter(Boolean);
  const consigneeIds = (buyer.consigneeIds || [])
    .map((c) => c?._id || c)
    .filter(Boolean);

  const brokerageByName = {};

  if (buyer.brokerage) {
    const rawBrokerage = buyer.brokerage;
    (buyer.commodityIds || []).forEach((c) => {
      if (c && c.name) {
        const cid = c._id ? c._id.toString() : c.toString();
        const value =
          typeof rawBrokerage.get === "function"
            ? rawBrokerage.get(cid)
            : rawBrokerage[cid];
        if (value !== undefined) brokerageByName[c.name] = value;
      }
    });
  }

  const firstCompany = (buyer.companyIds || [])[0] || {};

  return {
    _id: buyer._id,
    name: buyer.name,
    mobile: normalizeStringArray(buyer.mobile),
    email: normalizeStringArray(buyer.email),
    password: buyer.password || "",
    status: buyer.status || "Active",
    brokerage: buyer.brokerage || {},
    brokerageByName,

    companyIds,
    groupId,
    commodityIds,
    consigneeIds,

    companyNames: (buyer.companyIds || []).map((c) => c?.companyName || ""),
    companyName: firstCompany.companyName || buyer.companyName || "",
    location: firstCompany.location || "",
    state: firstCompany.state || "",
    district: firstCompany.district || "",
    pinCode: firstCompany.pinCode || "",
    gstNumber: firstCompany.gstNumber || "",
    panNumber: firstCompany.panNumber || "",
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
  {
    path: "companyIds",
    select:
      "companyName companyEmail location state district pinCode gstNumber panNumber groupId consigneeIds commodities",
    populate: { path: "commodities.commodityId", select: "name" },
  },
  { path: "groupId", select: "groupName" },
  { path: "commodityIds", select: "name" },
  { path: "consigneeIds", select: "name" },
];

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);
    const mobile = req.query.mobile;
    const search = (req.query.search || "").trim();

    const query = {};
    if (mobile) {
      query.mobile = mobile;
    }
    if (search) {
      const regex = new RegExp(search, "i");
      const [companies, groups] = await Promise.all([
        Company.find({ companyName: regex }).select("_id").lean(),
        Group.find({ groupName: regex }).select("_id").lean(),
      ]);
      const companyIds = companies.map((c) => c._id);
      const groupIds = groups.map((g) => g._id);
      query.$or = [
        { name: regex },
        { mobile: { $regex: regex } },
        { email: { $regex: regex } },
        ...(companyIds.length ? [{ companyIds: { $in: companyIds } }] : []),
        ...(groupIds.length ? [{ groupId: { $in: groupIds } }] : []),
      ];
    }

    if (page > 0 && limit > 0) {
      const items = await Buyer.find(query)
        .sort({ name: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(buyerPopulate)
        .lean();
      const total = await Buyer.countDocuments(query);
      return res.json({ data: items.map(mapBuyerForClient), total });
    }

    const items = await Buyer.find(query)
      .sort({ name: 1, _id: 1 })
      .limit(100)
      .populate(buyerPopulate)
      .lean();
    res.json(items.map(mapBuyerForClient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id)
      .populate(buyerPopulate)
      .lean();
    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    res.json(mapBuyerForClient(buyer));
  } catch (error) {
    res.status(400).json({ message: "Invalid ID" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    let companyIds = normalizeObjectIdArray(body.companyIds);
    let groupId = toObjectId(body.groupId);
    let commodityIds = normalizeObjectIdArray(body.commodityIds);
    let consigneeIds = normalizeObjectIdArray(body.consigneeIds);

    if (companyIds.length === 0 && body.companyName) {
      const company = await Company.findOne({ companyName: body.companyName })
        .select("_id")
        .lean();
      if (company) companyIds = [company._id];
    }
    if (!groupId && body.group) {
      const group = await Group.findOne({ groupName: body.group })
        .select("_id")
        .lean();
      groupId = group?._id || null;
    }
    if (commodityIds.length === 0 && Array.isArray(body.commodity)) {
      const commodities = await Commodity.find({
        name: { $in: body.commodity },
      })
        .select("_id")
        .lean();
      commodityIds = commodities.map((c) => c._id);
    }
    if (consigneeIds.length === 0 && Array.isArray(body.consignee)) {
      const names = body.consignee
        .map((c) => (typeof c === "string" ? c : c?.label || c?.name || ""))
        .filter(Boolean);
      const consignees = await Consignee.find({ name: { $in: names } })
        .select("_id name")
        .lean();
      consigneeIds = consignees.map((c) => c._id);
    }

    const item = await Buyer.create({
      name: body.name,
      mobile: normalizeStringArray(body.mobile),
      email: normalizeStringArray(body.email),
      password: body.password || "",
      status: body.status || "Active",
      brokerage: body.brokerage || {},
      companyIds,
      groupId,
      commodityIds,
      consigneeIds,
    });

    const created = await Buyer.findById(item._id)
      .populate(buyerPopulate)
      .lean();
    res.status(201).json(mapBuyerForClient(created));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    let { companyIds, groupId, commodityIds, consigneeIds } = body;
    companyIds = normalizeObjectIdArray(companyIds);

    if (companyIds.length === 0 && body.companyName) {
      const company = await Company.findOne({ companyName: body.companyName })
        .select("_id")
        .lean();
      if (company) companyIds = [company._id];
    }

    if (!toObjectId(groupId) && body.group) {
      const group = await Group.findOne({ groupName: body.group })
        .select("_id")
        .lean();
      groupId = group?._id || null;
    }

    if (Array.isArray(body.commodity)) {
      if (body.commodity.length === 0) {
        commodityIds = [];
      } else {
        const commodities = await Commodity.find({
          name: { $in: body.commodity },
        })
          .select("_id")
          .lean();
        commodityIds = commodities.map((c) => c._id);
      }
    }

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
      companyIds,
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
