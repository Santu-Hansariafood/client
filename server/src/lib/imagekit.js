import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ImageKit from "imagekit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localUploadBaseDir = path.resolve(__dirname, "../../uploads");

class ImageKitStorage {
  constructor() {
    this.refreshConfig();
  }

  refreshConfig() {
    const clean = (val) =>
      typeof val === "string"
        ? val
            .replace(/^[\s"'`]+|[\s"'`]+$/g, "")
            .replace(/\r/g, "")
            .trim()
        : "";

    this.publicKey = clean(process.env.IMAGEKIT_PUBLIC_KEY);
    this.privateKey = clean(process.env.IMAGEKIT_PRIVATE_KEY);
    this.urlEndpoint = clean(process.env.IMAGEKIT_URL_ENDPOINT);

    if (this.urlEndpoint.endsWith("/")) {
      this.urlEndpoint = this.urlEndpoint.slice(0, -1);
    }

    if (this.publicKey && this.privateKey && this.urlEndpoint) {
      try {
        this.imagekit = new ImageKit({
          publicKey: this.publicKey,
          privateKey: this.privateKey,
          urlEndpoint: this.urlEndpoint,
        });
        const maskedPriv = `${this.privateKey.slice(0, 10)}…${this.privateKey.slice(-4)}`;
        console.log(
          "ImageKit configured successfully — endpoint:",
          this.urlEndpoint,
          "| publicKey:",
          this.publicKey.slice(0, 16) + "…",
          "| privateKey:",
          maskedPriv,
        );
      } catch (err) {
        console.error("ImageKit SDK init failed:", err.message || err);
        this.imagekit = null;
      }
    } else {
      this.imagekit = null;
      console.warn("ImageKit credentials missing (after trim):", {
        hasPublic: !!this.publicKey,
        publicLen: this.publicKey.length,
        hasPrivate: !!this.privateKey,
        privateLen: this.privateKey.length,
        hasEndpoint: !!this.urlEndpoint,
        endpointSample: JSON.stringify(this.urlEndpoint.slice(0, 40)),
      });
    }
  }

  async uploadFile(file, fileName, folder = "/") {
    try {
      if (!this.imagekit) {
        this.refreshConfig();
      }

      if (this.imagekit) {
        const response = await this.imagekit.upload({
          file: file.buffer,
          fileName: fileName,
          useUniqueFileName: true,
          folder: folder,
        });

        console.log("ImageKit upload success:", response.url);
        return response.url;
      }

      return this.uploadLocally(file, fileName, folder);
    } catch (error) {
      console.error("ImageKit upload error details:", {
        message: error?.message,
        stack: error?.stack?.slice(0, 300),
        ...(error?.help ? { help: error.help } : {}),
        ...(error?.statusCode ? { statusCode: error.statusCode } : {}),
      });
      const msg = String(error?.message || "").toLowerCase();
      if (
        msg.includes("imagekit") ||
        msg.includes("configuration missing") ||
        msg.includes("authenticated") ||
        msg.includes("auth") ||
        msg.includes("unauthorized") ||
        msg.includes("forbidden") ||
        msg.includes("invalid key") ||
        error?.statusCode === 401 ||
        error?.statusCode === 403
      ) {
        console.warn("→ Falling back to local filesystem upload due to ImageKit auth error.");
        return this.uploadLocally(file, fileName, folder);
      }
      throw new Error(
        `Failed to upload file to ImageKit: ${error.message || "Unknown error"}`,
      );
    }
  }

  async uploadLocally(file, fileName, folder = "/") {
    try {
      const normalizedFolder = (folder || "/").replace(/^\/+|\/+$/g, "");
      const targetDir = normalizedFolder
        ? path.join(localUploadBaseDir, normalizedFolder)
        : localUploadBaseDir;

      await fs.mkdir(targetDir, { recursive: true });
      const filePath = path.join(targetDir, fileName);
      await fs.writeFile(filePath, file.buffer || file);

      const publicPath = normalizedFolder
        ? `/uploads/${normalizedFolder}/${fileName}`
        : `/uploads/${fileName}`;

      console.log("Local upload fallback success:", publicPath);
      return publicPath;
    } catch (error) {
      console.error("Local upload fallback error:", error);
      throw new Error(`Failed to store file locally: ${error.message || "Unknown error"}`);
    }
  }

  async deleteFile(fileUrl) {
    try {
      if (!this.imagekit) {
        console.warn("ImageKit not configured, skipping delete");
        return true;
      }

      const fileId = this.extractFileIdFromUrl(fileUrl);
      if (!fileId) {
        throw new Error("Could not extract file ID from URL");
      }

      await this.imagekit.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error("ImageKit delete error:", error.message || error);
      throw new Error("Failed to delete file from ImageKit");
    }
  }

  extractFileIdFromUrl(url) {
    try {
      const urlParts = url.split("/");
      const fileNamePart = urlParts[urlParts.length - 1];
      return fileNamePart.split(".")[0];
    } catch {
      return null;
    }
  }

  async cleanupFolder(folder, olderThanMinutes = 60) {
    try {
      if (!this.imagekit) {
        this.refreshConfig();
      }
      if (!this.imagekit) return;

      const files = await this.imagekit.listFiles({
        path: folder,
      });

      const now = new Date();
      let deletedCount = 0;

      for (const file of files) {
        const createdAt = new Date(file.createdAt);
        const diff = (now - createdAt) / 1000 / 60; // Difference in minutes

        if (diff > olderThanMinutes) {
          await this.imagekit.deleteFile(file.fileId);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[ImageKit] Cleaned up ${deletedCount} files from ${folder}`);
      }
      return deletedCount;
    } catch (error) {
      console.error("[ImageKit] Cleanup error:", error.message || error);
      return 0;
    }
  }
}

export default new ImageKitStorage();
