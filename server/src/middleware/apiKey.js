import { timingSafeEqual } from "node:crypto";

export default function apiKey(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const providedKey = req.header("x-api-key");
  const configuredKey = process.env.API_KEY;

  if (
    typeof providedKey !== "string" ||
    typeof configuredKey !== "string" ||
    !configuredKey
  ) {
    return res.status(401).json({ message: "Invalid API key" });
  }

  const providedBuffer = Buffer.from(providedKey);
  const configuredBuffer = Buffer.from(configuredKey);
  if (
    providedBuffer.length !== configuredBuffer.length ||
    !timingSafeEqual(providedBuffer, configuredBuffer)
  ) {
    return res.status(401).json({ message: "Invalid API key" });
  }

  next();
}
