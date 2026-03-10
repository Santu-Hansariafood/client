import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Loading from "../../common/Loading/Loading";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import { FaTachometerAlt } from "react-icons/fa";
const CardGrid = lazy(() => import("./CardGrid/CardGrid"));
const ChartSection = lazy(() => import("./ChartSection/ChartSection"));

const Dashboard = () => {
  const [counts, setCounts] = useState({
    buyers: 0,
    sellers: 0,
    consignees: 0,
    orders: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const responses = await Promise.all([
        axios.get("/buyers"),
        axios.get("/sellers"),
        axios.get("/consignees"),
        axios.get("/self-order"),
      ]);

      const getCount = (res) => {
        const data = res?.data;
        if (Array.isArray(data)) return data.length;
        if (data && Array.isArray(data.data)) return data.data.length;
        return 0;
      };

      setCounts({
        buyers: getCount(responses[0]),
        sellers: getCount(responses[1]),
        consignees: getCount(responses[2]),
        orders: getCount(responses[3]),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch data counts");
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Admin Report"
        subtitle="Overview of buyers, sellers, consignees, and orders"
        icon={FaTachometerAlt}
        noContentCard
      >
        <div className="max-w-5xl mx-auto">
          <CardGrid counts={counts} />
          <ChartSection />
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default Dashboard;
