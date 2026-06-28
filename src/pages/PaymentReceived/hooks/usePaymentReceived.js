import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";

export const usePaymentReceived = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [nextVoucherNumber, setNextVoucherNumber] = useState(1);

  // Fetch next voucher number
  const fetchNextVoucherNumber = useCallback(async () => {
    try {
      const response = await api.get("/payments/next-voucher");
      setNextVoucherNumber(response.data?.voucherNumber || 1);
    } catch (err) {
      console.error("Error fetching next voucher number:", err);
    }
  }, []);

  // Fetch all payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/payments", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchInput,
        },
      });

      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      setPayments(data);
      setTotalItems(Number(payload.total) || 0);
      
      // Also update next voucher number
      if (data.length > 0) {
        const maxVoucher = Math.max(...data.map(p => Number(p.voucherNumber) || 0));
        setNextVoucherNumber(maxVoucher + 1);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Failed to load payments");
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchInput]);

  // Save payment (add or update)
  const savePayment = useCallback(async (paymentData) => {
    try {
      setLoading(true);
      
      let response;
      if (paymentData.id) {
        // Update existing payment
        response = await api.put(`/payments/${paymentData.id}`, paymentData);
        toast.success("Payment updated successfully!");
      } else {
        // Add new payment - ensure voucher number is auto-generated
        const paymentWithVoucher = {
          ...paymentData,
          voucherNumber: nextVoucherNumber,
        };
        response = await api.post("/payments", paymentWithVoucher);
        toast.success("Payment added successfully!");
        setNextVoucherNumber(prev => prev + 1);
      }

      await fetchPayments();
      setShowForm(false);
      setSelectedPayment(null);
    } catch (err) {
      console.error("Error saving payment:", err);
      toast.error("Failed to save payment");
    } finally {
      setLoading(false);
    }
  }, [fetchPayments, nextVoucherNumber]);

  // Delete payment
  const deletePayment = useCallback(async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/payments/${paymentId}`);
      toast.success("Payment deleted successfully!");
      await fetchPayments();
    } catch (err) {
      console.error("Error deleting payment:", err);
      toast.error("Failed to delete payment");
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  // Scan voucher and fetch payment details
  const scanVoucher = useCallback(async (voucherNumber) => {
    try {
      setLoading(true);
      const response = await api.get(`/payments/voucher/${voucherNumber}`);
      setSelectedPayment(response.data);
      setShowDetails(true);
      setShowForm(false);
    } catch (err) {
      console.error("Error fetching payment by voucher:", err);
      toast.error("Payment not found for this voucher");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add entry to existing payment
  const addEntryToPayment = useCallback(async (paymentId, entryData) => {
    try {
      setLoading(true);
      const response = await api.post(`/payments/${paymentId}/entries`, entryData);
      toast.success("Entry added successfully!");
      await fetchPayments();
    } catch (err) {
      console.error("Error adding entry:", err);
      toast.error("Failed to add entry");
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  // Update entry in payment
  const updatePaymentEntry = useCallback(async (paymentId, entryId, entryData) => {
    try {
      setLoading(true);
      await api.put(`/payments/${paymentId}/entries/${entryId}`, entryData);
      toast.success("Entry updated successfully!");
      await fetchPayments();
    } catch (err) {
      console.error("Error updating entry:", err);
      toast.error("Failed to update entry");
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  // Delete entry from payment
  const deletePaymentEntry = useCallback(async (paymentId, entryId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/payments/${paymentId}/entries/${entryId}`);
      toast.success("Entry deleted successfully!");
      await fetchPayments();
    } catch (err) {
      console.error("Error deleting entry:", err);
      toast.error("Failed to delete entry");
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  useEffect(() => {
    fetchPayments();
    fetchNextVoucherNumber();
  }, [fetchPayments, fetchNextVoucherNumber]);

  return {
    payments,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    searchInput,
    selectedPayment,
    showForm,
    showDetails,
    nextVoucherNumber,
    setCurrentPage,
    setItemsPerPage,
    setSearchInput,
    setSelectedPayment,
    setShowForm,
    setShowDetails,
    fetchPayments,
    savePayment,
    deletePayment,
    scanVoucher,
    addEntryToPayment,
    updatePaymentEntry,
    deletePaymentEntry,
  };
};