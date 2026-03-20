import { Router } from "express";
import Bid from "../models/Bid.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (page > 0 && limit > 0) {
      const items = await Bid.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      const total = await Bid.countDocuments();
      return res.json({ data: items, total });
    }

    const items = await Bid.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const item = await Bid.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Bid.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ message: "Bid not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Bid.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Bid not found" });
    }

    res.json({ message: "Bid deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Bid.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Bid not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
