import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import imagekit from "../lib/imagekit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

try {
  await fs.access(UPLOAD_DIR);
} catch {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/whatsapp", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const saudaNo = req.body.saudaNo || "unknown";
    const fileName = `Sauda-${saudaNo}-${Date.now()}.pdf`;

    const cloudUrl = await imagekit.uploadFile(
      req.file,
      fileName,
      "/sauda_confirmations",
    );

    res.json({
      url: cloudUrl,
      fileName,
    });
  } catch (error) {
    console.error("WhatsApp upload error:", error);
    res.status(500).json({ message: error.message || "Failed to upload file" });
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;

    const localPath = path.join(UPLOAD_DIR, fileName);
    await fs.writeFile(localPath, req.file.buffer);
    console.log("File saved locally to:", localPath);

    let cloudUrl = null;
    try {
      cloudUrl = await imagekit.uploadFile(req.file, fileName);
    } catch (ikError) {
      console.error("Cloud upload failed, using local only:", ikError.message);
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const localUrl = `${baseUrl}/uploads/${fileName}`;

    res.json({
      url: cloudUrl || localUrl,
      cloudUrl,
      localUrl,
      fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message || "Failed to upload file" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "File URL is required" });
    }

    await imagekit.deleteFile(url);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message || "Failed to delete file" });
  }
});

export default router;
