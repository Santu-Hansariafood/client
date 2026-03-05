import { Router } from "express";
import Company from "../models/Company.js";

const router = Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);
  if (page > 0 && limit > 0) {
    const items = await Company.find()
      .sort({ companyName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await Company.countDocuments();
    return res.json({ data: items, total });
  }
  const items = await Company.find().sort({ companyName: 1 }).lean();
  res.json({ data: items });
});

router.post("/", async (req, res) => {
  const item = await Company.create(req.body);
  res.status(201).json(item);
});

export default router;
