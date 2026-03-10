import PropTypes from "prop-types";

const PageHeader = ({ title, subtitle, icon: Icon, className = "" }) => {
  return (
    <div
      className={`mb-6 sm:mb-8 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="hidden sm:flex shrink-0 w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 items-center justify-center">
                <Icon className="text-xl" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="animate-page-title text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="animate-page-title mt-1 text-sm sm:text-base text-slate-600 max-w-2xl [animation-delay:60ms]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="animate-page-underline mt-4 h-px bg-gradient-to-r from-emerald-500/40 via-amber-400/30 to-transparent rounded-full" />
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

export default PageHeader;
