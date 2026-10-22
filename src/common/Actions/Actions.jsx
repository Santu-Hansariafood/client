import PropTypes from "prop-types";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";

const Actions = ({ onView, onEdit, onDelete, size = "md", labels = false }) => {
  const sizeConfig = {
    sm: {
      wrap: "gap-1 p-1 rounded-xl",
      btn: "w-8 h-8 rounded-lg",
      icon: 16,
      label: "text-[10px]",
    },
    md: {
      wrap: "gap-1.5 p-1.5 rounded-2xl",
      btn: "w-10 h-10 sm:w-11 sm:h-11 rounded-xl",
      icon: 20,
      label: "text-[11px]",
    },
    lg: {
      wrap: "gap-2 p-2 rounded-2xl",
      btn: "w-12 h-12 rounded-xl",
      icon: 22,
      label: "text-xs",
    },
  };

  const cfg = sizeConfig[size] || sizeConfig.md;

  const buttonClass = (colors) => `
    flex items-center justify-center gap-1.5
    ${cfg.btn}
    bg-lux-cream
    ${colors.border} ${colors.text}
    hover:${colors.bgHover} hover:${colors.borderHover}
    active:scale-90 hover:scale-105 hover:-translate-y-0.5
    transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
    focus:outline-none focus:ring-2 ${colors.ring}
    shadow-sm hover:shadow-md
    ${labels ? "w-auto px-2.5 sm:px-3" : ""}
  `;

  return (
    <div className={`
      inline-flex items-center ${cfg.wrap}
      bg-gradient-to-br from-lux-cream via-[#f7f4ec] to-lux-cream
      border border-[#e9e2d3] shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)]
      animate-fade-in
    `}>
      <button
        type="button"
        onClick={onView}
        className={buttonClass({
          border: "border border-[#e6dcc4]",
          text: "text-lux-emerald",
          bgHover: "bg-lux-ivory",
          borderHover: "border-[#dccfa8]",
          ring: "focus:ring-lux-gold/40",
        })}
        title="View details"
      >
        <MdVisibility size={cfg.icon} className="shrink-0" />
        {labels && <span className={`font-serif font-bold ${cfg.label}`}>View</span>}
      </button>
      <button
        type="button"
        onClick={onEdit}
        className={buttonClass({
          border: "border border-lux-gold/20",
          text: "text-lux-gold",
          bgHover: "bg-lux-ivory",
          borderHover: "border-[#dccfa8]",
          ring: "focus:ring-lux-gold/40",
        })}
        title="Edit"
      >
        <MdEdit size={cfg.icon} className="shrink-0" />
        {labels && <span className={`font-serif font-bold ${cfg.label}`}>Edit</span>}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={buttonClass({
          border: "border border-red-100",
          text: "text-red-500",
          bgHover: "bg-red-50",
          borderHover: "border-red-300",
          ring: "focus:ring-red-400/40",
        })}
        title="Delete"
      >
        <MdDelete size={cfg.icon} className="shrink-0" />
        {labels && <span className={`font-serif font-bold ${cfg.label}`}>Delete</span>}
      </button>
    </div>
  );
};

Actions.propTypes = {
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  labels: PropTypes.bool,
};

export default Actions;
