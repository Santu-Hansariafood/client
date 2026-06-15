import { Router } from "express";
import mongoose from "mongoose";
import Commodity from "../models/Commodity.js";
import QualityParameter from "../models/QualityParameter.js";
import Company from "../models/Company.js";

const router = Router();

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

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

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (s, t) => {
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const dp = Array.from({ length: s.length + 1 }, () =>
    Array(t.length + 1).fill(0),
  );
  for (let i = 0; i <= s.length; i++) dp[i][0] = i;
  for (let j = 0; j <= t.length; j++) dp[0][j] = j;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[s.length][t.length];
};

// Normalize text for better matching
const normalize = (str) =>
  String(str || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// Smart search with priority: Quality → Company → Commodity
router.get("/search/smart", async (req, res) => {
  try {
    const query = normalize(req.query.q || "");
    const limit = parseInt(req.query.limit || "20", 10);

    if (!query) {
      return res.json({
        qualityParameters: [],
        companies: [],
        commodities: [],
      });
    }

    const regex = new RegExp(escapeRegex(query), "i");
    const [allQualityParams, allCompanies, allCommodities] = await Promise.all([
      QualityParameter.find({ name: regex, isActive: true }).limit(100).lean(),
      Company.find({ companyName: regex }).limit(100).lean(),
      Commodity.find({ name: regex }).limit(100).populate(commodityPopulate).lean(),
    ]);

    const scoreItem = (item, fieldName, weight) => {
      const itemStr = normalize(item[fieldName] || "");
      if (!itemStr) return { item, score: Infinity };

      const distance = levenshteinDistance(query, itemStr);
      const lengthDiff = Math.abs(query.length - itemStr.length);
      const partialPenalty = itemStr.includes(query) ? 0 : lengthDiff * 0.5;
      const score = (distance + partialPenalty) * weight;

      return { item, score };
    };

    // Score quality parameters (highest priority: weight 1)
    const scoredQuality = allQualityParams
      .map((qp) => scoreItem(qp, "name", 1))
      .filter((r) => r.score <= query.length * 0.4) // Max 40% mismatch
      .sort((a, b) => a.score - b.score);

    // Score companies (priority 2)
    const scoredCompanies = allCompanies
      .map((c) => scoreItem(c, "companyName", 2))
      .filter((r) => r.score <= query.length * 0.4)
      .sort((a, b) => a.score - b.score);

    // Score commodities (priority 3)
    const scoredCommodities = allCommodities
      .map((c) => scoreItem(c, "name", 3))
      .filter((r) => r.score <= query.length * 0.4)
      .sort((a, b) => a.score - b.score);

    // Map to client-friendly format
    const qualityParameters = scoredQuality
      .slice(0, limit)
      .map((r) => r.item);

    const companies = scoredCompanies
      .slice(0, limit)
      .map((r) => r.item);

    const commodities = scoredCommodities
      .slice(0, limit)
      .map(mapCommodityForClient);

    return res.json({
      qualityParameters,
      companies,
      commodities,
    });
  } catch (error) {
    console.error("Smart search error:", error);
    res.status(500).json({ message: error.message });
  }
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

    const items = await Commodity.find()
      .sort({ name: 1 })
      .limit(limit > 0 ? limit : 200)
      .populate(commodityPopulate)
      .lean();
    res.json(items.map(mapCommodityForClient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Commodity.findById(req.params.id)
      .populate(commodityPopulate)
      .lean();

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

    const normalizedParameters = await normalizeCommodityParameters(
      parameters || [],
    );

    const commodity = new Commodity({
      name,
      hsnCode,
      parameters: normalizedParameters,
    });

    const saved = await commodity.save();

    const created = await Commodity.findById(saved._id)
      .populate(commodityPopulate)
      .lean();
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

    if (!updated)
      return res.status(404).json({ message: "Commodity not found" });
    res.json(mapCommodityForClient(updated));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Commodity.findByIdAndDelete(req.params.id).lean();
    if (!deleted)
      return res.status(404).json({ message: "Commodity not found" });
    res.json({ message: "Commodity deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid ID" });
  }
});

export default router;
