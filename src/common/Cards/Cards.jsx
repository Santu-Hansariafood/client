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
        bg-lux-cream border border-[#e9e2d3] shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)]
        backdrop-blur-xl
        transition-all duration-400 cubic-bezier(0.2, 0.8, 0.2, 1)
        hover:shadow-2xl hover:-translate-y-1.5 hover:border-[#dccfa8]
        ${pressed ? "scale-[0.96]" : "scale-100"}
        focus:outline-none focus:ring-2 focus:ring-lux-gold/50
        active:scale-[0.97]
      `}
    >
      <div
        className={`absolute inset-0 opacity-10 group-hover:opacity-25 transition-all duration-500 bg-gradient-to-br ${color}`}
      />

      <div className="absolute -top-12 -right-12 w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-lux-cream/70 to-[#f2eee2]/70 rounded-full opacity-50 blur-3xl group-hover:scale-150 group-hover:opacity-70 transition-all duration-700 ease-out" />

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
              text-lux-muted uppercase tracking-[0.14em] sm:tracking-widest
              group-hover:text-lux-ink
              font-serif
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
                text-lux-ink
                tracking-tighter
                font-serif
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
                text-lux-ink
                tracking-tighter
                font-serif
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
          bg-gradient-to-br from-lux-emerald to-lux-deep
          text-lux-gold-soft shadow-md
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
          bg-[#f2eee2] text-lux-muted
          transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)
          group-hover:bg-gradient-to-br group-hover:from-lux-emerald group-hover:to-lux-deep
          group-hover:text-lux-gold-soft group-hover:rotate-45 group-hover:scale-110
        "
        >
          <FaArrowRight className="text-xs sm:text-sm lg:text-base" />
        </div>
      </div>

      <div
        className="
        absolute bottom-0 right-0
        w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32
        bg-gradient-to-tl from-[#f2eee2]/70 to-transparent
        rounded-tl-[100px]
        -mr-10 -mb-10 sm:-mr-14 sm:-mb-14
        opacity-50
        group-hover:scale-150 group-hover:opacity-70
        transition-all duration-600 ease-out
      "
      />

      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-lux-gold/15 pointer-events-none" />

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
