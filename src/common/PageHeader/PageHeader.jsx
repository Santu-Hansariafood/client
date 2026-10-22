import PropTypes from "prop-types";

const PageHeader = ({ title, subtitle, icon: Icon, className = "", actions }) => {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3.5">
            {Icon && (
              <span className="animate-pop-in relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40 sm:h-12 sm:w-12">
                <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="lux-eyebrow animate-page-title mb-1">
                Hansaria Food &middot; Private Limited
              </p>
              <h1 className="animate-page-title font-serif text-2xl font-semibold tracking-tight text-lux-ink text-balance sm:text-3xl md:text-[2rem]">
                {title}
              </h1>
              {subtitle && (
                <p className="animate-page-title mt-1.5 max-w-2xl text-sm text-lux-muted text-balance [animation-delay:60ms]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {actions && (
          <div className="animate-slide-up w-full [animation-delay:120ms] sm:w-auto">
            <div className="flex flex-wrap items-stretch gap-2 sm:items-center sm:gap-2.5">
              {actions}
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-5">
        <div className="lux-rule animate-page-underline" />
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
