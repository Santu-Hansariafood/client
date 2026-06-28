import { useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../../../utils/apiClient/apiClient";

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
};

export const useCopyEntry = () => {
  const handleCopy = useCallback(async (entry) => {
    const toastId = toast.loading("Preparing details to copy...");

    let cdValue = 0;
    let gstValue = 0;
    try {
      const selfOrderRes = await api.get("/self-order", {
        params: { search: entry.saudaNo, limit: 1 },
      });
      const selfOrders = Array.isArray(selfOrderRes?.data?.data)
        ? selfOrderRes.data.data
        : Array.isArray(selfOrderRes?.data)
        ? selfOrderRes.data
        : [];

      const normalize = (v) => String(v || "").trim().toLowerCase();
      const selfOrder = selfOrders.find(
        (order) => normalize(order?.saudaNo) === normalize(entry?.saudaNo)
      );
      if (selfOrder) {
        cdValue = Number(selfOrder.cd || 0);
        gstValue = Number(selfOrder.gst || 0);
      }
    } catch (e) {
      console.error("Error fetching sauda for copy:", e);
    }

    const grossAmount = (entry.unloadingWeight || 0) * (entry.actualRate || 0);
    const cdDeduction = grossAmount * (cdValue / 100);
    const taxableValue = grossAmount - cdDeduction;
    const gstAmount = taxableValue * (gstValue / 100);
    const finalAmount = taxableValue + gstAmount;

    const documents = [];
    if (entry.documents?.kantaSlip)
      documents.push(`Kanta Slip: ${entry.documents.kantaSlip}`);
    if (entry.documents?.unloadingChallan)
      documents.push(`Unloading Challan: ${entry.documents.unloadingChallan}`);
    if (entry.documents?.partyBillCopy)
      documents.push(`Party Bill Copy: ${entry.documents.partyBillCopy}`);

    const textToCopy = `*RECEIVING ENTRY DETAILS*

*Sauda No:* _${entry.saudaNo || "N/A"}_
*Invoice No:* _${entry.billNumber || "N/A"}_
*Seller Bill No:* _${entry.sellerBillNo || "N/A"}_
*Lorry No:* _${(entry.lorryNumber || "N/A").toUpperCase()}_
*Loading Weight:* _${entry.loadingWeight || 0}_ *Tons*
*Unloading Weight:* _${entry.unloadingWeight || 0}_ *Tons*
*Rejected Quantity:* _${(Number(entry.loadingWeight || 0) - Number(entry.unloadingWeight || 0)).toFixed(2)}_ *Tons*
*Loading Date:* _${formatDate(entry.loadingDate)}_
*Unloading Date:* _${formatDate(entry.unloadingDate)}_
*Rate:* _Rs. ${entry.actualRate || 0}_
*Gross Amount:* _Rs. ${grossAmount.toFixed(2)}_
${cdValue > 0 ? `*CD (${cdValue}%):* _ Rs. - ${cdDeduction.toFixed(2)}_` : ""}
${cdValue > 0 ? `*Taxable Value:* _Rs. ${taxableValue.toFixed(2)}_` : ""}
${gstValue > 0 ? `*GST (${gstValue}%):* _+ Rs. ${gstAmount.toFixed(2)}_` : ""}
*Final Amount:* _Rs. ${finalAmount.toFixed(2)}_
*Seller Company:* _${entry.supplierCompany || "N/A"}_
*Buyer Company:* _${entry.buyerCompany || "N/A"}_

*DOCUMENTS:*

${
  documents.length > 0
    ? documents.map((doc) => `• _${doc}_`).join("\n")
    : "_No documents attached_"
}

_*Thanks and Regards,*_
_*Purchase Team*_
_*Hansaria Food Private Limited*_`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        toast.update(toastId, {
          render: "Entry details copied to clipboard!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.update(toastId, {
          render: "Failed to copy details",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      });
  }, []);

  return { handleCopy };
};
