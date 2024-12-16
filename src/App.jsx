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

// Lazy-loaded components
const LazyPages = {
  Login: lazy(() => import("./pages/Login/Login")),
  Dashboard: lazy(() => import("./pages/Dashboard/Dashboard")),
  AddBuyer: lazy(() => import("./pages/Buyer/AddBuyer/AddBuyer")),
  ListBuyer: lazy(() => import("./pages/Buyer/BuyerList/BuyerList")),
  AddCommodity: lazy(() => import("./pages/Commodity/AddCommodity/AddCommodity")),
  ListCommodity: lazy(() => import("./pages/Commodity/ListCommodity/ListCommodity")),
  AddCompany: lazy(() => import("./pages/Company/AddCompany/AddCompany")),
  ListCompany: lazy(() => import("./pages/Company/ListCompany/ListCompany")),
  AddConsignee: lazy(() => import("./pages/Consignee/AddConsignee/AddConsignee")),
  ListConsignee: lazy(() => import("./pages/Consignee/ListConsignee/ListConsignee")),
  AddGroupOfCompany: lazy(() => import("./pages/GroupofCompany/AddGroupOfCompany/AddGroupOfCompany")),
  ListGroupOfCompany: lazy(() => import("./pages/GroupofCompany/ListGroupOfCompany/ListGroupOfCompany")),
  AddQualityParameter: lazy(() => import("./pages/QualityParameter/AddQualityParameter/AddQualityParameter")),
  ListQualityParameter: lazy(() => import("./pages/QualityParameter/ListQualityParameter/ListQualityParameter")),
  AddSellerDetails: lazy(() => import("./pages/SellerDetails/AddSellerDetails/AddSellerDetails")),
  ListSellerDetails: lazy(() => import("./pages/SellerDetails/ListSellerDetails/ListSellerDetails")),
  AddSellerCompany: lazy(() => import("./pages/SellerCompany/AddSellerCompany/AddSellerCompany")),
  ListSellerCompany: lazy(() => import("./pages/SellerCompany/ListSellerCompany/ListSellerCompany")),
  BuyerBid: lazy(() => import("./pages/ManageBids/BuyerBid/BuyerBid")),
  SupplierBid: lazy(() => import("./pages/ManageBids/SupplierBid/SupplierBid")),
  BidLocation: lazy(() => import("./pages/ManageBids/BidLocation/BidLocation")),
  AddSoudabook: lazy(() => import("./pages/Soudabook/AddSoudabook/AddSoudabook")),
  ListSoudabook: lazy(() => import("./pages/Soudabook/ListSoudabook/ListSoudabook")),
  BidList: lazy(() => import("./pages/ManageBids/BidList/BidList")),
};

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
    idleCallback(() => setHydrated(true));
  }, []);

  const criticalRoutes = useMemo(
    () => (
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
      </Routes>
    ),
    []
  );

  const privateRoutes = useMemo(
    () =>
      hydrated && (
        <Routes>
          {Object.entries({
            "/buyer/add": LazyPages.AddBuyer,
            "/buyer/list": LazyPages.ListBuyer,
            "/group-of-company/add": LazyPages.AddGroupOfCompany,
            "/group-of-company/list": LazyPages.ListGroupOfCompany,
            "/company/add": LazyPages.AddCompany,
            "/company/list": LazyPages.ListCompany,
            "/consignee/add": LazyPages.AddConsignee,
            "/consignee/list": LazyPages.ListConsignee,
            "/commodity/add": LazyPages.AddCommodity,
            "/commodity/list": LazyPages.ListCommodity,
            "/quality-parameter/add": LazyPages.AddQualityParameter,
            "/quality-parameter/list": LazyPages.ListQualityParameter,
            "/seller-company/add": LazyPages.AddSellerCompany,
            "/seller-company/list": LazyPages.ListSellerCompany,
            "/seller-details/add": LazyPages.AddSellerDetails,
            "/seller-details/list": LazyPages.ListSellerDetails,
            "/manage-bids/supplier": LazyPages.SupplierBid,
            "/manage-bids/buyer": LazyPages.BuyerBid,
            "/manage-bids/bid-list": LazyPages.BidList,
            "/manage-bids/bid-location": LazyPages.BidLocation,
            "/sodabook/add": LazyPages.AddSoudabook,
            "/sodabook/list": LazyPages.ListSoudabook,
          }).map(([path, Component]) => (
            <Route
              key={path}
              path={path}
              element={
                <PrivateRoute>
                  <Component />
                </PrivateRoute>
              }
            />
          ))}
        </Routes>
      ),
    [hydrated]
  );

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          {criticalRoutes}
          {privateRoutes}
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default App;
