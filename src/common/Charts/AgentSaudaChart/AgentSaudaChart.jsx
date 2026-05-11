import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 shadow-2xl border border-slate-100 rounded-xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            {payload[0].value.toLocaleString()} Tons
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const AgentSaudaChart = ({ data, chartType = "bar" }) => {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.name,
      tons: item.tons,
    }));
  }, [data]);

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: -20, bottom: 20 },
    };

    if (chartType === "bar") {
      return (
        <BarChart {...commonProps}>
          <defs>
            <filter id="agentBarShadow" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feOffset in="blur" dx="0" dy="4" result="offsetBlur" />
              <feMerge>
                <feMergeNode in="offsetBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="agentBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
              <stop offset="100%" stopColor="#4338ca" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} 
            angle={-25} 
            textAnchor="end" 
            interval={0} 
            height={60}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar 
            dataKey="tons" 
            fill="url(#agentBarGradient)" 
            radius={[6, 6, 0, 0]} 
            barSize={30} 
            filter="url(#agentBarShadow)"
          />
        </BarChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="colorAgent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <filter id="agentAreaShadow" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="10" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} 
          angle={-25} 
          textAnchor="end" 
          interval={0} 
          height={60}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="tons"
          stroke="#4338ca"
          strokeWidth={5}
          fillOpacity={1}
          fill="url(#colorAgent)"
          animationDuration={2000}
          filter="url(#agentAreaShadow)"
        />
      </AreaChart>
    );
  };

  return (
    <div className="w-full h-auto">
      <div className="mb-8">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-4 bg-indigo-600 rounded-full"></span>
          Agent Distribution
        </h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Volume metrics by representative</p>
      </div>

      <div className="h-[350px]">
        {!chartData.length ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">No agent data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AgentSaudaChart;
