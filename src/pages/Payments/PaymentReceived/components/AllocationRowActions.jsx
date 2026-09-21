import Buttons from "../../../../common/Buttons/Buttons";
import {
  FaCheckCircle,
  FaExchangeAlt,
  FaPlus,
  FaSave,
} from "react-icons/fa";

const AllocationRowActions = ({
  row,
  index,
  isAdmin,
  isLocked,
  multiAdjustmentMode,
  loading,
  onSave,
  onAdd,
}) => (
  <div className="flex w-full min-w-[100px] flex-col gap-1">
    <div className="flex gap-1">
      {!multiAdjustmentMode && (
        <Buttons
          label={
            isLocked && !isAdmin
              ? "Locked"
              : isAdmin && row.isSaved
                ? "Adjust"
                : "Save"
          }
          onClick={() => onSave(row)}
          disabled={(isLocked && !isAdmin) || loading}
          variant={
            isLocked && !isAdmin
              ? "ghost"
              : isAdmin && row.isSaved
                ? "outline"
                : "primary"
          }
          size="sm"
          icon={
            isLocked && !isAdmin ? (
              <FaCheckCircle size={12} />
            ) : isAdmin && row.isSaved ? (
              <FaExchangeAlt size={12} />
            ) : (
              <FaSave size={12} />
            )
          }
          className={`flex-1 !py-2.5 !text-[10px] ${
            isAdmin && row.isSaved
              ? "!border-green-500 !text-green-600 hover:!bg-green-50"
              : ""
          }`}
        />
      )}
      {!isLocked && (
        <button
          type="button"
          onClick={() => onAdd(row, index)}
          className="rounded-xl bg-slate-100 p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-900 hover:text-white"
          title="Add another allocation for this lorry"
        >
          <FaPlus size={12} />
        </button>
      )}
    </div>
  </div>
);

export default AllocationRowActions;
