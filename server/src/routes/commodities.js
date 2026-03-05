import { Router } from "express";
import Commodity from "../models/Commodity.js";

const router = Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);
  if (page > 0 && limit > 0) {
    const items = await Commodity.find()
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await Commodity.countDocuments();
    return res.json({ data: items, total });
  }
  const items = await Commodity.find().sort({ name: 1 }).lean();
  res.json(items);
});

router.get("/:id", async (req, res) => {
  const item = await Commodity.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

router.post("/", async (req, res) => {
  try {
    const item = await Commodity.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
