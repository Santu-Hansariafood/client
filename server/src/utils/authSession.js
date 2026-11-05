import User from "../models/User.js";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import Employee from "../models/Employee.js";
import Transporter from "../models/Transporter.js";

export const getModelByRole = (role) => {
  switch (role) {
    case "Admin":
      return User;
    case "Buyer":
      return Buyer;
    case "Seller":
      return Seller;
    case "Employee":
      return Employee;
    case "Transporter":
      return Transporter;
    default:
      return null;
  }
};

export const getAuthUserFromTokenPayload = async (decoded) => {
  if (!decoded?.role || !decoded?.sub) {
    return null;
  }

  const Model = getModelByRole(decoded.role);
  if (!Model) {
    return null;
  }

  const selectedFields =
    decoded.role === "Employee"
      ? "_id passwordChangedAt allowedPermissions"
      : "_id passwordChangedAt";
  return Model.findById(decoded.sub).select(selectedFields);
};

export const isTokenIssuedBeforePasswordChange = (decoded, user) => {
  if (!decoded?.iat || !user?.passwordChangedAt) {
    return false;
  }

  const tokenIssuedAtSeconds = Number(decoded.iat);
  const passwordChangedAtSeconds = Math.floor(
    new Date(user.passwordChangedAt).getTime() / 1000,
  );

  return passwordChangedAtSeconds > tokenIssuedAtSeconds;
};
