import { Router } from "express";
import multer from "multer";
import spacebyte from "../lib/spacebyte.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const fileName = req.file.originalname;
    const fileUrl = await spacebyte.uploadFile(req.file, fileName);

    res.json({ url: fileUrl, fileName });
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

    await spacebyte.deleteFile(url);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message || "Failed to delete file" });
  }
});

export default router;
