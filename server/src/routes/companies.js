import { Router } from "express";
import Company from "../models/Company.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (page > 0 && limit > 0) {
      const companies = await Company.find()
        .sort({ companyName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await Company.countDocuments();

      return res.json({
        data: companies,
        total
      });
    }

    const companies = await Company.find()
      .sort({ companyName: 1 })
      .lean();

    res.json({
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean();

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { companyName } = req.body;

    if (!companyName) {
      return res.status(400).json({
        message: "Company name is required"
      });
    }

    const company = new Company({
      companyName
    });

    const saved = await company.save();

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Company not found"
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
    const deleted = await Company.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.json({
      message: "Company deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

export default router;