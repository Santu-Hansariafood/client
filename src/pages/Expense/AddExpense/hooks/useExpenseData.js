import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../../utils/apiClient/apiClient";

const useExpenseData = ({ isAdmin, page, limit, filters }) => {
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [total, setTotal] = useState(0);
  const [trackedAmount, setTrackedAmount] = useState(0);
  const [financialYears, setFinancialYears] = useState([]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/expense-categories");
      if (!Array.isArray(response.data)) {
        throw new Error("Expense categories response is not a list");
      }
      setCategories(response.data);
    } catch {
      toast.error("Failed to fetch categories");
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get("/expense-requests/employees");
      if (!Array.isArray(response.data)) {
        throw new Error("Employee response is not a list");
      }
      setEmployees(response.data || []);
    } catch {
      toast.error("Failed to fetch employees");
    }
  }, []);

  const fetchSellers = useCallback(async () => {
    try {
      const response = await api.get("/sellers?status=active&limit=1000");
      const sellerList = Array.isArray(response.data)
        ? response.data
        : response.data?.data;
      if (!Array.isArray(sellerList)) {
        throw new Error("Sellers response is not a list");
      }
      setSellers(sellerList);
    } catch {
      toast.error("Failed to fetch sellers");
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters,
      }).toString();
      const response = await api.get(`/expense-requests?${queryParams}`);
      if (!Array.isArray(response.data.requests)) {
        throw new Error("Expense requests response is not a list");
      }
      setRequests(response.data.requests);
      setTotal(response.data.total);
      setTrackedAmount(response.data.totalAmount || 0);
      setFinancialYears(response.data.financialYears || []);
    } catch {
      toast.error("Failed to fetch expense requests");
    }
  }, [filters, limit, page]);

  const handleStatusUpdate = useCallback(
    async (id, status) => {
      try {
        await api.put(`/expense-requests/${id}/status`, { status });
        toast.success(`Request ${status} successfully`);
        await fetchRequests();
      } catch {
        toast.error("Failed to update status");
      }
    },
    [fetchRequests],
  );

  useEffect(() => {
    fetchCategories();
    fetchSellers();
  }, [fetchCategories, fetchSellers]);

  useEffect(() => {
    if (isAdmin) fetchEmployees();
  }, [fetchEmployees, isAdmin]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    categories,
    employees,
    fetchCategories,
    fetchRequests,
    financialYears,
    handleStatusUpdate,
    requests,
    sellers,
    total,
    trackedAmount,
  };
};

export default useExpenseData;
