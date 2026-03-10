import { Router } from "express";
import mongoose from "mongoose";
import Company from "../models/Company.js";
import Consignee from "../models/Consignee.js";
import Group from "../models/Group.js";

const router = Router();

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const normalizeObjectIdArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((v) => toObjectId(v)).filter(Boolean);
};

const mapCompanyForClient = (company) => {
  const consigneeIds = (company.consigneeIds || [])
    .map((c) => c?._id || c)
    .filter(Boolean);

  const commodities = (company.commodities || []).map((entry) => {
    const commodityId = entry.commodityId?._id || entry.commodityId || null;
    const commodityRef = entry.commodityId;

    // Get parameters from the Company record (with their values)
    const storedParamsMap = new Map(
      (entry.parameters || []).map((p) => [
        String(p.parameterId?._id || p.parameterId),
        p.value ?? "",
      ])
    );

    // Get parameters from the Commodity model (the latest list)
    const commodityParams = (commodityRef?.parameters || []).map((p) => ({
      _id: p.parameterId?._id || p.parameterId,
      parameterId: p.parameterId?._id || p.parameterId,
      parameter: p.parameterId?.name || "",
      value: storedParamsMap.get(String(p.parameterId?._id || p.parameterId)) ?? "",
    }));

    return {
      _id: commodityId,
      commodityId,
      name: commodityRef?.name || entry.name || "",
      brokerage: entry.brokerage ?? 0,
      parameters: commodityParams,
    };
  });

  return {
    _id: company._id,
    companyName: company.companyName,
    companyEmail: company.companyEmail || "",
    consigneeIds,
    consignee: (company.consigneeIds || []).map((c) => c?.name || "").filter(Boolean),
    groupId: company.groupId?._id || company.groupId || null,
    group: company.groupId?.groupName || company.group || "",
    commodities,
    mandiLicense: company.mandiLicense || "",
    activeStatus: typeof company.activeStatus === "boolean" ? company.activeStatus : true,
  };
};

const companyPopulate = [
  { path: "consigneeIds", select: "name" },
  { path: "groupId", select: "groupName" },
  {
    path: "commodities.commodityId",
    select: "name parameters",
    populate: { path: "parameters.parameterId", select: "name" },
  },
  { path: "commodities.parameters.parameterId", select: "name" },
];

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (page > 0 && limit > 0) {
      const companies = await Company.find()
        .sort({ companyName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(companyPopulate)
        .lean();

      const total = await Company.countDocuments();

      return res.json({
        data: companies.map(mapCompanyForClient),
        total
      });
    }

    const companies = await Company.find()
      .sort({ companyName: 1 })
      .populate(companyPopulate)
      .lean();

    res.json(companies.map(mapCompanyForClient));
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate(companyPopulate).lean();

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.json(mapCompanyForClient(company));
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const { companyName } = body;

    if (!companyName) {
      return res.status(400).json({
        message: "Company name is required"
      });
    }

    let consigneeIds = normalizeObjectIdArray(body.consigneeIds);
    let groupId = toObjectId(body.groupId);

    if (consigneeIds.length === 0 && Array.isArray(body.consignee)) {
      const consignees = await Consignee.find({ name: { $in: body.consignee } })
        .select("_id")
        .lean();
      consigneeIds = consignees.map((c) => c._id);
    }

    if (!groupId && body.group) {
      const group = await Group.findOne({ groupName: body.group }).select("_id").lean();
      groupId = group?._id || null;
    }

    const commodities = Array.isArray(body.commodities)
      ? body.commodities
          .map((entry) => ({
            commodityId: toObjectId(entry.commodityId),
            brokerage: Number(entry.brokerage || 0),
            parameters: Array.isArray(entry.parameters)
              ? entry.parameters
                  .map((p) => ({
                    parameterId: toObjectId(p.parameterId || p._id),
                    value: p.value ?? "",
                  }))
                  .filter((p) => p.parameterId)
              : [],
          }))
          .filter((entry) => entry.commodityId)
      : [];

    const company = new Company({
      companyName,
      companyEmail: body.companyEmail || "",
      consigneeIds,
      groupId: groupId || null,
      commodities,
      mandiLicense: body.mandiLicense || "",
      activeStatus: typeof body.activeStatus === "boolean" ? body.activeStatus : true,
    });

    const saved = await company.save();

    const created = await Company.findById(saved._id).populate(companyPopulate).lean();
    res.status(201).json(mapCompanyForClient(created));
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const update = {
      companyName: body.companyName,
      companyEmail: body.companyEmail,
      consigneeIds: normalizeObjectIdArray(body.consigneeIds),
      groupId: toObjectId(body.groupId),
      commodities: Array.isArray(body.commodities)
        ? body.commodities
            .map((entry) => ({
              commodityId: toObjectId(entry.commodityId || entry._id),
              brokerage: Number(entry.brokerage || 0),
              parameters: Array.isArray(entry.parameters)
                ? entry.parameters
                    .map((p) => ({
                      parameterId: toObjectId(p.parameterId || p._id),
                      value: p.value ?? "",
                    }))
                    .filter((p) => p.parameterId)
                : [],
            }))
            .filter((entry) => entry.commodityId)
        : [],
      mandiLicense: body.mandiLicense || "",
      activeStatus: typeof body.activeStatus === "boolean" ? body.activeStatus : true,
    };

    const updated = await Company.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
      .populate(companyPopulate)
      .lean();

    if (!updated) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.json(mapCompanyForClient(updated));
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
