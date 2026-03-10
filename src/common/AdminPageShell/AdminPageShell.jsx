import PropTypes from "prop-types";
import PageHeader from "../PageHeader/PageHeader";

/**
 * Common content wrapper for admin pages. Header is rendered once in PrivateLayout.
 * Use for Buyer, Company, Group of Company, Consignee, and any admin screen.
 */
const AdminPageShell = ({
  title,
  subtitle,
  icon,
  children,
  mainClassName = "",
  contentClassName = "",
  noContentCard = false,
}) => (
  <main
    className={`min-h-[calc(100vh-5rem)] w-full max-w-full overflow-x-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-10 bg-gradient-to-b from-slate-50 to-emerald-50/40 ${mainClassName}`}
  >
    <div
      className={`mx-auto w-full max-w-7xl ${noContentCard ? "" : "rounded-2xl border border-amber-200/60 bg-white/95 shadow-lg shadow-slate-200/50 p-4 sm:p-6 md:p-8"} ${contentClassName}`}
    >
      {(title || subtitle) && (
        <PageHeader title={title} subtitle={subtitle} icon={icon} />
      )}
      {children}
    </div>
  </main>
);

AdminPageShell.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  mainClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  noContentCard: PropTypes.bool,
};

export default AdminPageShell;
