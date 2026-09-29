import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { useEffect } from "react";

const PopupBox = ({
  isOpen,
  onClose,
  title,
  children,
  width = "w-[98vw] sm:w-[92vw]",
  height = "h-[94vh] sm:h-[92vh] md:h-[90vh]",
  headerActions = null,
  showDragHandle = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex sm:items-center items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        className={`
          relative ${width} ${height} max-w-full max-h-full
          bg-white dark:bg-slate-900
          sm:rounded-[2rem] rounded-t-[2rem] sm:rounded-b-[2rem] rounded-b-none
          shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)]
          sm:border border-white/20
          flex flex-col overflow-hidden
          md:animate-modal-desktop animate-modal-mobile
          will-change-transform
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {showDragHandle && (
          <div className="sm:hidden flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 animate-pulse-slow" />
          </div>
        )}

        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 sm:py-5 border-b border-slate-100 bg-gradient-to-b from-white/95 via-white/90 to-white/80 backdrop-blur-xl min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="hidden sm:block w-1 h-6 rounded-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-500 animate-gradient-border bg-[length:100%_200%]" />
            {typeof title === "string" ? (
              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase min-w-0 truncate font-display">
                {title}
              </h3>
            ) : (
              <div className="min-w-0 flex-1">{title}</div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {headerActions}
            <button
              onClick={onClose}
              title="Close"
              className="
                flex items-center justify-center
                w-10 h-10 sm:w-11 sm:h-11
                rounded-2xl
                text-slate-400 hover:text-slate-900 hover:bg-slate-100
                transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)
                focus:outline-none focus:ring-2 focus:ring-emerald-400/50
                active:scale-90 hover:scale-105
                group
              "
            >
              <div className="relative">
                <FaTimes className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90" />
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 text-slate-600 dark:text-slate-300 overscroll-contain animate-slide-up [animation-delay:100ms]">
          <div className="sm:hidden h-0.5 w-16 mx-auto mb-5 rounded-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          {children}
        </div>

        <div className="hidden sm:block absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

PopupBox.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  children: PropTypes.node.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
  headerActions: PropTypes.node,
  showDragHandle: PropTypes.bool,
};

export default PopupBox;
