import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineUser,
  AiOutlineBell,
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineDelete,
  AiOutlineLock,
  AiOutlineCloud,
} from "react-icons/ai";
import { RiLogoutBoxLine } from "react-icons/ri";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { WiDaySunny, WiRain, WiCloudy, WiThermometer, WiHumidity } from "react-icons/wi";

import PWAInstall from "../PWAInstall/PWAInstall";
import Typewriter from "../Typewriter/Typewriter";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNotifications } from "../../context/NotificationContext/NotificationContext";
import ChangePasswordModal from "./ChangePasswordModal";
import PopupBox from "../PopupBox/PopupBox";

const Header = ({
  onLogoutClick,
  showMenuButton,
  onMenuClick,
  isSidebarOpen,
  isProfileDropdownOpen,
  setProfileDropdownOpen,
}) => {
  const { userRole, mobile } = useAuth();

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification: deleteNotificationFromContext,
  } = useNotifications();

  const navigate = useNavigate();

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

  // Weather state
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      setWeatherLoading(true);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
        );
        const data = await response.json();
        
        setWeather({
          temp: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          precipitation: data.current.precipitation,
          code: data.current.weather_code,
          isDay: data.current.is_day
        });

        const dailyForecast = data.daily.time.map((time, i) => ({
          date: new Date(time).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
          maxTemp: data.daily.temperature_2m_max[i],
          minTemp: data.daily.temperature_2m_min[i],
          code: data.daily.weather_code[i],
          precip: data.daily.precipitation_sum[i]
        }));
        setForecast(dailyForecast);
      } catch (error) {
        console.error("Weather fetch failed:", error);
      } finally {
        setWeatherLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(28.6139, 77.2090) // Default to New Delhi if denied
      );
    }
  }, []);

  const getWeatherIcon = (code, isDay = 1) => {
    if (code === 0) return <WiDaySunny className={isDay ? "text-amber-400" : "text-blue-200"} />;
    if (code >= 1 && code <= 3) return <WiCloudy className="text-slate-300" />;
    if (code >= 51 && code <= 67) return <WiRain className="text-blue-400" />;
    return <AiOutlineCloud className="text-slate-400" />;
  };

  const filteredNotifications = useMemo(() => {
    return unreadOnly ? notifications.filter((n) => !n.isRead) : notifications;
  }, [notifications, unreadOnly]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    setProfileDropdownOpen((prev) => !prev);
    setShowNotifications(false);
  }, [setProfileDropdownOpen]);

  const toggleNotifications = useCallback(() => {
    setShowNotifications((prev) => {
      const newState = !prev;
      if (newState) {
        fetchNotifications(false);
      }
      return newState;
    });
    setProfileDropdownOpen(false);
  }, [setProfileDropdownOpen, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    setShowNotifications(false);

    if (userRole === "Admin" || userRole === "Employee") {
      navigate("/manage-bids/bid-list/participate-bid-admin");
    } else {
      navigate("/participate-bid-list");
    }
  };

  const deleteNotification = async (id) => {
    await deleteNotificationFromContext(id);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };

    if (isProfileDropdownOpen || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen, showNotifications, setProfileDropdownOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between px-3 sm:px-5 lg:px-6 h-16 sm:h-[72px]">
          <div className="flex items-center gap-3 min-w-0">
            {showMenuButton && (
              <button
                type="button"
                onClick={onMenuClick}
                aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                {isSidebarOpen ? (
                  <IoClose size={24} />
                ) : (
                  <HiMenuAlt2 size={24} />
                )}
              </button>
            )}

            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-black uppercase italic tracking-tight text-white truncate">
                <Typewriter text="Hansaria Food Private Limited" speed={70} />
              </h1>

              <p className="hidden sm:block text-[10px] uppercase tracking-[0.25em] text-emerald-200 font-bold">
                Logistics & Bid Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Weather Widget */}
            {weather && (
              <button
                onClick={() => setIsWeatherModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/15 transition-all duration-300 border border-white/5 group shadow-inner"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform duration-500">
                  {getWeatherIcon(weather.code, weather.isDay)}
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-sm font-black text-white">{weather.temp}°C</span>
                  <span className="text-[9px] font-bold text-emerald-200 uppercase tracking-tighter">Live Weather</span>
                </div>
              </button>
            )}

            <div className="hidden md:block">
              <PWAInstall />
            </div>

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                <AiOutlineBell size={22} className="text-white" />

                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-emerald-900">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[340px] sm:w-[390px] max-w-[95vw] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div>
                      <h3 className="font-black text-slate-800">
                        Notifications
                      </h3>

                      <p className="text-xs text-slate-500">
                        {unreadCount} unread messages
                      </p>
                    </div>

                    <button
                      onClick={markAllRead}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Mark all
                    </button>
                  </div>

                  <div className="flex border-b border-slate-100">
                    <button
                      className={`flex-1 py-2.5 text-xs font-bold transition ${
                        unreadOnly
                          ? "text-emerald-600 border-b-2 border-emerald-600"
                          : "text-slate-500"
                      }`}
                      onClick={() => setUnreadOnly(true)}
                    >
                      Unread
                    </button>

                    <button
                      className={`flex-1 py-2.5 text-xs font-bold transition ${
                        !unreadOnly
                          ? "text-emerald-600 border-b-2 border-emerald-600"
                          : "text-slate-500"
                      }`}
                      onClick={() => setUnreadOnly(false)}
                    >
                      All
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[420px] overflow-y-auto">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`group p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${
                            !n.isRead ? "bg-emerald-50/40" : ""
                          }`}
                        >
                          <div className="flex justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm font-bold truncate ${
                                  !n.isRead
                                    ? "text-emerald-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {n.title}
                              </h4>

                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {n.message}
                              </p>

                              <span className="text-[10px] text-slate-400 mt-2 inline-block">
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n._id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white"
                              >
                                {n.isRead ? (
                                  <AiOutlineEyeInvisible size={15} />
                                ) : (
                                  <AiOutlineEye size={15} />
                                )}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n._id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                              >
                                <AiOutlineDelete size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center text-slate-400 text-sm">
                        No notifications found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={toggleDropdown}
                className="flex items-center gap-2 px-2 py-1.5 rounded-2xl hover:bg-white/10 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-700 border-2 border-amber-300 flex items-center justify-center shadow-md">
                  <AiOutlineUser size={20} className="text-white" />
                </div>

                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs text-emerald-100 font-bold">
                    {userRole}
                  </span>

                  <span className="text-[11px] text-white font-medium max-w-[120px] truncate">
                    {mobile}
                  </span>
                </div>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs uppercase text-slate-400 font-bold">
                      Logged In As
                    </p>

                    <h4 className="font-black text-slate-700 mt-1 truncate">
                      {mobile}
                    </h4>

                    <span className="inline-flex mt-2 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      {userRole}
                    </span>
                  </div>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-slate-50 transition"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setChangePasswordOpen(true);
                    }}
                  >
                    <AiOutlineLock size={18} />
                    Change Password
                  </button>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition border-t border-slate-100"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogoutClick?.();
                    }}
                  >
                    <RiLogoutBoxLine size={18} />
                    Logout
                  </button>

                  <div className="md:hidden border-t border-slate-100 p-3">
                    <PWAInstall />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* Weather Forecast Modal */}
      <PopupBox
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        title="Weather Forecast"
        width="w-[90vw] sm:w-[450px]"
        height="h-auto max-h-[85vh]"
      >
        {weather && (
          <div className="space-y-8 p-2">
            {/* Current Weather Detailed */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-8xl opacity-10">
                {getWeatherIcon(weather.code, weather.isDay)}
              </div>
              
              <div className="relative z-10">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Current Conditions</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-6xl">
                      {getWeatherIcon(weather.code, weather.isDay)}
                    </div>
                    <div>
                      <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
                        {weather.temp}<span className="text-2xl text-slate-400">°C</span>
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <WiHumidity size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Humidity</p>
                      <p className="text-sm font-black text-slate-800">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <WiRain size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Rain</p>
                      <p className="text-sm font-black text-slate-800">{weather.precipitation}mm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">7-Day Forecast</p>
              <div className="space-y-2">
                {forecast.map((day, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl group-hover:scale-110 transition-transform">
                        {getWeatherIcon(day.code)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{i === 0 ? "Today" : day.date}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {day.precip > 0 ? `${day.precip}mm rain` : "Clear Sky"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{day.maxTemp}°</p>
                      <p className="text-[10px] font-bold text-slate-400">{day.minTemp}°</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </PopupBox>
    </>
  );
};

export default Header;
