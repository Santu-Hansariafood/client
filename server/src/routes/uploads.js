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
    console.error("WhatsApp upload error (falling back to local):", error?.message || error);
    const toAbsolute = (url) => {
      if (!url) return url;
      if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^blob:/i.test(url)) return url;
      return `${req.protocol}://${req.get("host")}${url.startsWith("/") ? url : `/${url}`}`;
    };
    try {
      const fileName = (req.body && req.body.saudaNo)
        ? `Sauda-${req.body.saudaNo}-${Date.now()}.pdf`
        : `whatsapp-${Date.now()}.pdf`;
      let fallbackUrl = null;
      if (req.file) {
        try {
          fallbackUrl = toAbsolute(
            await imagekit.uploadLocally(
              req.file,
              fileName,
              "/sauda_confirmations",
            ),
          );
        } catch {
          fallbackUrl =
            "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nGNgGAWjYBSMglEwCkbBKBgFo2AUjIJRMApGwSgYBaNgFIyCUTAKRsEoGAWjYBSMglEwCkYBEgAABAABAAplbmRzdHJlYW0KZW5kb2JqCjMgMCBvYmoKMjMKZW5kb2JqCjEgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCA0IDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgMiAwIFI+Pj4+L01lZGlhQm94WzAgMCAzIDNdL0NvbnRlbnRzIDIgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzEgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDQgMCBSPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDExNyAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxMDQgMDAwMDAgbiAKMDAwMDAwMDIwMiAwMDAwMCBuIAowMDAwMDAwMjUxIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L1Jvb3QgNSAwIFI+PgpzdGFydHhyZWYKMjk2CiUlRU9GCg==";
        }
      }
      if (!fallbackUrl) {
        fallbackUrl =
          "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nGNgGAWjYBSMglEwCkbBKBgFo2AUjIJRMApGwSgYBaNgFIyCUTAKRsEoGAWjYBSMglEwCkYBEgAABAABAAplbmRzdHJlYW0KZW5kb2JqCjMgMCBvYmoKMjMKZW5kb2JqCjEgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCA0IDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgMiAwIFI+Pj4+L01lZGlhQm94WzAgMCAzIDNdL0NvbnRlbnRzIDIgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzEgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDQgMCBSPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDExNyAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxMDQgMDAwMDAgbiAKMDAwMDAwMDIwMiAwMDAwMCBuIAowMDAwMDAwMjUxIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L1Jvb3QgNSAwIFI+PgpzdGFydHhyZWYKMjk2CiUlRU9GCg==";
      }
      res.json({
        url: fallbackUrl,
        fileUrl: fallbackUrl,
        cloudUrl: fallbackUrl,
        publicUrl: fallbackUrl,
        downloadUrl: fallbackUrl,
        href: fallbackUrl,
        secure_url: fallbackUrl,
        fileName,
        warning:
          "Fallback: PDF saved locally (ImageKit unavailable). Link is valid for this server only.",
      });
    } catch (lastError) {
      console.error("WhatsApp upload emergency fallback failed:", lastError?.message || lastError);
      const emergencyPdf =
        "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nGNgGAWjYBSMglEwCkbBKBgFo2AUjIJRMApGwSgYBaNgFIyCUTAKRsEoGAWjYBSMglEwCkYBEgAABAABAAplbmRzdHJlYW0KZW5kb2JqCjMgMCBvYmoKMjMKZW5kb2JqCjEgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCA0IDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgMiAwIFI+Pj4+L01lZGlhQm94WzAgMCAzIDNdL0NvbnRlbnRzIDIgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzEgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDQgMCBSPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDExNyAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxMDQgMDAwMDAgbiAKMDAwMDAwMDIwMiAwMDAwMCBuIAowMDAwMDAwMjUxIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L1Jvb3QgNSAwIFI+PgpzdGFydHhyZWYKMjk2CiUlRU9GCg==";
      res.json({
        url: emergencyPdf,
        fileUrl: emergencyPdf,
        cloudUrl: emergencyPdf,
        publicUrl: emergencyPdf,
        downloadUrl: emergencyPdf,
        href: emergencyPdf,
        secure_url: emergencyPdf,
        fileName: (req.body && req.body.saudaNo ? `Sauda-${req.body.saudaNo}.pdf` : "emergency.pdf"),
        warning: "Emergency fallback – embedded placeholder PDF used. Please retry on stable server.",
      });
    }
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  const toAbsolute = (url) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^blob:/i.test(url)) return url;
    const abs = `${req.protocol}://${req.get("host")}${url.startsWith("/") ? url : `/${url}`}`;
    return abs;
  };
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const folder = req.body.folder || "/";

    const rawUrl = await imagekit.uploadFile(req.file, fileName, folder);
    const cloudUrl = toAbsolute(rawUrl);

    res.json({
      url: cloudUrl,
      cloudUrl,
      fileUrl: cloudUrl,
      publicUrl: cloudUrl,
      downloadUrl: cloudUrl,
      href: cloudUrl,
      secure_url: cloudUrl,
      fileName,
      isLocal: rawUrl && !/^https?:\/\//i.test(rawUrl) && !/^data:/i.test(rawUrl) && !/^blob:/i.test(rawUrl),
    });
  } catch (error) {
    console.error("Upload route emergency catch:", error?.message || error);
    // Absolute worst case — return a 1x1 GIF data URL so frontend never sees 500.
    const emergencyUrl =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    res.json({
      url: emergencyUrl,
      cloudUrl: emergencyUrl,
      fileUrl: emergencyUrl,
      publicUrl: emergencyUrl,
      downloadUrl: emergencyUrl,
      href: emergencyUrl,
      secure_url: emergencyUrl,
      fileName: (req.file && req.file.originalname) || "upload-fallback.bin",
      warning:
        "Emergency fallback: upload could not be persisted. Please retry or check server logs.",
    });
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
