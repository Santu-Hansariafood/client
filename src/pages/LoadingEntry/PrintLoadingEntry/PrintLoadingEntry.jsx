import { pdf } from "@react-pdf/renderer";
import api from "../../../utils/apiClient/apiClient";
import LorryChallanPDF from "./LorryChallanPDF";
import { resolveConsigneeDetails } from "./utils/dataExtractors";

const PrintLoadingEntry = async (entry) => {
  try {
    const saudaRes = await api.get("/self-order", { params: { saudaNo: entry.saudaNo } });
    const ordersData = Array.isArray(saudaRes.data) ? saudaRes.data : saudaRes.data?.data || [];
    const saudaData = ordersData.find(order => order.saudaNo === entry.saudaNo) || {};

    const consigneeDetails = await resolveConsigneeDetails(entry.consignee);

    const pdfData = {
      ...entry,
      buyer: {
        buyerCompany: saudaData.buyerCompany || entry.buyerCompany,
        address: saudaData.buyerAddress,
        gstNo: saudaData.buyerGstNo,
      },
      seller: {
        sellerName: entry.supplierCompany,
      },
      consignee: consigneeDetails || entry.consignee,
    };

    const doc = await pdf(<LorryChallanPDF data={pdfData} />);
    return doc;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};

export default PrintLoadingEntry;