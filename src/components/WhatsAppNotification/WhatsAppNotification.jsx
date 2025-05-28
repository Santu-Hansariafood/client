import axios from "axios";

const WhatsAppNotification = async ({ bidData, bidId }) => {
  const apiBaseUrl = "https://api.hansariafood.shop/api";

  const notifyRelevantSellers = async () => {
    try {
      if (!bidId) {
        console.error("Missing bidId");
        return false;
      }

      const response = await axios.post(`${apiBaseUrl}/whatsapp/send`, {
        bidData,
        bidId,
      });

      if (response.status === 200) {
        console.log("WhatsApp notifications triggered successfully");
        return true;
      } else {
        console.error("Failed to trigger WhatsApp notifications");
        return false;
      }
    } catch (error) {
      console.error("Error notifying sellers via backend:", error.message);
      return false;
    }
  };

  return { notifyRelevantSellers };
};

export default WhatsAppNotification;
