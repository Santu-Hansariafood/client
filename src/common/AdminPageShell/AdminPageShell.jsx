import PropTypes from "prop-types";
import PageHeader from "../PageHeader/PageHeader";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSyncAlt } from "react-icons/fa";

const AdminPageShell = ({
  title,
  subtitle,
  icon,
  children,
  mainClassName = "",
  contentClassName = "",
  noContentCard = false,
  onRefresh,
}) => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <main
      className={`min-h-[calc(100vh-5rem)] w-full max-w-full overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 bg-slate-50 ${mainClassName}`}
    >
      <div
        className={`mx-auto w-full max-w-7xl ${noContentCard ? "" : "rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-md shadow-xl shadow-slate-900/5 p-6 sm:p-8 md:p-10"} ${contentClassName}`}
      >
        {/* Global Action Buttons */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <FaArrowLeft /> Back
          </button>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-lg"
          >
            <FaSyncAlt /> Refresh
          </button>
        </div>

        {(title || subtitle) && (
          <PageHeader title={title} subtitle={subtitle} icon={icon} />
        )}
        {children}
      </div>
    </main>
  );
};

AdminPageShell.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  mainClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  noContentCard: PropTypes.bool,
  onRefresh: PropTypes.func,
};

export default AdminPageShell;
