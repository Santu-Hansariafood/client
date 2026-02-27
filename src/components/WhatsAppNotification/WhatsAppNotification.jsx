import axios from "axios";

const WhatsAppNotification = async ({ bidData, bidId }) => {
  const notifyRelevantSellers = async () => {
    try {
      if (!bidId || !bidData) {
        console.error("Missing bidId or bidData");
        return false;
      }

      const apiKey = "cdbcead5dfba4eb7a4b3f16b62dc2bb8";

      console.log("Sending WhatsApp Notification with data:", {
        bidId,
        bidData,
        apiKey,
      });

      const response = await axios.post(
        `https://phpserver-kappa.vercel.app/api/whatsapp/send`,
        {
          bidId,
          bidData,
          apiKey,
        }
      );

      if (response.status === 200) {
        console.log("WhatsApp notifications triggered successfully");
        return true;
      } else {
        console.error("Failed to trigger WhatsApp notifications");
        return false;
      }
    } catch (error) {
      console.error(
        "Error notifying sellers:",
        error.response?.data || error.message
      );
      return false;
    }
  };

  return { notifyRelevantSellers };
};

export default WhatsAppNotification;
