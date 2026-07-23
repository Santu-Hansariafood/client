import { Router } from "express";
import multer from "multer";
import imagekit from "../lib/imagekit.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/whatsapp", upload.single("file"), async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const saudaNo = req.body.saudaNo || "N/A";
    const fileName = `Sauda-${saudaNo}-${Date.now()}.pdf`;

    const cloudUrl = await imagekit.uploadFile(
      req.file,
      fileName,
      "/sauda_confirmations",
    );

    console.log("Generated ImageKit URL:", cloudUrl);
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
