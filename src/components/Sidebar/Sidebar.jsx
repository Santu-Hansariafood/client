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

  const isAdmin = useMemo(
    () => userRole === "Admin" || userRole === "SuperAdmin" || userRole === "Owner",
    [userRole],
  );
  const isEmployee = useMemo(() => userRole === "Employee", [userRole]);

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

  const gradientAccent = useMemo(() => {
    if (isAdmin) return "from-emerald-400 via-teal-400 to-cyan-400";
    if (isEmployee) return "from-indigo-400 via-blue-400 to-violet-400";
    return "from-blue-400 via-indigo-400 to-purple-400";
  }, [isAdmin, isEmployee]);

  const sidebarBg = useMemo(() => {
    if (isAdmin) return "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950";
    if (isEmployee) return "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900";
    return "bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950";
  }, [isAdmin, isEmployee]);

  const accentColor = useMemo(() => {
    if (isAdmin) return "text-emerald-400";
    if (isEmployee) return "text-indigo-400";
    return "text-blue-400";
  }, [isAdmin, isEmployee]);

  const accentBg = useMemo(() => {
    if (isAdmin) return "bg-emerald-600";
    if (isEmployee) return "bg-indigo-600";
    return "bg-blue-600";
  }, [isAdmin, isEmployee]);

  const accentBgHover = useMemo(() => {
    if (isAdmin) return "bg-emerald-500 shadow-emerald-900/30";
    if (isEmployee) return "bg-indigo-500 shadow-indigo-900/30";
    return "bg-blue-500 shadow-blue-900/30";
  }, [isAdmin, isEmployee]);

  const accentShadow = useMemo(() => {
    if (isAdmin) return "shadow-[0_0_12px_rgba(16,185,129,0.5)]";
    if (isEmployee) return "shadow-[0_0_12px_rgba(99,102,241,0.5)]";
    return "shadow-[0_0_12px_rgba(59,130,246,0.5)]";
  }, [isAdmin, isEmployee]);

  return (
    <>
      <aside
        className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen
        ${sidebarBg}
        shadow-[8px_0_40px_-12px_rgba(0,0,0,0.4)]
        transform transition-[width,transform] duration-600 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${isCollapsed ? "w-[5.5rem]" : "w-[20rem]"}
        flex flex-col shrink-0
        border-r border-white/5
        overflow-hidden
      `}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_50%_0%,#ffffff_0.5px,transparent_1px)] [background-size:24px_24px" />
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className={`absolute -left-20 top-1/4 w-64 h-64 rounded-full bg-gradient-to-br ${gradientAccent} opacity-[0.06] blur-[100px] pointer-events-none animate-pulse`} />
        <div className={`absolute -right-10 bottom-1/4 w-48 h-48 rounded-full bg-gradient-to-br ${gradientAccent} opacity-[0.04] blur-[80px] pointer-events-none animate-pulse delay-1000`} />

        <div className="relative flex items-center h-24 px-6 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-4 min-w-0 w-full">
            <div className={`group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientAccent} shadow-xl transition-all duration-500 hover:rotate-12 hover:scale-110`}>
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientAccent} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
              <Icons.FaLeaf className="relative z-10 text-xl text-white drop-shadow-lg" />
            </div>

            <div
              className={`flex flex-col transition-all duration-500 ${
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
            >
              <h1 className="font-black text-white text-xl tracking-tight leading-none bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                HANSARIA
              </h1>
              <span className={`text-[10px] font-black ${accentColor} uppercase tracking-[0.25em] mt-1.5 inline-flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${accentBg} animate-pulse`} />
                BID PORTAL
              </span>
            </div>
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="group absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-slate-900/80 backdrop-blur-sm border border-white/10 text-slate-500 hover:text-white hover:border-white/30 hover:bg-slate-800 transition-all duration-300 shadow-xl z-50"
            >
              <Icons.FaChevronLeft size={9} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="group mx-auto mt-5 mb-3 flex items-center justify-center w-10 h-10 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 transition-all duration-300 border border-white/5 hover:border-white/20"
          >
            <Icons.FaChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {!isCollapsed && (
          <div className="px-5 py-4 border-b border-white/5">
            <div className={`flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent border border-white/5 hover:border-white/10 transition-all duration-300`}>
              <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${gradientAccent} flex items-center justify-center text-white font-black shadow-lg overflow-hidden`}>
                {user?.name?.charAt(0) || "U"}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate tracking-tight">
                  {user?.name || "Guest User"}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${accentColor} flex items-center gap-1.5 mt-0.5`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {userRole || "User"}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav
          className={`relative flex-1 overflow-y-auto overscroll-contain no-scrollbar py-5 ${
            isCollapsed ? "px-2.5" : "px-4"
          }`}
        >
          {dashboardData.sections
            .map((section) => {
              const filteredActions = section.actions.filter((action) => {
                if (action.link === "/dashboard" || action.link === "/employee/dashboard") {
                  return true;
                }

                if (userRole === "Employee" && user?.allowedPermissions && user.allowedPermissions.length > 0) {
                  return user.allowedPermissions.some((p) => {
                    const normalizedP = p.startsWith("/") ? p : `/${p}`;
                    const normalizedLink = action.link.startsWith("/")
                      ? action.link
                      : `/${action.link}`;
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
                <div
                  key={index}
                  className="mb-2.5 last:mb-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.section)}
                    className={`
                      group relative w-full flex items-center gap-3.5
                      rounded-2xl transition-all duration-400 ease-out
                      ${
                        isCollapsed
                          ? "justify-center py-3.5 h-14 hover:bg-white/[0.08]"
                          : `py-3.5 px-4.5 h-14 ${
                              isSectionExpanded
                                ? `bg-gradient-to-r from-white/[0.12] via-white/[0.06] to-transparent text-white border border-white/[0.08] shadow-lg shadow-black/10`
                                : "text-slate-400 hover:bg-white/[0.05] hover:text-white hover:border-white/[0.04] border border-transparent"
                            }`
                      }
                    `}
                  >
                    <span
                      className={`shrink-0 transition-all duration-400 ease-out ${
                        isSectionExpanded
                          ? `${accentColor} scale-110 drop-shadow-lg`
                          : "text-slate-500 group-hover:text-slate-200 group-hover:scale-105"
                      }`}
                    >
                      {renderIcon(sectionIcon)}
                    </span>

                    {!isCollapsed && (
                      <>
                        <span
                          className={`text-[11px] font-black truncate flex-1 tracking-[0.02em] transition-colors duration-300`}
                        >
                          {section.section}
                        </span>
                        <Icons.FaChevronDown
                          size={9}
                          className={`shrink-0 transition-all duration-400 ${
                            isSectionExpanded ? `rotate-180 ${accentColor}` : "text-slate-600 group-hover:text-slate-400"
                          }`}
                        />
                      </>
                    )}

                    {isCollapsed && isSectionExpanded && (
                      <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-l-full ${accentBg} ${accentShadow}`} />
                    )}

                    {isSectionExpanded && !isCollapsed && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${accentBg} ${accentShadow} opacity-60`} />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div
                      className={`
                        overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]
                        ${
                          isSectionExpanded
                            ? "max-h-[600px] opacity-100 mt-2"
                            : "max-h-0 opacity-0 mt-0"
                        }
                      `}
                    >
                      <div className="pl-3 pr-1.5 py-1.5 space-y-1.5 relative">
                        <div className="absolute left-[27px] top-1 bottom-4 w-px bg-gradient-to-b from-white/10 via-white/[0.06] to-transparent" />

                        {section.actions.map((action, idx) => {
                          const isActive = location.pathname.startsWith(action.link);

                          return (
                            <Link
                              key={idx}
                              to={action.link}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`
                                group relative flex items-center gap-3
                                py-3 px-4.5 rounded-xl
                                text-[11px] font-black tracking-tight
                                transition-all duration-300 ease-out
                                ${
                                  isActive
                                    ? `${accentBgHover} text-white shadow-lg border border-white/10`
                                    : "text-slate-500 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05]"
                                }
                              `}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? `bg-white scale-125 shadow-lg` : `bg-slate-600 group-hover:bg-slate-400 group-hover:scale-125`}`}
                              />
                              <span className="truncate flex-1">{action.name}</span>
                              {isActive && (
                                <div className={`w-1.5 h-1.5 rounded-full bg-white animate-pulseSlow`} />
                              )}
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

        {!isCollapsed && (
          <div className="relative shrink-0 px-4 py-5 border-t border-white/5">
            <div className={`p-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.05] relative overflow-hidden`}>
              <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradientAccent} opacity-10 blur-2xl`} />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Version</p>
                <p className="text-white font-bold text-sm flex items-center gap-2">
                  <span className={accentColor}>Premium</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">v2.0</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-2">© 2026 Hansaria Food</p>
              </div>
            </div>
          </div>
        )}
      </aside>
      {isSidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-md lg:hidden animate-fade-in"
        />
      )}
    </>
  );
};

export default Sidebar;
