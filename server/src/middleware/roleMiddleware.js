import ExpenseCategory from "../models/ExpenseCategory.js";
import ExpenseRequest from "../models/ExpenseRequest.js";

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};

const employeeOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "Admin" || req.user.role === "Employee")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied." });
  }
};

export { adminOnly, employeeOrAdmin };
