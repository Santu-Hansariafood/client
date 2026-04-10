import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import api from "../../utils/apiClient/apiClient";
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
    bids: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const responses = await Promise.all([
        api.get("/buyers"),
        api.get("/sellers"),
        api.get("/consignees"),
        api.get("/self-order"),
        api.get("/bids"),
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
        bids: getCount(responses[4]),
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch data counts",
      );
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
        <div className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="animate-fade-in-up">
              <CardGrid counts={counts} />
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm animate-fade-in-up delay-100">
              <ChartSection />
            </div>
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default Dashboard;
