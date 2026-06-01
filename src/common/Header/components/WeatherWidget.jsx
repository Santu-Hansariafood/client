import { useState, useEffect, useCallback } from "react";
import { AiOutlineCloud, AiOutlineEnvironment } from "react-icons/ai";
import { FaSatellite } from "react-icons/fa";
import {
  WiDaySunny,
  WiRain,
  WiCloudy,
  WiHumidity,
  WiStrongWind,
} from "react-icons/wi";
import PopupBox from "../../PopupBox/PopupBox";

const getWeatherLabel = (code) => {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [locationName, setLocationName] = useState("Local Area");
  const [coords, setCoords] = useState(null);

  const fetchWeather = useCallback(async (lat, lon) => {
    setWeatherLoading(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`,
      );
      const data = await response.json();

      setWeather({
        temp: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation,
        wind: data.current.wind_speed_10m,
        code: data.current.weather_code,
        isDay: data.current.is_day,
      });

      const dailyForecast = data.daily.time.map((time, i) => ({
        date: new Date(time).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        maxTemp: data.daily.temperature_2m_max[i],
        minTemp: data.daily.temperature_2m_min[i],
        code: data.daily.weather_code[i],
        precip: data.daily.precipitation_sum[i],
      }));
      setForecast(dailyForecast);

      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        );
        const geoData = await geoRes.json();
        const city =
          geoData.address.city ||
          geoData.address.town ||
          geoData.address.village ||
          geoData.address.state ||
          "Local Area";
        setLocationName(city);
      } catch (e) {
        console.error("Geocoding failed:", e);
      }
    } catch (error) {
      console.error("Weather fetch failed:", error);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    let watchId;

    const handleSuccess = (pos) => {
      const { latitude, longitude } = pos.coords;

      if (
        !coords ||
        Math.abs(coords.lat - latitude) > 0.01 ||
        Math.abs(coords.lon - longitude) > 0.01
      ) {
        setCoords({ lat: latitude, lon: longitude });
        fetchWeather(latitude, longitude);
      }
    };

    const handleError = () => {
      if (!coords) {
        fetchWeather(28.6139, 77.209);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError);

      watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 30000,
        },
      );
    } else {
      fetchWeather(28.6139, 77.209);
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [fetchWeather, coords]);

  useEffect(() => {
    if (isWeatherModalOpen && coords) {
      fetchWeather(coords.lat, coords.lon);
    }
  }, [isWeatherModalOpen, coords, fetchWeather]);

  const getWeatherIcon = (code, isDay = 1, className = "") => {
    const sizeClass = className || "w-full h-full";
    if (code === 0)
      return (
        <WiDaySunny
          className={`${sizeClass} ${isDay ? "text-amber-300" : "text-indigo-300"}`}
        />
      );
    if (code >= 1 && code <= 3)
      return <WiCloudy className={`${sizeClass} text-slate-200`} />;
    if (code >= 51 && code <= 67)
      return <WiRain className={`${sizeClass} text-sky-300`} />;
    if (code >= 71 && code <= 86)
      return <AiOutlineCloud className={`${sizeClass} text-slate-100`} />;
    return <WiCloudy className={`${sizeClass} text-slate-300`} />;
  };

  const modalTitle = (
    <div className="min-w-0">
      <p className="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em] mb-0.5">
        HFPL
      </p>
      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
        Atmospheric{" "}
        <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
          Intelligence
        </span>
      </h3>
    </div>
  );

  if (weatherLoading) {
    return (
      <div
        className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white/10 border border-white/10 animate-pulse min-w-[72px] sm:min-w-[88px]"
        aria-hidden
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 shrink-0" />
        <div className="flex flex-col gap-1 min-w-0">
          <div className="w-7 h-3 bg-white/15 rounded" />
          <div className="w-10 h-2 bg-white/10 rounded hidden sm:block" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const condition = getWeatherLabel(weather.code);
  const isNight = !weather.isDay;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsWeatherModalOpen(true)}
        aria-label={`Weather: ${weather.temp}°C in ${locationName}. Open atmospheric intelligence`}
        className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/15 to-white/5 hover:from-white/20 hover:to-white/10 transition-all duration-300 border border-white/15 shadow-lg shadow-black/10 group min-w-0"
      >
        <div className="relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 group-hover:scale-110 transition-transform duration-300">
          <div className="w-6 h-6 sm:w-7 sm:h-7">
            {getWeatherIcon(weather.code, weather.isDay)}
          </div>
        </div>
        <div className="flex flex-col items-start leading-none min-w-0">
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm sm:text-base font-black text-white tabular-nums">
              {Math.round(weather.temp)}°
            </span>
            <span className="text-[9px] font-bold text-emerald-200/90">C</span>
          </div>
          <span className="hidden sm:block text-[8px] font-black text-white/50 uppercase tracking-widest truncate max-w-[72px]">
            {locationName}
          </span>
        </div>
      </button>

      <PopupBox
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        title={modalTitle}
        width="w-[min(100vw-1.5rem,28rem)] sm:w-[32rem]"
        height="h-auto max-h-[92vh]"
      >
        <div className="space-y-5 sm:space-y-6 -mt-2 pb-2">
          {/* Hero */}
          <div
            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl ${
              isNight
                ? "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
                : "bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700"
            }`}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/15 blur-3xl" />
              <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-sky-400/20 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Live feed
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white/70 uppercase tracking-wider">
                  <FaSatellite className="text-white/60" size={10} />
                  Open-Meteo
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-white/80 mb-1">
                    <AiOutlineEnvironment size={13} className="shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] truncate">
                      {locationName}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white/70 mb-2">
                    {condition}
                  </p>
                  <p className="text-4xl sm:text-5xl font-black tracking-tighter tabular-nums leading-none">
                    {Math.round(weather.temp)}
                    <span className="text-xl sm:text-2xl font-bold text-white/50 ml-0.5">
                      °C
                    </span>
                  </p>
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 animate-weather-float drop-shadow-2xl">
                  {getWeatherIcon(weather.code, weather.isDay)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 sm:mt-7">
                <WeatherStat
                  icon={WiHumidity}
                  label="Humidity"
                  value={`${weather.humidity}%`}
                />
                <WeatherStat
                  icon={WiStrongWind}
                  label="Wind"
                  value={`${Math.round(weather.wind)}`}
                  unit="km/h"
                />
                <WeatherStat
                  icon={WiRain}
                  label="Rain"
                  value={`${weather.precipitation}`}
                  unit="mm"
                />
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 sm:mb-4 flex items-center gap-2 px-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" />
              7-day outlook
            </h4>

            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin sm:grid sm:grid-cols-1 sm:overflow-visible sm:pb-0">
              {forecast.map((day, i) => (
                <ForecastDay
                  key={day.date}
                  day={day}
                  isToday={i === 0}
                  getWeatherIcon={getWeatherIcon}
                />
              ))}
            </div>
          </div>
        </div>
      </PopupBox>
    </>
  );
};

const WeatherStat = ({ icon: Icon, label, value, unit }) => (
  <div className="rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 flex flex-col items-center gap-0.5 sm:gap-1 text-center min-w-0">
    <Icon className="text-xl sm:text-2xl text-white/85 shrink-0" />
    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/55 truncate w-full">
      {label}
    </span>
    <span className="text-xs sm:text-sm font-black tabular-nums leading-tight">
      {value}
      {unit && (
        <span className="text-[9px] font-bold text-white/50 ml-0.5">{unit}</span>
      )}
    </span>
  </div>
);

const ForecastDay = ({ day, isToday, getWeatherIcon }) => {
  const tempRange = Math.max(day.maxTemp - day.minTemp, 1);
  const barHeight = Math.min(100, Math.max(20, (day.maxTemp / 45) * 100));

  return (
    <div
      className={[
        "snap-start shrink-0 w-[140px] sm:w-full sm:shrink",
        "flex sm:flex-row flex-col sm:items-center sm:justify-between gap-3",
        "p-3.5 sm:p-4 rounded-2xl sm:rounded-2xl",
        "bg-slate-50/80 border border-slate-100/80",
        "hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/40",
        "transition-all duration-300",
        isToday ? "ring-2 ring-emerald-500/30 bg-emerald-50/50" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
          <div className="w-7 h-7">{getWeatherIcon(day.code)}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-black text-slate-800 truncate">
            {isToday ? "Today" : day.date}
          </p>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 truncate">
            {day.precip > 0 ? `${day.precip} mm rain` : "Dry"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
        <div className="flex items-center gap-2 tabular-nums">
          <span className="text-sm font-black text-slate-900">
            {Math.round(day.maxTemp)}°
          </span>
          <span className="text-xs font-bold text-slate-400">
            {Math.round(day.minTemp)}°
          </span>
        </div>
        <div
          className="w-1.5 h-10 sm:h-12 rounded-full bg-slate-100 overflow-hidden flex flex-col justify-end shrink-0"
          title={`Range ${tempRange.toFixed(0)}°`}
        >
          <div
            className="w-full bg-gradient-to-t from-emerald-500 to-sky-400 rounded-full transition-all duration-500"
            style={{ height: `${barHeight}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
