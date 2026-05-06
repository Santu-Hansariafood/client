export const formatDate = (date) => {
  const d = new Date(date);
  return isNaN(d)
    ? "N/A"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

export const pick = (v) => v || "N/A";

export const setBold = (doc) => doc.setFont("helvetica", "bold");
export const setNormal = (doc) => doc.setFont("helvetica", "normal");

export const getBase64 = (img) =>
  new Promise((resolve) => {
    const image = new Image();
    image.src = img;
    image.crossOrigin = "Anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(null);
  });

export const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const normalizeLoose = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

export const isObjectId = (value) =>
  /^[a-f\d]{24}$/i.test(String(value || "").trim());

export const wrapText = (text, maxLength, maxLines = 3) => {
  if (!text) return [""];
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";
  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > maxLength) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1 && maxLines > 1) {
        currentLine = currentLine.substring(0, maxLength - 3) + "...";
        lines.push(currentLine);
        currentLine = "";
      }
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine && lines.length < maxLines) lines.push(currentLine);
  if (lines.length === 0) lines.push("");
  return lines;
};

export const hasValue = (value) =>
  value !== undefined &&
  value !== null &&
  String(value).trim() !== "" &&
  String(value).trim().toLowerCase() !== "n/a";

export const pickDisplay = (value, fallback = "N/A") =>
  hasValue(value) ? String(value).trim() : fallback;

export const formatMoney = (value) =>
  hasValue(value) ? `Rs. ${Number(value).toLocaleString("en-IN")}` : "N/A";

export const drawLabelValue = ({
  doc,
  label,
  value,
  x,
  y,
  valueX,
  labelWidth,
  wrapLength = 60,
  maxLines = 2,
  lineHeight = 4,
}) => {
  const lines = wrapText(pickDisplay(value), wrapLength, maxLines);
  const resolvedValueX = valueX ?? x + (labelWidth || 18);
  setBold(doc);
  doc.text(label, x, y);
  setNormal(doc);
  lines.forEach((line, index) => {
    doc.text(line, resolvedValueX, y + index * lineHeight);
  });
  return Math.max(lines.length, 1) * lineHeight;
};

export const buildAddressFromObject = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  return [
    obj.address,
    obj.location,
    obj.city,
    obj.district,
    obj.state,
    obj.pin || obj.pincode || obj.pinNo || obj.pinCode,
  ]
    .filter(Boolean)
    .join(", ");
};

export const formatConsigneeAddress = (details) => {
  if (!details || typeof details !== "object") return "";
  const base = details.address || details.location || "";
  const district = details.district || "";
  const state = details.state || "";
  const pin =
    details.pin ||
    details.pinNo ||
    details.pincode ||
    details.pinCode ||
    "";
  const place = [district, state].filter(Boolean).join(", ");
  let out = "";
  if (base) out = base;
  if (place) out = out ? `${out}, ${place}` : place;
  if (pin) out = out ? `${out} - ${pin}` : pin;
  return out;
};

export const firstNonEmpty = (...values) => {
  for (const v of values) {
    if (!v) continue;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed) return trimmed;
      continue;
    }
    return v;
  }
  return null;
};
