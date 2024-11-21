import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import PropTypes from "prop-types";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;
