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
      className="relative bg-white/50 p-8 rounded-3xl transition-all duration-300 hover:bg-white group cursor-pointer overflow-hidden"
      onClick={handleRedirect}
      role="button"
      aria-label={`View details for ${title}`}
    >
      <div className="relative z-10">
        <div
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl mb-6 
          group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-emerald-200"
        >
          <Icon className="text-2xl" loading="lazy" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 group-hover:text-emerald-700 transition-colors">
          {title}
        </h3>
        <p className="text-4xl font-black text-slate-800 tracking-tight">
          {count}
        </p>
      </div>

      <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-50 rounded-tl-[100px] -mr-16 -mb-16 group-hover:scale-150 transition-transform duration-500 opacity-50"></div>

      <div
        className="absolute top-8 right-8 p-3 bg-slate-50 rounded-2xl text-slate-400 
        group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-45 transition-all duration-300 shadow-sm"
      >
        <FaArrowRight className="text-lg" loading="lazy" aria-hidden="true" />
      </div>
    </article>
  );
};

export default Cards;
