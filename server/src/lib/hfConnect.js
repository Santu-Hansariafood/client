const HF_CONNECT_URL = "https://hfconnect.in/api/v1/messages/send";
const normalizeRecipient = (recipient) => {
  const value = String(recipient || "").trim();
  const digits = value.replace(/\D/g, "");
  const mobile =
    digits.length === 10
      ? digits
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits.length === 12 && digits.startsWith("91")
          ? digits.slice(2)
          : null;

  return mobile && /^[6-9]\d{9}$/.test(mobile) ? `+91${mobile}` : null;
};

const toTemplateString = (value) =>
  value === undefined || value === null ? "" : String(value);

const buildVariables = ({ bid, participation }) => ({
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
});

const sendMessage = async (toUserId, payload) => {
  const response = await fetch(HF_CONNECT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HANSARIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      templateId: process.env.HANSARIA_TEMPLATE_ID,
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
    throw new Error(
      result.error ||
        result.message ||
        `Request failed: ${response.status}`,
    );
  }

  return result;
};

export const sendBidMessages = async ({
  event,
  bid,
  recipients,
  participation,
}) => {
  const uniqueRecipients = [
    ...new Set(
      (recipients || [])
        .map((recipient) => String(recipient || "").trim())
        .filter(Boolean),
    ),
  ];
  const normalizedRecipients = uniqueRecipients
    .map(normalizeRecipient)
    .filter(Boolean);
  const toUserIds = [...new Set(normalizedRecipients)];
  const invalidRecipients = uniqueRecipients.length - normalizedRecipients.length;
  const recipientCount = toUserIds.length + invalidRecipients;

  if (invalidRecipients > 0) {
    console.error("HF Connect skipped invalid seller mobile numbers:", {
      event,
      count: invalidRecipients,
    });
  }
  if (toUserIds.length === 0) {
    return { recipients: recipientCount, sent: 0, failed: invalidRecipients };
  }

  const requiredConfig = ["HANSARIA_API_KEY", "HANSARIA_TEMPLATE_ID"];
  const missingConfig = requiredConfig.filter((key) => !process.env[key]);
  if (missingConfig.length > 0) {
    console.error(
      "HF Connect is not configured; missing:",
      missingConfig.join(", "),
    );
    return { recipients: recipientCount, sent: 0, failed: recipientCount };
  }

  const results = await Promise.allSettled(
    toUserIds.map((toUserId) =>
      sendMessage(
        toUserId,
        buildVariables({ bid, participation }),
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
    recipients: recipientCount,
    sent: toUserIds.length - failed.length,
    failed: failed.length + invalidRecipients,
  };
};
