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

const hasExpenseManagementPermission = (req) => {
  if (req.user?.role === "Admin") return true;
  if (req.user?.role !== "Employee") return false;

  return (req.authUser?.allowedPermissions || []).some((permission) => {
    if (typeof permission !== "string") return false;
    const normalizedPermission = permission.startsWith("/")
      ? permission
      : `/${permission}`;
    return normalizedPermission === "/expense/add";
  });
};

const expenseManager = (req, res, next) => {
  if (hasExpenseManagementPermission(req)) {
    next();
  } else {
    res.status(403).json({ message: "Expense management permission required." });
  }
};

export {
  adminOnly,
  employeeOrAdmin,
  expenseManager,
  hasExpenseManagementPermission,
};
