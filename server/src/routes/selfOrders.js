import { Router } from "express";
import nodemailer from "nodemailer";
import ExcelJS from "exceljs";
import SelfOrder from "../models/SelfOrder.js";
import Seller from "../models/Seller.js";
import Consignee from "../models/Consignee.js";

const router = Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/send-email", async (req, res) => {
  try {
    const { email, pdfBase64, saudaNo, poNumber } = req.body;

    if (!email || !pdfBase64) {
      return res.status(400).json({ message: "Email and PDF are required" });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Purchase Order - Sauda No: ${saudaNo || "N/A"}`,
      text: `Please find attached the Purchase Order for Sauda No: ${saudaNo || "N/A"}, PO Number: ${poNumber || "N/A"}.`,
      attachments: [
        {
          filename: `HANS-2025-${saudaNo || "Order"}.pdf`,
          content: pdfBase64,
          encoding: "base64",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);
    const search = (req.query.search || "").trim();
    const sellerMobile = req.query.sellerMobile;
    const supplier = req.query.supplier;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const exportAll = String(req.query.export || "").toLowerCase() === "true";

    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { saudaNo: { $regex: searchRegex } },
        { poNumber: { $regex: searchRegex } },
        { buyer: { $regex: searchRegex } },
        { buyerCompany: { $regex: searchRegex } },
        { supplierCompany: { $regex: searchRegex } },
        { commodity: { $regex: searchRegex } },
      ];
    }

    if (sellerMobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(sellerMobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : sellerMobile;

      const mobileQuery = {
        $or: [
          { sellerMobile: normalizedMobile },
          { sellerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
        ],
      };

      if (query.$or) {
        query.$and = query.$and || [];
        query.$and.push({ $or: query.$or });
        query.$and.push(mobileQuery);
        delete query.$or;
      } else {
        Object.assign(query, mobileQuery);
      }
    }

    if (supplier) {
      query.supplier = supplier;
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }

      const dateQuery = {
        $or: [{ poDate: dateFilter }, { createdAt: dateFilter }],
      };

      if (query.$or || query.$and) {
        query.$and = query.$and || [];
        if (query.$or) {
          query.$and.push({ $or: query.$or });
          delete query.$or;
        }
        query.$and.push(dateQuery);
      } else {
        Object.assign(query, dateQuery);
      }
    }

    if (exportAll) {
      const items = await SelfOrder.find(query)
        .sort({ poDate: -1, createdAt: -1 })
        .populate("supplier", "sellerName")
        .lean();
      return res.json(items);
    }

    if (page > 0 && limit > 0) {
      const items = await SelfOrder.find(query)
        .sort({ poDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("supplier", "sellerName")
        .lean();
      const total = await SelfOrder.countDocuments(query);
      return res.json({ data: items, total });
    }

    const items = await SelfOrder.find(query)
      .sort({ poDate: -1, createdAt: -1 })
      .limit(100)
      .populate("supplier", "sellerName")
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/pending/list", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = (req.query.search || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = {
      status: "active",
      $or: [
        { pendingQuantity: { $gt: 0 } },
        { pendingQuantity: { $exists: false } },
        { pendingQuantity: 0 },
      ],
    };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$and = [
        {
          $or: [
            { supplierCompany: { $regex: searchRegex } },
            { saudaNo: { $regex: searchRegex } },
            { buyerCompany: { $regex: searchRegex } },
            { commodity: { $regex: searchRegex } },
          ],
        },
      ];
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }

      const dateQuery = {
        $or: [{ poDate: dateFilter }, { createdAt: dateFilter }],
      };

      if (query.$or || query.$and) {
        query.$and = query.$and || [];
        if (query.$or) {
          query.$and.push({ $or: query.$or });
          delete query.$or;
        }
        query.$and.push(dateQuery);
      } else {
        Object.assign(query, dateQuery);
      }
    }

    const items = await SelfOrder.find(query)
      .sort({ poDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("supplier", "sellerName")
      .lean();

    const total = await SelfOrder.countDocuments(query);

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

router.get("/:id", async (req, res) => {
  try {
    const item = await SelfOrder.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Order not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const item = await SelfOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!item) return res.status(404).json({ message: "Order not found" });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (
      data.pendingQuantity === undefined ||
      data.pendingQuantity === null ||
      data.pendingQuantity === ""
    ) {
      data.pendingQuantity = data.quantity || 0;
    }
    if (!data.status) {
      data.status = "active";
    }
    const item = await SelfOrder.create(data);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id/whatsapp-sent", async (req, res) => {
  try {
    const item = await SelfOrder.findByIdAndUpdate(
      req.params.id,
      { whatsappSent: true },
      { new: true },
    );
    if (!item) return res.status(404).json({ message: "Order not found" });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/export/excel", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const sellerMobile = req.query.sellerMobile;
    const supplier = req.query.supplier;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const userRole = req.query.userRole;
    const mobile = req.query.mobile;

    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { saudaNo: { $regex: searchRegex } },
        { poNumber: { $regex: searchRegex } },
        { buyer: { $regex: searchRegex } },
        { buyerCompany: { $regex: searchRegex } },
        { supplierCompany: { $regex: searchRegex } },
        { commodity: { $regex: searchRegex } },
      ];
    }

    if (sellerMobile) {
      const normalizedMobile = String(sellerMobile)
        .replace(/\D/g, "")
        .slice(-10);
      const mobileQuery = {
        $or: [
          { sellerMobile: normalizedMobile },
          { sellerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
        ],
      };
      if (query.$or) {
        query.$and = query.$and || [];
        query.$and.push({ $or: query.$or });
        query.$and.push(mobileQuery);
        delete query.$or;
      } else {
        Object.assign(query, mobileQuery);
      }
    }

    if (supplier) query.supplier = supplier;

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      const dateQuery = {
        $or: [{ poDate: dateFilter }, { createdAt: dateFilter }],
      };
      if (query.$or || query.$and) {
        query.$and = query.$and || [];
        if (query.$or) {
          query.$and.push({ $or: query.$or });
          delete query.$or;
        }
        query.$and.push(dateQuery);
      } else {
        Object.assign(query, dateQuery);
      }
    }

    let items = await SelfOrder.find(query)
      .sort({ poDate: -1, createdAt: -1 })
      .populate("supplier", "sellerName")
      .lean();

    // Additional filtering for Buyer/Seller roles if needed (mirroring frontend logic)
    if (userRole === "Buyer" && mobile) {
      // Note: In a real scenario, you'd fetch the buyer's company IDs here
      // For now, we assume the query might need more server-side role logic if not handled by client
    } else if (userRole === "Seller" && mobile) {
      const normalizedMobile = String(mobile).replace(/\D/g, "").slice(-10);
      items = items.filter(
        (item) =>
          String(item.sellerMobile).includes(normalizedMobile) ||
          (item.supplier &&
            String(item.supplier._id).includes(normalizedMobile)),
      );
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Self Orders");

    const consignees = await Consignee.find({}).lean();
    const consigneeMap = new Map();
    consignees.forEach((c) => {
      if (c?._id) consigneeMap.set(String(c._id), c.name || c.label || "-");
    });

    const getConsigneeDisplay = (item) => {
      const c = item.consignee;
      if (typeof c === "object" && c?.name) return c.name;
      if (typeof c === "object" && c?.label) return c.label;
      if (c && typeof c === "string")
        return consigneeMap.get(c) || consigneeMap.get(c.trim()) || c;
      return consigneeMap.get(String(c)) || "N/A";
    };

    const columns = [
      { header: "Date", key: "Date", width: 15 },
      { header: "Sauda No", key: "Sauda No", width: 15 },
      { header: "PO Number", key: "PO Number", width: 20 },
      { header: "Buyer", key: "Buyer", width: 20 },
      { header: "Buyer Company", key: "Buyer Company", width: 30 },
      { header: "Seller Company", key: "Seller Company", width: 30 },
      { header: "Seller Name", key: "Seller Name", width: 30 },
      { header: "Consignee", key: "Consignee", width: 30 },
      { header: "Commodity", key: "Commodity", width: 20 },
      { header: "Quantity", key: "Quantity", width: 15 },
      { header: "Rate", key: "Rate", width: 15 },
      { header: "Tax", key: "Tax", width: 10 },
      { header: "CD", key: "CD", width: 10 },
      { header: "Delivery Date", key: "Delivery Date", width: 15 },
      { header: "Payment Time", key: "Payment Time", width: 20 },
    ];

    worksheet.columns = columns;

    items.forEach((item) => {
      const rowData = {
        Date: item.poDate
          ? new Date(item.poDate).toLocaleDateString("en-GB")
          : item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB")
            : "",
        "Sauda No": item.saudaNo || "",
        "PO Number": item.poNumber || "",
        Buyer: item.buyer || "",
        "Buyer Company": item.buyerCompany || "",
        "Seller Company": item.supplierCompany || "",
        "Seller Name": item.supplier?.sellerName || "",
        Consignee: getConsigneeDisplay(item) || "",
        Commodity: item.commodity || "",
        Quantity: item.quantity || "",
        Rate: item.rate || "",
        Tax: item.tax || item.gst || "",
        CD: item.cd || "",
        "Delivery Date": item.deliveryDate
          ? new Date(item.deliveryDate).toLocaleDateString("en-GB")
          : "",
        "Payment Time": item.paymentTerms || "",
      };

      worksheet.addRow(rowData);
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
      "attachment; filename=" + "SelfOrders.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Excel Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
