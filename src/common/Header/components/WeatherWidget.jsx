import { useState, useEffect } from "react";
import { AiOutlineCloud, AiOutlineEnvironment } from "react-icons/ai";
import {
  WiDaySunny,
  WiRain,
  WiCloudy,
  WiHumidity,
  WiStrongWind,
  WiThermometer,
} from "react-icons/wi";
import PopupBox from "../../PopupBox/PopupBox";

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [locationName, setLocationName] = useState("Local Area");

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
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
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(28.6139, 77.209), // Default to New Delhi
      );
    } else {
      fetchWeather(28.6139, 77.209);
    }
  }, []);

  const getWeatherIcon = (code, isDay = 1) => {
    if (code === 0)
      return (
        <WiDaySunny className={isDay ? "text-amber-400" : "text-indigo-300"} />
      );
    if (code >= 1 && code <= 3) return <WiCloudy className="text-slate-300" />;
    if (code >= 51 && code <= 67) return <WiRain className="text-blue-400" />;
    if (code >= 71 && code <= 86)
      return <AiOutlineCloud className="text-slate-200" />;
    return <WiCloudy className="text-slate-400" />;
  };

  if (weatherLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 animate-pulse">
        <div className="w-6 h-6 rounded-full bg-white/10"></div>
        <div className="flex flex-col gap-1">
          <div className="w-8 h-3 bg-white/10 rounded"></div>
          <div className="w-12 h-2 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <>
      <button
        onClick={() => setIsWeatherModalOpen(true)}
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/15 transition-all duration-500 border border-white/5 group shadow-lg shadow-black/5"
      >
        <div className="text-2xl sm:text-3xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
          {getWeatherIcon(weather.code, weather.isDay)}
        </div>
        <div className="flex flex-col items-start leading-none">
          <div className="flex items-center gap-1">
            <span className="text-sm sm:text-base font-black text-white tracking-tighter">
              {weather.temp}°
            </span>
            <span className="text-[10px] font-bold text-emerald-300/80">C</span>
          </div>
          <span className="hidden xs:block text-[9px] font-black text-emerald-300/60 uppercase tracking-widest">
            {locationName}
          </span>
        </div>
      </button>

      <PopupBox
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        title="HFPL Atmospheric Intelligence"
        width="w-[95vw] sm:w-[500px]"
      >
        <div className="space-y-8 p-1">
          <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-blue-700 p-8 text-white shadow-2xl">
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="flex items-center gap-2 text-emerald-100/80 mb-1">
                    <AiOutlineEnvironment size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {locationName}
                    </span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter flex items-start">
                    {weather.temp}
                    <span className="text-2xl mt-2 ml-1 opacity-60">°C</span>
                  </h2>
                </div>
                <div className="text-7xl drop-shadow-2xl animate-float">
                  {getWeatherIcon(weather.code, weather.isDay)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <WeatherStat
                  icon={WiHumidity}
                  label="Humidity"
                  value={`${weather.humidity}%`}
                />
                <WeatherStat
                  icon={WiStrongWind}
                  label="Wind"
                  value={`${weather.wind} km/h`}
                />
                <WeatherStat
                  icon={WiRain}
                  label="Precip"
                  value={`${weather.precipitation}mm`}
                />
              </div>
            </div>
          </div>
          <div className="px-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Extended Forecast
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {forecast.map((day, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="text-3xl group-hover:scale-125 transition-transform duration-500">
                      {getWeatherIcon(day.code)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 tracking-tight">
                        {i === 0 ? "Today" : day.date}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {day.precip > 0
                          ? `${day.precip}mm precipitation`
                          : "Clear Conditions"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 leading-none">
                        {day.maxTemp}°
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 leading-none">
                        {day.minTemp}°
                      </p>
                    </div>
                    <div className="w-1.5 h-8 rounded-full bg-slate-100 overflow-hidden flex flex-col justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-400 to-blue-400 rounded-full"
                        style={{ height: `${(day.maxTemp / 50) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopupBox>
    </>
  );
};

const WeatherStat = ({ icon: Icon, label, value }) => (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/10 flex flex-col items-center gap-1 transition-all hover:bg-white/20">
    <Icon size={24} className="text-white/80" />
    <span className="text-[8px] font-black uppercase tracking-tighter text-white/60">
      {label}
    </span>
    <span className="text-xs font-black">{value}</span>
  </div>
);

export default WeatherWidget;
