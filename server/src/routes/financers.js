import { Router } from "express";
import mongoose from "mongoose";
import Financer from "../models/Financer.js";
import SellerCompany from "../models/SellerCompany.js";

const router = Router();

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const populatePaths = [
  { path: "groupId", select: "groupName" },
  { path: "sellerCompanyId", select: "companyName email mobileNo" },
];

router.get("/options", async (req, res) => {
  try {
    const groupId = toObjectId(req.query.groupId);
    if (!groupId) {
      return res.status(400).json({ message: "A valid groupId is required" });
    }

    const sellerCompanies = await SellerCompany.find()
      .select("companyName email mobileNo")
      .sort({ companyName: 1, _id: 1 })
      .lean();
    const savedFinancers = await Financer.find({ groupId })
      .select("_id sellerCompanyId")
      .lean();
    const savedByCompany = new Map(
      savedFinancers.map((item) => [String(item.sellerCompanyId), String(item._id)]),
    );

    res.json(
      sellerCompanies.map((company) => ({
        _id: company._id,
        companyName: company.companyName,
        email: company.email || "",
        mobileNo: company.mobileNo || "",
        financerId: savedByCompany.get(String(company._id)) || null,
      })),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "10", 10)));
    const query = {};
    const groupId = toObjectId(req.query.groupId);

    if (req.query.groupId && !groupId) {
      return res.status(400).json({ message: "Invalid groupId" });
    }
    if (groupId) query.groupId = groupId;

    const [data, total] = await Promise.all([
      Financer.find(query)
        .populate(populatePaths)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Financer.countDocuments(query),
    ]);

    res.json({ data, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const groupId = toObjectId(req.body?.groupId);
    const sellerCompanyId = toObjectId(req.body?.sellerCompanyId);

    if (!groupId || !sellerCompanyId) {
      return res.status(400).json({
        message: "groupId and sellerCompanyId are required",
      });
    }

    const sellerCompany = await SellerCompany.findById(sellerCompanyId)
      .select("_id")
      .lean();
    if (!sellerCompany) {
      return res.status(400).json({
        message: "Selected seller company was not found",
      });
    }

    const financer = await Financer.findOneAndUpdate(
      { groupId, sellerCompanyId },
      { $setOnInsert: { groupId, sellerCompanyId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate(populatePaths);

    res.status(201).json(financer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const financer = await Financer.findByIdAndDelete(req.params.id);
    if (!financer) return res.status(404).json({ message: "Financer not found" });
    res.json({ message: "Financer removed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
