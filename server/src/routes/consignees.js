import { Router } from "express";
import Consignee from "../models/Consignee.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50, search = "" } = req.query;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { gst: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const consignees = await Consignee.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Consignee.countDocuments(query);

    res.json({
      data: consignees,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


router.post("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      gst,
      pan,
      state,
      district,
      location,
      pin,
      contactPerson,
      mandiLicense,
      activeStatus
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and Phone are required"
      });
    }

    const consignee = new Consignee({
      name,
      phone,
      email,
      gst,
      pan,
      state,
      district,
      location,
      pin,
      contactPerson,
      mandiLicense,
      activeStatus
    });

    const saved = await consignee.save();

    res.status(201).json(saved);

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});


router.put("/:id", async (req, res) => {
  try {

    const updated = await Consignee.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Consignee not found"
      });
    }

    res.json(updated);

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});


router.delete("/:id", async (req, res) => {
  try {

    const deleted = await Consignee.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Consignee not found"
      });
    }

    res.json({
      message: "Consignee deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

export default router;
