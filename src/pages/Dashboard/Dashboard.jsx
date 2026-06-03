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
  const [agentSaudas, setAgentSaudas] = useState([]);

  const fetchCounts = useCallback(async () => {
    try {
      const response = await api.get("/dashboard/stats");
      const data = response.data;

      setAgentSaudas(data.agentSaudas || []);
      setCounts({
        buyers: data.buyers || 0,
        sellers: data.sellers || 0,
        consignees: data.consignees || 0,
        orders: data.orders || 0,
        bids: data.bids || 0,
        totalSaudaTons: data.totalSaudaTons || 0,
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch dashboard metrics",
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
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f8fafc,_#f1f5f9)]" />
            <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-emerald-400/10 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[150px] rounded-full animate-pulse delay-700" />
            <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-amber-400/5 blur-[120px] rounded-full animate-pulse delay-1000" />
          </div>

          <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14 lg:space-y-16 relative z-10 min-w-0">
            <div className="animate-fade-in-up">
              <CardGrid counts={counts} />
            </div>

            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-emerald-500/10 rounded-[4rem] blur-[30px] opacity-20 group-hover:opacity-100 transition duration-1000"></div>

              <div className="relative bg-white/40 backdrop-blur-3xl rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-5 sm:p-8 lg:p-12 border border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] animate-fade-in-up delay-200 min-w-0 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-10 lg:mb-12">
                  <div className="space-y-2 min-w-0">
                    <div className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                      Analytics Dashboard
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      Market Intelligence
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">
                      Graphical analytics by saria.ai — sauda, bids, payments
                      & logistics
                    </p>
                  </div>
                  <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/50 border border-white/80 shadow-sm shrink-0 self-start sm:self-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-700 uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                      Real-time Live Feed
                    </span>
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
