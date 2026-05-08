import ImageKit from "imagekit";

const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || "";
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || "";
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || "";

class ImageKitStorage {
  constructor() {
    this.publicKey = IMAGEKIT_PUBLIC_KEY;
    this.privateKey = IMAGEKIT_PRIVATE_KEY;
    this.urlEndpoint = IMAGEKIT_URL_ENDPOINT;

    if (this.publicKey && this.privateKey && this.urlEndpoint) {
      this.imagekit = new ImageKit({
        publicKey: this.publicKey,
        privateKey: this.privateKey,
        urlEndpoint: this.urlEndpoint,
      });
    } else {
      this.imagekit = null;
      console.warn("ImageKit credentials not configured");
    }
  }

  async uploadFile(file, fileName) {
    try {
      if (!this.imagekit) {
        console.warn("ImageKit not configured, returning mock URL");
        return `https://mock.imagekit.io/uploads/${fileName}-${Date.now()}`;
      }

      const response = await this.imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        useUniqueFileName: true,
      });

      return response.url;
    } catch (error) {
      console.error("ImageKit upload error:", error.message || error);
      throw new Error("Failed to upload file to ImageKit");
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
}

export default new ImageKitStorage();
