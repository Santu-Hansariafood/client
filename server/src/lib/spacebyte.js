import axios from "axios";
import FormData from "form-data";

const SPACEBYTE_API_KEY = process.env.SPACEBYTE_API_KEY || "";
const SPACEBYTE_BASE_URL = process.env.SPACEBYTE_BASE_URL || "https://api.spacebyte.in";

class SpaceByteStorage {
  constructor() {
    this.apiKey = SPACEBYTE_API_KEY;
    this.baseUrl = SPACEBYTE_BASE_URL;
  }

  async uploadFile(file, fileName) {
    try {
      if (!this.apiKey) {
        console.warn("SPACEBYTE_API_KEY not configured, returning mock URL");
        return `https://mock.spacebyte.in/uploads/${fileName}-${Date.now()}`;
      }

      const formData = new FormData();
      formData.append("file", file.buffer, fileName);

      const response = await axios.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      return response.data.url || response.data.fileUrl;
    } catch (error) {
      console.error("SpaceByte upload error:", error.response?.data || error.message);
      throw new Error("Failed to upload file to SpaceByte");
    }
  }

  async deleteFile(fileUrl) {
    try {
      if (!this.apiKey) {
        console.warn("SPACEBYTE_API_KEY not configured, skipping delete");
        return true;
      }

      await axios.delete(`${this.baseUrl}/delete`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
        data: { url: fileUrl },
      });

      return true;
    } catch (error) {
      console.error("SpaceByte delete error:", error.response?.data || error.message);
      throw new Error("Failed to delete file from SpaceByte");
    }
  }
}

export default new SpaceByteStorage();
