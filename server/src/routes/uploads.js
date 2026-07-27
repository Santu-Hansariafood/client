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

    const uploadResult = await imagekit.uploadFile(
      req.file,
      fileName,
      "/sauda_confirmations",
    );

    const resolveUrl = (value) => {
      if (!value) return null;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        const match = trimmed.match(/https?:\/\/[^")\]\s']+/i);
        return match ? match[0] : trimmed || null;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          const result = resolveUrl(item);
          if (result) return result;
        }
        return null;
      }
      if (typeof value === "object") {
        const keys = [
          "url",
          "fileUrl",
          "cloudUrl",
          "link",
          "downloadUrl",
          "publicUrl",
          "secure_url",
          "href",
          "src",
          "path",
        ];
        for (const key of keys) {
          const result = resolveUrl(value[key]);
          if (result) return result;
        }
        for (const key of ["data", "result", "response", "payload"]) {
          const result = resolveUrl(value[key]);
          if (result) return result;
        }
      }
      return null;
    };

    const uploadedFileUrl = resolveUrl(uploadResult);
    const responsePayload =
      typeof uploadResult === "string"
        ? {
            url: uploadedFileUrl || uploadResult,
            fileName,
            fileUrl: uploadedFileUrl || uploadResult,
            cloudUrl: uploadedFileUrl || uploadResult,
            publicUrl: uploadedFileUrl || uploadResult,
            downloadUrl: uploadedFileUrl || uploadResult,
            href: uploadedFileUrl || uploadResult,
            secure_url: uploadedFileUrl || uploadResult,
          }
        : {
            ...uploadResult,
            fileName,
            url: uploadedFileUrl,
            fileUrl: uploadedFileUrl,
            cloudUrl: uploadedFileUrl,
            publicUrl: uploadedFileUrl,
            downloadUrl: uploadedFileUrl,
            href: uploadedFileUrl,
            secure_url: uploadedFileUrl,
          };

    const uploadUrl =
      responsePayload.url ||
      responsePayload.fileUrl ||
      responsePayload.cloudUrl ||
      responsePayload.publicUrl ||
      responsePayload.downloadUrl ||
      responsePayload.href ||
      responsePayload.secure_url ||
      null;
    const resolvedUrl =
      !uploadUrl || /^https?:\/\//i.test(uploadUrl)
        ? uploadUrl
        : `${req.protocol}://${req.get("host")}${uploadUrl.startsWith("/") ? uploadUrl : `/${uploadUrl}`}`;

    responsePayload.url = resolvedUrl;
    responsePayload.fileUrl = resolvedUrl;
    responsePayload.cloudUrl = resolvedUrl;
    responsePayload.publicUrl = resolvedUrl;
    responsePayload.downloadUrl = resolvedUrl;
    responsePayload.href = resolvedUrl;
    responsePayload.secure_url = resolvedUrl;

    console.log("Generated ImageKit response payload:", responsePayload);
    res.json(responsePayload);
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
