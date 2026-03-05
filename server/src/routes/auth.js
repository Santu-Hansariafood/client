import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
    const user = await User.findOne({ role: "Buyer", mobile, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { sub: user._id.toString(), role: "Buyer", mobile: user.mobile || "" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
    res.json({ role: "Buyer", mobile: user.mobile || "", name: user.name, token });
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
    const user = await User.findOne({ role: "Seller", phone, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { sub: user._id.toString(), role: "Seller", mobile: user.phone || "" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );
    res.json({ role: "Seller", mobile: user.phone || "", name: user.name, token });
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
