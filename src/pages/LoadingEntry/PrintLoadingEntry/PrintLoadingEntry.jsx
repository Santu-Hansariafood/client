import { pdf } from "@react-pdf/renderer";
import api from "../../../utils/apiClient/apiClient";
import LorryChallanPDF from "./LorryChallanPDF";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { buildSaudaPdfData } from "../../../utils/saudaPdf/buildSaudaPdfData";
import logoUrl from "../../../assets/Hans.png";

const PrintLoadingEntry = async (entry) => {
  try {
    const [consigneeData, supplierData, buyerData, companyData, sellerData, selfOrderRes] = await Promise.all([
      fetchAllPages("/consignees", { limit: 200 }),
      fetchAllPages("/seller-company", { limit: 200 }),
      fetchAllPages("/buyers", { limit: 200 }),
      fetchAllPages("/companies", { limit: 200 }),
      fetchAllPages("/sellers", { limit: 200 }),
      entry.saudaNo ? api.get("/self-order", { params: { saudaNo: entry.saudaNo, limit: 0 } }) : Promise.resolve({ data: [] }),
    ]);

    const selfOrders = selfOrderRes?.data?.data || selfOrderRes?.data || [];
    const selfOrder = selfOrders.find((o) => o.saudaNo === entry.saudaNo) || selfOrders[0] || null;

    const pdfData = buildSaudaPdfData({
      item: { ...entry, ...selfOrder },
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

    const doc = await pdf(<LorryChallanPDF data={pdfData} logoUrl={logoUrl} />);
    return doc;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};

export default PrintLoadingEntry;