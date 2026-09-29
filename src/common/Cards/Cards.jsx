import { useCallback, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Cards = ({ title, count, icon: Icon, link, state, color, index = 0 }) => {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);

  const handleRedirect = useCallback(() => {
    navigate(link, { state });
  }, [navigate, link, state]);

  const staggerClass = `stagger-${Math.min((index % 8) + 1, 8)}`;

  return (
    <article
      onClick={handleRedirect}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${title}`}
      className={`
        relative group cursor-pointer overflow-hidden animate-card-stagger ${staggerClass}
        rounded-2xl sm:rounded-3xl
        p-3 sm:p-4 lg:p-6
        min-h-[110px] sm:min-h-[140px]
        bg-white border border-slate-200 shadow-md
        backdrop-blur-xl
        transition-all duration-400 cubic-bezier(0.2, 0.8, 0.2, 1)
        hover:shadow-2xl hover:-translate-y-1.5 hover:border-emerald-100
        ${pressed ? "scale-[0.96]" : "scale-100"}
        focus:outline-none focus:ring-2 focus:ring-emerald-400/60
        active:scale-[0.97]
      `}
    >
      <div
        className={`absolute inset-0 opacity-10 group-hover:opacity-25 transition-all duration-500 bg-gradient-to-br ${color}`}
      />

      <div className="absolute -top-12 -right-12 w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-white/60 to-slate-100/80 rounded-full opacity-50 blur-3xl group-hover:scale-150 group-hover:opacity-70 transition-all duration-700 ease-out" />

      <div className="relative z-10 flex flex-row sm:flex-col items-start justify-between h-full gap-2 sm:gap-0">
        <div className="flex flex-row sm:flex-col items-start sm:items-start gap-3 sm:gap-0 flex-1 min-w-0">
          <div
            className={`
              flex items-center justify-center shrink-0
              w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12
              rounded-xl sm:rounded-2xl
              bg-gradient-to-br ${color}
              text-white shadow-lg
              shadow-black/10
              transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)
              group-hover:scale-115 group-hover:rotate-6
              sm:mb-0
            `}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 transition-transform duration-400 group-hover:scale-110" />
          </div>

          <div className="flex flex-col min-w-0 flex-1 sm:mt-3 sm:mt-4">
            <h3
              className="
              text-[10px] sm:text-xs
              font-extrabold
              text-slate-500 uppercase tracking-[0.14em] sm:tracking-widest
              group-hover:text-slate-700
              font-display
              leading-tight
              break-words
            "
            >
              {title}
            </h3>

            <div className="mt-1 flex items-baseline gap-2">
              <p
                className="
                flex sm:hidden
                text-2xl sm:text-3xl
                font-black
                text-slate-900
                tracking-tighter
                font-display
                leading-none
              "
              >
                {count}
              </p>
              <p
                className="
                hidden sm:block
                text-xl sm:text-2xl lg:text-3xl
                font-black
                text-slate-900
                tracking-tighter
                font-display
              "
              >
                {count}
              </p>
            </div>
          </div>
        </div>

        <div
          className="
          shrink-0 sm:absolute sm:top-3 sm:right-3 lg:top-4 lg:right-4
          flex sm:hidden
          p-2
          rounded-xl
          bg-gradient-to-br from-slate-800 to-slate-900
          text-white shadow-md
          transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)
        "
        >
          <FaArrowRight className="w-4 h-4" />
        </div>

        <div
          className="
          hidden sm:flex shrink-0
          absolute top-3 right-3 lg:top-4 lg:right-4
          p-1.5 lg:p-2
          rounded-xl lg:rounded-2xl
          bg-slate-100 text-slate-400
          transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)
          group-hover:bg-gradient-to-br group-hover:from-slate-800 group-hover:to-slate-900
          group-hover:text-white group-hover:rotate-45 group-hover:scale-110
        "
        >
          <FaArrowRight className="text-xs sm:text-sm lg:text-base" />
        </div>
      </div>

      <div
        className="
        absolute bottom-0 right-0
        w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32
        bg-gradient-to-tl from-slate-100/80 to-transparent
        rounded-tl-[100px]
        -mr-10 -mb-10 sm:-mr-14 sm:-mb-14
        opacity-50
        group-hover:scale-150 group-hover:opacity-70
        transition-all duration-600 ease-out
      "
      />

      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/60 pointer-events-none" />

      <div
        className={`
          absolute bottom-0 left-3 sm:left-4 right-3 sm:right-4
          h-0.5 rounded-full opacity-0 group-hover:opacity-100
          bg-gradient-to-r ${color}
          transition-all duration-500 ease-out
          scale-x-0 group-hover:scale-x-100 origin-left
        `}
      />
    </article>
  );
};

export default Cards;
