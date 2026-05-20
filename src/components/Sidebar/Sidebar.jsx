import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";
import { useAuth } from "../../context/AuthContext/AuthContext";

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  const { userRole, user } = useAuth();

  const [expandedSection, setExpandedSection] = useState(
    localStorage.getItem("expandedSection") || null,
  );

  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "1",
  );

  const iconMap = useMemo(() => Icons, []);

  useEffect(() => {
    localStorage.setItem("expandedSection", expandedSection || "");
  }, [expandedSection]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  useEffect(() => {
    const matchedSection = dashboardData.sections.find((section) =>
      section.actions.some((action) =>
        location.pathname.startsWith(action.link),
      ),
    );

    if (matchedSection) {
      setExpandedSection(matchedSection.section);
    }
  }, [location.pathname]);

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

  const renderIcon = useCallback(
    (iconName) => {
      const IconComponent = iconMap[iconName];

      return IconComponent ? (
        <IconComponent className="text-xl drop-shadow" />
      ) : null;
    },
    [iconMap],
  );

  return (
    <>
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen
          text-slate-100
          shadow-[35px_0_70px_-20px_rgba(0,0,0,0.6)]
          border-r border-white/5
          bg-[#020617]/95
          backdrop-blur-2xl
          transform transition-[width,transform] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${isCollapsed ? "w-[6rem]" : "w-80"}
          flex flex-col shrink-0
        `}
      >
        {/* Premium ambient light effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative flex items-center h-28 px-7 shrink-0">
          <div className="flex items-center gap-5 min-w-0 w-full">
            <div className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-tr from-emerald-500/10 via-emerald-400/20 to-emerald-500/10 border border-emerald-400/30 shadow-[0_8px_32px_-8px_rgba(16,185,129,0.4)] transition-all duration-700 hover:rotate-[15deg] hover:scale-110">
              <div className="absolute inset-0 rounded-[22px] bg-emerald-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <Icons.FaLeaf className="relative text-2xl text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
            </div>

            <div
              className={`flex flex-col transition-all duration-500 delay-100 ${
                isCollapsed ? "opacity-0 w-0 overflow-hidden -translate-x-4" : "opacity-100 translate-x-0"
              }`}
            >
              <h1 className="font-black text-white text-2xl tracking-[0.05em] uppercase italic leading-none">
                HANSARIA
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.35em]">
                  BID PORTAL
                </span>
              </div>
            </div>
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <Icons.FaChevronLeft size={10} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="mx-auto mt-4 mb-2 flex items-center justify-center w-10 h-10 rounded-2xl bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            <Icons.FaChevronRight size={12} />
          </button>
        )}

        <nav
          className={`relative flex-1 overflow-y-auto overscroll-contain no-scrollbar py-10 ${
            isCollapsed ? "px-4" : "px-6"
          }`}
        >
          {dashboardData.sections
            .map((section) => {
              const filteredActions = section.actions.filter((action) => {
                // 1. Check if user has specific assigned permissions (for Employees)
                if (userRole === "Employee" && user?.allowedPermissions?.length > 0) {
                  return user.allowedPermissions.includes(action.link);
                }

                // 2. Fallback to default role-based filtering
                if (!action.roles) return true;
                return action.roles.includes(userRole);
              });
              return { ...section, actions: filteredActions };
            })
            .filter((section) => section.actions.length > 0)
            .map((section, index) => {
              const isSectionExpanded = expandedSection === section.section;
              const sectionIcon = section.icon || section.actions?.[0]?.icon;

              return (
                <div key={index} className="mb-4 last:mb-0">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.section)}
                    className={`
                      group relative w-full flex items-center gap-4
                      rounded-2xl transition-all duration-500
                      ${
                        isCollapsed
                          ? "justify-center py-4 h-14 border border-transparent hover:bg-white/5"
                          : `py-4 px-5 h-14 ${
                              isSectionExpanded
                                ? "bg-white/10 text-white border border-white/10 shadow-lg"
                                : "text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-200"
                            }`
                      }
                    `}
                  >
                    <span
                      className={`shrink-0 transition-all duration-500 ${
                        isSectionExpanded
                          ? "text-emerald-400 scale-110"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    >
                      {renderIcon(sectionIcon)}
                    </span>

                    {!isCollapsed && (
                      <>
                        <span className={`text-[13px] font-black truncate flex-1 tracking-[0.05em] transition-colors duration-300 ${
                          isSectionExpanded ? "text-white" : ""
                        }`}>
                          {section.section}
                        </span>
                        <Icons.FaChevronDown 
                          size={10} 
                          className={`shrink-0 transition-transform duration-500 ${
                            isSectionExpanded ? "rotate-180 text-emerald-400" : "text-slate-600 group-hover:text-slate-400"
                          }`}
                        />
                      </>
                    )}

                    {isCollapsed && isSectionExpanded && (
                      <div className="absolute right-0 top-0 w-1 h-full bg-emerald-500 rounded-l-full shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div
                      className={`
                        overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                        ${
                          isSectionExpanded
                            ? "max-h-[500px] opacity-100 mt-4"
                            : "max-h-0 opacity-0 mt-0"
                        }
                      `}
                    >
                      <div className="pl-12 pr-1 py-1 space-y-2.5 relative">
                        {/* Elegant vertical rail */}
                        <div className="absolute left-[26px] top-0 bottom-8 w-[2px] bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-full" />

                        {section.actions.map((action, idx) => {
                          const isActive = location.pathname.startsWith(action.link);

                          return (
                            <Link
                              key={idx}
                              to={action.link}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`
                                group relative flex items-center gap-4
                                py-3.5 px-5 rounded-[14px]
                                text-[11px] font-black uppercase tracking-[0.2em]
                                transition-all duration-300
                                ${
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_24px_-8px_rgba(16,185,129,0.3)]"
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                                }
                              `}
                            >
                              {isActive && (
                                <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)] border-[3px] border-[#020617]" />
                              )}

                              <span className={`truncate group-hover:translate-x-1.5 transition-transform duration-300 ${
                                isActive ? "translate-x-1" : ""
                              }`}>
                                {action.name}
                              </span>
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
      </aside>
      {isSidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
