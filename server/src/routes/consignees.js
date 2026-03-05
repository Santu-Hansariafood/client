
import { Router } from "express";
import Consignee from "../models/Consignee.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const consignees = await Consignee.find().sort({ name: 1 });
    res.json(consignees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const consignee = new Consignee(req.body);
    await consignee.save();
    res.status(201).json(consignee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const consignee = await Consignee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!consignee) return res.status(404).json({ message: "Consignee not found" });
    res.json(consignee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const consignee = await Consignee.findByIdAndDelete(req.params.id);
    if (!consignee) return res.status(404).json({ message: "Consignee not found" });
    res.json({ message: "Consignee deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
