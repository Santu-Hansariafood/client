import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";
import { prefetchRoute } from "../../utils/LazyPages/LazyPages";

const Sidebar = () => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState(
    localStorage.getItem("expandedSection") || null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      return;
    }
    setExpandedSection((prev) => (prev === sectionName ? null : sectionName));
  }, []);

  const renderIcon = useCallback((iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent className="text-xl drop-shadow" /> : null;
  }, []);

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 text-white p-2.5 rounded-xl shadow-lg focus:outline-none border border-emerald-500/70 bg-gradient-to-r from-emerald-500 to-emerald-600"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        aria-label="Toggle Sidebar"
      >
        {isSidebarOpen ? <Icons.FaTimes size={24} /> : <Icons.FaBars size={24} />}
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-slate-900 text-slate-100 shadow-xl transform transition-all duration-300 ease-out border-r border-slate-700/80
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static ${isCollapsed ? "lg:w-[4.5rem]" : "lg:w-60"} flex flex-col`}
      >
        {/* Header: logo + collapse */}
        <div className="flex items-center justify-between h-14 min-h-[3.5rem] px-4 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
              <Icons.FaLeaf className="text-sm" />
            </div>
            <span
              className={`font-semibold text-slate-100 truncate transition-opacity duration-200 ${
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
            >
              HFPL
            </span>
          </div>
          <button
            type="button"
            className="hidden lg:flex shrink-0 items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
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
                } rounded-lg text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors text-left`}
                onClick={() => toggleSection(section.section)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 text-slate-500">{renderIcon(section.icon || section.actions?.[0]?.icon)}</span>
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
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  {section.actions.map((action, idx) => {
                    const isActive = location.pathname === action.link;
                    return (
                      <Link
                        key={idx}
                        to={action.link}
                        onMouseEnter={() => prefetchRoute(action.link)}
                        className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm transition-colors
                          ${isActive
                            ? "bg-emerald-600/20 text-emerald-400 font-medium"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                          }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <span className="shrink-0 opacity-80">{renderIcon(action.icon)}</span>
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
