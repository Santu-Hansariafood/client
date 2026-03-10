import PropTypes from "prop-types";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";

const Actions = ({ onView, onEdit, onDelete }) => {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 p-1.5 border border-slate-200/80 shadow-sm">
      <button
        type="button"
        onClick={onView}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        title="View"
      >
        <MdVisibility size={18} />
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-amber-600 border border-amber-100 hover:bg-amber-50 hover:border-amber-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        title="Edit"
      >
        <MdEdit size={18} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-red-600 border border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/40"
        title="Delete"
      >
        <MdDelete size={18} />
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
