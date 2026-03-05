import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

router.post("/admin/login", async (req, res) => {
  const { mobile, password } = req.body;
  const user = await User.findOne({ role: "Admin", mobile, password });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign(
    { sub: user._id.toString(), role: "Admin", mobile: user.mobile || "" },
    process.env.JWT_SECRET,
    { expiresIn: "365d" }
  );
  res.json({ role: "Admin", mobile: user.mobile || "", name: user.name, token });
});

router.post("/employees/login", async (req, res) => {
  const { mobile, password } = req.body;
  const user = await User.findOne({ role: "Employee", mobile, password });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign(
    { sub: user._id.toString(), role: "Employee", mobile: user.mobile || "" },
    process.env.JWT_SECRET,
    { expiresIn: "365d" }
  );
  res.json({ role: "Employee", mobile: user.mobile || "", name: user.name, token });
});

router.post("/buyers/login", async (req, res) => {
  const { mobile, password } = req.body;
  const user = await User.findOne({ role: "Buyer", mobile, password });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign(
    { sub: user._id.toString(), role: "Buyer", mobile: user.mobile || "" },
    process.env.JWT_SECRET,
    { expiresIn: "365d" }
  );
  res.json({ role: "Buyer", mobile: user.mobile || "", name: user.name, token });
});

router.post("/sellers/login", async (req, res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ role: "Seller", phone, password });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign(
    { sub: user._id.toString(), role: "Seller", mobile: user.phone || "" },
    process.env.JWT_SECRET,
    { expiresIn: "365d" }
  );
  res.json({ role: "Seller", mobile: user.phone || "", name: user.name, token });
});

router.post("/transporters/login", async (req, res) => {
  const { mobile, password } = req.body;
  const user = await User.findOne({ role: "Transporter", mobile, password });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign(
    { sub: user._id.toString(), role: "Transporter", mobile: user.mobile || "" },
    process.env.JWT_SECRET,
    { expiresIn: "365d" }
  );
  res.json({ role: "Transporter", mobile: user.mobile || "", name: user.name, token });
});

export default router;
