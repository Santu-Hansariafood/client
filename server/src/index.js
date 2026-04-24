import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import connect from "./lib/db.js";
import cluster from "node:cluster";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.js";
import apiKey from "./middleware/apiKey.js";
import authJwt from "./middleware/authJwt.js";
import { cache } from "./middleware/cache.js";
import sellerRoutes from "./routes/sellers.js";
import buyerRoutes from "./routes/buyers.js";
import commodityRoutes from "./routes/commodities.js";
import companyRoutes from "./routes/companies.js";
import bidLocationRoutes from "./routes/bidLocations.js";
import bidRoutes from "./routes/bids.js";
import sellerCompanyRoutes from "./routes/sellerCompanies.js";
import participateRoutes from "./routes/participateBids.js";
import confirmBidRoutes from "./routes/confirmBids.js";
import agentRoutes from "./routes/agents.js";
import selfOrderRoutes from "./routes/selfOrders.js";
import saudaNoRoutes from "./routes/saudaNo.js";
import whatsappRoutes from "./routes/whatsapp.js";
import qualityParameterRoutes from "./routes/qualityParameters.js";
import groupRoutes from "./routes/groups.js";
import consigneeRoutes from "./routes/consignees.js";
import emailRoutes from "./routes/email.js";
import employeeRoutes from "./routes/employees.js";
import transporterRoutes from "./routes/transporters.js";
import notificationRoutes from "./routes/notifications.js";
import loadingEntryRoutes from "./routes/loadingEntries.js";
import vendorCodeRoutes from "./routes/vendorCodes.js";
import expenseCategoryRoutes from "./routes/expenseCategories.js";
import expenseRequestRoutes from "./routes/expenseRequests.js";
import { startNotificationCleanup } from "./lib/scheduler.js";
import http from "http";
import { initSocket } from "./lib/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
app.set("trust proxy", 1);

app.use(compression({ level: 6 }));

const corsOrigin = (process.env.CORS_ORIGIN || "*").trim();
const corsOrigins =
  corsOrigin && corsOrigin !== "*"
    ? corsOrigin
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : "*";

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
      "Origin",
      "Accept",
      "X-Requested-With",
    ],
    exposedHeaders: ["X-Cache"],
    maxAge: 86400,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Static Files Serving
// Serve public folder from root
app.use("/logo", express.static(path.join(__dirname, "../../public/logo")));
app.use("/icons", express.static(path.join(__dirname, "../../public/icons")));
app.use("/images", express.static(path.join(__dirname, "../../public/images")));
app.use("/teams", express.static(path.join(__dirname, "../../public/teams")));

// Performance Monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`SLOW: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });
  next();
});

app.get("/api/keep-alive", (_, res) => {
  res.json({ ok: true });
});

app.use("/api", apiKey);
app.use("/api", authRoutes);
app.use("/api/sellers", cache(30), authJwt, sellerRoutes);
app.use("/api/buyers", cache(30), authJwt, buyerRoutes);
app.use("/api/commodities", cache(60), authJwt, commodityRoutes);
app.use("/api/companies", cache(60), authJwt, companyRoutes);
app.use("/api/seller-company", cache(60), authJwt, sellerCompanyRoutes);
app.use("/api/bid-locations", cache(60), authJwt, bidLocationRoutes);
app.use("/api/bids", cache(10), authJwt, bidRoutes);
app.use("/api/participatebids", cache(5), authJwt, participateRoutes);
app.use("/api/confirm-bid", cache(10), authJwt, confirmBidRoutes);
app.use("/api/agents", cache(120), authJwt, agentRoutes);
app.use("/api/self-order", cache(5), authJwt, selfOrderRoutes);
app.use("/api/sauda-no", cache(60), authJwt, saudaNoRoutes);
app.use("/api/whatsapp", authJwt, whatsappRoutes);
app.use("/api/quality-parameters", cache(60), authJwt, qualityParameterRoutes);
app.use("/api/groups", cache(60), authJwt, groupRoutes);
app.use("/api/consignees", cache(30), authJwt, consigneeRoutes);
app.use("/api/email", authJwt, emailRoutes);
app.use("/api/employees", authJwt, employeeRoutes);
app.use("/api/transporters", cache(60), authJwt, transporterRoutes);
app.use("/api/notifications", cache(5), authJwt, notificationRoutes);
app.use("/api/loading-entries", cache(5), authJwt, loadingEntryRoutes);
app.use("/api/vendor-codes", cache(5), authJwt, vendorCodeRoutes);
app.use("/api/expense-categories", authJwt, expenseCategoryRoutes);
app.use("/api/expense-requests", authJwt, expenseRequestRoutes);

// Production Serving
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../../dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    // Only handle non-API requests
    if (!req.path.startsWith("/api/")) {
      res.sendFile(path.join(distPath, "index.html"));
    } else {
      res.status(404).json({ message: "API route not found" });
    }
  });
}

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = initSocket(server);

const start = async () => {
  await connect();
  startNotificationCleanup(12); // Daily cleanup at 12:00 PM
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS allowed origins: ${process.env.CORS_ORIGIN || "*"}`);
    console.log(
      `API Key loaded: ${process.env.API_KEY ? "Yes (starts with " + process.env.API_KEY.slice(0, 4) + ")" : "No"}`,
    );
  });
};

if (process.env.CLUSTER_MODE === "1" && process.env.NODE_ENV === "production") {
  if (cluster.isPrimary) {
    const count = os.cpus().length;
    for (let i = 0; i < count; i++) cluster.fork();
    cluster.on("exit", () => {
      cluster.fork();
    });
  } else {
    start();
  }
} else {
  start();
}
