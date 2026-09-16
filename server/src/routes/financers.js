import { Router } from "express";
import mongoose from "mongoose";
import Financer from "../models/Financer.js";
import Buyer from "../models/Buyer.js";
import Company from "../models/Company.js";
import Seller from "../models/Seller.js";
import SelfOrder from "../models/SelfOrder.js";
import LoadingEntry from "../models/LoadingEntry.js";
import FinanceAdjustment from "../models/FinanceAdjustment.js";

const router = Router();

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const populatePaths = [
  { path: "groupId", select: "groupName" },
  { path: "buyerId", select: "name mobile" },
  { path: "companyId", select: "companyName companyEmail groupId" },
  { path: "sellerId", select: "sellerName phoneNumbers companies" },
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

router.get("/seller-options", async (_req, res) => {
  try {
    const [sellers, sellerCompanies] = await Promise.all([
      Seller.find({ status: "active" }).select("sellerName companies").sort({ sellerName: 1 }).lean(),
      SelfOrder.distinct("supplierCompany", { supplierCompany: { $exists: true, $ne: "" } }),
    ]);
    res.json({
      sellers: sellers.map((seller) => ({
        value: String(seller._id),
        label: seller.sellerName,
      })),
      sellerCompanies: sellerCompanies.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b))),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/pending-options", async (req, res) => {
  try {
    const selectedCompany = String(req.query.sellerCompany || "").trim();
    const selectedConsignee = String(req.query.consignee || "").trim();
    const sellerCompanies = (await Financer.distinct("sellerCompany", {
      financerType: "Seller",
      sellerCompany: { $exists: true, $ne: "" },
    }))
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));

    if (!selectedCompany) {
      return res.json({ sellerCompanies, saudaNumbers: [] });
    }

    const companyRegex = new RegExp(
      `^${selectedCompany.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    );
    const consigneeRegex = selectedConsignee
      ? new RegExp(
          `^${selectedConsignee.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        )
      : null;
    const saudaNumbers = await SelfOrder.find({
      supplierCompany: companyRegex,
      ...(consigneeRegex ? { consignee: consigneeRegex } : {}),
    })
      .select("saudaNo poDate consignee")
      .sort({ poDate: -1, saudaNo: -1 })
      .lean();

    const uniqueSaudaNumbers = [];
    const seenSaudaNumbers = new Set();
    saudaNumbers.forEach((item) => {
      const key = String(item.saudaNo || "").toLowerCase();
      if (key && !seenSaudaNumbers.has(key)) {
        seenSaudaNumbers.add(key);
        uniqueSaudaNumbers.push({
          saudaNo: item.saudaNo,
          poDate: item.poDate,
          consignee: item.consignee || "",
        });
      }
    });

    return res.json({
      sellerCompanies,
      saudaNumbers: uniqueSaudaNumbers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
    const consignee = String(req.query.consignee || "").trim();
    const sellerCompany = String(req.query.sellerCompany || "").trim();
    const manualAdjustment = Math.max(0, Number(req.query.manualAdjustment || 0));
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
        sellerCompanyOptions: [],
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
    let orderQuery = {
      $or: [
        { companyId: { $in: scopedCompanyIds } },
        ...(legacyCompanyNameQuery ? [legacyCompanyNameQuery] : []),
      ],
    };
    const escapedSellerCompany = sellerCompany.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    if (rawSaudaNos.length && sellerCompany) {
      orderQuery = {
        saudaNo: { $in: rawSaudaNos },
        supplierCompany: {
          $regex: `^${escapedSellerCompany}$`,
          $options: "i",
        },
      };
    } else if (rawSaudaNos.length) {
      orderQuery.saudaNo = { $in: rawSaudaNos };
    }
    if (sellerCompany) {
      orderQuery.supplierCompany ||= {
        $regex: `^${escapedSellerCompany}$`,
        $options: "i",
      };
    }
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
    const consigneeQuery = {
      $or: [
        { companyId: { $in: scopedCompanyIds } },
        ...(legacyCompanyNameQuery ? [legacyCompanyNameQuery] : []),
      ],
    };
    if (consignee) {
      orderQuery.consignee = { $regex: `^${consignee.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
    }

    const [orders, total, companies, financerOrders, consigneeOptions, sellerCompanyOptions] = await Promise.all([
      SelfOrder.find(orderQuery)
        .select("saudaNo poDate supplierCompany buyerCompany consignee quantity rate cd gst deliveryDate paymentTerms companyId")
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
      SelfOrder.distinct("consignee", consigneeQuery),
      SelfOrder.distinct("supplierCompany", {
        $or: [
          { companyId: { $in: scopedCompanyIds } },
          ...(legacyCompanyNameQuery ? [legacyCompanyNameQuery] : []),
        ],
      }),
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

    const adjustmentDateFilter = {};
    if (startDate && !Number.isNaN(startDate.getTime())) adjustmentDateFilter.$gte = startDate;
    if (endDate && !Number.isNaN(endDate.getTime())) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      adjustmentDateFilter.$lte = endOfDay;
    }
    const adjustmentQuery = {
      ...(rawSaudaNos.length
        ? { saudaNo: { $in: rawSaudaNos }, sellerCompany: { $regex: `^${escapedSellerCompany}$`, $options: "i" } }
        : {}),
      ...(Object.keys(adjustmentDateFilter).length ? { adjustmentDate: adjustmentDateFilter } : {}),
    };
    const [adjustments, dateWiseSaudas] = await Promise.all([
      FinanceAdjustment.find(adjustmentQuery).sort({ adjustmentDate: -1, createdAt: -1 }).lean(),
      SelfOrder.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$poDate", "$createdAt"] } } },
            saudaCount: { $sum: 1 },
            saudaQuantity: { $sum: { $ifNull: ["$quantity", 0] } },
            saudaNos: { $push: "$saudaNo" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);
    const totalsSaudaNos = dateWiseSaudas.flatMap((item) => item.saudaNos || []).filter(Boolean);
    const totalsLoadedBySauda = await LoadingEntry.aggregate([
      { $match: { saudaNo: { $in: totalsSaudaNos } } },
      {
        $group: {
          _id: "$saudaNo",
          loadedQuantity: { $sum: { $ifNull: ["$loadingWeight", 0] } },
        },
      },
    ]);
    const totalsLoadedMap = new Map(
      totalsLoadedBySauda.map((item) => [String(item._id), Number(item.loadedQuantity || 0)]),
    );
    const dateTotals = new Map(
      dateWiseSaudas.map((item) => [
        item._id,
        {
          date: item._id,
          saudaCount: Number(item.saudaCount || 0),
          saudaQuantity: Number(item.saudaQuantity || 0),
          loadedQuantity: (item.saudaNos || []).reduce(
            (totalQuantity, saudaNo) => totalQuantity + (totalsLoadedMap.get(String(saudaNo)) || 0),
            0,
          ),
          adjustmentQuantity: 0,
          pendingQuantity: 0,
        },
      ]),
    );
    adjustments.forEach((adjustment) => {
      const date = new Date(adjustment.adjustmentDate).toISOString().slice(0, 10);
      const current = dateTotals.get(date) || {
        date,
        saudaCount: 0,
        saudaQuantity: 0,
        loadedQuantity: 0,
        adjustmentQuantity: 0,
        pendingQuantity: 0,
      };
      current.adjustmentQuantity += Number(adjustment.adjustmentQuantity || 0);
      dateTotals.set(date, current);
    });
    dateTotals.forEach((item) => {
      item.pendingQuantity = Math.max(
        0,
        item.saudaQuantity - item.loadedQuantity - item.adjustmentQuantity,
      );
    });

    const adjustmentSaudaNos = [...new Set(adjustments.map((item) => item.saudaNo).filter(Boolean))];
    const adjustmentSaudas = await SelfOrder.find({ saudaNo: { $in: adjustmentSaudaNos } })
      .select("saudaNo poDate")
      .lean();
    const adjustmentSaudaDateMap = new Map(
      adjustmentSaudas.map((item) => [String(item.saudaNo).toLowerCase(), item.poDate]),
    );
    const enrichedAdjustments = adjustments.map((adjustment) => ({
      ...adjustment,
      saudaDate: adjustmentSaudaDateMap.get(String(adjustment.saudaNo).toLowerCase()) || null,
    }));

    const data = orders.map((order) => ({
      ...order,
      pendingQuantity: Math.max(
        0,
        Number(order.quantity || 0) -
          (loadedMap.get(String(order.saudaNo)) || 0) -
          (rawSaudaNos.length ? manualAdjustment : 0),
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
      consigneeOptions: consigneeOptions
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second)),
      sellerCompanyOptions: sellerCompanyOptions
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second)),
      financerCount: financerRecords.length,
      adjustments: enrichedAdjustments,
      dateWiseTotals: [...dateTotals.values()].sort((first, second) => first.date.localeCompare(second.date)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/adjustments", async (req, res) => {
  try {
    const adjustmentQuantity = Math.max(0, Number(req.body.adjustmentQuantity || 0));
    if (!String(req.body.saudaNo || "").trim() || !String(req.body.sellerCompany || "").trim()) {
      return res.status(400).json({ message: "Sauda number and seller company are required" });
    }
    if (!adjustmentQuantity) {
      return res.status(400).json({ message: "Adjustment quantity must be greater than zero" });
    }
    const adjustment = await FinanceAdjustment.create({
      saudaNo: String(req.body.saudaNo).trim(),
      sellerCompany: String(req.body.sellerCompany).trim(),
      consignee: String(req.body.consignee || "").trim(),
      purchaseQuantity: Math.max(0, Number(req.body.purchaseQuantity || 0)),
      loadedQuantity: Math.max(0, Number(req.body.loadedQuantity || 0)),
      pendingQuantity: Math.max(0, Number(req.body.pendingQuantity || 0)),
      adjustmentQuantity,
      adjustmentDate: req.body.adjustmentDate ? new Date(req.body.adjustmentDate) : new Date(),
    });
    return res.status(201).json(adjustment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/adjustments/:id", async (req, res) => {
  try {
    const adjustmentQuantity = Math.max(0, Number(req.body.adjustmentQuantity || 0));
    if (!adjustmentQuantity) {
      return res.status(400).json({ message: "Adjustment quantity must be greater than zero" });
    }
    const adjustment = await FinanceAdjustment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          adjustmentQuantity,
          pendingQuantity: Math.max(0, Number(req.body.pendingQuantity || 0)),
          adjustmentDate: req.body.adjustmentDate ? new Date(req.body.adjustmentDate) : new Date(),
        },
      },
      { new: true, runValidators: true },
    );
    if (!adjustment) return res.status(404).json({ message: "Adjustment not found" });
    return res.json(adjustment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/adjustments/:id", async (req, res) => {
  try {
    const adjustment = await FinanceAdjustment.findByIdAndDelete(req.params.id);
    if (!adjustment) return res.status(404).json({ message: "Adjustment not found" });
    return res.json({ message: "Adjustment deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
    const financerType = req.body?.financerType || "Buyer";

    if (financerType === "Seller") {
      const sellerId = toObjectId(req.body?.sellerId);
      const sellerCompany = String(req.body?.sellerCompany || "").trim();
      if (!groupId || !sellerId || !sellerCompany) {
        return res.status(400).json({
          message: "groupId, sellerId and sellerCompany are required",
        });
      }
      const seller = await Seller.findById(sellerId).select("_id").lean();
      if (!seller) return res.status(400).json({ message: "Invalid seller" });
      const financer = await Financer.findOneAndUpdate(
        { groupId, sellerId, sellerCompany, financerType: "Seller" },
        { $setOnInsert: { groupId, sellerId, sellerCompany, financerType: "Seller" } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).populate(populatePaths);
      return res.status(201).json(financer);
    }

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
