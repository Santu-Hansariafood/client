import PropTypes from "prop-types";
import { lazy, Suspense, useMemo, useEffect, useState } from "react";
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const idleCallback = window.requestIdleCallback || setTimeout;
    idleCallback(() => {
      setHydrated(true);
    });
  }, []);

  const criticalRoutes = useMemo(
    () => (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    ),
    []
  );

  const nonCriticalRoutes = useMemo(
    () =>
      hydrated && (
        <Routes>
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
        </Routes>
      ),
    [hydrated]
  );

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          {criticalRoutes}
          {nonCriticalRoutes}
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default App;
