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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const corsOrigin = (process.env.CORS_ORIGIN || "*").trim();
const corsOrigins =
  corsOrigin && corsOrigin !== "*"
    ? corsOrigin
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
app.use(
  cors({
    origin: corsOrigins || true,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(compression());

app.get("/api/keep-alive", (_, res) => {
  res.json({ ok: true });
});

// API key required for all API endpoints
app.use("/api", apiKey);
// Public auth endpoints (still require API key)
app.use("/api", authRoutes);
// All remaining API routes require JWT
app.use("/api/sellers", authJwt, sellerRoutes);
app.use("/api/buyers", authJwt, buyerRoutes);
app.use("/api/commodities", cache(60), authJwt, commodityRoutes);
app.use("/api/companies", cache(60), authJwt, companyRoutes);
app.use("/api/seller-company", cache(60), authJwt, sellerCompanyRoutes);
app.use("/api/bid-locations", cache(60), authJwt, bidLocationRoutes);
app.use("/api/bids", cache(10), authJwt, bidRoutes);
app.use("/api/participatebids", authJwt, participateRoutes);
app.use("/api/confirm-bid", cache(10), authJwt, confirmBidRoutes);
app.use("/api/agents", cache(120), authJwt, agentRoutes);
app.use("/api/self-order", authJwt, selfOrderRoutes);
app.use("/api/sauda-no", authJwt, saudaNoRoutes);
app.use("/api/whatsapp", authJwt, whatsappRoutes);
app.use("/api/quality-parameters", authJwt, qualityParameterRoutes);
app.use("/api/groups", authJwt, groupRoutes);
app.use("/api/consignees", authJwt, consigneeRoutes);
app.use("/api/email", authJwt, emailRoutes);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connect();
  app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
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
