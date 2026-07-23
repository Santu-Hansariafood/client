import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Create sauda directory if it doesn't exist
const saudaDir = path.join(__dirname, "../../sauda");
if (!fs.existsSync(saudaDir)) {
  fs.mkdirSync(saudaDir, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, saudaDir);
  },
  filename: (req, file, cb) => {
    const saudaNo = req.body.saudaNo || "unknown";
    const fileName = `Sauda-${saudaNo}-${Date.now()}.pdf`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/whatsapp", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const fileName = req.file.filename;
    const protocol = req.protocol;
    const host = req.get("host");
    const fileUrl = `${protocol}://${host}/sauda/${fileName}`;

    res.json({
      url: fileUrl,
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
    const folder = req.body.folder || "/";

    // Directly upload to ImageKit without local storage
    const cloudUrl = await imagekit.uploadFile(req.file, fileName, folder);

    res.json({
      url: cloudUrl,
      cloudUrl,
      fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message || "Failed to upload file to ImageKit" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "File URL is required" });
    }

    // Only delete from ImageKit as local files are no longer stored
    await imagekit.deleteFile(url);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message || "Failed to delete file" });
  }
});

export default router;
