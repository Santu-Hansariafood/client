import PropTypes from "prop-types";

const PopupBox = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-8 md:p-10 lg:p-12 transition-transform transform scale-100">
        <button
          title="Close"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl focus:outline-none transition-transform transform hover:scale-110"
        >
          ✖
        </button>
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-4">
          {title}
        </h3>
        <div className="overflow-auto max-h-[70vh] space-y-6 px-4 text-gray-700">
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
