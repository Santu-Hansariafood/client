import { Routes, Route, Navigate } from "react-router-dom";
import LazyPages from "./LazyPages";
import PrivateRoute from "../layouts/PrivateRoute";
import { useAuth } from "../context/AuthContext/AuthContext";

const RoutesConfig = ({ hydrated }) => {
  const { isAuthenticated, userRole } = useAuth();

  const roleBasedDashboard = {
    Admin: "/dashboard",
    Employee: "/employee/dashboard",
    Buyer: "/buyer/dashboard",
    Seller: "/seller/dashboard",
    Transporter: "/transporter/dashboard",
  };

  return (
    <Routes>
      <Route path="/" element={<LazyPages.Login />} />
      <Route path="/login" element={<LazyPages.Login />} />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Navigate to={roleBasedDashboard[userRole] || "/dashboard"} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {hydrated && (
        <>
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <LazyPages.Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/dashboard"
            element={
              <PrivateRoute>
                <LazyPages.Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/buyer/dashboard"
            element={
              <PrivateRoute>
                <LazyPages.Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/seller/dashboard"
            element={
              <PrivateRoute>
                <LazyPages.Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/transporter/dashboard"
            element={
              <PrivateRoute>
                <LazyPages.Dashboard />
              </PrivateRoute>
            }
          />

          {/* Other private routes */}
          <Route path="/buyer/add" element={<LazyPages.AddBuyer />} />
          <Route path="/buyer/list" element={<LazyPages.ListBuyer />} />
          <Route path="/commodity/add" element={<LazyPages.AddCommodity />} />
          <Route path="/commodity/list" element={<LazyPages.ListCommodity />} />
          <Route path="/company/add" element={<LazyPages.AddCompany />} />
          <Route path="/company/list" element={<LazyPages.ListCompany />} />
        </>
      )}
    </Routes>
  );
};

export default RoutesConfig;
