import express from "express";
import LoadingEntry from "../models/LoadingEntry.js";
import SelfOrder from "../models/SelfOrder.js";
import ExcelJS from "exceljs";

const router = express.Router();

const escapeRegex = (string) => {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
};

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = (req.query.search || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const paymentStatus = req.query.paymentStatus;

    let query = {
      unloadingWeight: { $gt: 0 },
    };

    if (paymentStatus && paymentStatus !== "all" && paymentStatus !== "due") {
      query.paymentStatus = paymentStatus;
    } else if (paymentStatus === "due") {
      query.paymentStatus = "pending"; // Due is a subset of pending
    }

    const andParts = [query];

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

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      andParts.push({ unloadingDate: dateFilter });
    }

    const finalQuery = andParts.length > 1 ? { $and: andParts } : andParts[0];

    const [items, total] = await Promise.all([
      LoadingEntry.find(finalQuery)
        .sort({ unloadingDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("supplier", "sellerName")
        .lean(),
      LoadingEntry.countDocuments(finalQuery),
    ]);

    const saudaNos = [...new Set(items.map((i) => i.saudaNo).filter(Boolean))];
    const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } })
      .select("saudaNo buyerCompany paymentTerms rate")
      .lean();

    const saudaMap = selfOrders.reduce((acc, so) => {
      acc[so.saudaNo] = so;
      return acc;
    }, {});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let processedItems = items.map((item) => {
      const order = saudaMap[item.saudaNo] || {};
      const terms = parseInt(order.paymentTerms) || 0;
      const unloadingDate = new Date(item.unloadingDate);
      const dueDate = new Date(unloadingDate);
      dueDate.setDate(unloadingDate.getDate() + terms);

      const isDue = item.paymentStatus === "pending" && today >= dueDate;

      return {
        ...item,
        paymentTerms: terms,
        dueDate,
        isDue,
        rate: order.rate || 0,
        amount: (item.unloadingWeight || 0) * (order.rate || 0),
        buyerCompany: item.buyerCompany || order.buyerCompany || "N/A",
      };
    });

    // If "due" filter is applied, filter only due items
    if (paymentStatus === "due") {
      processedItems = processedItems.filter((item) => item.isDue);
    }

    // Add Sl No after filtering
    const finalItems = processedItems.map((item, index) => ({
      ...item,
      slNo: (page - 1) * limit + index + 1,
    }));

    res.json({
      data: finalItems,
      total: paymentStatus === "due" ? processedItems.length : total,
      page,
      totalPages: Math.ceil(
        (paymentStatus === "due" ? processedItems.length : total) / limit,
      ),
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

    let query = { unloadingWeight: { $gt: 0 } };
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }

    const andParts = [query];
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      andParts.push({
        $or: [
          { saudaNo: { $regex: searchRegex } },
          { buyerCompany: { $regex: searchRegex } },
          { supplierCompany: { $regex: searchRegex } },
          { consignee: { $regex: searchRegex } },
        ],
      });
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      andParts.push({ unloadingDate: dateFilter });
    }

    const finalQuery = andParts.length > 1 ? { $and: andParts } : andParts[0];

    const items = await LoadingEntry.find(finalQuery)
      .sort({ unloadingDate: 1, createdAt: 1 })
      .populate("supplier", "sellerName")
      .lean();

    const saudaNos = [...new Set(items.map((i) => i.saudaNo).filter(Boolean))];
    const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } })
      .select("saudaNo buyerCompany paymentTerms rate")
      .lean();

    const saudaMap = selfOrders.reduce((acc, so) => {
      acc[so.saudaNo] = so;
      return acc;
    }, {});

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payments");

    worksheet.columns = [
      { header: "Sl No", key: "slNo", width: 10 },
      { header: "Sauda No", key: "saudaNo", width: 15 },
      { header: "Lorry No", key: "lorryNumber", width: 15 },
      { header: "Buyer Company", key: "buyerCompany", width: 30 },
      { header: "Consignee", key: "consignee", width: 30 },
      { header: "Seller Name", key: "sellerName", width: 30 },
      { header: "Seller Company", key: "sellerCompany", width: 30 },
      { header: "Payment Terms", key: "paymentTerms", width: 30 },
      { header: "Unloading Date", key: "unloadingDate", width: 15 },
      { header: "Unloading Qty (Tons)", key: "unloadingWeight", width: 20 },
      { header: "Amount (Rs)", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const order = saudaMap[item.saudaNo] || {};
      const amount = (item.unloadingWeight || 0) * (order.rate || 0);

      worksheet.addRow({
        slNo: i + 1,
        saudaNo: item.saudaNo || "N/A",
        lorryNumber: item.lorryNumber || "N/A",
        buyerCompany: item.buyerCompany || order.buyerCompany || "N/A",
        consignee: item.consignee || "N/A",
        sellerName: item.supplier?.sellerName || "N/A",
        sellerCompany: item.supplierCompany || "N/A",
        paymentTerms: order.paymentTerms || "N/A",
        unloadingDate: item.unloadingDate
          ? new Date(item.unloadingDate).toLocaleDateString("en-GB")
          : "N/A",
        unloadingWeight: (item.unloadingWeight || 0).toFixed(2),
        amount: amount.toFixed(2),
        status: (item.paymentStatus || "pending").toUpperCase(),
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
