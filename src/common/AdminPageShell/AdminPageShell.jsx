import PropTypes from "prop-types";
import { useState } from "react";
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
  isLoading = false,
  showRefresh = true,
  showBack = true,
}) => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  return (
    <main
      className={`min-h-[calc(100vh-5rem)] w-full max-w-full overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10 bg-slate-50 ${mainClassName}`}
    >
      <div
        className={`mx-auto w-full max-w-7xl animate-slide-up ${noContentCard ? "" : "rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-md shadow-xl shadow-slate-900/5 p-4 sm:p-8 md:p-10"} ${contentClassName}`}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 shadow-sm active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 animate-fade-in"
            >
              <FaArrowLeft /> Back
            </button>
          )}
          {!showBack && <div />}
          {showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 shadow-lg active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 animate-fade-in disabled:opacity-70"
            >
              <FaSyncAlt className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          )}
        </div>

        {isLoading ? (
          <>
            <div className="space-y-4 mb-8">
              <div className="h-8 w-48 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: "0ms" }} />
              <div className="h-5 w-72 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: "100ms" }} />
              <div className="h-5 w-64 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: "200ms" }} />
              <div className="h-5 w-56 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: "300ms" }} />
            </div>
            <div className="grid gap-4 sm:gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 p-4 sm:p-6 bg-white"
                  style={{ animationDelay: `${(i + 1) * 150}ms` }}
                >
                  <div className="h-6 w-32 rounded-md bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 w-full rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
                    <div className="h-4 w-5/6 rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
                    <div className="h-4 w-4/6 rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {(title || subtitle) && (
              <PageHeader title={title} subtitle={subtitle} icon={icon} />
            )}
            {children}
          </>
        )}
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
  isLoading: PropTypes.bool,
  showRefresh: PropTypes.bool,
  showBack: PropTypes.bool,
};

export default AdminPageShell;
