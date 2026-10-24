const HF_CONNECT_URL = "https://hfconnect.in/api/v1/messages/send";

const toTemplateString = (value) =>
  value === undefined || value === null ? "" : String(value);

const buildVariables = ({ event, bid, participation, notes, recipient }) => ({
  event,
  commodity: toTemplateString(bid.commodity),
  group: toTemplateString(bid.group),
  origin: toTemplateString(bid.origin),
  consignee: toTemplateString(bid.consignee),
  quantity: toTemplateString(
    participation?.acceptedQuantity ?? participation?.quantity ?? bid.quantity,
  ),
  rate: toTemplateString(
    participation?.acceptedRate ?? participation?.rate ?? bid.rate,
  ),
  endTime: toTemplateString(bid.endTime),
  sellerMobile: toTemplateString(participation?.mobile || recipient),
  notes: toTemplateString(notes ?? participation?.remarks ?? bid.notes),
});

const sendMessage = async (toUserId, payload) => {
  const response = await fetch(HF_CONNECT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HANSARIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      adminId: process.env.HANSARIA_WORKSPACE_ID,
      templateId: process.env.HANSARIA_TEMPLATE_ID,
      language: "en",
      fromUserId: process.env.HANSARIA_ADMIN_ID,
      toUserId,
      variables: payload,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const responseText = await response.text();
  let result = {};
  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { error: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(result.error || `Request failed: ${response.status}`);
  }
};

export const sendBidMessages = async ({
  event,
  bid,
  recipients,
  participation,
  notes,
}) => {
  const toUserIds = [
    ...new Set(
      (recipients || [])
        .map((recipient) => String(recipient || "").trim())
        .filter(Boolean),
    ),
  ];
  if (toUserIds.length === 0) {
    return { recipients: 0, sent: 0, failed: 0 };
  }

  const requiredConfig = [
    "HANSARIA_API_KEY",
    "HANSARIA_WORKSPACE_ID",
    "HANSARIA_TEMPLATE_ID",
    "HANSARIA_ADMIN_ID",
  ];
  const missingConfig = requiredConfig.filter((key) => !process.env[key]);
  if (missingConfig.length > 0) {
    console.error(
      "HF Connect is not configured; missing:",
      missingConfig.join(", "),
    );
    return { recipients: toUserIds.length, sent: 0, failed: toUserIds.length };
  }

  const results = await Promise.allSettled(
    toUserIds.map((toUserId) =>
      sendMessage(
        toUserId,
        buildVariables({ event, bid, participation, notes, recipient: toUserId }),
      ),
    ),
  );
  const failed = results.filter((result) => result.status === "rejected");
  failed.forEach((result) => {
    console.error("HF Connect message delivery failed:", {
      event,
      error: result.reason?.message || "Unknown provider error",
    });
  });

  return {
    recipients: toUserIds.length,
    sent: toUserIds.length - failed.length,
    failed: failed.length,
  };
};
