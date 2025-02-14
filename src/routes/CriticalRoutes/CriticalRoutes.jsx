import { Routes, Route } from "react-router-dom";
import LazyPages from "../../utils/LazyPages/LazyPages";
import PrivateRoute from "../PrivateRoute/PrivateRoute";

const CriticalRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LazyPages.Login />} />
      <Route path="/login" element={<LazyPages.Login />} />
      <Route
        path="/dashboard"
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
            <LazyPages.EmployeeDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/buyer/dashboard"
        element={
          <PrivateRoute>
            <LazyPages.BuyerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/seller/dashboard"
        element={
          <PrivateRoute>
            <LazyPages.SellerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/transporter/dashboard"
        element={
          <PrivateRoute>
            <LazyPages.TransporterDashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default CriticalRoutes;
