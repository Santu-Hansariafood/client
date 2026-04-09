import { Router } from "express";
import Agent from "../models/Agent.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (page > 0 && limit > 0) {
      const items = await Agent.find()
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await Agent.countDocuments();

      return res.json({
        data: items,
        total,
        page,
        limit,
      });
    }

    const items = await Agent.find().sort({ name: 1 }).lean();

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch agents" });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ message: "Agent name is required" });
    }

    const agent = await Agent.create({
      name: req.body.name,
    });

    res.status(201).json(agent);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Agent already exists",
      });
    }

    res.status(500).json({
      message: "Failed to create agent",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ message: "Agent name is required" });
    }

    const updated = await Agent.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated) {
      return res.status(404).json({
        message: "Agent not found",
      });
    }

    res.json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Agent name already exists",
      });
    }

    res.status(500).json({
      message: "Failed to update agent",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Agent.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Agent not found",
      });
    }

    res.json({
      message: "Agent deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete agent",
    });
  }
});

export default router;
