import { Router } from "express";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import LoadingEntry from "../models/LoadingEntry.js";
import Buyer from "../models/Buyer.js";
import Group from "../models/Group.js";
import Seller from "../models/Seller.js";
import SelfOrder from "../models/SelfOrder.js";

const router = Router();

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const computePendingForSelfOrder = (order) => {
  const quantity = Number(order.quantity || 0);
  let pendingQuantity = order.pendingQuantity;

  if (
    (pendingQuantity === undefined ||
      pendingQuantity === null ||
      (pendingQuantity === 0 && order.status === "active")) &&
    order.status !== "closed"
  ) {
    pendingQuantity = quantity;
  } else {
    pendingQuantity = Number(pendingQuantity || 0);
  }

  const isClosed = false;

  return { pendingQuantity, isClosed };
};

router.get("/filters", async (req, res) => {
  try {
    const role = req.user?.role;
    const mobile = req.user?.mobile;

    if (role !== "Admin" && role !== "Employee" && role !== "Seller") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [groups, sellers] = await Promise.all([
      Group.find().select("_id groupName").sort({ groupName: 1 }).lean(),
      role === "Seller" && mobile
        ? Seller.find({ "phoneNumbers.value": String(mobile) })
            .select("_id sellerName companies phoneNumbers status")
            .lean()
        : Seller.find()
            .select("_id sellerName companies phoneNumbers status")
            .lean(),
    ]);

    res.json({
      groups: (groups || []).map((g) => ({
        _id: g._id,
        groupName: g.groupName || "",
      })),
      sellers: (sellers || [])
        .filter(
          (s) => String(s.status || "active").toLowerCase() !== "inactive",
        )
        .map((s) => ({
          _id: s._id,
          sellerName: s.sellerName || "",
          companies: Array.isArray(s.companies) ? s.companies : [],
        }))
        .sort((a, b) => a.sellerName.localeCompare(b.sellerName)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/buyers", async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== "Admin" && role !== "Employee") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const groupIdRaw = req.query.groupId;
    if (!groupIdRaw) {
      return res.status(400).json({ message: "groupId is required" });
    }

    const groupIds = groupIdRaw.split(",").map(toObjectId).filter(Boolean);

    const buyers = await Buyer.find({ groupId: { $in: groupIds } })
      .select("_id name companyIds consigneeIds")
      .populate({
        path: "companyIds",
        select: "companyName",
      })
      .populate({
        path: "consigneeIds",
        select: "name location district state",
      })
      .sort({ name: 1, _id: 1 })
      .lean();

    const buyersWithCompanies = await Promise.all(
      (buyers || []).map(async (b) => {
        const populatedCompanyNames = (b.companyIds || [])
          .map((c) => c?.companyName || "")
          .filter(Boolean);

        let companyNames = populatedCompanyNames;

        if (companyNames.length === 0 && b.name) {
          const fallbackCompanyNames = await SelfOrder.distinct("buyerCompany", {
            buyer: b.name,
            buyerCompany: { $exists: true, $ne: "" },
          });
          companyNames = (fallbackCompanyNames || []).filter(Boolean);
        }

        return {
          _id: b._id,
          name: b.name || "",
          companyNames,
          consignees: (b.consigneeIds || []).map((c) => ({
            _id: c._id,
            name: c.name || "",
            label: `${c.name || "N/A"} - ${c.location || "N/A"}, ${c.district || "N/A"}, ${c.state || "N/A"}`,
          })),
        };
      }),
    );

    res.json(buyersWithCompanies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/saudas", async (req, res) => {
  try {
    const role = req.user?.role;
    const mobile = req.user?.mobile;

    if (role !== "Admin" && role !== "Employee" && role !== "Seller") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const buyerId = toObjectId(req.query.buyerId);
    const groupIdRaw = req.query.groupId;
    const buyerCompany = String(req.query.buyerCompany || "").trim();
    const consigneeName = String(req.query.consigneeName || "").trim();
    const sellerIdFromQuery = toObjectId(req.query.sellerId);
    const sellerCompany = String(req.query.sellerCompany || "").trim();
    const saudaNo = String(req.query.saudaNo || "").trim();

    let sellerId = sellerIdFromQuery;
    if (!sellerId && role === "Seller") {
      sellerId = toObjectId(req.user?.sub);
    }

    const andParts = [];

    if (buyerId) {
      const buyer = await Buyer.findById(buyerId)
        .select("_id name companyIds groupId")
        .populate({ path: "companyIds", select: "companyName" })
        .lean();

      if (!buyer) return res.status(404).json({ message: "Buyer not found" });

      const companyIds = (buyer.companyIds || [])
        .map((c) => c?._id || c)
        .filter(Boolean);
      const companyNames = (buyer.companyIds || [])
        .map((c) => c?.companyName || "")
        .filter(Boolean);

      const buyerOr = [];
      if (companyIds.length) buyerOr.push({ companyId: { $in: companyIds } });
      if (companyNames.length)
        buyerOr.push({ buyerCompany: { $in: companyNames } });
      if (buyer.name) buyerOr.push({ buyer: buyer.name });

      if (buyerOr.length) andParts.push({ $or: buyerOr });
    } else if (groupIdRaw) {
      const groupIds = groupIdRaw.split(",").map(toObjectId).filter(Boolean);
      const buyers = await Buyer.find({ groupId: { $in: groupIds } })
        .select("_id companyIds name")
        .populate({ path: "companyIds", select: "companyName" })
        .lean();

      if (buyers.length) {
        const allCompanyIds = [];
        const allCompanyNames = [];
        const allBuyerNames = [];

        buyers.forEach((b) => {
          if (b.name) allBuyerNames.push(b.name);
          (b.companyIds || []).forEach((c) => {
            if (c?._id) allCompanyIds.push(c._id);
            if (c?.companyName) allCompanyNames.push(c.companyName);
          });
        });

        const groupOr = [];
        if (allCompanyIds.length)
          groupOr.push({ companyId: { $in: allCompanyIds } });
        if (allCompanyNames.length)
          groupOr.push({ buyerCompany: { $in: allCompanyNames } });
        if (allBuyerNames.length)
          groupOr.push({ buyer: { $in: allBuyerNames } });

        if (groupOr.length) andParts.push({ $or: groupOr });
        else andParts.push({ _id: null });
      } else {
        andParts.push({ _id: null });
      }
    }

    if (buyerCompany) {
      andParts.push({
        buyerCompany: { $regex: new RegExp(`^${buyerCompany}$`, "i") },
      });
    }

    if (consigneeName) {
      andParts.push({ consignee: consigneeName });
    }

    if (sellerId) {
      andParts.push({ supplier: sellerId });
    } else if (role === "Seller" && mobile) {
      andParts.push({ sellerMobile: String(mobile) });
    }

    if (sellerCompany) {
      andParts.push({ supplierCompany: sellerCompany });
    }

    if (saudaNo) {
      andParts.push({ saudaNo: { $regex: new RegExp(saudaNo, "i") } });
    }

    const query = andParts.length ? { $and: andParts } : {};

    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 1000);
    const items = await SelfOrder.find(query)
      .sort({ poDate: -1, createdAt: -1 })
      .limit(limit)
      .populate("supplier", "sellerName")
      .lean();

    const processed = (items || []).map((o) => {
      const computed = computePendingForSelfOrder(o);
      return { ...o, ...computed };
    });

    processed.sort((a, b) => {
      if (Boolean(a.isClosed) !== Boolean(b.isClosed))
        return a.isClosed ? 1 : -1;
      const aTime = new Date(a.poDate || a.createdAt || 0).getTime();
      const bTime = new Date(b.poDate || b.createdAt || 0).getTime();
      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });

    res.json({ data: processed, total: processed.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = (req.query.search || "").trim();
    const saudaNo = (req.query.saudaNo || "").trim();
    const lorryNumber = (req.query.lorryNumber || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const role = req.query.role;
    const mobile = req.query.mobile;

    let query = {};

    if (role === "Seller" && mobile) {
      const seller = await Seller.findOne({
        "phoneNumbers.value": String(mobile),
      }).lean();
      if (seller) {
        query.supplier = seller._id;
      } else {
        return res.json({ data: [], total: 0, page, totalPages: 0 });
      }
    }

    const andParts = [];
    if (Object.keys(query).length > 0) {
      andParts.push(query);
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      andParts.push({
        $or: [
          { supplierCompany: { $regex: searchRegex } },
          { consignee: { $regex: searchRegex } },
          { saudaNo: { $regex: searchRegex } },
          { lorryNumber: { $regex: searchRegex } },
          { billNumber: { $regex: searchRegex } },
          { commodity: { $regex: searchRegex } },
        ],
      });
    }

    if (saudaNo) {
      andParts.push({ saudaNo: { $regex: new RegExp(saudaNo, "i") } });
    }

    if (lorryNumber) {
      andParts.push({ lorryNumber: { $regex: new RegExp(lorryNumber, "i") } });
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      andParts.push({ loadingDate: dateFilter });
    }

    const finalQuery = andParts.length > 1 ? { $and: andParts } : andParts[0] || {};

    const items = await LoadingEntry.find(finalQuery)
      .sort({ loadingDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("supplier", "sellerName")
      .lean();

    const total = await LoadingEntry.countDocuments(finalQuery);

    res.json({
      data: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/suggestions", async (req, res) => {
  try {
    const role = req.query.role;
    const mobile = req.query.mobile;
    let query = {};

    if (role === "Seller" && mobile) {
      const seller = await Seller.findOne({
        "phoneNumbers.value": String(mobile),
      }).lean();
      if (seller) {
        query.supplier = seller._id;
      } else {
        return res.json({ sellers: [], saudas: [], lorries: [] });
      }
    }

    const [sellers, buyers, saudas, lorries] = await Promise.all([
      LoadingEntry.distinct("supplierCompany", query),
      LoadingEntry.distinct("consignee", query),
      LoadingEntry.distinct("saudaNo", query),
      LoadingEntry.distinct("lorryNumber", query),
    ]);

    res.json({
      sellers: [...new Set([...sellers, ...buyers])].filter(Boolean),
      saudas: saudas.filter(Boolean),
      lorries: lorries.filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/export/excel", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const saudaNo = (req.query.saudaNo || "").trim();
    const lorryNumber = (req.query.lorryNumber || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const role = req.query.role;
    const mobile = req.query.mobile;

    let query = {};

    if (role === "Seller" && mobile) {
      const seller = await Seller.findOne({
        "phoneNumbers.value": String(mobile),
      }).lean();
      if (seller) {
        query.supplier = seller._id;
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const andParts = [];
    if (Object.keys(query).length > 0) {
      andParts.push(query);
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      andParts.push({
        $or: [
          { supplierCompany: { $regex: searchRegex } },
          { consignee: { $regex: searchRegex } },
          { saudaNo: { $regex: searchRegex } },
          { lorryNumber: { $regex: searchRegex } },
          { billNumber: { $regex: searchRegex } },
          { commodity: { $regex: searchRegex } },
        ],
      });
    }

    if (saudaNo) {
      andParts.push({ saudaNo: { $regex: new RegExp(saudaNo, "i") } });
    }

    if (lorryNumber) {
      andParts.push({ lorryNumber: { $regex: new RegExp(lorryNumber, "i") } });
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      andParts.push({ loadingDate: dateFilter });
    }

    const finalQuery = andParts.length > 1 ? { $and: andParts } : andParts[0] || {};

    const items = await LoadingEntry.find(finalQuery)
      .sort({ loadingDate: -1, createdAt: -1 })
      .populate("supplier", "sellerName")
      .lean();

    // Fetch buyerCompany from SelfOrder for items that don't have it (backwards compatibility)
    const saudaNos = [...new Set(items.map(i => i.saudaNo).filter(Boolean))];
    const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } }).select("saudaNo buyerCompany").lean();
    const saudaToBuyerCompany = selfOrders.reduce((acc, so) => {
      acc[so.saudaNo] = so.buyerCompany;
      return acc;
    }, {});

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Loading Entries");

    worksheet.columns = [
      { header: "Date", key: "loadingDate", width: 15 },
      { header: "Sauda No", key: "saudaNo", width: 15 },
      { header: "Supplier", key: "supplierName", width: 30 },
      { header: "Supplier Company", key: "supplierCompany", width: 30 },
      { header: "Buyer Company", key: "buyerCompany", width: 30 },
      { header: "Consignee", key: "consignee", width: 30 },
      { header: "Commodity", key: "commodity", width: 20 },
      { header: "Lorry Number", key: "lorryNumber", width: 20 },
      { header: "Loading Weight", key: "loadingWeight", width: 15 },
      { header: "Unloading Weight", key: "unloadingWeight", width: 15 },
      { header: "Bags", key: "bags", width: 10 },
      { header: "Driver Name", key: "driverName", width: 20 },
      { header: "Driver Phone", key: "driverPhoneNumber", width: 15 },
      { header: "Bill Number", key: "billNumber", width: 20 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        loadingDate: item.loadingDate
          ? new Date(item.loadingDate).toLocaleDateString("en-GB")
          : "N/A",
        saudaNo: item.saudaNo || "N/A",
        supplierName: item.supplier?.sellerName || "Unknown Supplier",
        supplierCompany: item.supplierCompany || "N/A",
        buyerCompany: item.buyerCompany || saudaToBuyerCompany[item.saudaNo] || "N/A",
        consignee: item.consignee || "N/A",
        commodity: item.commodity || "N/A",
        lorryNumber: item.lorryNumber || "N/A",
        loadingWeight: item.loadingWeight || 0,
        unloadingWeight: item.unloadingWeight || 0,
        bags: item.bags || 0,
        driverName: item.driverName || "N/A",
        driverPhoneNumber: item.driverPhoneNumber || "N/A",
        billNumber: item.billNumber || "N/A",
      });
    });

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
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=LoadingEntries.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Excel Error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/sauda/:saudaNo", async (req, res) => {
  try {
    const items = await LoadingEntry.find({ saudaNo: req.params.saudaNo })
      .sort({ loadingDate: -1 })
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { entries, saudaNo } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "No entries provided" });
    }

    const selfOrder = await SelfOrder.findOne({ saudaNo });
    
    // Process entries with brokerage calculation if selfOrder exists
    const processedEntries = entries.map(entry => {
      const newEntry = { ...entry };
      if (selfOrder && entry.unloadingWeight) {
        const uWeight = parseFloat(entry.unloadingWeight) || 0;
        const buyerRate = selfOrder.buyerBrokerage?.brokerageBuyer || 0;
        const sellerRate = selfOrder.buyerBrokerage?.brokerageSupplier || 0;
        
        newEntry.buyerBrokerage = +(uWeight * buyerRate).toFixed(2);
        newEntry.sellerBrokerage = +(uWeight * sellerRate).toFixed(2);
      }
      return newEntry;
    });

    const savedEntries = await LoadingEntry.insertMany(processedEntries);

    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo });
      const totalLoaded = allEntries.reduce(
        (sum, e) => sum + (e.loadingWeight || 0),
        0,
      );
      selfOrder.pendingQuantity = Math.max(
        0,
        (selfOrder.quantity || 0) - totalLoaded,
      );

      const tolerance = (selfOrder.quantity || 0) * 0.05;
      if (Math.abs(selfOrder.pendingQuantity) <= tolerance) {
        selfOrder.status = "closed";
      } else {
        selfOrder.status = "active";
      }

      await selfOrder.save();
    }

    res.status(201).json({
      message: "Bulk entries saved successfully",
      count: savedEntries.length,
    });
  } catch (error) {
    console.error("Bulk save error:", error);
    res.status(400).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const entry = await LoadingEntry.create(req.body);

    const selfOrder = await SelfOrder.findOne({ saudaNo: entry.saudaNo });
    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo: entry.saudaNo });
      const totalLoaded = allEntries.reduce(
        (sum, e) => sum + (e.loadingWeight || 0),
        0,
      );
      selfOrder.pendingQuantity = Math.max(
        0,
        (selfOrder.quantity || 0) - totalLoaded,
      );

      const tolerance = (selfOrder.quantity || 0) * 0.05;
      if (Math.abs(selfOrder.pendingQuantity) <= tolerance) {
        selfOrder.status = "closed";
      } else {
        selfOrder.status = "active";
      }

      await selfOrder.save();
    }

    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const oldEntry = await LoadingEntry.findById(req.params.id);
    if (!oldEntry) return res.status(404).json({ message: "Entry not found" });

    const updatedEntry = await LoadingEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    if (
      oldEntry.loadingWeight !== updatedEntry.loadingWeight ||
      oldEntry.saudaNo !== updatedEntry.saudaNo
    ) {
      const selfOrder = await SelfOrder.findOne({
        saudaNo: updatedEntry.saudaNo,
      });
      if (selfOrder) {
        const allEntries = await LoadingEntry.find({
          saudaNo: updatedEntry.saudaNo,
        });
        const totalLoaded = allEntries.reduce(
          (sum, e) => sum + (e.loadingWeight || 0),
          0,
        );
        selfOrder.pendingQuantity = Math.max(
          0,
          (selfOrder.quantity || 0) - totalLoaded,
        );

        const tolerance = (selfOrder.quantity || 0) * 0.05;
        if (Math.abs(selfOrder.pendingQuantity) <= tolerance) {
          selfOrder.status = "closed";
        } else {
          selfOrder.status = "active";
        }

        await selfOrder.save();
      }
    }

    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const entry = await LoadingEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    const saudaNo = entry.saudaNo;
    await LoadingEntry.findByIdAndDelete(req.params.id);

    const selfOrder = await SelfOrder.findOne({ saudaNo });
    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo });
      const totalLoaded = allEntries.reduce(
        (sum, e) => sum + (e.loadingWeight || 0),
        0,
      );
      selfOrder.pendingQuantity = Math.max(
        0,
        (selfOrder.quantity || 0) - totalLoaded,
      );

      const tolerance = (selfOrder.quantity || 0) * 0.05;
      if (Math.abs(selfOrder.pendingQuantity) <= tolerance) {
        selfOrder.status = "closed";
      } else {
        selfOrder.status = "active";
      }

      await selfOrder.save();
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
