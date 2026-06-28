import { useState, useCallback } from "react";
import api from "../../../../utils/apiClient/apiClient";

export const useCdGstFetcher = () => {
  const [cdValue, setCdValue] = useState(0);
  const [gstValue, setGstValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCdGst = useCallback(async (saudaNo) => {
    if (!saudaNo) {
      setCdValue(0);
      setGstValue(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selfOrderRes = await api.get("/self-order", {
        params: { search: saudaNo, limit: 1 },
      });
      
      const selfOrders = Array.isArray(selfOrderRes?.data?.data)
        ? selfOrderRes.data.data
        : Array.isArray(selfOrderRes?.data)
        ? selfOrderRes.data
        : [];

      const normalize = (v) => String(v || "").trim().toLowerCase();
      const selfOrder = selfOrders.find(
        (order) => normalize(order?.saudaNo) === normalize(saudaNo)
      );

      if (selfOrder) {
        setCdValue(Number(selfOrder.cd || 0));
        setGstValue(Number(selfOrder.gst || 0));
      } else {
        setCdValue(0);
        setGstValue(0);
      }
    } catch (e) {
      console.error("Error fetching sauda for CD/GST:", e);
      setError("Failed to fetch CD/GST values");
      setCdValue(0);
      setGstValue(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetValues = useCallback(() => {
    setCdValue(0);
    setGstValue(0);
    setError(null);
  }, []);

  return {
    cdValue,
    gstValue,
    cdGstLoading: loading,
    cdGstError: error,
    fetchCdGst,
    resetValues,
  };
};
