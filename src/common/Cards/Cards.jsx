import { useCallback } from "react";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Cards = ({ title, count, icon: Icon, link, state }) => {
  const navigate = useNavigate();

  const handleRedirect = useCallback(() => {
    navigate(link, { state });
  }, [navigate, link, state]);

  return (
    <article
      className="relative bg-white/50 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl transition-all duration-300 hover:bg-white group cursor-pointer overflow-hidden"
      onClick={handleRedirect}
      role="button"
      aria-label={`View details for ${title}`}
    >
      <div className="relative z-10">
        <div
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-xl lg:rounded-2xl mb-4 sm:mb-6 
          group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-emerald-200"
        >
          <Icon className="text-xl sm:text-2xl" loading="lazy" aria-hidden="true" />
        </div>
        <h3 className="text-[10px] sm:text-xs lg:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2 group-hover:text-emerald-700 transition-colors">
          {title}
        </h3>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
          {count}
        </p>
      </div>

      <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-emerald-50 rounded-tl-[100px] -mr-12 -mb-12 lg:-mr-16 lg:-mb-16 group-hover:scale-150 transition-transform duration-500 opacity-50"></div>

      <div
        className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 p-2 sm:p-3 bg-slate-50 rounded-xl lg:rounded-2xl text-slate-400 
        group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-45 transition-all duration-300 shadow-sm"
      >
        <FaArrowRight className="text-base lg:text-lg" loading="lazy" aria-hidden="true" />
      </div>
    </article>
  );
};

export default Cards;
