import express from "express";
import LoadingEntry from "../models/LoadingEntry.js";
import SelfOrder from "../models/SelfOrder.js";
import Company from "../models/Company.js";
import SellerCompany from "../models/SellerCompany.js";
import PaymentReceived from "../models/PaymentReceived.js";
import ExcelJS from "exceljs";

const router = express.Router();

const escapeRegex = (string) => {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
};

const companyRegex = (name) =>
  new RegExp(`^${escapeRegex(String(name).trim())}$`, "i");

const computeLorryAllocationSums = async (entryIds) => {
  if (!entryIds || entryIds.length === 0) return {};
  const result = await PaymentReceived.aggregate([
    { $unwind: "$mappings" },
    {
      $match: {
        "mappings.loadingEntryId": { $in: entryIds },
      },
    },
    {
      $group: {
        _id: "$mappings.loadingEntryId",
        totalAllocated: { $sum: { $ifNull: ["$mappings.allocatedAmount", 0] } },
      },
    },
  ]);
  const allocationMap = {};
  result.forEach((r) => {
    allocationMap[r._id.toString()] = Number(r.totalAllocated) || 0;
  });
  return allocationMap;
};

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = (req.query.search || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const paymentStatus = req.query.paymentStatus;
    const buyerCompany = req.query.buyerCompany;
    const sellerCompany = req.query.sellerCompany;

    let query = {
      unloadingWeight: { $gt: 0 },
    };

    if (paymentStatus === "done") {
      query.$or = [
        { paymentStatus: "done" },
        { paidAmount: { $gt: 0 } }
      ];
    } else if (paymentStatus === "due") {
      query.paymentStatus = "pending";
    }

    const andParts = [query];

    if (buyerCompany) {
      const buyerRegex = companyRegex(buyerCompany);
      andParts.push({
        $or: [{ buyerCompany: buyerRegex }, { consignee: buyerRegex }],
      });
    }

    if (sellerCompany) {
      andParts.push({ supplierCompany: companyRegex(sellerCompany) });
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      andParts.push({
        $or: [
          { saudaNo: { $regex: searchRegex } },
          { buyerCompany: { $regex: searchRegex } },
          { supplierCompany: { $regex: searchRegex } },
          { consignee: { $regex: searchRegex } },
          { lorryNumber: { $regex: searchRegex } },
        ],
      });
    }

    const tempQuery = andParts.length > 1 ? { $and: andParts } : andParts[0];
    const allItems = await LoadingEntry.find(tempQuery)
      .sort({ unloadingDate: -1, createdAt: -1 })
      .select("saudaNo lorryNumber buyerCompany supplierCompany consignee unloadingWeight loadingWeight unloadingDate paymentStatus paidAmount supplier billNumber generalRemarks qualityClaims bankCharges isRejected totalFreight advance balance secondClaim secondClaimRemarks otherCharges otherChargesRemarks bankChargesRemarks tds tdsRemarks manualClaim manualClaimAmount")
      .populate("supplier", "sellerName")
      .lean();

    const entryIds = allItems.map((i) => i._id);
    const allocationMap = await computeLorryAllocationSums(entryIds);

    const saudaNos = [...new Set(allItems.map((i) => i.saudaNo).filter(Boolean))];
    const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } })
      .select("saudaNo buyerCompany paymentTerms rate cd gst")
      .lean();

    const saudaMap = selfOrders.reduce((acc, so) => {
      acc[so.saudaNo] = so;
      return acc;
    }, {});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let processedItems = allItems.map((item) => {
      const lorryAllocatedAmount = allocationMap[item._id.toString()] || 0;
      const remainingLorryBalance = Math.max(0, (item.totalFreight || 0) - lorryAllocatedAmount);

      if (item.isRejected) {
        return {
          ...item,
          qualityClaimsDetails: [],
          paymentTerms: 0,
          dueDate: null,
          isDue: false,
          rate: 0,
          amount: 0,
          grossAmount: 0,
          cdAmount: 0,
          gstAmount: 0,
          netAmount: 0,
          totalQualityClaims: 0,
          bankCharges: 0,
          dueAmount: 0,
          buyerCompany: item.buyerCompany || "N/A",
          totalFreight: item.totalFreight || 0,
          lorryAllocatedAmount: 0,
          remainingLorryBalance: 0,
        };
      }

      const order = saudaMap[item.saudaNo] || {};
      const terms = parseInt(order.paymentTerms) || 0;
      const unloadingDate = new Date(item.unloadingDate);
      const dueDate = new Date(unloadingDate);
      dueDate.setDate(unloadingDate.getDate() + terms);

      const isDue = item.paymentStatus === "pending" && today >= dueDate;

      let grossAmount = 0;
      let cdAmount = 0;
      let gstAmount = 0;
      let netAmount = 0;
      let totalQualityClaims = 0;
      let bankCharges = 0;
      let qualityClaimsDetails = [];

      if (order) {
        const weight =
          item.unloadingWeight && item.unloadingWeight > 0
            ? item.unloadingWeight
            : item.loadingWeight || 0;
        const rate = order.rate || 0;
        const cdPercent = order.cd || 0;
        const gstPercent = order.gst || 0;
        bankCharges = Number(item.bankCharges) || 0;

        grossAmount = weight * rate;
        cdAmount = grossAmount * (cdPercent / 100);
        const taxableAmount = grossAmount - cdAmount - bankCharges;
        gstAmount = taxableAmount * (gstPercent / 100);
        netAmount = taxableAmount + gstAmount;

        if (item.qualityClaims && Array.isArray(item.qualityClaims)) {
          qualityClaimsDetails = item.qualityClaims.map((c) => ({
            parameterId: c.parameterId,
            parameterName: c.parameterName,
            standardValue: c.standardValue,
            actualValue: c.actualValue,
            claimAmount: Number(c.claimAmount) || 0,
            notes: c.notes || "",
          }));
          totalQualityClaims = qualityClaimsDetails.reduce(
            (sum, c) => sum + c.claimAmount,
            0
          );
        }

        if (item.manualClaim) {
          totalQualityClaims = Number(item.manualClaimAmount) || 0;
          qualityClaimsDetails = [
            {
              parameterId: "manual",
              parameterName: "Manual Claim",
              standardValue: null,
              actualValue: null,
              claimAmount: totalQualityClaims,
              notes: "Report not received - manual entry",
            },
          ];
        }
      }

      const paidAmount = Math.max(
        Number(item.paidAmount) || 0,
        lorryAllocatedAmount,
      );
      const dueAmount = Math.max(
        0,
        grossAmount -
          totalQualityClaims -
          bankCharges -
          cdAmount +
          gstAmount -
          paidAmount,
      );

      return {
        ...item,
        qualityClaimsDetails,
        paymentTerms: terms,
        dueDate,
        isDue,
        rate: order.rate || 0,
        amount:
          (item.unloadingWeight && item.unloadingWeight > 0
            ? item.unloadingWeight
            : item.loadingWeight || 0) * (order.rate || 0),
        paidAmount,
        grossAmount,
        cdAmount,
        gstAmount,
        netAmount,
        totalQualityClaims,
        bankCharges,
        dueAmount,
        buyerCompany: item.buyerCompany || order.buyerCompany || "N/A",
        totalFreight: item.totalFreight || 0,
        lorryAllocatedAmount,
        remainingLorryBalance,
      };
    });

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      
      if (paymentStatus === "due") {
        processedItems = processedItems.filter(item => {
          if (!item.dueDate) return false;
          const dueDt = new Date(item.dueDate);
          let matchesStart = true;
          let matchesEnd = true;
          if (dateFilter.$gte) matchesStart = dueDt >= dateFilter.$gte;
          if (dateFilter.$lte) matchesEnd = dueDt <= dateFilter.$lte;
          return matchesStart && matchesEnd;
        });
      } else {
        processedItems = processedItems.filter(item => {
          if (!item.unloadingDate) return false;
          const unloadDate = new Date(item.unloadingDate);
          let matchesStart = true;
          let matchesEnd = true;
          if (dateFilter.$gte) matchesStart = unloadDate >= dateFilter.$gte;
          if (dateFilter.$lte) matchesEnd = unloadDate <= dateFilter.$lte;
          return matchesStart && matchesEnd;
        });
      }
    }

    if (paymentStatus === "due") {
      processedItems = processedItems.filter((item) => item.isDue);
    }

    let totalGross = 0;
    let totalCd = 0;
    let totalGst = 0;
    let totalClaims = 0;
    let totalBankCharges = 0;
    let totalCredit = 0;
    let totalDue = 0;
    let totalRemainingLorryBalance = 0;

    processedItems.forEach(item => {
      totalGross += item.grossAmount || 0;
      totalCd += item.cdAmount || 0;
      totalGst += item.gstAmount || 0;
      totalClaims += item.totalQualityClaims || 0;
      totalBankCharges += item.bankCharges || 0;
      totalCredit += item.paidAmount || 0;
      totalDue += item.dueAmount || 0;
      totalRemainingLorryBalance += item.remainingLorryBalance || 0;
    });

    const totalItems = processedItems.length;
    const paginatedItems = processedItems.slice((page - 1) * limit, page * limit);

    const finalItems = paginatedItems.map((item, index) => ({
      ...item,
      slNo: (page - 1) * limit + index + 1,
    }));

    res.json({
      data: finalItems,
      total: totalItems,
      page,
      totalPages: Math.ceil(totalItems / limit),
      totals: {
        totalGross,
        totalCd,
        totalGst,
        totalClaims,
        totalBankCharges,
        totalCredit,
        totalDue,
        totalRemainingLorryBalance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const entry = await LoadingEntry.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: status },
      { new: true },
    );

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const days = parseInt(req.query.days || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await LoadingEntry.aggregate([
      {
        $match: {
          unloadingWeight: { $gt: 0 },
          unloadingDate: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "selforders",
          localField: "saudaNo",
          foreignField: "saudaNo",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $project: {
          unloadingDate: 1,
          paymentStatus: 1,
          amount: { $multiply: ["$unloadingWeight", "$order.rate"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$unloadingDate" },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$amount", 0],
            },
          },
          received: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "done"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/export/excel", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const paymentStatus = req.query.paymentStatus;
    const buyerCompany = req.query.buyerCompany;
    const sellerCompany = req.query.sellerCompany;

    let query = { unloadingWeight: { $gt: 0 } };
    if (paymentStatus === "done") {
      query.$or = [
        { paymentStatus: "done" },
        { paidAmount: { $gt: 0 } }
      ];
    } else if (paymentStatus === "due") {
      query.paymentStatus = "pending";
    }

    const andParts = [query];

    if (buyerCompany) {
      const buyerRegex = companyRegex(buyerCompany);
      andParts.push({
        $or: [{ buyerCompany: buyerRegex }, { consignee: buyerRegex }],
      });
    }

    if (sellerCompany) {
      andParts.push({ supplierCompany: companyRegex(sellerCompany) });
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      andParts.push({
        $or: [
          { saudaNo: { $regex: searchRegex } },
          { buyerCompany: { $regex: searchRegex } },
          { supplierCompany: { $regex: searchRegex } },
          { consignee: { $regex: searchRegex } },
          { lorryNumber: { $regex: searchRegex } },
        ],
      });
    }

    const tempQuery = andParts.length > 1 ? { $and: andParts } : andParts[0];
    let items = await LoadingEntry.find(tempQuery)
      .sort({ unloadingDate: -1, createdAt: -1 })
      .select("saudaNo lorryNumber buyerCompany supplierCompany consignee unloadingWeight loadingWeight unloadingDate paymentStatus paidAmount supplier billNumber generalRemarks qualityClaims bankCharges isRejected totalFreight advance balance secondClaim secondClaimRemarks otherCharges otherChargesRemarks bankChargesRemarks tds tdsRemarks manualClaim manualClaimAmount")
      .populate("supplier", "sellerName")
      .lean();

    const excelEntryIds = items.map((i) => i._id);
    const excelAllocationMap = await computeLorryAllocationSums(excelEntryIds);

    const saudaNos = [...new Set(items.map((i) => i.saudaNo).filter(Boolean))];
    const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } })
      .select("saudaNo buyerCompany paymentTerms rate cd gst")
      .lean();

    const saudaMap = selfOrders.reduce((acc, so) => {
      acc[so.saudaNo] = so;
      return acc;
    }, {});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let processedItems = items.map((item) => {
      const lorryAllocatedAmount = excelAllocationMap[item._id.toString()] || 0;
      const remainingLorryBalance = Math.max(0, (item.totalFreight || 0) - lorryAllocatedAmount);

      if (item.isRejected) {
        return {
          ...item,
          qualityClaimsDetails: [],
          paymentTerms: 0,
          dueDate: null,
          isDue: false,
          rate: 0,
          amount: 0,
          grossAmount: 0,
          cdAmount: 0,
          gstAmount: 0,
          netAmount: 0,
          totalQualityClaims: 0,
          bankCharges: 0,
          dueAmount: 0,
          buyerCompany: item.buyerCompany || "N/A",
          totalFreight: item.totalFreight || 0,
          lorryAllocatedAmount: 0,
          remainingLorryBalance: 0,
        };
      }

      const order = saudaMap[item.saudaNo] || {};
      const terms = parseInt(order.paymentTerms) || 0;
      const unloadingDate = new Date(item.unloadingDate);
      const dueDate = new Date(unloadingDate);
      dueDate.setDate(unloadingDate.getDate() + terms);

      const isDue = item.paymentStatus === "pending" && today >= dueDate;

      let grossAmount = 0;
      let cdAmount = 0;
      let gstAmount = 0;
      let netAmount = 0;
      let totalQualityClaims = 0;
      let bankCharges = 0;
      let qualityClaimsDetails = [];

      if (order) {
        const weight =
          item.unloadingWeight && item.unloadingWeight > 0
            ? item.unloadingWeight
            : item.loadingWeight || 0;
        const rate = order.rate || 0;
        const cdPercent = order.cd || 0;
        const gstPercent = order.gst || 0;
        bankCharges = Number(item.bankCharges) || 0;

        grossAmount = weight * rate;
        cdAmount = grossAmount * (cdPercent / 100);
        const taxableAmount = grossAmount - cdAmount - bankCharges;
        gstAmount = taxableAmount * (gstPercent / 100);
        netAmount = taxableAmount + gstAmount;

        if (item.qualityClaims && Array.isArray(item.qualityClaims)) {
          qualityClaimsDetails = item.qualityClaims.map((c) => ({
            parameterId: c.parameterId,
            parameterName: c.parameterName,
            standardValue: c.standardValue,
            actualValue: c.actualValue,
            claimAmount: Number(c.claimAmount) || 0,
            notes: c.notes || "",
          }));
          totalQualityClaims = qualityClaimsDetails.reduce(
            (sum, c) => sum + c.claimAmount,
            0
          );
        }

        if (item.manualClaim) {
          totalQualityClaims = Number(item.manualClaimAmount) || 0;
          qualityClaimsDetails = [
            {
              parameterId: "manual",
              parameterName: "Manual Claim",
              standardValue: null,
              actualValue: null,
              claimAmount: totalQualityClaims,
              notes: "Report not received - manual entry",
            },
          ];
        }
      }

      const paidAmount = Math.max(
        Number(item.paidAmount) || 0,
        excelAllocationMap[item._id.toString()] || 0,
      );
      const dueAmount = Math.max(
        0,
        grossAmount -
          totalQualityClaims -
          bankCharges -
          cdAmount +
          gstAmount -
          paidAmount,
      );

      return {
        ...item,
        qualityClaimsDetails,
        paymentTerms: terms,
        dueDate,
        isDue,
        rate: order.rate || 0,
        amount:
          (item.unloadingWeight && item.unloadingWeight > 0
            ? item.unloadingWeight
            : item.loadingWeight || 0) * (order.rate || 0),
        paidAmount,
        grossAmount,
        cdAmount,
        gstAmount,
        netAmount,
        totalQualityClaims,
        bankCharges,
        dueAmount,
        buyerCompany: item.buyerCompany || order.buyerCompany || "N/A",
        totalFreight: item.totalFreight || 0,
        lorryAllocatedAmount,
        remainingLorryBalance,
      };
    });

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      
      if (paymentStatus === "due") {
        processedItems = processedItems.filter(item => {
          if (!item.dueDate) return false;
          const dueDt = new Date(item.dueDate);
          let matchesStart = true;
          let matchesEnd = true;
          if (dateFilter.$gte) matchesStart = dueDt >= dateFilter.$gte;
          if (dateFilter.$lte) matchesEnd = dueDt <= dateFilter.$lte;
          return matchesStart && matchesEnd;
        });
      } else {
        processedItems = processedItems.filter(item => {
          if (!item.unloadingDate) return false;
          const unloadDate = new Date(item.unloadingDate);
          let matchesStart = true;
          let matchesEnd = true;
          if (dateFilter.$gte) matchesStart = unloadDate >= dateFilter.$gte;
          if (dateFilter.$lte) matchesEnd = unloadDate <= dateFilter.$lte;
          return matchesStart && matchesEnd;
        });
      }
    }

    if (paymentStatus === "due") {
      processedItems = processedItems.filter((item) => item.isDue);
    }

    processedItems.sort((a, b) => new Date(b.unloadingDate) - new Date(a.unloadingDate));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payments");

    worksheet.columns = [
      { header: "No", key: "slNo", width: 8 },
      { header: "Date", key: "unloadingDate", width: 12 },
      { header: "Sauda No", key: "saudaNo", width: 12 },
      { header: "Lorry No", key: "lorryNumber", width: 15 },
      { header: "Bill No", key: "billNumber", width: 12 },
      { header: "Buyer", key: "buyerCompany", width: 25 },
      { header: "Seller", key: "sellerCompany", width: 25 },
      { header: "Weight (T)", key: "weight", width: 12 },
      { header: "Rate", key: "rate", width: 10 },
      { header: "Gross Amt", key: "grossAmount", width: 15 },
      { header: "CD", key: "cdAmount", width: 12 },
      { header: "GST", key: "gstAmount", width: 12 },
      { header: "Claims", key: "totalQualityClaims", width: 12 },
      { header: "Claim Details", key: "claimDetails", width: 50 },
      { header: "Bank Chgs", key: "bankCharges", width: 12 },
      { header: "2nd Claim", key: "secondClaim", width: 12 },
      { header: "Other Chgs", key: "otherCharges", width: 12 },
      { header: "TDS", key: "tds", width: 12 },
      { header: "Credit", key: "paidAmount", width: 12 },
      { header: "Balance", key: "dueAmount", width: 15 },
      { header: "Lorry Balance", key: "remainingLorryBalance", width: 15 },
      { header: "Remarks", key: "generalRemarks", width: 30 },
    ];

    let claimDetailsText = "";
    for (let i = 0; i < processedItems.length; i++) {
      const item = processedItems[i];
      const weight =
        item.unloadingWeight && item.unloadingWeight > 0
          ? item.unloadingWeight
          : item.loadingWeight || 0;
      if (item.qualityClaimsDetails && item.qualityClaimsDetails.length > 0) {
        claimDetailsText = item.qualityClaimsDetails
          .map((c) => {
            const std =
              c.standardValue != null
                ? Number(c.standardValue).toFixed(2)
                : "-";
            const act =
              c.actualValue != null ? Number(c.actualValue).toFixed(2) : "-";
            return `${c.parameterName || "Claim"}(Std:${std}%/Act:${act}%:Rs${c.claimAmount.toFixed(2)})`;
          })
          .join(" | ");
      } else {
        claimDetailsText = "-";
      }
      const row = worksheet.addRow({
        slNo: i + 1,
        unloadingDate: item.unloadingDate
          ? new Date(item.unloadingDate).toLocaleDateString("en-GB")
          : "N/A",
        saudaNo: item.saudaNo || "N/A",
        lorryNumber: item.lorryNumber || "N/A",
        billNumber: item.billNumber || "-",
        buyerCompany: item.buyerCompany || "N/A",
        sellerCompany: item.supplierCompany || "N/A",
        weight: Number(weight).toFixed(3),
        rate: Number(item.rate || 0).toFixed(2),
        grossAmount: Number(item.grossAmount || 0).toFixed(2),
        cdAmount: Number(item.cdAmount || 0).toFixed(2),
        gstAmount: Number(item.gstAmount || 0).toFixed(2),
        totalQualityClaims: Number(item.totalQualityClaims || 0).toFixed(2),
        claimDetails: claimDetailsText,
        bankCharges: Number(item.bankCharges || 0).toFixed(2),
        secondClaim: Number(item.secondClaim || 0).toFixed(2),
        otherCharges: Number(item.otherCharges || 0).toFixed(2),
        tds: Number(item.tds || 0).toFixed(2),
        paidAmount: Number(item.paidAmount || 0).toFixed(2),
        dueAmount: Number(item.dueAmount || 0).toFixed(2),
        remainingLorryBalance: Number(item.remainingLorryBalance || 0).toFixed(2),
        generalRemarks: item.generalRemarks || "-"
      });
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A3A5F" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    headerRow.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    headerRow.height = 30;

    const dataEndRow = worksheet.rowCount;
    const totalsRow = worksheet.addRow({
      slNo: "",
      unloadingDate: "",
      saudaNo: "",
      lorryNumber: "",
      billNumber: "",
      buyerCompany: "",
      sellerCompany: "",
      weight: "",
      rate: "TOTALS ->",
      grossAmount: Number(processedItems.reduce((s, i) => s + (i.grossAmount || 0), 0)).toFixed(2),
      cdAmount: Number(processedItems.reduce((s, i) => s + (i.cdAmount || 0), 0)).toFixed(2),
      gstAmount: Number(processedItems.reduce((s, i) => s + (i.gstAmount || 0), 0)).toFixed(2),
      totalQualityClaims: Number(processedItems.reduce((s, i) => s + (i.totalQualityClaims || 0), 0)).toFixed(2),
      claimDetails: "",
      bankCharges: Number(processedItems.reduce((s, i) => s + (i.bankCharges || 0), 0)).toFixed(2),
      secondClaim: Number(processedItems.reduce((s, i) => s + (i.secondClaim || 0), 0)).toFixed(2),
      otherCharges: Number(processedItems.reduce((s, i) => s + (i.otherCharges || 0), 0)).toFixed(2),
      tds: Number(processedItems.reduce((s, i) => s + (i.tds || 0), 0)).toFixed(2),
      paidAmount: Number(processedItems.reduce((s, i) => s + (i.paidAmount || 0), 0)).toFixed(2),
      dueAmount: Number(processedItems.reduce((s, i) => s + (i.dueAmount || 0), 0)).toFixed(2),
      remainingLorryBalance: Number(processedItems.reduce((s, i) => s + (i.remainingLorryBalance || 0), 0)).toFixed(2),
      generalRemarks: ""
    });
    const tRow = worksheet.getRow(dataEndRow + 1);
    tRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    tRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" },
    };
    tRow.alignment = { vertical: "middle", horizontal: "right" };
    tRow.border = {
      top: { style: "double" },
      left: { style: "thin" },
      bottom: { style: "double" },
      right: { style: "thin" },
    };
    tRow.height = 24;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber <= dataEndRow) {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
          cell.alignment = { vertical: "middle", wrapText: true };
          if (colNumber >= 8) {
            cell.alignment.horizontal = "right";
          }
          if (colNumber <= 7) {
            cell.alignment.horizontal = "left";
          }
        });
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        }
      }
    });

    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=Payments.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
