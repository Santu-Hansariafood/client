import { Router } from "express";
import Transporter from "../models/Transporter.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transporters = await Transporter.find()
      .select("name mobile status vehicleDetails.number driverDetails.name driverDetails.licenseNumber")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Transporter.countDocuments();

    res.json({
      data: transporters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const transporter = await Transporter.findById(req.params.id);
    if (!transporter) return res.status(404).json({ message: "Transporter not found" });
    res.json(transporter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const transporter = new Transporter(req.body);
    const saved = await transporter.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Transporter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Transporter not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Transporter.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Transporter not found" });
    res.json({ message: "Transporter deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
