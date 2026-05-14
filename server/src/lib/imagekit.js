import ImageKit from "imagekit";

class ImageKitStorage {
  constructor() {
    this.refreshConfig();
  }

  refreshConfig() {
    this.publicKey = process.env.IMAGEKIT_PUBLIC_KEY || "";
    this.privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
    this.urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";

    if (this.urlEndpoint.endsWith("/")) {
      this.urlEndpoint = this.urlEndpoint.slice(0, -1);
    }

    if (this.publicKey && this.privateKey && this.urlEndpoint) {
      this.imagekit = new ImageKit({
        publicKey: this.publicKey,
        privateKey: this.privateKey,
        urlEndpoint: this.urlEndpoint,
      });
      console.log(
        "ImageKit configured successfully with endpoint:",
        this.urlEndpoint,
      );
    } else {
      this.imagekit = null;
      console.warn("ImageKit credentials missing:", {
        hasPublic: !!this.publicKey,
        hasPrivate: !!this.privateKey,
        hasEndpoint: !!this.urlEndpoint,
      });
    }
  }

  async uploadFile(file, fileName, folder = "/") {
    try {
      if (!this.imagekit) {
        this.refreshConfig();
      }

      if (!this.imagekit) {
        console.error("ImageKit not configured for upload");
        throw new Error("ImageKit configuration missing");
      }

      const response = await this.imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        useUniqueFileName: true,
        folder: folder,
      });

      console.log("ImageKit upload success:", response.url);
      return response.url;
    } catch (error) {
      console.error("ImageKit upload error details:", error);
      throw new Error(
        `Failed to upload file to ImageKit: ${error.message || "Unknown error"}`,
      );
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
