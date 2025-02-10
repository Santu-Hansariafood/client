import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext/AuthContext";
import Sidebar from "../components/Sidebar/Sidebar";

const PrivateLayout = ({ children }) => {
  const { userRole } = useAuth();

  return (
    <div className="flex h-screen">
      {userRole === "Admin" && <Sidebar />}
      <main className="flex-1 p-4 overflow-auto">{children}</main>
    </div>
  );
};

PrivateLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateLayout;
