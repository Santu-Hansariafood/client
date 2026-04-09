import { Router } from "express";
import Consignee from "../models/Consignee.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "50", 10);
    const search = (req.query.search || "").trim();

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { gst: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    if (page > 0 && limit > 0) {
      const consignees = await Consignee.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await Consignee.countDocuments(query);

      return res.json({
        data: consignees,
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    }

    const consignees = await Consignee.find(query)
      .sort({ name: 1 })
      .limit(100)
      .lean();
    res.json(consignees);
  } catch (error) {
    res.status(500).json({
      message: error.message,
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

    if (gst && gst !== "0") {
      if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/i.test(
          gst,
        )
      ) {
        return res.status(400).json({
          message: "Invalid GST number",
        });
      }
    }

    if (gst === "0") {
      if (!pan) {
        return res.status(400).json({
          message: "PAN number is required when GST is 0",
        });
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan)) {
        return res.status(400).json({
          message: "Invalid PAN number format",
        });
      }
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
    const { gst, pan } = req.body;

    if (gst && gst !== "0") {
      if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/i.test(
          gst,
        )
      ) {
        return res.status(400).json({
          message: "Invalid GST number",
        });
      }
    }

    if (gst === "0") {
      if (!pan) {
        return res.status(400).json({
          message: "PAN number is required when GST is 0",
        });
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan)) {
        return res.status(400).json({
          message: "Invalid PAN number format",
        });
      }
    }

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
