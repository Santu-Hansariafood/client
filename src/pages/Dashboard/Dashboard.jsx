import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import api from "../../utils/apiClient/apiClient";
import Loading from "../../common/Loading/Loading";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import { FaTachometerAlt, FaUserTie, FaWeightHanging } from "react-icons/fa";
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
  const [agentSaudas, setAgentSaudas] = useState([]);

  const fetchCounts = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const responses = await Promise.all([
        api.get("/buyers"),
        api.get("/sellers"),
        api.get("/consignees"),
        api.get("/self-order?limit=0"),
        api.get(`/bids?date=${todayStr}`),
      ]);

      const getCount = (res) => {
        const data = res?.data;
        if (data && typeof data.total === "number") return data.total;
        if (Array.isArray(data)) return data.length;
        if (data && Array.isArray(data.data)) return data.data.length;
        return 0;
      };

      const selfOrders = responses[3]?.data || [];
      const saudaByAgent = selfOrders.reduce((acc, order) => {
        const agent = order.agentName || "Direct / Unknown";
        const tons = Number(order.quantity) || 0;
        if (!acc[agent]) {
          acc[agent] = 0;
        }
        acc[agent] += tons;
        return acc;
      }, {});

      const agentSaudaList = Object.entries(saudaByAgent)
        .map(([name, tons]) => ({ name, tons }))
        .sort((a, b) => b.tons - a.tons);

      const totalSaudaTons = agentSaudaList.reduce(
        (sum, item) => sum + item.tons,
        0,
      );

      setAgentSaudas(agentSaudaList);

      setCounts({
        buyers: getCount(responses[0]),
        sellers: getCount(responses[1]),
        consignees: getCount(responses[2]),
        orders: getCount(responses[3]),
        bids: getCount(responses[4]),
        totalSaudaTons,
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
        subtitle="Intelligent monitoring for your distribution network"
        icon={FaTachometerAlt}
        noContentCard
      >
        <div className="relative min-h-screen overflow-hidden -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
          {/* Animated Premium Background with deeper gradients */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f8fafc,_#f1f5f9)]" />
            <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-emerald-400/10 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[150px] rounded-full animate-pulse delay-700" />
            <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-amber-400/5 blur-[120px] rounded-full animate-pulse delay-1000" />
          </div>

          <div className="max-w-7xl mx-auto space-y-16 relative z-10">
            {/* Top Stat Cards Section with Fade-in */}
            <div className="animate-fade-in-up">
              <CardGrid counts={counts} />
            </div>

            {/* Performance Analytics Section */}
            <div className="group relative">
              {/* Ultra-Modern Glow Container */}
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-emerald-500/10 rounded-[4rem] blur-[30px] opacity-20 group-hover:opacity-100 transition duration-1000"></div>
              
              <div className="relative bg-white/40 backdrop-blur-3xl rounded-[3.5rem] p-10 sm:p-14 border border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] animate-fade-in-up delay-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div className="space-y-2">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">Analytics Dashboard</div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Agent Performance Metrics</h2>
                    <p className="text-slate-500 font-medium">Deep-dive distribution analysis by sauda volume and tonnage</p>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/50 border border-white/80 shadow-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em]">Real-time Live Feed</span>
                  </div>
                </div>
                
                <ChartSection agentSaudas={agentSaudas} />
              </div>
            </div>
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default Dashboard;
