import { Router } from "express";
import mongoose from "mongoose";
import Commodity from "../models/Commodity.js";
import QualityParameter from "../models/QualityParameter.js";

const router = Router();

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const commodityPopulate = [{ path: "parameters.parameterId", select: "name" }];

const mapCommodityForClient = (item) => ({
  _id: item._id,
  name: item.name,
  hsnCode: item.hsnCode,
  parameters: Array.isArray(item.parameters)
    ? item.parameters
        .map((p) => ({
          _id: p.parameterId?._id || p.parameterId,
          parameterId: p.parameterId?._id || p.parameterId,
          parameter: p.parameterId?.name || p.parameter || "",
        }))
        .filter((p) => p._id || p.parameter)
    : [],
});

const normalizeCommodityParameters = async (raw) => {
  if (!Array.isArray(raw)) return [];

  const ids = raw
    .map((p) => toObjectId(p?.parameterId || p?._id || p))
    .filter(Boolean);
  if (ids.length > 0) {
    return ids.map((id) => ({ parameterId: id }));
  }

  const names = raw
    .map((p) => (typeof p === "string" ? p : p?.parameter))
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  if (names.length === 0) return [];

  const params = await QualityParameter.find({
    name: { $in: names },
  })
    .select("_id name")
    .lean();

  const byName = new Map(params.map((p) => [p.name, p._id]));
  const resolvedIds = names.map((n) => byName.get(n)).filter(Boolean);

  return resolvedIds.map((id) => ({ parameterId: id }));
};

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (page > 0 && limit > 0) {
      const items = await Commodity.find()
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(commodityPopulate)
        .lean();

      const total = await Commodity.countDocuments();

      return res.json({ data: items.map(mapCommodityForClient), total });
    }

    const items = await Commodity.find().sort({ name: 1 }).populate(commodityPopulate).lean();
    res.json(items.map(mapCommodityForClient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Commodity.findById(req.params.id).populate(commodityPopulate).lean();

    if (!item) {
      return res.status(404).json({ message: "Commodity not found" });
    }

    res.json(mapCommodityForClient(item));
  } catch (error) {
    res.status(400).json({ message: "Invalid ID" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, hsnCode, parameters } = req.body || {};

    if (!name || !hsnCode) {
      return res.status(400).json({
        message: "Name and HSN Code are required",
      });
    }

    const normalizedParameters = await normalizeCommodityParameters(parameters || []);

    const commodity = new Commodity({
      name,
      hsnCode,
      parameters: normalizedParameters,
    });

    const saved = await commodity.save();

    const created = await Commodity.findById(saved._id).populate(commodityPopulate).lean();
    res.status(201).json(mapCommodityForClient(created));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Commodity already exists",
      });
    }

    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, hsnCode, parameters } = req.body || {};
    const update = {};
    if (typeof name === "string") update.name = name;
    if (typeof hsnCode === "string") update.hsnCode = hsnCode;
    if (Array.isArray(parameters)) {
      update.parameters = await normalizeCommodityParameters(parameters);
    }

    const updated = await Commodity.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
      .populate(commodityPopulate)
      .lean();

    if (!updated) return res.status(404).json({ message: "Commodity not found" });
    res.json(mapCommodityForClient(updated));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Commodity.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: "Commodity not found" });
    res.json({ message: "Commodity deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid ID" });
  }
});

export default router;
