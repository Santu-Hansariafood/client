import { lazy, Suspense, useMemo } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext/AuthContext";

import Loading from "./common/Loading/Loading";
import PrivateLayout from "./layouts/PrivateLayout";

import "./App.css";

const Login = lazy(() => import("./pages/Login/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const AddBuyer = lazy(() => import("./pages/Buyer/AddBuyer/AddBuyer"));
const ListBuyer = lazy(() => import("./pages/Buyer/BuyerList/BuyerList"));
const AddCommodity = lazy(() =>
  import("./pages/Commodity/AddCommodity/AddCommodity")
);
const ListCommodity = lazy(() =>
  import("./pages/Commodity/ListCommodity/ListCommodity")
);
const AddCompany = lazy(() => import("./pages/Company/AddCompany/AddCompany"));
const ListCompany = lazy(() =>
  import("./pages/Company/ListCompany/ListCompany")
);
const AddConsignee = lazy(() =>
  import("./pages/Consignee/AddConsignee/AddConsignee")
);
const ListConsignee = lazy(() =>
  import("./pages/Consignee/ListConsignee/ListConsignee")
);
const AddGroupOfCompany = lazy(() =>
  import("./pages/GroupofCompany/AddGroupOfCompany/AddGroupOfCompany")
);
const ListGroupOfCompany = lazy(() =>
  import("./pages/GroupofCompany/ListGroupOfCompany/ListGroupOfCompany")
);
const AddQualityParameter = lazy(() =>
  import("./pages/QualityParameter/AddQualityParameter/AddQualityParameter")
);
const ListQualityParameter = lazy(() =>
  import("./pages/QualityParameter/ListQualityParameter/ListQualityParameter")
);
const AddSellerDetails = lazy(() =>
  import("./pages/SellerDetails/AddSellerDetails/AddSellerDetails")
);
const ListSellerDetails = lazy(() =>
  import("./pages/SellerDetails/ListSellerDetails/ListSellerDetails")
);
const AddSellerCompany = lazy(() =>
  import("./pages/SellerCompany/AddSellerCompany/AddSellerCompany")
);
const ListSellerCompany = lazy(() =>
  import("./pages/SellerCompany/ListSellerCompany/ListSellerCompany")
);

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <PrivateLayout>{children}</PrivateLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const App = () => {
  const memoizedRoutes = useMemo(() => {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Buyer Routes */}
        <Route
          path="/buyer/add"
          element={
            <PrivateRoute>
              <AddBuyer />
            </PrivateRoute>
          }
        />
        <Route
          path="/buyer/list"
          element={
            <PrivateRoute>
              <ListBuyer />
            </PrivateRoute>
          }
        />

        {/* Group of Company Routes */}
        <Route
          path="/group-of-company/add"
          element={
            <PrivateRoute>
              <AddGroupOfCompany />
            </PrivateRoute>
          }
        />
        <Route
          path="/group-of-company/list"
          element={
            <PrivateRoute>
              <ListGroupOfCompany />
            </PrivateRoute>
          }
        />

        {/* Company Routes */}
        <Route
          path="/company/add"
          element={
            <PrivateRoute>
              <AddCompany />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/list"
          element={
            <PrivateRoute>
              <ListCompany />
            </PrivateRoute>
          }
        />

        {/* Consignee Routes */}
        <Route
          path="/consignee/add"
          element={
            <PrivateRoute>
              <AddConsignee />
            </PrivateRoute>
          }
        />
        <Route
          path="/consignee/list"
          element={
            <PrivateRoute>
              <ListConsignee />
            </PrivateRoute>
          }
        />

        {/* Commodity Routes */}
        <Route
          path="/commodity/add"
          element={
            <PrivateRoute>
              <AddCommodity />
            </PrivateRoute>
          }
        />
        <Route
          path="/commodity/list"
          element={
            <PrivateRoute>
              <ListCommodity />
            </PrivateRoute>
          }
        />

        {/* Quality Parameter Routes */}
        <Route
          path="/quality-parameter/add"
          element={
            <PrivateRoute>
              <AddQualityParameter />
            </PrivateRoute>
          }
        />
        <Route
          path="/quality-parameter/list"
          element={
            <PrivateRoute>
              <ListQualityParameter />
            </PrivateRoute>
          }
        />

        {/* Seller Company Routes */}
        <Route
          path="/seller-company/add"
          element={
            <PrivateRoute>
              <AddSellerCompany />
            </PrivateRoute>
          }
        />
        <Route
          path="/seller-company/list"
          element={
            <PrivateRoute>
              <ListSellerCompany />
            </PrivateRoute>
          }
        />

        {/* Seller Details Routes */}
        <Route
          path="/seller-details/add"
          element={
            <PrivateRoute>
              <AddSellerDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/seller-details/list"
          element={
            <PrivateRoute>
              <ListSellerDetails />
            </PrivateRoute>
          }
        />

        {/* Default and Fallback Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loading />}>{memoizedRoutes}</Suspense>
      </Router>
    </AuthProvider>
  );
};

export default App;
