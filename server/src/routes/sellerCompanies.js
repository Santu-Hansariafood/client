import { Router } from "express";
import SellerCompany from "../models/SellerCompany.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);

    if (page > 0 && limit > 0) {
      const items = await SellerCompany.find()
        .sort({ companyName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      const total = await SellerCompany.countDocuments();
      return res.json({ data: items, total });
    }

    const items = await SellerCompany.find().sort({ companyName: 1 }).lean();
    res.json({ data: items, total: items.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    const bankDetails =
      typeof body.bankDetails === "string"
        ? JSON.parse(body.bankDetails || "[]")
        : Array.isArray(body.bankDetails)
        ? body.bankDetails
        : [];

    const company = await SellerCompany.create({
      companyName: body.companyName,
      gstNo: body.gstNo,
      panNo: body.panNo,
      aadhaarNo: body.aadhaarNo,
      address: body.address,
      mobileNo: body.mobileNo,
      email: body.email,
      state: body.state,
      district: body.district,
      pinNo: body.pinNo,
      msmeNo: body.msmeNo || "",
      bankDetails: bankDetails.map((b) => ({
        accountHolderName: b.accountHolderName,
        accountNumber: b.accountNumber,
        ifscCode: b.ifscCode,
        branchName: b.branchName,
        bankName: b.bankName
      }))
    });

    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const body = req.body || {};

    const bankDetails =
      typeof body.bankDetails === "string"
        ? JSON.parse(body.bankDetails || "[]")
        : Array.isArray(body.bankDetails)
        ? body.bankDetails
        : [];

    const updated = await SellerCompany.findByIdAndUpdate(
      req.params.id,
      {
        companyName: body.companyName,
        gstNo: body.gstNo,
        panNo: body.panNo,
        aadhaarNo: body.aadhaarNo,
        address: body.address,
        mobileNo: body.mobileNo,
        email: body.email,
        state: body.state,
        district: body.district,
        pinNo: body.pinNo,
        msmeNo: body.msmeNo || "",
        bankDetails: bankDetails.map((b) => ({
          accountHolderName: b.accountHolderName,
          accountNumber: b.accountNumber,
          ifscCode: b.ifscCode,
          branchName: b.branchName,
          bankName: b.bankName
        }))
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Seller company not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SellerCompany.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Seller company not found" });
    }
    res.json({ message: "Seller company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

