import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

const PopupBox = ({
  isOpen,
  onClose,
  title,
  children,
  width = "w-[98vw]",
  height = "h-[95vh]",
  headerActions = null,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-900/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className={`relative ${width} ${height} max-w-full max-h-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
          <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
            {title}
          </h3>

          <div className="flex items-center gap-3">
            {headerActions}
            <button
              onClick={onClose}
              title="Close"
              className="flex items-center justify-center w-11 h-11 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 focus:outline-none active:scale-95"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 text-slate-600 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

PopupBox.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
  headerActions: PropTypes.node,
};

export default PopupBox;
