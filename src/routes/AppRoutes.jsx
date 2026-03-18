import { Routes, Route, Navigate } from "react-router-dom";
import LazyPages from "../utils/LazyPages/LazyPages";
import PrivateRoute from "./PrivateRoute/PrivateRoute";

const privateRoutes = [
  { path: "dashboard", component: LazyPages.Dashboard },
  { path: "employee/dashboard", component: LazyPages.EmployeeDashboard },
  { path: "buyer/dashboard", component: LazyPages.BuyerDashboard },
  { path: "seller/dashboard", component: LazyPages.SellerDashboard },
  { path: "transporter/dashboard", component: LazyPages.TransporterDashboard },
  { path: "buyer/add", component: LazyPages.AddBuyer },
  { path: "buyer/list", component: LazyPages.ListBuyer },
  { path: "group-of-company/add", component: LazyPages.AddGroupOfCompany },
  { path: "group-of-company/list", component: LazyPages.ListGroupOfCompany },
  { path: "company/add", component: LazyPages.AddCompany },
  { path: "company/list", component: LazyPages.ListCompany },
  { path: "consignee/add", component: LazyPages.AddConsignee },
  { path: "consignee/list", component: LazyPages.ListConsignee },
  { path: "commodity/add", component: LazyPages.AddCommodity },
  { path: "commodity/list", component: LazyPages.ListCommodity },
  { path: "quality-parameter/add", component: LazyPages.AddQualityParameter },
  { path: "quality-parameter/list", component: LazyPages.ListQualityParameter },
  { path: "seller-company/add", component: LazyPages.AddSellerCompany },
  { path: "seller-company/list", component: LazyPages.ListSellerCompany },
  { path: "seller-details/add", component: LazyPages.AddSellerDetails },
  { path: "seller-details/list", component: LazyPages.ListSellerDetails },
  { path: "manage-bids/buyer", component: LazyPages.BuyerBid },
  { path: "manage-bids/bid-list", component: LazyPages.BidList },
  { path: "manage-bids/bid-list/participate-bid-admin", component: LazyPages.ParticipateBidAdmin },
  { path: "manage-bids/bid-location", component: LazyPages.BidLocation },
  { path: "sodabook/add", component: LazyPages.AddSoudabook },
  { path: "sodabook/list", component: LazyPages.ListSoudabook },
  { path: "manage-order/add-self-order", component: LazyPages.AddSelfOrder },
  { path: "manage-order/edit-self-order/:id", component: LazyPages.EditSelfOrder },
  { path: "manage-order/list-self-order", component: LazyPages.ListSelfOrder },
  { path: "Loading-Entry/list-loading-entry", component: LazyPages.ListLoadingEntry },
  { path: "Loading-Entry/add-loading-entry", component: LazyPages.AddLoadingEntry },
  { path: "employee/add", component: LazyPages.AddEmployee },
  { path: "employee/list", component: LazyPages.ListEmployee },
  { path: "transporter/add", component: LazyPages.AddTransporter },
  { path: "transporter/list", component: LazyPages.ListTransporter },
  { path: "loading-entry-sauda/:id", component: LazyPages.LoadingEntrySauda },
  { path: "Supplier-Bid-List", component: LazyPages.SellerBidList },
  { path: "participate-bid-list", component: LazyPages.ParticipateBid },
  { path: "confirm-bids/:bidId", component: LazyPages.ConfirmBids },
];

const AppRoutes = ({ hydrated }) => {
  if (!hydrated) return null;

  return (
    <Routes>
      <Route path="/" element={<LazyPages.Login />} />
      <Route path="/privacy-policy" element={<LazyPages.PrivacyPolicy />} />
      <Route path="/terms-conditions" element={<LazyPages.TermsConditions />} />
      <Route path="/broker-commission-policy" element={<LazyPages.BrokerCommissionPolicy />} />
      <Route path="/login" element={<LazyPages.Login />} />
      <Route path="/teams" element={<LazyPages.Teams />} />
      <Route element={<PrivateRoute />}>
        {privateRoutes.map(({ path, component: Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Route>
      <Route path="*" element={<LazyPages.NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
