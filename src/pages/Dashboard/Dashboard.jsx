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
        title="Administrative Overview"
        subtitle="Manage and monitor your business operations with ease"
        icon={FaTachometerAlt}
        noContentCard
      >
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <CardGrid counts={counts} />
            </div>
          </div>
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-xl shadow-slate-200/50">
            <ChartSection />
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default Dashboard;
