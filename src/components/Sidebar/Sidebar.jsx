import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import dashboardData from '../../data/dashboardData.json';

const Sidebar = () => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const renderIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 space-y-4 lg:w-80 md:w-64 sm:w-full">
      <h2 className="text-xl font-bold text-gray-200">{dashboardData.title}</h2>
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
            <span>{expandedSections[section.section] ? renderIcon("FaMinus") : renderIcon("FaPlus")}</span>
          </div>
          {expandedSections[section.section] && (
            <div className="pl-6 space-y-1">
              {section.actions.map((action, idx) => (
                <Link 
                  key={idx} 
                  to={action.link} 
                  className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-700 rounded"
                >
                  {renderIcon(action.icon)}
                  <span>{action.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
