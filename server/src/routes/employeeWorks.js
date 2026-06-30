import { Router } from "express";
import EmployeeWork from "../models/EmployeeWork.js";
import Employee from "../models/Employee.js";

const router = Router();

// Get all works (admin) with employee details
router.get("/", async (req, res) => {
  try {
    const { employeeId, status, workType, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    if (workType) filter.workType = workType;

    const skip = (page - 1) * limit;

    const works = await EmployeeWork.find(filter)
      .populate("employeeId", "name employeeId email mobile")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmployeeWork.countDocuments(filter);

    res.json({
      data: works,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all works for a specific employee
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, workType, page = 1, limit = 10 } = req.query;
    
    const filter = { employeeId };
    if (status) filter.status = status;
    if (workType) filter.workType = workType;

    const skip = (page - 1) * limit;

    const works = await EmployeeWork.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmployeeWork.countDocuments(filter);

    res.json({
      data: works,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single work by ID
router.get("/:id", async (req, res) => {
  try {
    const work = await EmployeeWork.findById(req.params.id);
    if (!work) {
      return res.status(404).json({ message: "Work not found" });
    }
    res.json(work);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new work
router.post("/", async (req, res) => {
  try {
    const work = new EmployeeWork(req.body);
    const savedWork = await work.save();
    res.status(201).json(savedWork);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a work
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.status === "Completed" && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }
    const updatedWork = await EmployeeWork.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedWork) {
      return res.status(404).json({ message: "Work not found" });
    }
    res.json(updatedWork);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a work
router.delete("/:id", async (req, res) => {
  try {
    const deletedWork = await EmployeeWork.findByIdAndDelete(req.params.id);
    if (!deletedWork) {
      return res.status(404).json({ message: "Work not found" });
    }
    res.json({ message: "Work deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
