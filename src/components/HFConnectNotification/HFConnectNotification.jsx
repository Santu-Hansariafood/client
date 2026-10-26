import api from "../../utils/apiClient/apiClient";

const HFConnectNotification = async ({ bidId }) => {
  const sendBidMessage = async () => {
    if (!bidId) {
      throw new Error("Bid ID is required to send bid messages.");
    }

    const response = await api.post("/hf-connect/send", { bidId });
    return response.data;
  };

  return { sendBidMessage };
};

export default HFConnectNotification;
