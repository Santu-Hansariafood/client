import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import LazyPages from "../utils/LazyPages/LazyPages";
import PrivateRoute from "./PrivateRoute/PrivateRoute";
import PublicRoute from "./PublicRoute/PublicRoute";
import { useAuth } from "../context/AuthContext/AuthContext";

const RoleBasedRoute = ({ children, allowedRoles, path }) => {
  const { userRole, user } = useAuth();

  if (!allowedRoles) return children;

  if (!allowedRoles.includes(userRole)) {
    const roleDashboards = {
      Admin: "/dashboard",
      Employee: "/employee/dashboard",
      Buyer: "/buyer/dashboard",
      Seller: "/seller/dashboard",
      Transporter: "/transporter/dashboard",
    };
    return <Navigate to={roleDashboards[userRole] || "/login"} replace />;
  }

  if (userRole === "Employee" && user?.allowedPermissions && user.allowedPermissions.length > 0) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    
    if (normalizedPath === "/dashboard" || normalizedPath === "/employee/dashboard") {
      return children;
    }

    const hasPermission = user.allowedPermissions.some(p => {
      const normalizedP = p.startsWith("/") ? p : `/${p}`;
      return normalizedPath === normalizedP || normalizedPath.startsWith(`${normalizedP}/`);
    });

    if (!hasPermission) {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return children;
};

const privateRoutes = [
  { path: "dashboard", component: LazyPages.Dashboard, roles: ["Admin"] },
  {
    path: "employee/dashboard",
    component: LazyPages.EmployeeDashboard,
    roles: ["Admin", "Employee"],
  },

  {
    path: "buyer/dashboard",
    component: LazyPages.BuyerDashboard,
    roles: ["Buyer"],
  },
  {
    path: "seller/dashboard",
    component: LazyPages.SellerDashboard,
    roles: ["Seller"],
  },
  {
    path: "transporter/dashboard",
    component: LazyPages.TransporterDashboard,
    roles: ["Transporter"],
  },

  {
    path: "buyer/add",
    component: LazyPages.AddBuyer,
    roles: ["Admin", "Employee"],
  },
  {
    path: "buyer/list",
    component: LazyPages.ListBuyer,
    roles: ["Admin", "Employee"],
  },
  {
    path: "group-of-company/add",
    component: LazyPages.AddGroupOfCompany,
    roles: ["Admin", "Employee"],
  },
  {
    path: "group-of-company/list",
    component: LazyPages.ListGroupOfCompany,
    roles: ["Admin", "Employee"],
  },
  {
    path: "company/add",
    component: LazyPages.AddCompany,
    roles: ["Admin", "Employee"],
  },
  {
    path: "company/list",
    component: LazyPages.ListCompany,
    roles: ["Admin", "Employee"],
  },
  {
    path: "consignee/add",
    component: LazyPages.AddConsignee,
    roles: ["Admin", "Employee"],
  },
  {
    path: "consignee/list",
    component: LazyPages.ListConsignee,
    roles: ["Admin", "Employee"],
  },
  {
    path: "commodity/add",
    component: LazyPages.AddCommodity,
    roles: ["Admin", "Employee"],
  },
  {
    path: "commodity/list",
    component: LazyPages.ListCommodity,
    roles: ["Admin", "Employee"],
  },
  {
    path: "quality-parameter/add",
    component: LazyPages.AddQualityParameter,
    roles: ["Admin", "Employee"],
  },
  {
    path: "quality-parameter/list",
    component: LazyPages.ListQualityParameter,
    roles: ["Admin", "Employee"],
  },
  {
    path: "seller-company/add",
    component: LazyPages.AddSellerCompany,
    roles: ["Admin", "Employee"],
  },
  {
    path: "seller-company/list",
    component: LazyPages.ListSellerCompany,
    roles: ["Admin", "Employee"],
  },
  {
    path: "seller-details/add",
    component: LazyPages.AddSellerDetails,
    roles: ["Admin", "Employee"],
  },
  {
    path: "seller-details/edit/:sellerId",
    component: LazyPages.EditSellerDetails,
    roles: ["Admin", "Employee"],
  },
  {
    path: "seller-details/list",
    component: LazyPages.ListSellerDetails,
    roles: ["Admin", "Employee"],
  },
  {
    path: "manage-bids/buyer",
    component: LazyPages.BuyerBid,
    roles: ["Admin", "Employee", "Buyer"],
  },
  {
    path: "manage-bids/bid-list",
    component: LazyPages.BidList,
    roles: ["Admin", "Employee", "Buyer"],
  },
  {
    path: "manage-bids/bid-list/participate-bid-admin",
    component: LazyPages.ParticipateBidAdmin,
    roles: ["Admin", "Employee", "Buyer"],
  },
  {
    path: "manage-bids/interactions",
    component: LazyPages.ParticipateBidAdmin,
    roles: ["Admin", "Employee", "Buyer"],
  },
  {
    path: "manage-bids/bid-location",
    component: LazyPages.BidLocation,
    roles: ["Admin", "Employee"],
  },
  {
    path: "sodabook/add",
    component: LazyPages.AddSoudabook,
    roles: ["Admin", "Employee"],
  },
  {
    path: "sodabook/list",
    component: LazyPages.ListSoudabook,
    roles: ["Admin", "Employee", "Buyer", "Seller"],
  },
  {
    path: "manage-order/add-self-order",
    component: LazyPages.AddSelfOrder,
    roles: ["Admin", "Employee"],
  },
  {
    path: "manage-order/edit-self-order/:id",
    component: LazyPages.EditSelfOrder,
    roles: ["Admin", "Employee"],
  },
  {
    path: "manage-order/list-self-order",
    component: LazyPages.ListSelfOrder,
    roles: ["Admin", "Employee", "Buyer", "Seller"],
  },
  {
    path: "Loading-Entry/list-loading-entry",
    component: LazyPages.ListLoadingEntry,
    roles: ["Admin", "Employee", "Seller"],
  },
  {
    path: "Loading-Entry/add-loading-entry",
    component: LazyPages.AddLoadingEntry,
    roles: ["Admin", "Employee", "Seller"],
  },
  {
    path: "Loading-Entry/pending-loading-list",
    component: LazyPages.PendingLoadingList,
    roles: ["Admin", "Employee", "Seller"],
  },
  {
    path: "Loading-Entry/complete-loading-list",
    component: LazyPages.CompleteLoadingList,
    roles: ["Admin", "Employee", "Seller"],
  },
  {
    path: "Loading-Entry/pending-sauda-summary",
    component: LazyPages.PendingSaudaSummary,
    roles: ["Admin", "Seller"],
  },
  {
    path: "Loading-Entry/receiving-list",
    component: LazyPages.ReceivingList,
    roles: ["Admin", "Employee"],
  },
  {
    path: "Loading-Entry/loading-report",
    component: LazyPages.LoadingReport,
    roles: ["Admin", "Employee"],
  },
  {
    path: "Loading-Entry/lorry-wise-loading-list",
    component: LazyPages.LorryWiseLoadingList,
    roles: ["Admin", "Employee", "Seller"],
  },
  { path: "employee/add", component: LazyPages.AddEmployee, roles: ["Admin"] },
  {
    path: "employee/list",
    component: LazyPages.ListEmployee,
    roles: ["Admin"],
  },
  {
    path: "transporter/add",
    component: LazyPages.AddTransporter,
    roles: ["Admin", "Employee"],
  },
  {
    path: "transporter/list",
    component: LazyPages.ListTransporter,
    roles: ["Admin", "Employee"],
  },
  {
    path: "loading-entry-sauda/:id",
    component: LazyPages.LoadingEntrySauda,
    roles: ["Admin", "Employee"],
  },

  {
    path: "Supplier-Bid-List",
    component: LazyPages.SellerBidList,
    roles: ["Seller"],
  },
  {
    path: "participate-bid-list",
    component: LazyPages.ParticipateBid,
    roles: ["Buyer", "Seller"],
  },
  {
    path: "confirm-bids/:bidId",
    component: LazyPages.ConfirmBids,
    roles: ["Buyer"],
  },
  {
    path: "buyer/market-analytics",
    component: LazyPages.BuyerMarketAnalytics,
    roles: ["Buyer"],
  },
  {
    path: "buyer/bid-history",
    component: LazyPages.BuyerBidHistory,
    roles: ["Buyer"],
  },
  {
    path: "/vendor-code/add",
    component: LazyPages.AddVendorCode,
    roles: ["Admin", "Employee"],
  },
  {
    path: "expense/add",
    component: LazyPages.AddExpense,
    roles: ["Admin", "Employee"],
  },
  {
    path: "expense/list",
    component: LazyPages.ListExpense,
    roles: ["Admin", "Employee"],
  },
  {
    path: "payments/list",
    component: LazyPages.ListPayment,
    roles: ["Admin", "Employee"],
  },
  {
    path: "payments/received/add",
    component: LazyPages.AddPaymentReceived,
    roles: ["Admin", "Employee"],
  },
  {
    path: "payments/received/list",
    component: LazyPages.ListPaymentReceived,
    roles: ["Admin", "Employee"],
  },
  {
    path: "data-safety",
    component: LazyPages.DataSafety,
    roles: ["Admin", "Employee"],
  },
  {
    path: "/vendor-code/list",
    component: LazyPages.ListVendorCode,
    roles: ["Admin", "Employee"],
  },
  {
    path: "/expense/add",
    component: LazyPages.AddExpense,
    roles: ["Admin", "Employee"],
  },
  {
    path: "/expense/list",
    component: LazyPages.ListExpense,
    roles: ["Admin", "Employee"],
  },
  {
    path: "/brokerage/buyer",
    component: LazyPages.BuyerBrokerage,
    roles: ["Admin", "Employee"],
  },
  {
    path: "/brokerage/seller",
    component: LazyPages.SellerBrokerage,
    roles: ["Admin", "Employee"],
  },
];

const AppRoutes = ({ hydrated }) => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Force redirect to dashboard on initial app load if authenticated
    if (hydrated && isAuthenticated) {
      const isInitialLoad = !sessionStorage.getItem("appInitialized");

      if (isInitialLoad) {
        const roleDashboards = {
          Admin: "/dashboard",
          Employee: "/employee/dashboard",
          Buyer: "/buyer/dashboard",
          Seller: "/seller/dashboard",
          Transporter: "/transporter/dashboard",
        };

        const targetDashboard = roleDashboards[userRole] || "/dashboard";

        // Mark as initialized for this session
        sessionStorage.setItem("appInitialized", "true");

        // Redirect to dashboard if not already there
        if (location.pathname !== targetDashboard) {
          navigate(targetDashboard, { replace: true });
        }
      }
    }
  }, [hydrated, isAuthenticated, userRole, navigate, location.pathname]);

  if (!hydrated) return null;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <LazyPages.Login />
          </PublicRoute>
        }
      />
      <Route path="/privacy-policy" element={<LazyPages.PrivacyPolicy />} />
      <Route path="/terms-conditions" element={<LazyPages.TermsConditions />} />
      <Route path="/data-safety" element={<LazyPages.DataSafety />} />
      <Route
        path="/broker-commission-policy"
        element={<LazyPages.BrokerCommissionPolicy />}
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LazyPages.Login />
          </PublicRoute>
        }
      />
      <Route path="/teams" element={<LazyPages.Teams />} />
      <Route element={<PrivateRoute />}>
        {privateRoutes.map(({ path, component: Component, roles }) => (
          <Route
            key={path}
            path={path}
            element={
              <RoleBasedRoute allowedRoles={roles} path={path}>
                <Component />
              </RoleBasedRoute>
            }
          />
        ))}
      </Route>
      <Route path="*" element={<LazyPages.NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
