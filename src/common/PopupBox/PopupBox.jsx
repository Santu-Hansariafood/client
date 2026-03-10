import PropTypes from "prop-types";
import { FaTimes } from "react-icons/fa";

const PopupBox = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/30 border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 px-6 py-4 border-b border-emerald-600/20 bg-gradient-to-r from-emerald-800 to-emerald-700">
          <h3 className="text-lg font-semibold text-amber-50 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            title="Close"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-amber-100/90 hover:text-white hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300/50"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 text-slate-600 dark:text-slate-300">
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
};

export default PopupBox;
