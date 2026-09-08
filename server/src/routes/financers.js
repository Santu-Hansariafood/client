import { Router } from "express";
import mongoose from "mongoose";
import Financer from "../models/Financer.js";
import Buyer from "../models/Buyer.js";
import Company from "../models/Company.js";
import SelfOrder from "../models/SelfOrder.js";
import LoadingEntry from "../models/LoadingEntry.js";

const router = Router();

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const populatePaths = [
  { path: "groupId", select: "groupName" },
  { path: "buyerId", select: "name mobile" },
  { path: "companyId", select: "companyName companyEmail groupId" },
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
      .select("name mobile groupId companyIds")
      .populate({ path: "companyIds", select: "companyName companyEmail groupId" })
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
      buyers.flatMap((buyer) =>
        (buyer.companyIds || [])
          .filter(
            (company) =>
              String(buyer.groupId || "") === String(groupId) ||
              groupedCompanyIds.some((id) => String(id) === String(company._id)),
          )
          .map((company) => ({
            buyerId: buyer._id,
            buyerName: buyer.name,
            companyId: company._id,
            companyName: company.companyName,
            companyEmail: company.companyEmail || "",
            financerId:
              savedByCompany.get(`${buyer._id}:${company._id}`) || null,
          })),
      ),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/report", async (req, res) => {
  try {
    const groupId = req.query.groupId ? toObjectId(req.query.groupId) : null;
    const companyId = req.query.companyId ? toObjectId(req.query.companyId) : null;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "10", 10)));
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const rawSaudaNos = String(req.query.saudaNos || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (req.query.groupId && !groupId) {
      return res.status(400).json({ message: "Invalid groupId" });
    }
    if (req.query.companyId && !companyId) {
      return res.status(400).json({ message: "Invalid companyId" });
    }

    const financerQuery = {
      ...(groupId ? { groupId } : {}),
      ...(companyId ? { companyId } : {}),
    };
    const financerRecords = await Financer.find(financerQuery)
      .select("groupId buyerId companyId")
      .populate([
        { path: "groupId", select: "groupName" },
        { path: "buyerId", select: "name" },
        { path: "companyId", select: "companyName" },
      ])
      .lean();
    const financedCompanyIds = [
      ...new Set(
        financerRecords
          .map((item) => String(item.companyId?._id || item.companyId || ""))
          .filter(Boolean),
      ),
    ];
    const financedCompanies = await Company.find({
      _id: { $in: financedCompanyIds },
    })
      .select("_id companyName")
      .lean();
    const financedCompanyNames = financedCompanies
      .map((company) => company.companyName)
      .filter(Boolean);
    const financedGroups = [
      ...new Map(
        financerRecords
          .filter((item) => item.groupId?._id)
          .map((item) => [
            String(item.groupId._id),
            {
              _id: item.groupId._id,
              groupName: item.groupId.groupName,
            },
          ]),
      ).values(),
    ].sort((first, second) =>
      String(first.groupName || "").localeCompare(String(second.groupName || "")),
    );

    if (companyId && !financedCompanyIds.includes(String(companyId))) {
      return res.json({
        data: [],
        total: 0,
        page,
        limit,
        financers: financerRecords,
        groups: financedGroups,
        companies: [],
        financerCount: financerRecords.length,
      });
    }

    const scopedCompanyIds = (companyId ? [companyId] : financedCompanyIds).filter(Boolean);
    const scopedCompanyNames = companyId
      ? financedCompanies
          .filter((company) => String(company._id) === String(companyId))
          .map((company) => company.companyName)
      : financedCompanyNames;
    const legacyCompanyNameQuery = scopedCompanyNames.length
      ? {
          $and: [
            {
              $or: [{ companyId: { $exists: false } }, { companyId: null }],
            },
            { buyerCompany: { $in: scopedCompanyNames } },
          ],
        }
      : null;
    const orderQuery = {
      $or: [
        { companyId: { $in: scopedCompanyIds } },
        ...(legacyCompanyNameQuery ? [legacyCompanyNameQuery] : []),
      ],
    };
    if (rawSaudaNos.length) orderQuery.saudaNo = { $in: rawSaudaNos };
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate && !Number.isNaN(startDate.getTime())) {
        dateFilter.$gte = startDate;
      }
      if (endDate && !Number.isNaN(endDate.getTime())) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter.$lte = endOfDay;
      }
      if (Object.keys(dateFilter).length) {
        orderQuery.$and = [
          {
            $or: [{ poDate: dateFilter }, { createdAt: dateFilter }],
          },
        ];
      }
    }

    const [orders, total, companies, financerOrders] = await Promise.all([
      SelfOrder.find(orderQuery)
        .select("saudaNo poDate supplierCompany buyerCompany consignee quantity rate deliveryDate paymentTerms companyId")
        .sort({ poDate: -1, saudaNo: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SelfOrder.countDocuments(orderQuery),
      Company.find({ _id: { $in: financedCompanyIds } })
        .select("_id companyName")
        .sort({ companyName: 1 })
        .lean(),
      SelfOrder.find(orderQuery)
        .select("saudaNo poDate buyerCompany companyId")
        .sort({ poDate: -1, saudaNo: -1 })
        .lean(),
    ]);

    const financerData = financerRecords.map((financer) => {
      const financerCompanyId = String(financer.companyId?._id || financer.companyId || "");
      const financerCompanyName = financer.companyId?.companyName || "";
      const saudas = financerOrders
        .filter(
          (order) =>
            (order.companyId && String(order.companyId) === financerCompanyId) ||
            (!order.companyId && order.buyerCompany === financerCompanyName),
        )
        .map((order) => ({
          id: order._id,
          saudaNo: order.saudaNo,
          poDate: order.poDate,
        }));

      return { ...financer, saudas };
    });

    const saudaNos = orders.map((order) => order.saudaNo).filter(Boolean);
    const loadedBySauda = await LoadingEntry.aggregate([
      { $match: { saudaNo: { $in: saudaNos } } },
      {
        $group: {
          _id: "$saudaNo",
          loadedQuantity: { $sum: { $ifNull: ["$loadingWeight", 0] } },
        },
      },
    ]);
    const loadedMap = new Map(
      loadedBySauda.map((item) => [String(item._id), Number(item.loadedQuantity || 0)]),
    );

    const data = orders.map((order) => ({
      ...order,
      pendingQuantity: Math.max(
        0,
        Number(order.quantity || 0) - (loadedMap.get(String(order.saudaNo)) || 0),
      ),
      loadedQuantity: loadedMap.get(String(order.saudaNo)) || 0,
    }));

    res.json({
      data,
      total,
      page,
      limit,
      financers: financerData,
      groups: financedGroups,
      companies,
      financerCount: financerRecords.length,
    });
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
    const companyId = toObjectId(req.query.companyId);

    if (req.query.groupId && !groupId) {
      return res.status(400).json({ message: "Invalid groupId" });
    }
    if (req.query.companyId && !companyId) {
      return res.status(400).json({ message: "Invalid companyId" });
    }
    if (groupId) query.groupId = groupId;
    if (companyId) query.companyId = companyId;

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

    const groupedCompany = await Company.findOne({ _id: companyId, groupId })
      .select("_id")
      .lean();
    const buyer = await Buyer.findOne({
      _id: buyerId,
      $or: [{ groupId }, { companyIds: companyId }],
    })
      .select("_id groupId companyIds")
      .lean();
    if (
      !buyer ||
      !(
        groupedCompany ||
        buyer.companyIds?.some((id) => String(id) === String(companyId))
      )
    ) {
      return res.status(400).json({
        message: "Selected buyer company is not linked to this group",
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
