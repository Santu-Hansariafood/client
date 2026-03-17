import PropTypes from "prop-types";
import PageHeader from "../PageHeader/PageHeader";

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
    className={`min-h-[calc(100vh-5rem)] w-full max-w-full overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 ${mainClassName}`}
  >
    <div
      className={`mx-auto w-full max-w-7xl ${noContentCard ? "" : "rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur-md shadow-2xl shadow-emerald-900/5 p-6 sm:p-8 md:p-10"} ${contentClassName}`}
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
