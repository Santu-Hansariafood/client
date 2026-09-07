import { Router } from "express";
import mongoose from "mongoose";
import Financer from "../models/Financer.js";
import Buyer from "../models/Buyer.js";
import Company from "../models/Company.js";

const router = Router();

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const populatePaths = [
  { path: "groupId", select: "groupName" },
  { path: "buyerId", select: "name mobile" },
  { path: "companyId", select: "companyName companyEmail" },
];

router.get("/options", async (req, res) => {
  try {
    const groupId = toObjectId(req.query.groupId);
    if (!groupId) {
      return res.status(400).json({ message: "A valid groupId is required" });
    }

    const groupedCompanies = await Company.find({ groupId })
      .select("_id")
      .lean();
    const groupedCompanyIds = groupedCompanies.map((company) => company._id);

    const buyers = await Buyer.find({
      $or: [
        { groupId },
        ...(groupedCompanyIds.length
          ? [{ companyIds: { $in: groupedCompanyIds } }]
          : []),
      ],
    })
      .select("name mobile companyIds groupId")
      .populate({ path: "companyIds", select: "companyName companyEmail" })
      .sort({ name: 1, _id: 1 })
      .lean();
    const savedFinancers = await Financer.find({ groupId })
      .select("_id buyerId companyId")
      .lean();
    const savedByCompany = new Map(
      savedFinancers.map((item) => [
        `${item.buyerId}:${item.companyId}`,
        String(item._id),
      ]),
    );

    res.json(
      buyers.map((buyer) => ({
        _id: buyer._id,
        name: buyer.name,
        mobile: buyer.mobile || [],
        companies: (buyer.companyIds || [])
          .filter(
            (company) =>
              String(buyer.groupId || "") === String(groupId) ||
              groupedCompanyIds.some((id) => String(id) === String(company._id)),
          )
          .map((company) => ({
          _id: company._id,
          companyName: company.companyName,
          companyEmail: company.companyEmail || "",
          financerId: savedByCompany.get(`${buyer._id}:${company._id}`) || null,
          })),
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
    const buyerId = toObjectId(req.body?.buyerId);
    const companyId = toObjectId(req.body?.companyId);

    if (!groupId || !buyerId || !companyId) {
      return res.status(400).json({
        message: "groupId, buyerId and companyId are required",
      });
    }

    const buyer = await Buyer.findOne({
      _id: buyerId,
      $or: [{ groupId }, { companyIds: companyId }],
    })
      .select("groupId companyIds")
      .populate({ path: "companyIds", select: "_id groupId" })
      .lean();
    const selectedCompany = (buyer?.companyIds || []).find(
      (company) => String(company._id || company) === String(companyId),
    );
    const isGroupLinked =
      String(buyer?.groupId || "") === String(groupId) ||
      String(selectedCompany?.groupId || "") === String(groupId);
    if (!buyer || !selectedCompany || !isGroupLinked) {
      return res.status(400).json({
        message: "The selected company is not linked to this buyer group",
      });
    }

    const financer = await Financer.findOneAndUpdate(
      { groupId, buyerId, companyId },
      { $setOnInsert: { groupId, buyerId, companyId } },
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
