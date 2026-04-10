import PropTypes from "prop-types";
import { FaTimes } from "react-icons/fa";

const PopupBox = ({
  isOpen,
  onClose,
  title,
  children,
  width = "w-[98vw]",
  height = "h-[95vh]",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative ${width} ${height} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-emerald-600/20 bg-gradient-to-r from-emerald-800 to-emerald-700">
          <h3 className="text-lg font-semibold text-amber-50 tracking-tight">
            {title}
          </h3>

          <button
            onClick={onClose}
            title="Close"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-amber-100/90 hover:text-white hover:bg-white/15 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 active:scale-95"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 text-slate-600 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};

PopupBox.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
};

export default PopupBox;
