import jwt from "jsonwebtoken";
import {
  getAuthUserFromTokenPayload,
  isTokenIssuedBeforePasswordChange,
} from "../utils/authSession.js";

export default async function authJwt(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const auth = req.header("authorization") || req.header("Authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const authUser = await getAuthUserFromTokenPayload(decoded);

    if (!authUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (isTokenIssuedBeforePasswordChange(decoded, authUser)) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    req.user = decoded;
    req.authUser = authUser;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
