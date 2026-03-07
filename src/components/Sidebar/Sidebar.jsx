import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";

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
        className="lg:hidden fixed top-4 left-4 z-50 text-white p-2.5 bg-slate-900/90 rounded-xl shadow-lg focus:outline-none border border-slate-700"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        aria-label="Toggle Sidebar"
        style={{ boxShadow: "0 4px 24px 0 rgba(34,197,94,0.25)" }}
      >
        {isSidebarOpen ? <Icons.FaTimes size={24} /> : <Icons.FaBars size={24} />}
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-slate-950 text-slate-50 shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-800
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static ${isCollapsed ? "lg:w-20" : "lg:w-72"} flex flex-col`}
      >
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <h4
            className={`text-xl font-semibold tracking-wide transition-opacity ${
              isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {dashboardData.title}
          </h4>
          <button
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            aria-label="Collapse sidebar"
            onClick={() => setIsCollapsed((v) => !v)}
          >
            {isCollapsed ? <Icons.FaAngleRight /> : <Icons.FaAngleLeft />}
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto no-scrollbar ${
            isCollapsed ? "p-3" : "p-4"
          } space-y-3`}
        >
          {dashboardData.sections.map((section, index) => (
            <div key={index} className="mb-4">
              <div
                className={`flex items-center ${
                  isCollapsed ? "justify-center" : "justify-between"
                } cursor-pointer text-slate-100 py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition`}
                onClick={() => toggleSection(section.section)}
              >
                <div
                  className={`flex items-center ${
                    isCollapsed ? "" : "space-x-2.5"
                  }`}
                >
                  {renderIcon(section.icon)}
                  {!isCollapsed && (
                    <span className="font-medium text-sm tracking-wide">
                      {section.section}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <span>
                    {expandedSection === section.section
                      ? renderIcon("FaMinus")
                      : renderIcon("FaPlus")}
                  </span>
                )}
              </div>

              {expandedSection === section.section && !isCollapsed && (
                <div className="pl-9 space-y-1.5 transition-all duration-300 ease-in-out mt-2">
                  {section.actions.map((action, idx) => (
                    <Link
                      key={idx}
                      to={action.link}
                      className={`flex items-center space-x-2 py-2 px-3 rounded-lg text-sm transition-all border
                        ${
                          location.pathname === action.link
                            ? "bg-slate-800 text-white border-slate-500"
                            : "bg-slate-900/70 text-slate-200 hover:bg-slate-800 hover:text-white border-slate-800"
                        }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      {renderIcon(action.icon)}
                      <span className="font-medium tracking-wide">{action.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
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
