import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";
import { prefetchRoute } from "../../utils/LazyPages/LazyPages";

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState(
    localStorage.getItem("expandedSection") || null
  );
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "1"
  );

  useEffect(() => {
    localStorage.setItem("expandedSection", expandedSection);
  }, [expandedSection]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  const toggleSection = useCallback((sectionName) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedSection(sectionName);
      return;
    }
    setExpandedSection((prev) => (prev === sectionName ? null : sectionName));
  }, [isCollapsed]);

  const renderIcon = useCallback((iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent className="text-xl drop-shadow" /> : null;
  }, []);

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 text-slate-100 shadow-2xl transform transition-all duration-300 ease-out border-r border-slate-800/80
          bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static ${isCollapsed ? "lg:w-[4.5rem]" : "lg:w-60"} flex flex-col`}
      >
        {/* Header: logo + collapse */}
        <div className="relative flex items-center justify-between h-16 min-h-[4rem] px-4 border-b border-slate-800/80 shrink-0">
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-emerald-500/40 via-amber-400/20 to-transparent" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/70 border border-slate-700/60 text-emerald-300 shadow-inner">
              <Icons.FaLeaf className="text-base" />
            </div>
            <span
              className={`font-semibold text-slate-100 truncate transition-opacity duration-200 tracking-tight ${
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
            >
              HFPL Bid Portal
            </span>
          </div>
          <button
            type="button"
            className="hidden lg:flex shrink-0 items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 transition"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setIsCollapsed((v) => !v)}
          >
            {isCollapsed ? <Icons.FaAngleRight size={18} /> : <Icons.FaAngleLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav
          className={`flex-1 overflow-y-auto no-scrollbar ${
            isCollapsed ? "px-2 py-3" : "px-3 py-4"
          }`}
        >
          {dashboardData.sections.map((section, index) => (
            <div key={index} className={isCollapsed ? "mb-2" : "mb-1"}>
              <button
                type="button"
                className={`w-full flex items-center ${
                  isCollapsed ? "justify-center py-2.5 px-2" : "justify-between py-2 px-3"
                } rounded-xl text-slate-300 hover:bg-slate-800/70 hover:text-white transition text-left border border-transparent hover:border-slate-700/60`}
                onClick={() => toggleSection(section.section)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 text-slate-400">
                    {renderIcon(section.icon || section.actions?.[0]?.icon)}
                  </span>
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{section.section}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="shrink-0 text-slate-500 text-xs">
                    {expandedSection === section.section ? (
                      <Icons.FaChevronUp size={12} />
                    ) : (
                      <Icons.FaChevronDown size={12} />
                    )}
                  </span>
                )}
              </button>

              {expandedSection === section.section && !isCollapsed && (
                <div className="pl-9 pr-2 py-1.5 space-y-1">
                  {section.actions.map((action, idx) => {
                    const isActive = location.pathname === action.link;
                    return (
                      <Link
                        key={idx}
                        to={action.link}
                        className={`group relative flex items-center gap-3 py-2 px-3 rounded-xl text-sm transition
                          ${isActive
                            ? "bg-emerald-500/15 text-emerald-200 font-semibold border border-emerald-500/20"
                            : "text-slate-300/80 hover:bg-slate-800/70 hover:text-white border border-transparent hover:border-slate-700/60"
                          }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        {isActive && (
                          <span className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-emerald-400/80" />
                        )}
                        <span className={`shrink-0 ${isActive ? "text-emerald-200" : "text-slate-300/70 group-hover:text-slate-200"}`}>
                          {renderIcon(action.icon)}
                        </span>
                        <span className="truncate">{action.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;
