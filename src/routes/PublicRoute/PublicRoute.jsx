import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();

  if (isAuthenticated) {
    const roleDashboards = {
      Admin: "/dashboard",
      Employee: "/employee/dashboard",
      Buyer: "/buyer/dashboard",
      Seller: "/seller/dashboard",
      Transporter: "/transporter/dashboard",
    };
    return <Navigate to={roleDashboards[userRole] || "/dashboard"} replace />;
  }

  return children;
};

export default PublicRoute;
