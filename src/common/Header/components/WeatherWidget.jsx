import { useState, useEffect } from "react";
import { AiOutlineCloud } from "react-icons/ai";
import { WiDaySunny, WiRain, WiCloudy, WiHumidity } from "react-icons/wi";
import PopupBox from "../../PopupBox/PopupBox";

const WeatherWidget = () => {
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

  if (!weather) return null;

  return (
    <>
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

      <PopupBox
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        title="Weather Forecast"
        width="w-[90vw] sm:w-[450px]"
        height="h-auto max-h-[85vh]"
      >
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
      </PopupBox>
    </>
  );
};

export default WeatherWidget;
