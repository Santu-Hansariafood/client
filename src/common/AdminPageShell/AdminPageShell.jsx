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

  const shimmer =
    "bg-gradient-to-r bg-[length:200%_100%] animate-shimmer from-[#efe9dc] via-[#e5ddc9] to-[#efe9dc]";

  const backButton =
    "flex items-center gap-2 px-4 py-2 rounded-xl bg-lux-cream border border-[#e4dbc6] text-lux-emerald font-black uppercase text-[10px] tracking-widest hover:bg-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-lux-emerald/10 transition-all duration-200 shadow-sm active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-lux-gold/50 focus:ring-offset-2 animate-fade-in";

  const refreshButton =
    "flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft font-black uppercase text-[10px] tracking-widest ring-1 ring-lux-gold/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-lux-emerald/25 transition-all duration-200 shadow-lg active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-lux-gold/50 focus:ring-offset-2 animate-fade-in disabled:opacity-70";

  return (
    <main
      className={`min-h-[calc(100vh-5rem)] w-full max-w-full overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10 lux-canvas ${mainClassName}`}
    >
      <div
        className={`mx-auto w-full max-w-7xl animate-slide-up ${
          noContentCard ? "" : "lux-card p-4 sm:p-8 md:p-10"
        } ${contentClassName}`}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          {showBack && (
            <button onClick={() => navigate(-1)} className={backButton}>
              <FaArrowLeft /> Back
            </button>
          )}
          {!showBack && <div />}
          {showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={refreshButton}
            >
              <FaSyncAlt className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          )}
        </div>

        {isLoading ? (
          <>
            <div className="space-y-4 mb-8">
              <div className={`h-8 w-48 rounded-lg ${shimmer}`} style={{ animationDelay: "0ms" }} />
              <div className={`h-5 w-72 rounded-lg ${shimmer}`} style={{ animationDelay: "100ms" }} />
              <div className={`h-5 w-64 rounded-lg ${shimmer}`} style={{ animationDelay: "200ms" }} />
              <div className={`h-5 w-56 rounded-lg ${shimmer}`} style={{ animationDelay: "300ms" }} />
            </div>
            <div className="grid gap-4 sm:gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#e9e2d3] bg-lux-cream p-4 sm:p-6"
                  style={{ animationDelay: `${(i + 1) * 150}ms` }}
                >
                  <div className={`h-6 w-32 rounded-md ${shimmer} mb-4`} />
                  <div className="space-y-3">
                    <div className={`h-4 w-full rounded ${shimmer}`} />
                    <div className={`h-4 w-5/6 rounded ${shimmer}`} />
                    <div className={`h-4 w-4/6 rounded ${shimmer}`} />
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
