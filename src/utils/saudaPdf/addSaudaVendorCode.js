import api from "../apiClient/apiClient";

export const addSaudaVendorCode = async (pdfData) => {
  const { vendorCodeBuyerId, vendorCodeGroupId, vendorCodeSellerId } = pdfData;
  if (!vendorCodeBuyerId || !vendorCodeSellerId) {
    return { ...pdfData, vendorCode: "" };
  }

  const response = await api.get("/vendor-codes", {
    params: {
      buyer: vendorCodeBuyerId,
      seller: vendorCodeSellerId,
      ...(vendorCodeGroupId ? { group: vendorCodeGroupId } : {}),
      page: 1,
      limit: 1,
    },
  });

  return {
    ...pdfData,
    vendorCode: response.data?.data?.[0]?.vendorCode || "",
  };
};
