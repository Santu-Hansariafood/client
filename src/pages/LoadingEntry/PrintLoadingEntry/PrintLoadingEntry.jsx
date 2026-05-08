import { pdf } from "@react-pdf/renderer";
import api from "../../../utils/apiClient/apiClient";
import LorryChallanPDF from "./LorryChallanPDF";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { buildSaudaPdfData } from "../../../utils/saudaPdf/buildSaudaPdfData";
import logoUrl from "../../../assets/Hans.png";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const PrintLoadingEntry = async (entry) => {
  try {
    if (!entry) {
      console.error("PrintLoadingEntry: No entry provided");
      return null;
    }

    const results = await Promise.allSettled([
      fetchAllPages("/consignees", { limit: 200 }),

      fetchAllPages("/seller-company", { limit: 200 }),

      fetchAllPages("/buyers", { limit: 200 }),

      fetchAllPages("/companies", { limit: 200 }),

      entry.saudaNo
        ? api.get("/self-order", {
            params: {
              saudaNo: entry.saudaNo,
              limit: 0,
            },
          })
        : Promise.resolve({ data: [] }),
    ]);

    const [consigneeData, supplierData, buyerData, companyData, selfOrderRes] =
      results.map((result) =>
        result.status === "fulfilled" ? result.value : [],
      );

    const selfOrders = Array.isArray(selfOrderRes?.data?.data)
      ? selfOrderRes.data.data
      : Array.isArray(selfOrderRes?.data)
        ? selfOrderRes.data
        : [];
    const selfOrder =
      selfOrders.find(
        (order) => normalize(order?.saudaNo) === normalize(entry?.saudaNo),
      ) || null;

    const pdfData = buildSaudaPdfData({
      item: {
        ...entry,
        ...(selfOrder || {}),
      },

      consigneeData,
      supplierData,
      buyerData,
      companyData,

      getConsigneeDisplay: (row) => {
        const consignee = row?.consignee;

        if (typeof consignee === "object" && consignee?.name) {
          return consignee.name;
        }

        if (typeof consignee === "object" && consignee?.label) {
          return consignee.label;
        }

        return String(consignee || "N/A");
      },
    });

    const document = (
      <LorryChallanPDF data={pdfData} logoUrl={logoUrl?.default || logoUrl} />
    );

    const pdfInstance = pdf(document);

    const blob = await pdfInstance.toBlob();

    return blob;
  } catch (error) {
    console.error("Error generating lorry challan PDF:", {
      error,
      entry,
    });

    return null;
  }
};

export default PrintLoadingEntry;
