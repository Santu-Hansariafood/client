import PropTypes from "prop-types";
import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext/AuthContext";
import { HelmetProvider, Helmet } from "react-helmet-async";
import Loading from "./common/Loading/Loading";
import PrivateLayout from "./layouts/PrivateLayout";
import "./App.css";

// Lazy-loaded components
const LazyPages = {
  Login: lazy(() => import("./pages/Login/Login")),
  Dashboard: lazy(() => import("./pages/Dashboard/Dashboard")),
  AddBuyer: lazy(() => import("./pages/Buyer/AddBuyer/AddBuyer")),
  ListBuyer: lazy(() => import("./pages/Buyer/BuyerList/BuyerList")),
  AddCommodity: lazy(() =>
    import("./pages/Commodity/AddCommodity/AddCommodity")
  ),
  ListCommodity: lazy(() =>
    import("./pages/Commodity/ListCommodity/ListCommodity")
  ),
  AddCompany: lazy(() => import("./pages/Company/AddCompany/AddCompany")),
  ListCompany: lazy(() => import("./pages/Company/ListCompany/ListCompany")),
  AddConsignee: lazy(() =>
    import("./pages/Consignee/AddConsignee/AddConsignee")
  ),
  ListConsignee: lazy(() =>
    import("./pages/Consignee/ListConsignee/ListConsignee")
  ),
  AddGroupOfCompany: lazy(() =>
    import("./pages/GroupofCompany/AddGroupOfCompany/AddGroupOfCompany")
  ),
  ListGroupOfCompany: lazy(() =>
    import("./pages/GroupofCompany/ListGroupOfCompany/ListGroupOfCompany")
  ),
  AddQualityParameter: lazy(() =>
    import("./pages/QualityParameter/AddQualityParameter/AddQualityParameter")
  ),
  ListQualityParameter: lazy(() =>
    import("./pages/QualityParameter/ListQualityParameter/ListQualityParameter")
  ),
  AddSellerDetails: lazy(() =>
    import("./pages/SellerDetails/AddSellerDetails/AddSellerDetails")
  ),
  ListSellerDetails: lazy(() =>
    import("./pages/SellerDetails/ListSellerDetails/ListSellerDetails")
  ),
  AddSellerCompany: lazy(() =>
    import("./pages/SellerCompany/AddSellerCompany/AddSellerCompany")
  ),
  ListSellerCompany: lazy(() =>
    import("./pages/SellerCompany/ListSellerCompany/ListSellerCompany")
  ),
  BuyerBid: lazy(() => import("./pages/ManageBids/BuyerBid/BuyerBid")),
  BidLocation: lazy(() => import("./pages/ManageBids/BidLocation/BidLocation")),
  AddSoudabook: lazy(() =>
    import("./pages/Soudabook/AddSoudabook/AddSoudabook")
  ),
  ListSoudabook: lazy(() =>
    import("./pages/Soudabook/ListSoudabook/ListSoudabook")
  ),
  BidList: lazy(() => import("./pages/ManageBids/BidList/BidList")),
  AddSelfOrder: lazy(() =>
    import("./pages/ManageSelfOrder/SelfOrder/SelfOrder")
  ),
  ListSelfOrder: lazy(() =>
    import("./pages/ManageSelfOrder/SelfOrderList/SelfOrderList")
  ),
  AddLoadingEntry: lazy(() =>
    import("./pages/LoadingEntry/AddLoadingEntry/AddLoadingEntry")
  ),
  ListLoadingEntry: lazy(() =>
    import("./pages/LoadingEntry/ListLoadingEntry/ListLoadingEntry")
  ),
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <PrivateLayout>{children}</PrivateLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
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
            "/manage-bids/buyer": LazyPages.BuyerBid,
            "/manage-bids/bid-list": LazyPages.BidList,
            "/manage-bids/bid-location": LazyPages.BidLocation,
            "/sodabook/add": LazyPages.AddSoudabook,
            "/sodabook/list": LazyPages.ListSoudabook,
            "/manage-order/add-self-order": LazyPages.AddSelfOrder,
            "/manage-order/list-self-order": LazyPages.ListSelfOrder,
            "/Loading-Entry/add-loading-entry": LazyPages.AddLoadingEntry,
            "/Loading-Entry/list-loading-entry": LazyPages.ListLoadingEntry,
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
    <HelmetProvider>
      <AuthProvider>
        <Helmet>
          <title>Hansaria Food Private Limited - Premium Food Products</title>
          <meta
            name="description"
            content="Hansaria Food Private Limited specializes in premium food products, offering innovative solutions and exceptional service. Discover quality, trust, and excellence in every product."
          />
          <link rel="icon" href="./assets/react.svg" />
        </Helmet>

        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            {criticalRoutes}
            {privateRoutes}
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
