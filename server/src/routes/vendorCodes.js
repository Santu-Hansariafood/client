import { Router } from "express";
import VendorCode from "../models/VendorCode.js";

const router = Router();

const normalizeVendorCode = (value) => String(value || "").trim().toUpperCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isDuplicateKeyError = (error) => error?.code === 11000;

const findDuplicateVendorCode = (vendorCode, excludeId) =>
  VendorCode.findOne({
    vendorCode: {
      $regex: `^${escapeRegex(vendorCode)}$`,
      $options: "i",
    },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

router.post("/", async (req, res) => {
  try {
    const { group, buyer, seller } = req.body;
    const vendorCode = normalizeVendorCode(req.body.vendorCode);

    if (!group || !buyer || !seller || !vendorCode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (await findDuplicateVendorCode(vendorCode)) {
      return res.status(409).json({ message: "Vendor code must be unique" });
    }

    const existingCode = await VendorCode.findOne({ group, buyer, seller });
    if (existingCode) {
      return res.status(409).json({ message: "Vendor code already exists for this combination" });
    }

    const newVendorCode = await VendorCode.create({ group, buyer, seller, vendorCode });
    res.status(201).json(newVendorCode);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "Vendor code or combination already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {};
    if (search) {
      query.$or = [
        { vendorCode: { $regex: search, $options: "i" } },
      ];
    }
    if (req.query.group) query.group = req.query.group;
    if (req.query.buyer) query.buyer = req.query.buyer;
    if (req.query.seller) query.seller = req.query.seller;

    const items = await VendorCode.find(query)
      .populate("group", "groupName")
      .populate("buyer", "companyName")
      .populate("seller", "sellerName companies")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await VendorCode.countDocuments(query);

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
    const vendorCode = await VendorCode.findById(req.params.id)
      .populate("group", "groupName")
      .populate("buyer", "companyName")
      .populate("seller", "sellerName companies")
      .lean();

    if (!vendorCode) {
      return res.status(404).json({ message: "Vendor code not found" });
    }

    res.json(vendorCode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { group, buyer, seller } = req.body;
    const vendorCode = normalizeVendorCode(req.body.vendorCode);

    if (!group || !buyer || !seller || !vendorCode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (await findDuplicateVendorCode(vendorCode, req.params.id)) {
      return res.status(409).json({ message: "Vendor code must be unique" });
    }

    const existingCombination = await VendorCode.findOne({
      group,
      buyer,
      seller,
      _id: { $ne: req.params.id },
    });
    if (existingCombination) {
      return res.status(409).json({
        message: "Vendor code already exists for this combination",
      });
    }

    const updatedVendorCode = await VendorCode.findByIdAndUpdate(
      req.params.id,
      { group, buyer, seller, vendorCode },
      { new: true, runValidators: true },
    );

    if (!updatedVendorCode) {
      return res.status(404).json({ message: "Vendor code not found" });
    }

    res.json(updatedVendorCode);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "Vendor code or combination already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedVendorCode = await VendorCode.findByIdAndDelete(req.params.id);

    if (!deletedVendorCode) {
      return res.status(404).json({ message: "Vendor code not found" });
    }

    res.json({ message: "Vendor code deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
