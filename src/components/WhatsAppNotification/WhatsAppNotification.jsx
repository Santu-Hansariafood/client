import api from "../../utils/apiClient/apiClient";

const WhatsAppNotification = async ({ bidId }) => {
  const notifyRelevantSellers = async () => {
    if (!bidId) {
      throw new Error("Bid ID is required to send bid messages.");
    }

    const response = await api.post("/whatsapp/send", { bidId });
    return response.data;
  };

  return { notifyRelevantSellers };
};

export default WhatsAppNotification;
