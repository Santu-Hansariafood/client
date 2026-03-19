import { Router } from "express";
import BidLocation from "../models/BidLocation.js";

const router = Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const items = await BidLocation.find()
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await BidLocation.countDocuments();
  res.json({ data: items, total });
});

router.post("/", async (req, res) => {
  const item = await BidLocation.create(req.body);
  res.status(201).json(item);
});

export default router;
