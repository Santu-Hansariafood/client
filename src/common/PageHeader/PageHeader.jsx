import PropTypes from "prop-types";

const PageHeader = ({ title, subtitle, icon: Icon, className = "", actions }) => {
  return (
    <div className={`mb-5 sm:mb-7 md:mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {Icon && (
              <span className={`
                flex shrink-0
                w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12
                rounded-xl sm:rounded-2xl
                bg-gradient-to-br from-emerald-500/10 via-emerald-500/10 to-teal-500/10
                text-emerald-600 items-center justify-center
                ring-1 ring-emerald-500/20
                animate-pop-in
                hover:scale-105 hover:from-emerald-500/20 hover:via-teal-500/20 hover:to-cyan-500/20
                transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)
              `}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-[26px] md:h-[26px]" aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="relative inline-flex items-center gap-2">
                <h1 className="
                  animate-page-title
                  text-xl sm:text-2xl md:text-3xl
                  font-black text-slate-900 tracking-tight truncate font-display
                  text-balance
                ">
                  {title}
                </h1>
                <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 animate-pulseSlow shadow-md shadow-emerald-500/40" />
              </div>
              {subtitle && (
                <p className="
                  animate-page-title
                  mt-1.5 sm:mt-2
                  text-xs sm:text-sm md:text-base
                  text-slate-600 max-w-2xl
                  leading-relaxed
                  [animation-delay:60ms]
                  text-balance
                ">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {actions && (
          <div className="animate-slide-up [animation-delay:120ms] w-full sm:w-auto">
            <div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              {actions}
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-4 sm:mt-5">
        <div className="animate-page-underline h-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 animate-gradient-border bg-[length:200%_200%] shadow-sm shadow-emerald-500/20" />
        <div className="absolute inset-0 blur-md opacity-40 animate-page-underline h-1 rounded-full bg-gradient-to-r from-emerald-500/60 via-teal-500/60 to-cyan-400/60 [animation-delay:120ms]" />
      </div>
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  className: PropTypes.string,
  actions: PropTypes.node,
};

export default PageHeader;
