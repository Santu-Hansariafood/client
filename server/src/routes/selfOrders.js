import { Router } from "express";
import nodemailer from "nodemailer";
import SelfOrder from "../models/SelfOrder.js";

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
    if (page > 0 && limit > 0) {
      const items = await SelfOrder.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      const total = await SelfOrder.countDocuments();
      return res.json({ data: items, total });
    }
    const items = await SelfOrder.find().sort({ createdAt: -1 }).lean();
    res.json(items);
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
    const item = await SelfOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Order not found" });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const item = await SelfOrder.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
