import { Router } from "express";
import QualityParameter from "../models/QualityParameter.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (page > 0 && limit > 0) {
      const skip = (page - 1) * limit;
      const params = await QualityParameter.find({ isActive: true })
        .skip(skip)
        .limit(limit)
        .lean();
      const total = await QualityParameter.countDocuments({ isActive: true });
      return res.json({ data: params, total });
    }

    const params = await QualityParameter.find({ isActive: true })
      .limit(100)
      .lean();
    res.json(params);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const param = new QualityParameter(req.body);
    await param.save();
    res.status(201).json(param);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const param = await QualityParameter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!param)
      return res.status(404).json({ message: "Quality Parameter not found" });
    res.json(param);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const param = await QualityParameter.findByIdAndDelete(req.params.id);
    if (!param)
      return res.status(404).json({ message: "Quality Parameter not found" });
    res.json({ message: "Quality Parameter deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
