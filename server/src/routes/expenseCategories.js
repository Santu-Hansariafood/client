import express from "express";
import ExpenseCategory from "../models/ExpenseCategory.js";
import authJwt from "../middleware/authJwt.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// @desc    Get all expense categories
// @route   GET /api/expense-categories
// @access  Private
router.get("/", authJwt, async (req, res) => {
  try {
    const categories = await ExpenseCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new expense category
// @route   POST /api/expense-categories
// @access  Private/Admin
router.post("/", authJwt, adminOnly, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const categoryExists = await ExpenseCategory.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (categoryExists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await ExpenseCategory.create({
      name,
      createdBy: req.user.id || req.user._id,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete an expense category
// @route   DELETE /api/expense-categories/:id
// @access  Private/Admin
router.delete("/:id", authJwt, adminOnly, async (req, res) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id);
    if (category) {
      await category.deleteOne();
      res.json({ message: "Category removed" });
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
