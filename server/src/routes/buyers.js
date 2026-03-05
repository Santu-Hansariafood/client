import { Router } from "express";
import Buyer from "../models/Buyer.js";

const router = Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);
  if (page > 0 && limit > 0) {
    const items = await Buyer.find()
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await Buyer.countDocuments();
    return res.json({ data: items, total });
  }
  const items = await Buyer.find().sort({ name: 1 }).lean();
  res.json(items);
});

router.post("/", async (req, res) => {
  const item = await Buyer.create(req.body);
  res.status(201).json(item);
});

export default router;
