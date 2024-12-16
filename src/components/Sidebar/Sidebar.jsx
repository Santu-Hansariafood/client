import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";

const Sidebar = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSection = (sectionName) => {
    setExpandedSection((prev) => (prev === sectionName ? null : sectionName));
  };

  const renderIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  const sidebarContent = useMemo(
    () => (
      <>
        <h2 className="text-xl font-bold text-gray-200">
          {dashboardData.title}
        </h2>
        {dashboardData.sections.map((section, index) => (
          <div key={index} className="mb-4">
            <div
              className="flex items-center justify-between cursor-pointer text-gray-400 mb-2"
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
              <div className="pl-6 space-y-1">
                {section.actions.map((action, idx) => (
                  <Link
                    key={idx}
                    to={action.link}
                    className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-700 rounded"
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
      </>
    ),
    [expandedSection]
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 text-gray-200 p-2 bg-gray-800 rounded focus:outline-none"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
      >
        {isSidebarOpen ? (
          <Icons.FaTimes size={20} />
        ) : (
          <Icons.FaBars size={20} />
        )}
      </button>
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 lg:w-80 bg-gray-800 text-white p-4 space-y-4 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        {sidebarContent}
      </aside>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
