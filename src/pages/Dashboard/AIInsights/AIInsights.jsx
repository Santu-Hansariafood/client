import { useState, useEffect } from "react";
import { FaRobot, FaLightbulb, FaChartLine, FaExclamationTriangle } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";

const AIInsights = ({ month, year }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        // Fetch stats for the selected period
        const response = await api.get(`/dashboard/stats?month=${month}&year=${year}`);
        const data = response.data;

        // Simulate AI generating insights based on the data
        const generatedInsights = [
          {
            id: 1,
            type: "trend",
            icon: <FaChartLine className="text-emerald-400" />,
            title: "Market Momentum",
            text: data?.totalSaudaTons > 0 
              ? `Sauda volume is showing a healthy trend with ${data.totalSaudaTons.toLocaleString()} tons recorded in ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })}.`
              : `No sauda volume recorded for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} yet. Operations are in standby mode.`,
          },
          {
            id: 2,
            type: "performance",
            icon: <FaLightbulb className="text-amber-400" />,
            title: "Top Performer",
            text: data?.agentSaudas?.length > 0 
              ? `Agent ${data.agentSaudas[0].name} is leading the distribution with ${data.agentSaudas[0].tons.toLocaleString()} tons.`
              : "Distribution metrics are being calibrated for this period.",
          },
          {
            id: 3,
            type: "alert",
            icon: <FaExclamationTriangle className="text-rose-400" />,
            title: "Operational Alert",
            text: (data?.orders || 0) < 5 
              ? "Order frequency is lower than seasonal averages. Recommended: Review bid participation rates."
              : "System operations are scaling normally with consistent order flow.",
          }
        ];

        setInsights(generatedInsights);
      } catch (error) {
        console.error("Failed to generate AI insights", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [month, year]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-6 sm:p-8 shadow-2xl group">
      {/* Futuristic Background Elements */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-1000" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-1000" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <FaRobot className="text-indigo-400 text-2xl animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">AI Market Insights</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Analysis Active</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <div 
                key={insight.id}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 group/card"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/5 rounded-lg group-hover/card:scale-110 transition-transform duration-500">
                    {insight.icon}
                  </div>
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest">{insight.title}</h4>
                </div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed group-hover/card:text-slate-300 transition-colors">
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Powered by Seria.ai Distribution Intelligence
          </p>
          <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">
            Generate Full Report →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
