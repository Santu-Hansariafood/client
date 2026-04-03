import { useCallback } from "react";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Cards = ({ title, count, icon: Icon, link, state, color }) => {
  const navigate = useNavigate();

  const handleRedirect = useCallback(() => {
    navigate(link, { state });
  }, [navigate, link, state]);

  return (
    <article
      onClick={handleRedirect}
      role="button"
      aria-label={`View details for ${title}`}
      className="
        relative group cursor-pointer overflow-hidden
        rounded-2xl sm:rounded-3xl
        p-3 sm:p-5 lg:p-6

        /* Base Card Look (IMPORTANT) */
        bg-white border border-slate-200 shadow-md

        /* Glass Effect */
        backdrop-blur-xl

        /* Smooth Animation */
        transition-all duration-300 ease-out

        /* Hover */
        hover:shadow-2xl hover:-translate-y-1
        active:scale-95
      "
    >
      <div
        className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-all duration-300 bg-gradient-to-br ${color}`}
      />

      <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-100 rounded-full opacity-40 blur-2xl group-hover:scale-125 transition-all duration-500"></div>

      <div className="relative z-10 flex flex-col items-start">
        <div
          className={`
            flex items-center justify-center
            w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12
            rounded-xl

            bg-gradient-to-br ${color}
            text-white shadow-md

            transition-all duration-300
            group-hover:scale-110 group-hover:rotate-6
          `}
        >
          <Icon className="text-lg sm:text-xl" />
        </div>

        <h3
          className="
          mt-3 sm:mt-4
          text-[10px] sm:text-xs
          font-semibold
          text-slate-500 uppercase tracking-wider
          group-hover:text-slate-700
        "
        >
          {title}
        </h3>

        <p
          className="
          text-lg sm:text-2xl lg:text-3xl
          font-bold
          text-slate-800
          tracking-tight
        "
        >
          {count}
        </p>
      </div>

      <div
        className="
          absolute top-2 right-2 sm:top-4 sm:right-4
          p-1.5 sm:p-2
          rounded-lg

          bg-slate-100 text-slate-400

          transition-all duration-300
          group-hover:bg-gradient-to-br group-hover:from-slate-800 group-hover:to-slate-900
          group-hover:text-white group-hover:rotate-45
        "
      >
        <FaArrowRight className="text-xs sm:text-sm" />
      </div>

      <div
        className="
        absolute bottom-0 right-0
        w-20 h-20 sm:w-24 sm:h-24
        bg-slate-100
        rounded-tl-[100px]
        -mr-10 -mb-10
        opacity-40
        group-hover:scale-150
        transition-transform duration-500
      "
      ></div>

      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/40 pointer-events-none"></div>
    </article>
  );
};

export default Cards;
