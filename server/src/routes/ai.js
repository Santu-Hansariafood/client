import { Router } from "express";

const router = Router();

const getWebhookUrl = () => (process.env.N8N_AI_WEBHOOK_URL || "").trim();

const getTimeoutMs = () => {
  const configured = Number(process.env.N8N_AI_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : 90000;
};

// n8n can answer with an object, an array of items, or a raw string.
const normalizeAgentPayload = (payload) => {
  const items = Array.isArray(payload) ? payload : [payload];
  const item = items.find((entry) => entry && typeof entry === "object") || {};
  const body =
    item.body && typeof item.body === "object"
      ? item.body
      : item.json && typeof item.json === "object"
        ? item.json
        : item;

  if (typeof body === "string") {
    return { content: body.trim(), suggestions: [] };
  }

  const content =
    body.content ?? body.output ?? body.text ?? body.answer ?? body.message ?? "";

  const suggestions = Array.isArray(body.suggestions)
    ? body.suggestions
        .filter((suggestion) => typeof suggestion === "string" && suggestion.trim())
        .slice(0, 4)
    : [];

  const action =
    body.action && typeof body.action === "object" && !Array.isArray(body.action)
      ? body.action
      : null;

  return { content: String(content || "").trim(), suggestions, action };
};

router.post("/chat", async (req, res) => {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return res
      .status(503)
      .json({ code: "AI_WEBHOOK_NOT_CONFIGURED", message: "Saria AI agent is not configured" });
  }

  const { message, history, context } = req.body || {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ message: "message is required" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const token = req.cookies?.accessToken;

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(process.env.API_KEY ? { "x-api-key": process.env.API_KEY } : {}),
      ...(process.env.N8N_AI_WEBHOOK_TOKEN
        ? { "x-saria-token": process.env.N8N_AI_WEBHOOK_TOKEN }
        : {}),
    };

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        message: message.trim(),
        history: Array.isArray(history) ? history.slice(-10) : [],
        context: context && typeof context === "object" ? context : {},
        user: { id: req.user?.sub, role: req.user?.role },
        api: { baseUrl: process.env.N8N_AI_APP_API_URL || "" },
      }),
    });

    if (!webhookResponse.ok) {
      const detail = (await webhookResponse.text().catch(() => "")).slice(0, 300);
      return res.status(502).json({
        code: "AI_WEBHOOK_ERROR",
        message: `Saria AI agent responded with ${webhookResponse.status}`,
        detail,
      });
    }

    const payload = await webhookResponse.json().catch(() => null);
    const { content, suggestions, action } = normalizeAgentPayload(payload);

    if (!content) {
      return res
        .status(502)
        .json({ code: "AI_EMPTY_RESPONSE", message: "Saria AI agent returned an empty answer" });
    }

    return res.json({ content, suggestions, action });
  } catch (error) {
    const aborted = error.name === "AbortError";
    return res.status(aborted ? 504 : 502).json({
      code: aborted ? "AI_WEBHOOK_TIMEOUT" : "AI_WEBHOOK_UNREACHABLE",
      message: aborted
        ? "Saria AI agent timed out"
        : "Saria AI agent could not be reached",
    });
  } finally {
    clearTimeout(timer);
  }
});

export default router;
