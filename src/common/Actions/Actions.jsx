import PropTypes from "prop-types";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";

const Actions = ({ onView, onEdit, onDelete }) => {
  return (
    <div className="flex space-x-2 bg-white/80 rounded-xl shadow-lg p-2 border border-gray-100 backdrop-blur-md">
      <button
        onClick={onView}
        className="group bg-gradient-to-tr from-blue-400 to-blue-700 text-white py-2 px-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400/60 hover:scale-110 transition-all duration-200 border border-blue-200 hover:shadow-xl"
        title="View"
      >
        <MdVisibility size={18} className="group-hover:animate-pulse" />
      </button>
      <button
        onClick={onEdit}
        className="group bg-gradient-to-tr from-green-400 to-green-700 text-white py-2 px-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-400/60 hover:scale-110 transition-all duration-200 border border-green-200 hover:shadow-xl"
        title="Edit"
      >
        <MdEdit size={18} className="group-hover:animate-pulse" />
      </button>
      <button
        onClick={onDelete}
        className="group bg-gradient-to-tr from-red-400 to-red-700 text-white py-2 px-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-400/60 hover:scale-110 transition-all duration-200 border border-red-200 hover:shadow-xl"
        title="Delete"
      >
        <MdDelete size={18} className="group-hover:animate-pulse" />
      </button>
    </div>
  );
};

Actions.propTypes = {
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default Actions;
