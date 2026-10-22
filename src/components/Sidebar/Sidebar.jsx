import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "react-icons/fa";
import dashboardData from "../../data/dashboardData.json";
import { useAuth } from "../../context/AuthContext/AuthContext";

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  const { userRole, user } = useAuth();
  const lux = userRole === "Admin";

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
          ${
            lux
              ? "shadow-[6px_0_36px_rgba(4,45,36,0.45)]"
              : "shadow-[4px_0_24px_rgba(0,0,0,0.3)]"
          }
          ${
            lux
              ? "bg-gradient-to-b from-lux-night via-lux-deep to-lux-night"
              : "bg-slate-950"
          }
          transform transition-[width,transform] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${isCollapsed ? "w-[5rem]" : "w-72"}
          flex flex-col shrink-0
          ${lux ? "border-r border-lux-gold/15" : "border-r border-white/5"}
        `}
      >
        <div className="relative flex items-center h-20 px-6 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0 w-full">
            <div
              className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500 hover:rotate-6 ${
                lux
                  ? "bg-gradient-to-br from-lux-gold to-[#8a6b1f] shadow-lg shadow-black/30"
                  : "bg-emerald-600 shadow-lg shadow-emerald-900/20"
              }`}
            >
              <Icons.FaLeaf
                className={`text-lg ${lux ? "text-lux-night" : "text-white"}`}
              />
            </div>

            <div
              className={`flex flex-col transition-all duration-500 ${
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
            >
              <h1
                className={`font-black text-lg tracking-tight leading-none ${
                  lux ? "font-serif text-lux-gold-soft" : "text-white"
                }`}
              >
                HANSARIA
              </h1>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${
                  lux ? "text-lux-gold/80" : "text-emerald-500"
                }`}
              >
                BID PORTAL
              </span>
            </div>
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className={`absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-white/10 text-slate-500 transition-all duration-300 shadow-lg z-50 ${
                lux
                  ? "hover:text-lux-gold-soft hover:border-lux-gold/40"
                  : "hover:text-emerald-400 hover:border-emerald-500/50"
              }`}
            >
              <Icons.FaChevronLeft size={8} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className={`mx-auto mt-4 mb-2 flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-slate-400 transition-all duration-300 ${
              lux
                ? "hover:text-lux-gold-soft hover:bg-lux-gold/10"
                : "hover:text-emerald-400 hover:bg-white/10"
            }`}
          >
            <Icons.FaChevronRight size={10} />
          </button>
        )}

        <nav
          className={`relative flex-1 overflow-y-auto overscroll-contain no-scrollbar py-6 ${
            isCollapsed ? "px-2" : "px-4"
          }`}
        >
          {dashboardData.sections
            .map((section) => {
              const filteredActions = section.actions.filter((action) => {
                if (action.link === "/dashboard" || action.link === "/employee/dashboard") {
                  return true;
                }

                if (userRole === "Employee" && user?.allowedPermissions && user.allowedPermissions.length > 0) {
                  return user.allowedPermissions.some(p => {
                    const normalizedP = p.startsWith("/") ? p : `/${p}`;
                    const normalizedLink = action.link.startsWith("/") ? action.link : `/${action.link}`;
                    return normalizedLink === normalizedP;
                  });
                }

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
                <div key={index} className="mb-2 last:mb-0">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.section)}
                    className={`
                      group relative w-full flex items-center gap-3
                      rounded-xl transition-all duration-300
                      ${
                        isCollapsed
                          ? "justify-center py-3 h-12 hover:bg-white/5"
                          : `py-3 px-4 h-12 ${
                              isSectionExpanded
                                ? lux
                                  ? "bg-lux-gold/10 text-lux-gold-soft"
                                  : "bg-white/10 text-white"
                                : lux
                                  ? "text-slate-300/80 hover:bg-white/5 hover:text-lux-gold-soft"
                                  : "text-slate-400 hover:bg-white/5 hover:text-white"
                            }`
                      }
                    `}
                  >
                    <span
                      className={`shrink-0 transition-all duration-300 ${
                        isSectionExpanded
                          ? lux
                            ? "text-lux-gold"
                            : "text-emerald-400"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    >
                      {renderIcon(sectionIcon)}
                    </span>

                    {!isCollapsed && (
                      <>
                        <span className={`text-xs font-bold truncate flex-1 tracking-tight transition-colors duration-300`}>
                          {section.section}
                        </span>
                        <Icons.FaChevronDown 
                          size={8} 
                          className={`shrink-0 transition-transform duration-300 ${
                            isSectionExpanded
                              ? lux
                                ? "rotate-180 text-lux-gold"
                                : "rotate-180 text-emerald-400"
                              : "text-slate-600 group-hover:text-slate-400"
                          }`}
                        />
                      </>
                    )}

                    {isCollapsed && isSectionExpanded && (
                      <div
                        className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full ${
                          lux
                            ? "bg-lux-gold shadow-[0_0_8px_rgba(201,162,39,0.6)]"
                            : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        }`}
                      />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div
                      className={`
                        overflow-hidden transition-all duration-300 ease-in-out
                        ${
                          isSectionExpanded
                            ? "max-h-[500px] opacity-100 mt-1"
                            : "max-h-0 opacity-0 mt-0"
                        }
                      `}
                    >
                      <div className="pl-9 pr-1 py-1 space-y-1 relative">
                        {/* Connecting Line */}
                        <div
                          className={`absolute left-[22px] top-0 bottom-4 w-px ${
                            lux ? "bg-lux-gold/10" : "bg-white/5"
                          }`}
                        />
                        
                        {section.actions.map((action, idx) => {
                          const isActive = location.pathname.startsWith(action.link);

                          return (
                            <Link
                              key={idx}
                              to={action.link}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`
                                group relative flex items-center gap-3
                                py-2.5 px-4 rounded-lg
                                text-[11px] font-bold tracking-tight
                                transition-all duration-200
                                ${
                                  isActive
                                    ? lux
                                      ? "bg-gradient-to-r from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-black/25"
                                      : "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                                }
                              `}
                            >
                              <span className="truncate">
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
