import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { downloadFile } from "./fileDownloader";

const BRAND_GREEN = [5, 150, 105];
const BRAND_INK = [15, 23, 42];

// Saria AI answers use light markdown (*bold*, _italic_, `code`). Exported
// files should read as plain text, so the emphasis markers are removed.
export const stripSariaMarkdown = (value) =>
  String(value ?? "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .trim();

const pad = (value) => String(value).padStart(2, "0");

const fileStamp = () => {
  const now = new Date();
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}`;
};

const safeName = (value, fallback = "saria-ai-answer") => {
  const cleaned = String(value ?? "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return cleaned || fallback;
};

// Splits a formatted Saria AI reply into a title, raw lines and label/value
// rows so the same answer can be rendered as a PDF, an Excel sheet or an image.
export const parseSariaAnswer = (rawContent, fallbackTitle = "Saria AI Answer") => {
  const text = stripSariaMarkdown(rawContent);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const title =
    (lines[0] || fallbackTitle).replace(/:\s*$/, "").trim() || fallbackTitle;

  const rows = lines.map((line) => {
    const bullet = line
      .replace(/^[•*-]\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .trim();
    // Only treat "Label: value" as a pair. Requiring a space after the colon
    // and skipping URLs keeps times ("10:00") and links intact.
    const pair = !bullet.includes("://")
      ? bullet.match(/^([A-Za-z][^:]{1,58}?):\s+(.+)$/)
      : null;
    return pair
      ? { Field: pair[1].trim(), Value: pair[2].trim() }
      : { Field: "", Value: bullet };
  });

  return { title, lines, rows };
};

const resolveFileName = (title, extension) =>
  `${safeName(title)}-${fileStamp()}.${extension}`;

export const exportSariaAnswerToPdf = async (rawContent) => {
  const { title, lines } = parseSariaAnswer(rawContent);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pageWidth, 62, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Saria AI", margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Hansaria Food Pvt. Ltd.", margin, 46);
  doc.text(new Date().toLocaleString("en-GB"), pageWidth - margin, 46, {
    align: "right",
  });

  doc.setTextColor(...BRAND_INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  let cursorY = 96;
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 18 + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  lines.slice(1).forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth);
    const blockHeight = wrapped.length * 16;
    if (cursorY + blockHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 10;
    }
    doc.text(wrapped, margin, cursorY);
    cursorY += blockHeight + 4;
  });

  await downloadFile(doc, resolveFileName(title, "pdf"));
};

export const exportSariaAnswerToExcel = async (rawContent) => {
  const { title, lines, rows } = parseSariaAnswer(rawContent);
  const hasFields = rows.some((row) => row.Field);
  const sheetRows = hasFields
    ? rows.map((row) => ({ Field: row.Field || "Detail", Value: row.Value }))
    : lines.map((line, index) => ({ "#": index + 1, Detail: line }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Saria AI");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  await downloadFile(blob, resolveFileName(title, "xlsx"));
};

export const exportSariaAnswerToImage = async (rawContent) => {
  const { title, lines } = parseSariaAnswer(rawContent);
  const scale = 2;
  const width = 760;
  const padding = 36;
  const headerHeight = 84;
  const titleSize = 22;
  const bodySize = 15;
  const titleLineHeight = titleSize + 8;
  const bodyLineHeight = 26;
  const maxWidth = width - padding * 2;

  const measureCtx = document.createElement("canvas").getContext("2d");

  const wrap = (text, font) => {
    measureCtx.font = font;
    const words = String(text).split(/\s+/).filter(Boolean);
    const out = [];
    let current = "";
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (measureCtx.measureText(candidate).width > maxWidth && current) {
        out.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    if (current) out.push(current);
    return out.length ? out : [""];
  };

  const titleLines = wrap(title, `bold ${titleSize}px Arial, sans-serif`);
  const bodyLines = lines
    .slice(1)
    .flatMap((line) => wrap(line, `${bodySize}px Arial, sans-serif`));

  const height =
    headerHeight +
    36 +
    titleLines.length * titleLineHeight +
    10 +
    bodyLines.length * bodyLineHeight +
    padding;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#059669";
  ctx.fillRect(0, 0, width, headerHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillText("Saria AI", padding, 40);
  ctx.font = "13px Arial, sans-serif";
  ctx.fillText(
    `Hansaria Food Pvt. Ltd. • ${new Date().toLocaleDateString("en-GB")}`,
    padding,
    62,
  );

  let y = headerHeight + 36;
  ctx.fillStyle = "#0f172a";
  ctx.font = `bold ${titleSize}px Arial, sans-serif`;
  titleLines.forEach((line) => {
    ctx.fillText(line, padding, y);
    y += titleLineHeight;
  });
  y += 10;

  ctx.fillStyle = "#1f2937";
  ctx.font = `${bodySize}px Arial, sans-serif`;
  bodyLines.forEach((line) => {
    ctx.fillText(line, padding, y);
    y += bodyLineHeight;
  });

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Could not render the answer as an image");

  await downloadFile(blob, resolveFileName(title, "png"));
};
