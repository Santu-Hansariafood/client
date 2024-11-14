import PropTypes from "prop-types";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";

const Actions = ({ onView, onEdit, onDelete }) => {
  return (
    <div className="flex space-x-2 bg-white rounded-lg shadow-md p-2">
      <button
        onClick={onView}
        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-4 rounded-lg focus:outline-none hover:scale-105 transition duration-300"
        title="View"
      >
        <MdVisibility size={24} className="animate-pulse" />
      </button>
      <button
        onClick={onEdit}
        className="bg-gradient-to-r from-green-500 to-green-700 text-white py-2 px-4 rounded-lg focus:outline-none hover:scale-105 transition duration-300"
        title="Edit"
      >
        <MdEdit size={24} className="animate-pulse" />
      </button>
      <button
        onClick={onDelete}
        className="bg-gradient-to-r from-red-500 to-red-700 text-white py-2 px-4 rounded-lg focus:outline-none hover:scale-105 transition duration-300"
        title="Delete"
      >
        <MdDelete size={24} className="animate-pulse" />
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
