import express from "express";
import LoadingEntry from "../models/LoadingEntry.js";
import SelfOrder from "../models/SelfOrder.js";
import Company from "../models/Company.js";
import SellerCompany from "../models/SellerCompany.js";
import ExcelJS from "exceljs";

const router = express.Router();

const escapeRegex = (string) => {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
};

const companyRegex = (name) =>
  new RegExp(`^${escapeRegex(String(name).trim())}$`, "i");

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
      // For Received List: include entries where paidAmount > 0 OR paymentStatus is "done"
      query.$or = [
        { paymentStatus: "done" },
        { paidAmount: { $gt: 0 } }
      ];
    } else if (paymentStatus === "due") {
      query.paymentStatus = "pending"; // Due is a subset of pending
    }

    const andParts = [query];

    if (buyerCompany) {
      andParts.push({ buyerCompany: companyRegex(buyerCompany) });
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

    // Get all loading entries first without date filtering to calculate due dates
    const tempQuery = andParts.length > 1 ? { $and: andParts } : andParts[0];
    const allItems = await LoadingEntry.find(tempQuery)
      .sort({ unloadingDate: -1, createdAt: -1 })
      .select("saudaNo lorryNumber buyerCompany supplierCompany consignee unloadingWeight unloadingDate paymentStatus paidAmount supplier billNumber generalRemarks qualityClaims bankCharges isRejected")
      .populate("supplier", "sellerName")
      .lean();

    // Get all sauda orders
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

    // Calculate due dates for all items
    let processedItems = allItems.map((item) => {
      if (item.isRejected) {
        return {
          ...item,
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
        };
      }

      const order = saudaMap[item.saudaNo] || {};
      const terms = parseInt(order.paymentTerms) || 0;
      const unloadingDate = new Date(item.unloadingDate);
      const dueDate = new Date(unloadingDate);
      dueDate.setDate(unloadingDate.getDate() + terms);

      const isDue = item.paymentStatus === "pending" && today >= dueDate;

      // Calculate detailed amounts for MIS format
      let grossAmount = 0;
      let cdAmount = 0;
      let gstAmount = 0;
      let netAmount = 0;
      let totalQualityClaims = 0;
      let bankCharges = 0;

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
          totalQualityClaims = item.qualityClaims.reduce((sum, claim) => sum + (Number(claim.claimAmount) || 0), 0);
        }
      }

      const dueAmount = Math.max(0, netAmount - (item.paidAmount || 0));

      return {
        ...item,
        paymentTerms: terms,
        dueDate,
        isDue,
        rate: order.rate || 0,
        amount:
          (item.unloadingWeight && item.unloadingWeight > 0
            ? item.unloadingWeight
            : item.loadingWeight || 0) * (order.rate || 0),
        grossAmount,
        cdAmount,
        gstAmount,
        netAmount,
        totalQualityClaims,
        bankCharges,
        dueAmount,
        buyerCompany: item.buyerCompany || order.buyerCompany || "N/A",
      };
    });

    // Apply date filtering based on payment status
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
          const dueDate = new Date(item.dueDate);
          let matchesStart = true;
          let matchesEnd = true;
          if (dateFilter.$gte) matchesStart = dueDate >= dateFilter.$gte;
          if (dateFilter.$lte) matchesEnd = dueDate <= dateFilter.$lte;
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

    // If "due" filter is applied, filter only due items
    if (paymentStatus === "due") {
      processedItems = processedItems.filter((item) => item.isDue);
    }

    // Calculate totals
    let totalGross = 0;
    let totalCd = 0;
    let totalGst = 0;
    let totalClaims = 0;
    let totalBankCharges = 0;
    let totalCredit = 0;
    let totalDue = 0;

    processedItems.forEach(item => {
      totalGross += item.grossAmount || 0;
      totalCd += item.cdAmount || 0;
      totalGst += item.gstAmount || 0;
      totalClaims += item.totalQualityClaims || 0;
      totalBankCharges += item.bankCharges || 0;
      totalCredit += item.paidAmount || 0;
      totalDue += item.dueAmount || 0;
    });

    // Apply pagination
    const totalItems = processedItems.length;
    const paginatedItems = processedItems.slice((page - 1) * limit, page * limit);

    // Add Sl No after filtering
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
        totalDue
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
      // For Received List: include entries where paidAmount > 0 OR paymentStatus is "done"
      query.$or = [
        { paymentStatus: "done" },
        { paidAmount: { $gt: 0 } }
      ];
    } else if (paymentStatus === "due") {
      query.paymentStatus = "pending"; // Due is a subset of pending
    }

    const andParts = [query];

    if (buyerCompany) {
      andParts.push({ buyerCompany: companyRegex(buyerCompany) });
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

    // Get all loading entries first without date filtering to calculate due dates
    const tempQuery = andParts.length > 1 ? { $and: andParts } : andParts[0];
    let items = await LoadingEntry.find(tempQuery)
      .sort({ unloadingDate: -1, createdAt: -1 })
      .select("saudaNo lorryNumber buyerCompany supplierCompany consignee unloadingWeight unloadingDate paymentStatus paidAmount supplier billNumber generalRemarks qualityClaims bankCharges isRejected")
      .populate("supplier", "sellerName")
      .lean();

    // Get all sauda orders
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

    // Calculate due dates for all items
    let processedItems = items.map((item) => {
      if (item.isRejected) {
        return {
          ...item,
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
        };
      }

      const order = saudaMap[item.saudaNo] || {};
      const terms = parseInt(order.paymentTerms) || 0;
      const unloadingDate = new Date(item.unloadingDate);
      const dueDate = new Date(unloadingDate);
      dueDate.setDate(unloadingDate.getDate() + terms);

      const isDue = item.paymentStatus === "pending" && today >= dueDate;

      // Calculate detailed amounts for MIS format
      let grossAmount = 0;
      let cdAmount = 0;
      let gstAmount = 0;
      let netAmount = 0;
      let totalQualityClaims = 0;
      let bankCharges = 0;

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
          totalQualityClaims = item.qualityClaims.reduce((sum, claim) => sum + (Number(claim.claimAmount) || 0), 0);
        }
      }

      const dueAmount = Math.max(0, netAmount - (item.paidAmount || 0));

      return {
        ...item,
        paymentTerms: terms,
        dueDate,
        isDue,
        rate: order.rate || 0,
        amount:
          (item.unloadingWeight && item.unloadingWeight > 0
            ? item.unloadingWeight
            : item.loadingWeight || 0) * (order.rate || 0),
        grossAmount,
        cdAmount,
        gstAmount,
        netAmount,
        totalQualityClaims,
        bankCharges,
        dueAmount,
        buyerCompany: item.buyerCompany || order.buyerCompany || "N/A",
      };
    });

    // Apply date filtering based on payment status
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
          const dueDate = new Date(item.dueDate);
          let matchesStart = true;
          let matchesEnd = true;
          if (dateFilter.$gte) matchesStart = dueDate >= dateFilter.$gte;
          if (dateFilter.$lte) matchesEnd = dueDate <= dateFilter.$lte;
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

    // If "due" filter is applied, filter only due items
    if (paymentStatus === "due") {
      processedItems = processedItems.filter((item) => item.isDue);
    }

    // Sort items
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
      { header: "Gross Amt", key: "grossAmount", width: 15 },
      { header: "GST", key: "gstAmount", width: 12 },
      { header: "Credit", key: "paidAmount", width: 12 },
      { header: "Claims", key: "totalQualityClaims", width: 12 },
      { header: "CD", key: "cdAmount", width: 12 },
      { header: "Bank Chgs", key: "bankCharges", width: 12 },
      { header: "Balance", key: "dueAmount", width: 15 },
      { header: "Remarks", key: "generalRemarks", width: 30 },
    ];

    for (let i = 0; i < processedItems.length; i++) {
      const item = processedItems[i];
      worksheet.addRow({
        slNo: i + 1,
        unloadingDate: item.unloadingDate
          ? new Date(item.unloadingDate).toLocaleDateString("en-GB")
          : "N/A",
        saudaNo: item.saudaNo || "N/A",
        lorryNumber: item.lorryNumber || "N/A",
        billNumber: item.billNumber || "-",
        buyerCompany: item.buyerCompany || "N/A",
        sellerCompany: item.supplierCompany || "N/A",
        grossAmount: Number(item.grossAmount || 0).toFixed(2),
        gstAmount: Number(item.gstAmount || 0).toFixed(2),
        paidAmount: Number(item.paidAmount || 0).toFixed(2),
        totalQualityClaims: Number(item.totalQualityClaims || 0).toFixed(2),
        cdAmount: Number(item.cdAmount || 0).toFixed(2),
        bankCharges: Number(item.bankCharges || 0).toFixed(2),
        dueAmount: Number(item.dueAmount || 0).toFixed(2),
        generalRemarks: item.generalRemarks || "-"
      });
    }

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

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
