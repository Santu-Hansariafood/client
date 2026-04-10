import { Router } from "express";
import nodemailer from "nodemailer";
import SelfOrder from "../models/SelfOrder.js";
import Seller from "../models/Seller.js";

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

    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = {
        $or: [
          { saudaNo: { $regex: searchRegex } },
          { poNumber: { $regex: searchRegex } },
          { buyer: { $regex: searchRegex } },
          { buyerCompany: { $regex: searchRegex } },
          { supplierCompany: { $regex: searchRegex } },
          { commodity: { $regex: searchRegex } },
        ],
      };
    }

    if (sellerMobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(sellerMobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : sellerMobile;
      
      query = {
        ...query,
        $or: [
          { sellerMobile: normalizedMobile },
          { sellerMobile: { $regex: new RegExp(normalizedMobile + "$") } }
        ]
      };
    }

    if (supplier) {
      query.supplier = supplier;
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
      query.poDate = {};
      if (startDate) query.poDate.$gte = new Date(startDate);
      if (endDate) query.poDate.$lte = new Date(endDate);
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

export default router;
