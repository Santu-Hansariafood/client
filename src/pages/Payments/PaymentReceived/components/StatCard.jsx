import React from "react";

const StatCard = ({
  icon,
  label,
  value,
  subValue,
  color,
  iconColor,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`lux-card lux-card-hover lux-sheen flex flex-col gap-3 p-5 ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl ${color} ${iconColor}`}>{icon}</div>
      {subValue && (
        <span className="rounded-lg border border-[#e6dcc4] bg-lux-cream px-2 py-1 lux-eyebrow">
          {subValue}
        </span>
      )}
    </div>
    <div>
      <p className="lux-eyebrow leading-none mb-1">
        {label}
      </p>
      <p className="font-serif text-2xl sm:text-3xl font-semibold text-lux-ink tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  </div>
);

export default StatCard;
