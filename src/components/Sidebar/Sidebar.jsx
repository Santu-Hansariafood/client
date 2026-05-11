import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState(
    localStorage.getItem("expandedSection") || null,
  );
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "1",
  );

  useEffect(() => {
    localStorage.setItem("expandedSection", expandedSection);
  }, [expandedSection]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  const toggleSection = useCallback(
    (sectionName) => {
      if (isCollapsed) {
        setIsCollapsed(false);
        setExpandedSection(sectionName);
        return;
      }
      setExpandedSection((prev) => (prev === sectionName ? null : sectionName));
    },
    [isCollapsed],
  );

  const renderIcon = useCallback((iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? (
      <IconComponent className="text-xl drop-shadow" />
    ) : null;
  }, []);

  return (
    <>
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen text-slate-100 shadow-[20px_0_50px_-15px_rgba(0,0,0,0.5)] transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-r border-slate-800/40
          bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 ${isCollapsed ? "w-[5.5rem]" : "w-64"} flex flex-col shrink-0`}
      >
        <div className="relative flex items-center justify-between h-20 min-h-[5rem] px-5 shrink-0">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 text-emerald-400 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Icons.FaLeaf className="text-lg drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
            </div>
            <div
              className={`flex flex-col transition-all duration-300 ${
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
            >
              <span className="font-black text-white text-lg tracking-tight font-display uppercase italic leading-none">
                HFPL
              </span>
              <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.2em] mt-0.5">
                Bid Portal
              </span>
            </div>
          </div>
          <button
            type="button"
            className="hidden lg:flex shrink-0 items-center justify-center w-8 h-8 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/40 transition-all duration-300"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setIsCollapsed((v) => !v)}
          >
            {isCollapsed ? (
              <Icons.FaChevronRight size={14} />
            ) : (
              <Icons.FaChevronLeft size={14} />
            )}
          </button>
        </div>

        <nav
          className={`flex-1 overflow-y-auto no-scrollbar py-6 ${
            isCollapsed ? "px-3" : "px-4"
          }`}
        >
          {dashboardData.sections.map((section, index) => {
            const isSectionExpanded = expandedSection === section.section;
            const sectionIcon = section.icon || section.actions?.[0]?.icon;

            return (
              <div key={index} className="mb-2 last:mb-0">
                <button
                  type="button"
                  className={`group w-full flex items-center gap-3.5 rounded-2xl transition-all duration-300 border border-transparent ${
                    isCollapsed
                      ? "justify-center py-3.5 px-0 h-12"
                      : `py-3 px-4 h-12 ${
                          isSectionExpanded
                            ? "bg-slate-800/40 text-white border-slate-700/30 shadow-sm"
                            : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                        }`
                  }`}
                  onClick={() => toggleSection(section.section)}
                  title={isCollapsed ? section.section : ""}
                >
                  <span className={`shrink-0 transition-colors duration-300 ${
                    isSectionExpanded ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}>
                    {renderIcon(sectionIcon)}
                  </span>
                  
                  {!isCollapsed && (
                    <>
                      <span className={`text-sm font-bold truncate flex-1 tracking-wide ${
                        isSectionExpanded ? "text-white" : ""
                      }`}>
                        {section.section}
                      </span>
                      <span className={`shrink-0 transition-transform duration-300 ${
                        isSectionExpanded ? "rotate-180 text-emerald-400" : "text-slate-600"
                      }`}>
                        <Icons.FaChevronDown size={10} />
                      </span>
                    </>
                  )}
                </button>

                {!isCollapsed && (
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isSectionExpanded ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
                    }`}
                  >
                    <div className="pl-11 pr-1 py-1 space-y-1 relative">
                      <div className="absolute left-[23px] top-0 bottom-4 w-px bg-slate-800/60" />
                      {section.actions.map((action, idx) => {
                        const isActive = location.pathname === action.link;
                        return (
                          <Link
                            key={idx}
                            to={action.link}
                            className={`group relative flex items-center gap-3.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300
                              ${
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                              }`}
                            onClick={() => setIsSidebarOpen(false)}
                          >
                            {isActive && (
                              <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            )}
                            <span className="truncate uppercase tracking-wider">{action.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Summary (Modern Footer) */}
        {!isCollapsed && (
          <div className="p-4 mt-auto">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 p-3.5 flex items-center gap-3 shadow-inner">
              <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/30">
                <Icons.FaUserCircle size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate uppercase tracking-wider leading-tight">
                  Bidder Account
                </p>
                <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                  Connected Ready
                </p>
              </div>
            </div>
          </div>
        )}
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
