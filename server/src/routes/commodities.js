import { Router } from "express";
import Commodity from "../models/Commodity.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Commodity.findById(req.params.id).lean();

    if (!item) {
      return res.status(404).json({ message: "Commodity not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(400).json({ message: "Invalid ID" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, hsnCode, parameters } = req.body;

    if (!name || !hsnCode) {
      return res.status(400).json({
        message: "Name and HSN Code are required",
      });
    }

    const commodity = new Commodity({
      name,
      hsnCode,
      parameters: parameters || [],
    });

    const saved = await commodity.save();

    res.status(201).json(saved);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Commodity already exists",
      });
    }

    res.status(400).json({ message: error.message });
  }
});

export default router;