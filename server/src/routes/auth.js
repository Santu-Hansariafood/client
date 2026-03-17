import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";

const router = Router();

router.post("/admin/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const user = await User.findOne({ role: "Admin", mobile, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { sub: user._id.toString(), role: "Admin", mobile: user.mobile || "" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
    res.json({ role: "Admin", mobile: user.mobile || "", name: user.name, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/employees/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const user = await User.findOne({ role: "Employee", mobile, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { sub: user._id.toString(), role: "Employee", mobile: user.mobile || "" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
    res.json({ role: "Employee", mobile: user.mobile || "", name: user.name, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/buyers/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const buyer = await Buyer.findOne({ mobile: mobile, password: password });
    if (!buyer) return res.status(401).json({ message: "Invalid credentials" });
    
    const token = jwt.sign(
      { sub: buyer._id.toString(), role: "Buyer", mobile: mobile },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
    res.json({ role: "Buyer", mobile: mobile, name: buyer.name, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/sellers/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const seller = await Seller.findOne({ "phoneNumbers.value": phone, password: password });
    if (!seller) return res.status(401).json({ message: "Invalid credentials" });
    
    const token = jwt.sign(
      { sub: seller._id.toString(), role: "Seller", mobile: phone },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
    res.json({ role: "Seller", mobile: phone, name: seller.sellerName, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/transporters/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const user = await User.findOne({ role: "Transporter", mobile, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { sub: user._id.toString(), role: "Transporter", mobile: user.mobile || "" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
    res.json({ role: "Transporter", mobile: user.mobile || "", name: user.name, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
