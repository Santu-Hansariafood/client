import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import SaudaPDF from "../../components/DownloadSauda/SaudaPDF/SaudaPDF";
import { fetchAllPages } from "../apiClient/fetchAllPages";
import { buildSaudaPdfData } from "./buildSaudaPdfData";

const toTrimmed = (value) => String(value || "").trim();

const collectUniqueEmails = (emails = []) => {
  const seen = new Set();
  const output = [];
  for (const raw of emails) {
    const value = toTrimmed(raw);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }
  return output;
};

export const sendSaudaOrderEmails = async (order) => {
  const shouldSendBuyer = order?.sendPOToBuyer === "yes";
  const shouldSendSupplier = order?.sendPOToSupplier === "yes";
  if (!shouldSendBuyer && !shouldSendSupplier) return;

  const buyerEmails = Array.isArray(order?.buyerEmails) ? order.buyerEmails : [];
  const buyerFromSingle = order?.buyerEmail ? [order.buyerEmail] : [];
  const sellerEmails = Array.isArray(order?.sellerEmails) ? order.sellerEmails : [];

  const recipients = collectUniqueEmails([
    ...(shouldSendBuyer ? [...buyerEmails, ...buyerFromSingle] : []),
    ...(shouldSendSupplier ? sellerEmails : []),
  ]);

  if (recipients.length === 0) return;

  const [consigneeData, supplierData, buyerData, companyData] = await Promise.all([
    fetchAllPages("/consignees", { limit: 200 }),
    fetchAllPages("/seller-company", { limit: 200 }),
    fetchAllPages("/buyers", { limit: 200 }),
    fetchAllPages("/companies", { limit: 200 }),
  ]);

  const transformedData = buildSaudaPdfData({
    item: order,
    consigneeData,
    supplierData,
    buyerData,
    companyData,
    getConsigneeDisplay: (row) => {
      const c = row?.consignee;
      if (typeof c === "object" && c?.name) return c.name;
      if (typeof c === "object" && c?.label) return c.label;
      return String(c || "N/A");
    },
  });

  const blob = await pdf(<SaudaPDF data={transformedData} />).toBlob();
  const base64data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      try {
        const result = reader.result;
        const base64 = typeof result === "string" ? result.split(",")[1] : "";
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
  });

  await axios.post("/api/email/send-pdf", {
    email: recipients.join(", "),
    pdf: base64data,
    saudaNo: order?.saudaNo || "",
    poNumber: order?.poNumber || "",
    buyer: order?.buyer || "",
    buyerCompany: order?.buyerCompany || "",
    consignee: order?.consignee || "",
    supplierCompany: order?.supplierCompany || "",
    commodity: order?.commodity || "",
    quantity: order?.quantity ?? "",
    rate: order?.rate ?? "",
  });
};

