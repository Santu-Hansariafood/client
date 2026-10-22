const AdjustmentModeToggle = ({
  enabled = false,
  selectedCount = 0,
  onChange,
}) => (
  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#e6dcc4] bg-lux-cream px-3 py-2 lux-eyebrow shadow-sm transition hover:bg-white">
    <input
      type="checkbox"
      checked={enabled}
      onChange={(event) => onChange?.(event.target.checked)}
      className="h-4 w-4 accent-lux-emerald"
    />
    Multi adjustment
    {enabled && <span className="text-lux-emerald">({selectedCount} selected)</span>}
  </label>
);

export default AdjustmentModeToggle;
