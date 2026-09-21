const AdjustmentModeToggle = ({
  enabled = false,
  selectedCount = 0,
  onChange,
}) => (
  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 shadow-sm">
    <input
      type="checkbox"
      checked={enabled}
      onChange={(event) => onChange?.(event.target.checked)}
      className="h-4 w-4 accent-blue-600"
    />
    Multi adjustment
    {enabled && <span className="text-blue-600">({selectedCount} selected)</span>}
  </label>
);

export default AdjustmentModeToggle;
