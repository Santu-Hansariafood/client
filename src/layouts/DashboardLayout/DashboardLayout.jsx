import PropTypes from "prop-types";

const DashboardLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-100">{children}</div>
);

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;
