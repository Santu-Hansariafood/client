import PropTypes from "prop-types";
import Sidebar from "../components/Sidebar/Sidebar";

const PrivateLayout = ({ children }) => (
  <div className="flex">
    <Sidebar />
    <div className="flex-1 p-4">{children}</div>
  </div>
);

PrivateLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateLayout;
