import { memo, useId } from "react";
import PropTypes from "prop-types";

/**
 * Animated Diwali diya (oil lamp) icon.
 * The clay bowl inherits `currentColor` so it stays legible on any of the
 * luxury card backgrounds, while the flame keeps a constant warm gold glow.
 */
const DiyaIcon = memo(
  ({
    className = "h-6 w-6 sm:h-7 sm:w-7 md:h-10 md:w-10",
    label = "Diya",
    glow = true,
  }) => {
    const uid = useId().replace(/[:]/g, "");
    const bowlId = `diya-bowl-${uid}`;
    const flameId = `diya-flame-${uid}`;
    const glowId = `diya-glow-${uid}`;

    return (
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label={label}
        className={`diya-icon ${className}`}
      >
        <defs>
          <linearGradient id={bowlId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={flameId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="45%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {glow && (
          <circle
            className="diya-glow"
            cx="32"
            cy="21"
            r="21"
            fill={`url(#${glowId})`}
          />
        )}

        <path
          d="M10 33 C 12 46 21 53 32 53 C 43 53 52 46 54 33 Z"
          fill={`url(#${bowlId})`}
        />
        <ellipse cx="32" cy="33" rx="22" ry="6" fill={`url(#${bowlId})`} />

        <g className="diya-flame">
          <path
            d="M32 5 C 25.5 15.5 25.5 24 32 32 C 38.5 24 38.5 15.5 32 5 Z"
            fill={`url(#${flameId})`}
          />
          <path
            d="M32 13 C 29 18.5 29 23 32 27.5 C 35 23 35 18.5 32 13 Z"
            fill="#fff6e0"
            opacity="0.92"
          />
        </g>
      </svg>
    );
  },
);

DiyaIcon.displayName = "DiyaIcon";
DiyaIcon.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  glow: PropTypes.bool,
};

/**
 * Festive divider: a glowing row of diyas framed by gold rules.
 */
export const DiyaGarland = memo(({ className = "" }) => (
  <div
    className={`flex items-center justify-center gap-3 sm:gap-5 ${className}`}
    aria-hidden="true"
  >
    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-lux-gold/50" />
    <div className="flex items-end gap-2 sm:gap-3">
      <DiyaIcon className="diya-sway h-4 w-4 text-lux-gold-soft sm:h-5 sm:w-5" />
      <DiyaIcon className="h-7 w-7 text-lux-gold sm:h-9 sm:w-9" />
      <DiyaIcon className="diya-sway h-4 w-4 text-lux-gold-soft sm:h-5 sm:w-5" />
    </div>
    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-lux-gold/50" />
  </div>
));

DiyaGarland.displayName = "DiyaGarland";
DiyaGarland.propTypes = {
  className: PropTypes.string,
};

export default DiyaIcon;
