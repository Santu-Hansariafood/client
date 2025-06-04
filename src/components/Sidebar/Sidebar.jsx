import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";

const Sidebar = () => {
  const [expandedSection, setExpandedSection] = useState(
    localStorage.getItem("expandedSection") || null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("expandedSection", expandedSection);
  }, [expandedSection]);

  const toggleSection = useCallback((sectionName) => {
    setExpandedSection((prev) => (prev === sectionName ? null : sectionName));
  }, []);

  const renderIcon = useCallback((iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent className="text-xl drop-shadow" /> : null;
  }, []);

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 text-white p-3 bg-gradient-to-br from-green-700 via-green-800 to-green-900 rounded-2xl shadow-xl focus:outline-none backdrop-blur-md border border-green-400/40"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        aria-label="Toggle Sidebar"
        style={{ boxShadow: "0 4px 24px 0 rgba(34,197,94,0.25)" }}
      >
        {isSidebarOpen ? <Icons.FaTimes size={24} /> : <Icons.FaBars size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-gradient-to-br from-green-800/80 via-green-900/90 to-green-950/90 text-white shadow-2xl transform transition-transform duration-300 ease-in-out backdrop-blur-xl border-r border-green-400/30
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:w-80 flex flex-col`}
        style={{ boxShadow: "0 8px 32px 0 rgba(34,197,94,0.25)" }}
      >
        {/* Sidebar Header */}
        <div className="p-6 bg-gradient-to-r from-green-700 via-green-800 to-green-900 rounded-b-2xl shadow-md border-b border-green-400/20">
          <h4 className="text-3xl font-extrabold text-yellow-300 tracking-wide drop-shadow-lg">
            {dashboardData.title}
          </h4>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {dashboardData.sections.map((section, index) => (
            <div key={index} className="mb-4">
              {/* Section Header */}
              <div
                className="flex items-center justify-between cursor-pointer text-yellow-200 py-2 px-4 hover:text-yellow-300 rounded-xl bg-white/10 hover:bg-white/20 shadow transition-all backdrop-blur-md border border-green-400/10"
                onClick={() => toggleSection(section.section)}
              >
                <div className="flex items-center space-x-3">
                  {renderIcon(section.icon)}
                  <span className="font-semibold text-lg tracking-wide">
                    {section.section}
                  </span>
                </div>
                <span>
                  {expandedSection === section.section
                    ? renderIcon("FaMinus")
                    : renderIcon("FaPlus")}
                </span>
              </div>

              {/* Section Actions */}
              {expandedSection === section.section && (
                <div className="pl-8 space-y-2 transition-all duration-300 ease-in-out mt-2">
                  {section.actions.map((action, idx) => (
                    <Link
                      key={idx}
                      to={action.link}
                      className="flex items-center space-x-2 py-2 px-4 bg-gradient-to-r from-green-700/80 to-green-900/80 hover:from-green-600 hover:to-green-800 rounded-lg text-yellow-100 hover:text-white shadow-md transition-all border border-green-400/10 backdrop-blur-md"
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

      {/* Sidebar Overlay */}
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
