import { pdf } from "@react-pdf/renderer";
import api from "../../../utils/apiClient/apiClient";
import LorryChallanPDF from "./LorryChallanPDF";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { buildSaudaPdfData } from "../../../utils/saudaPdf/buildSaudaPdfData";
import logoUrl from "../../../assets/Hans.png";

const PrintLoadingEntry = async (entry) => {
  try {
    const [consigneeData, supplierData, buyerData, companyData, sellerData] = await Promise.all([
      fetchAllPages("/consignees", { limit: 200 }),
      fetchAllPages("/seller-company", { limit: 200 }),
      fetchAllPages("/buyers", { limit: 200 }),
      fetchAllPages("/companies", { limit: 200 }),
      fetchAllPages("/sellers", { limit: 200 }),
    ]);

    const pdfData = buildSaudaPdfData({
      item: entry,
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