import { useState, useEffect } from "react";
import {
  FaChartLine,
  FaLightbulb,
  FaExclamationTriangle,
  FaBolt,
} from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";
import SariaAiBrand from "../../../common/SariaAiBrand/SariaAiBrand";

const AIInsights = ({ month, year }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const response = await api.get(
          `/dashboard/stats?month=${month}&year=${year}`,
        );
        const data = response.data;
        const monthLabel = new Date(year, month - 1).toLocaleString(
          "default",
          { month: "long" },
        );

        setInsights([
          {
            id: 1,
            type: "trend",
            icon: FaChartLine,
            accent: "from-emerald-400/20 to-teal-500/10",
            iconColor: "text-emerald-400",
            title: "Market Momentum",
            text:
              data?.totalSaudaTons > 0
                ? `Sauda volume is ${data.totalSaudaTons.toLocaleString()} tons in ${monthLabel}.`
                : `No sauda volume in ${monthLabel} yet — saria.ai is monitoring.`,
          },
          {
            id: 2,
            type: "performance",
            icon: FaLightbulb,
            accent: "from-amber-400/20 to-orange-500/10",
            iconColor: "text-amber-400",
            title: "Top Performer",
            text:
              data?.agentSaudas?.length > 0
                ? `${data.agentSaudas[0].name} leads with ${data.agentSaudas[0].tons.toLocaleString()} tons.`
                : "Distribution metrics calibrating for this period.",
          },
          {
            id: 3,
            type: "alert",
            icon: FaExclamationTriangle,
            accent: "from-rose-400/20 to-pink-500/10",
            iconColor: "text-rose-400",
            title: "Operational Alert",
            text:
              (data?.orders || 0) < 5
                ? "Order frequency below seasonal average — review bid participation."
                : "Operations scaling normally with consistent order flow.",
          },
        ]);
      } catch (error) {
        console.error("Failed to generate saria.ai insights", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [month, year]);

  return (
    <div className="mi-perspective relative">
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-white/15 p-4 sm:p-6 lg:p-8 shadow-2xl mi-card-3d"
        style={{
          background:
            "linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.92) 45%, rgba(15,23,42,0.98) 100%)",
          boxShadow:
            "0 28px 56px -20px rgba(49,46,129,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-16 w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-indigo-500/25 blur-[80px] mi-float-orb" />
          <div className="absolute -bottom-20 -left-16 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-cyan-500/20 blur-[70px] mi-float-orb" style={{ animationDelay: "1.5s" }} />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative z-10 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border border-indigo-400/30 shadow-[0_0_32px_rgba(99,102,241,0.45)]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(6,182,212,0.25))",
                  transform: "translateZ(20px)",
                }}
              >
                <FaBolt className="text-indigo-300 text-xl sm:text-2xl" />
              </div>
              <div className="min-w-0">
                <SariaAiBrand
                  size="md"
                  light
                  subtitle="Market insights · live analysis"
                />
                <div className="flex items-center gap-2 mt-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-300/90 uppercase tracking-widest">
                    saria.ai engine active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 sm:h-28 rounded-xl sm:rounded-2xl bg-white/5 animate-pulse border border-white/10"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {insights.map((insight, idx) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={insight.id}
                    className="mi-card-3d relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden group"
                    style={{
                      background: `linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
                      animationDelay: `${idx * 100}ms`,
                    }}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${insight.accent} opacity-60`}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                          <Icon className={`${insight.iconColor} text-sm`} />
                        </div>
                        <h4 className="text-[10px] sm:text-xs font-black text-slate-100 uppercase tracking-widest truncate">
                          {insight.title}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300/95 font-medium leading-relaxed line-clamp-4">
                        {insight.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 sm:pt-4 border-t border-white/10 flex flex-col xs:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Powered by saria.ai distribution intelligence
            </p>
            <span className="text-[9px] sm:text-[10px] font-black text-indigo-300 uppercase tracking-widest">
              Full report · coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
