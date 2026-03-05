import { Router } from "express";
import Agent from "../models/Agent.js";

const router = Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);
  if (page > 0 && limit > 0) {
    const items = await Agent.find()
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await Agent.countDocuments();
    return res.json({ data: items, total });
  }
  const items = await Agent.find().sort({ name: 1 }).lean();
  res.json(items);
});

router.post("/", async (req, res) => {
  const item = await Agent.create(req.body);
  res.status(201).json(item);
});

router.put("/:id", async (req, res) => {
  const updated = await Agent.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
});

export default router;
