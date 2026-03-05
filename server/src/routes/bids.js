import { Router } from "express";
import Bid from "../models/Bid.js";

const router = Router();

router.get("/", async (req, res) => {
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
});

router.post("/", async (req, res) => {
  const item = await Bid.create(req.body);
  res.status(201).json(item);
});

export default router;
