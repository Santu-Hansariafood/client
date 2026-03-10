import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";
import { prefetchRoute } from "../../utils/LazyPages/LazyPages";

const Sidebar = () => {
  const location = useLocation();

  const [expandedSection, setExpandedSection] = useState(
    localStorage.getItem("expandedSection")
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] =
    useState(localStorage.getItem("sidebarCollapsed") === "1");

  useEffect(() => {
    localStorage.setItem("expandedSection", expandedSection || "");
  }, [expandedSection]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  const toggleSection = (sectionName) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      return;
    }
    setExpandedSection((prev) => (prev === sectionName ? null : sectionName));
  };

  const renderIcon = (iconName) => {
    const Icon = Icons[iconName];
    return Icon ? <Icon className="text-xl drop-shadow" /> : null;
  };

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 text-white p-2.5 rounded-xl shadow-lg border border-emerald-500/70 bg-gradient-to-r from-emerald-500 to-emerald-600"
        onClick={() => setIsSidebarOpen((v) => !v)}
      >
        {isSidebarOpen ? <Icons.FaTimes size={24} /> : <Icons.FaBars size={24} />}
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 h-full text-slate-100 shadow-2xl transform transition-all duration-300 border-r border-slate-800/80
        bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static ${isCollapsed ? "lg:w-[4.5rem]" : "lg:w-60"} flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-emerald-300">
              <Icons.FaLeaf />
            </div>

            {!isCollapsed && (
              <span className="font-semibold text-slate-100">
                HFPL Bid Portal
              </span>
            )}
          </div>

          <button
            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setIsCollapsed((v) => !v)}
          >
            {isCollapsed ? (
              <Icons.FaAngleRight size={18} />
            ) : (
              <Icons.FaAngleLeft size={18} />
            )}
          </button>
        </div>
        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? "px-2 py-3" : "px-3 py-4"}`}>
          {dashboardData.sections.map((section, index) => (
            <div key={index} className="mb-2">
              <button
                className={`w-full flex items-center ${
                  isCollapsed ? "justify-center py-2.5" : "justify-between py-2 px-3"
                } rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white`}
                onClick={() => toggleSection(section.section)}
              >
                <div className="flex items-center gap-3">
                  {renderIcon(section.icon || section.actions?.[0]?.icon)}
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{section.section}</span>
                  )}
                </div>

                {!isCollapsed &&
                  (expandedSection === section.section ? (
                    <Icons.FaChevronUp size={12} />
                  ) : (
                    <Icons.FaChevronDown size={12} />
                  ))}
              </button>

              {expandedSection === section.section && !isCollapsed && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  {section.actions.map((action, idx) => {
                    const isActive = location.pathname === action.link;

                    return (
                      <Link
                        key={idx}
                        to={action.link}
                        onMouseEnter={() => prefetchRoute(action.link)}
                        className={`flex items-center gap-3 py-2 px-3 rounded-xl text-sm transition
                        ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-200 font-semibold"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        {renderIcon(action.icon)}
                        <span>{action.name}</span>
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
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
