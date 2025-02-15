import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";

const Sidebar = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSection = useCallback((sectionName) => {
    setExpandedSection((prev) => (prev === sectionName ? null : sectionName));
  }, []);

  const renderIcon = useCallback((iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent className="text-xl" /> : null;
  }, []);

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 text-white p-3 bg-gray-800 rounded-lg shadow-md focus:outline-none"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        aria-label="Toggle Sidebar"
      >
        {isSidebarOpen ? <Icons.FaTimes size={24} /> : <Icons.FaBars size={24} />}
      </button>
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-gray-900 text-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:w-80 flex flex-col`}
      >
        <div className="p-5 bg-gray-800 shadow-md">
          <h4 className="text-2xl font-bold text-gray-200">{dashboardData.title}</h4>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {dashboardData.sections.map((section, index) => (
            <div key={index} className="mb-4">
              <div
                className="flex items-center justify-between cursor-pointer text-gray-400 py-2 px-3 hover:text-gray-200 rounded-lg transition"
                onClick={() => toggleSection(section.section)}
              >
                <div className="flex items-center space-x-2">
                  {renderIcon(section.icon)}
                  <span>{section.section}</span>
                </div>
                <span>
                  {expandedSection === section.section
                    ? renderIcon("FaMinus")
                    : renderIcon("FaPlus")}
                </span>
              </div>
              {expandedSection === section.section && (
                <div className="pl-6 space-y-2 transition-all duration-300 ease-in-out">
                  {section.actions.map((action, idx) => (
                    <Link
                      key={idx}
                      to={action.link}
                      className="flex items-center space-x-2 py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      {renderIcon(action.icon)}
                      <span>{action.name}</span>
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
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;
