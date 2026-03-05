import dotenv from "dotenv";
import mongoose from "mongoose";
import connect from "../lib/db.js";
import User from "../models/User.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const run = async () => {
  try {
    await connect();
    const mobile = "7029481930";
    const password = "722154";
    const role = "Admin";
    const name = "Admin";

    const result = await User.findOneAndUpdate(
      { role, mobile },
      { role, mobile, password, name },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("Admin user upserted:", {
      id: result._id.toString(),
      role: result.role,
      mobile: result.mobile
    });
  } catch (err) {
    console.error("Failed to seed admin user:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
