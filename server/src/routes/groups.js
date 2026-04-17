import { Router } from "express";
import Group from "../models/Group.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);
    const search = (req.query.search || "").trim();

    const query = {};
    if (search) {
      query.groupName = { $regex: new RegExp(search, "i") };
    }

    if (page > 0 && limit > 0) {
      const items = await Group.find(query)
        .sort({ groupName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      const total = await Group.countDocuments(query);
      return res.json({ data: items, total });
    }

    const limitVal = limit > 0 ? limit : 0;
    const groups = await Group.find(query)
      .sort({ groupName: 1 })
      .limit(limitVal)
      .lean();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const group = new Group(req.body);
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json({ message: "Group deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
