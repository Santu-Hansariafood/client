import { Router } from "express";
import BidLocation from "../models/BidLocation.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (page > 0 && limit > 0) {
      const skip = (page - 1) * limit;
      const items = await BidLocation.find()
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      const total = await BidLocation.countDocuments();
      return res.json({ data: items, total });
    }

    const items = await BidLocation.find()
      .sort({ name: 1 })
      .limit(100)
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  const item = await BidLocation.create(req.body);
  res.status(201).json(item);
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await BidLocation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Bid location not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await BidLocation.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Bid location not found" });
    }
    res.json({ message: "Bid location deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
