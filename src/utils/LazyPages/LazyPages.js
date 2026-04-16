import { lazy } from "react";

const loaders = {
  Login: () => import("../../pages/Login/Login"),
  Dashboard: () => import("../../pages/Dashboard/Dashboard"),
  AddBuyer: () => import("../../pages/Buyer/AddBuyer/AddBuyer"),
  ListBuyer: () => import("../../pages/Buyer/BuyerList/BuyerList"),
  AddCommodity: () => import("../../pages/Commodity/AddCommodity/AddCommodity"),
  ListCommodity: () =>
    import("../../pages/Commodity/ListCommodity/ListCommodity"),
  AddCompany: () => import("../../pages/Company/AddCompany/AddCompany"),
  ListCompany: () => import("../../pages/Company/ListCompany/ListCompany"),
  AddConsignee: () => import("../../pages/Consignee/AddConsignee/AddConsignee"),
  ListConsignee: () =>
    import("../../pages/Consignee/ListConsignee/ListConsignee"),
  AddGroupOfCompany: () =>
    import("../../pages/GroupofCompany/AddGroupOfCompany/AddGroupOfCompany"),
  ListGroupOfCompany: () =>
    import("../../pages/GroupofCompany/ListGroupOfCompany/ListGroupOfCompany"),
  AddQualityParameter: () =>
    import("../../pages/QualityParameter/AddQualityParameter/AddQualityParameter"),
  ListQualityParameter: () =>
    import("../../pages/QualityParameter/ListQualityParameter/ListQualityParameter"),
  AddSellerDetails: () =>
    import("../../pages/SellerDetails/AddSellerDetails/AddSellerDetails"),
  ListSellerDetails: () =>
    import("../../pages/SellerDetails/ListSellerDetails/ListSellerDetails"),
  AddSellerCompany: () =>
    import("../../pages/SellerCompany/AddSellerCompany/AddSellerCompany"),
  ListSellerCompany: () =>
    import("../../pages/SellerCompany/ListSellerCompany/ListSellerCompany"),
  BuyerBid: () => import("../../pages/ManageBids/BuyerBid/BuyerBid"),
  BidLocation: () => import("../../pages/ManageBids/BidLocation/BidLocation"),
  AddSoudabook: () => import("../../pages/Soudabook/AddSoudabook/AddSoudabook"),
  ListSoudabook: () =>
    import("../../pages/Soudabook/ListSoudabook/ListSoudabook"),
  BidList: () => import("../../pages/ManageBids/BidList/BidList"),
  AddSelfOrder: () => import("../../pages/ManageSelfOrder/SelfOrder/SelfOrder"),
  EditSelfOrder: () =>
    import("../../pages/ManageSelfOrder/EditSelfOrder/EditSelfOrder"),
  ListSelfOrder: () =>
    import("../../pages/ManageSelfOrder/SelfOrderList/SelfOrderList"),
  AddLoadingEntry: () =>
    import("../../pages/LoadingEntry/AddLoadingEntry/AddLoadingEntry"),
  ListLoadingEntry: () =>
    import("../../pages/LoadingEntry/ListLoadingEntry/ListLoadingEntry"),
  AddEmployee: () => import("../../pages/Employee/AddEmployee/AddEmployee"),
  ListEmployee: () => import("../../pages/Employee/ListEmployee/ListEmployee"),
  AddTransporter: () =>
    import("../../pages/Transporter/AddTransporter/AddTransporter"),
  ListTransporter: () =>
    import("../../pages/Transporter/ListTransporter/ListTransporter"),
  SellerDashboard: () =>
    import("../../components/SellerDashboard/SellerDashboard"),
  BuyerDashboard: () =>
    import("../../components/BuyerDashboard/BuyerDashboard"),
  TransporterDashboard: () =>
    import("../../components/TransporterDashboard/TransporterDashboard"),
  EmployeeDashboard: () =>
    import("../../components/EmployeeDashboard/EmployeeDashboard"),
  SellerBidList: () =>
    import("../../pages/ManageBids/SupplierBidList/SupplierBidList"),
  ParticipateBid: () =>
    import("../../components/ParticipateBid/ParticipateBid"),
  ParticipateBidAdmin: () =>
    import("../../pages/ManageBids/ParticipateBidAdmin/ParticipateBidAdmin"),
  ConfirmBids: () => import("../../components/ConfirmBids/ConfirmBids"),
  LoadingEntrySauda: () =>
    import("../../pages/LoadingEntry/LoadingEntrySauda/LoadingEntrySauda"),
  PendingLoadingList: () =>
    import("../../pages/LoadingEntry/PendingLoadingList/PendingLoadingList"),
  PrivacyPolicy: () => import("../../common/PrivacyPolicy/PrivacyPolicy"),
  TermsConditions: () => import("../../common/TermsConditions/TermsConditions"),
  BrokerCommissionPolicy: () =>
    import("../../common/BrokerCommissionPolicy/BrokerCommissionPolicy"),
  Teams: () => import("../../common/Teams/Teams"),
  BuyerMarketAnalytics: () =>
    import("../../pages/MarketAnalysis/MarketAnalysis"),
  BuyerBidHistory: () => import("../../pages/BidHistory/BidHistory"),
  AddVendorCode: () =>
    import("../../pages/VendorCode/AddVendorCode/AddVendorCode"),
  ListVendorCode: () =>
    import("../../pages/VendorCode/ListVendorCode/ListVendorCode"),
  AddExpense: () => import("../../pages/Expense/AddExpense/AddExpense"),
  ListExpense: () => import("../../pages/Expense/ListExpense/ListExpense"),
};

const pathToKey = {
  "/": "Login",
  "/login": "Login",
  "/dashboard": "Dashboard",
  "/employee/dashboard": "EmployeeDashboard",
  "/buyer/dashboard": "BuyerDashboard",
  "/seller/dashboard": "SellerDashboard",
  "/transporter/dashboard": "TransporterDashboard",
  "/buyer/add": "AddBuyer",
  "/buyer/list": "ListBuyer",
  "/group-of-company/add": "AddGroupOfCompany",
  "/group-of-company/list": "ListGroupOfCompany",
  "/company/add": "AddCompany",
  "/company/list": "ListCompany",
  "/consignee/add": "AddConsignee",
  "/consignee/list": "ListConsignee",
  "/commodity/add": "AddCommodity",
  "/commodity/list": "ListCommodity",
  "/quality-parameter/add": "AddQualityParameter",
  "/quality-parameter/list": "ListQualityParameter",
  "/seller-company/add": "AddSellerCompany",
  "/seller-company/list": "ListSellerCompany",
  "/seller-details/add": "AddSellerDetails",
  "/seller-details/list": "ListSellerDetails",
  "/manage-bids/buyer": "BuyerBid",
  "/manage-bids/bid-list": "BidList",
  "/manage-bids/bid-list/participate-bid-admin": "ParticipateBidAdmin",
  "/manage-bids/bid-location": "BidLocation",
  "/sodabook/add": "AddSoudabook",
  "/sodabook/list": "ListSoudabook",
  "/manage-order/add-self-order": "AddSelfOrder",
  "/manage-order/list-self-order": "ListSelfOrder",
  "/Loading-Entry/add-loading-entry": "AddLoadingEntry",
  "/Loading-Entry/list-loading-entry": "ListLoadingEntry",
  "/Loading-Entry/pending-loading-list": "PendingLoadingList",
  "/employee/add": "AddEmployee",
  "/employee/list": "ListEmployee",
  "/transporter/add": "AddTransporter",
  "/transporter/list": "ListTransporter",
  "/Supplier-Bid-List": "SellerBidList",
  "/participate-bid-list": "ParticipateBid",
  "/confirm-bids/:bidId": "ConfirmBids",
  "/privacy-policy": "PrivacyPolicy",
  "/terms-conditions": "TermsConditions",
  "/broker-commission-policy": "BrokerCommissionPolicy",
  "/teams": "Teams",
  "/buyer/market-analytics": "BuyerMarketAnalytics",
  "/buyer/bid-history": "BuyerBidHistory",
  "/vendor-code/add": "AddVendorCode",
  "/vendor-code/list": "ListVendorCode",
  "/expense/add": "AddExpense",
  "/expense/list": "ListExpense",
};

const prefetched = new Set();

export function prefetchRoute(path) {
  const normalized = path?.startsWith("/") ? path : `/${path || ""}`;
  const key = pathToKey[normalized];
  if (!key || prefetched.has(key)) return;
  const loader = loaders[key];
  if (loader) {
    prefetched.add(key);
    loader();
  }
}

export function prefetchRouteByPathname(pathname) {
  if (prefetched.has(pathname)) return;
  let key = pathToKey[pathname];
  if (!key && pathname.startsWith("/confirm-bids/")) key = "ConfirmBids";
  if (!key && pathname.startsWith("/manage-order/edit-self-order/"))
    key = "EditSelfOrder";
  if (!key && pathname.startsWith("/loading-entry-sauda/"))
    key = "LoadingEntrySauda";
  if (key && loaders[key]) {
    prefetched.add(pathname);
    loaders[key]();
  }
}

const LazyPages = {
  Login: lazy(loaders.Login),
  Dashboard: lazy(loaders.Dashboard),
  AddBuyer: lazy(loaders.AddBuyer),
  ListBuyer: lazy(loaders.ListBuyer),
  AddCommodity: lazy(loaders.AddCommodity),
  ListCommodity: lazy(loaders.ListCommodity),
  AddCompany: lazy(loaders.AddCompany),
  ListCompany: lazy(loaders.ListCompany),
  AddConsignee: lazy(loaders.AddConsignee),
  ListConsignee: lazy(loaders.ListConsignee),
  AddGroupOfCompany: lazy(loaders.AddGroupOfCompany),
  ListGroupOfCompany: lazy(loaders.ListGroupOfCompany),
  AddQualityParameter: lazy(loaders.AddQualityParameter),
  ListQualityParameter: lazy(loaders.ListQualityParameter),
  AddSellerDetails: lazy(loaders.AddSellerDetails),
  ListSellerDetails: lazy(loaders.ListSellerDetails),
  AddSellerCompany: lazy(loaders.AddSellerCompany),
  ListSellerCompany: lazy(loaders.ListSellerCompany),
  BuyerBid: lazy(loaders.BuyerBid),
  BidLocation: lazy(loaders.BidLocation),
  AddSoudabook: lazy(loaders.AddSoudabook),
  ListSoudabook: lazy(loaders.ListSoudabook),
  BidList: lazy(loaders.BidList),
  AddSelfOrder: lazy(loaders.AddSelfOrder),
  EditSelfOrder: lazy(loaders.EditSelfOrder),
  ListSelfOrder: lazy(loaders.ListSelfOrder),
  AddLoadingEntry: lazy(loaders.AddLoadingEntry),
  ListLoadingEntry: lazy(loaders.ListLoadingEntry),
  AddEmployee: lazy(loaders.AddEmployee),
  ListEmployee: lazy(loaders.ListEmployee),
  AddTransporter: lazy(loaders.AddTransporter),
  ListTransporter: lazy(loaders.ListTransporter),
  SellerDashboard: lazy(loaders.SellerDashboard),
  BuyerDashboard: lazy(loaders.BuyerDashboard),
  TransporterDashboard: lazy(loaders.TransporterDashboard),
  EmployeeDashboard: lazy(loaders.EmployeeDashboard),
  SellerBidList: lazy(loaders.SellerBidList),
  ParticipateBid: lazy(loaders.ParticipateBid),
  ParticipateBidAdmin: lazy(loaders.ParticipateBidAdmin),
  ConfirmBids: lazy(loaders.ConfirmBids),
  LoadingEntrySauda: lazy(loaders.LoadingEntrySauda),
  PendingLoadingList: lazy(loaders.PendingLoadingList),
  PrivacyPolicy: lazy(loaders.PrivacyPolicy),
  TermsConditions: lazy(loaders.TermsConditions),
  BrokerCommissionPolicy: lazy(loaders.BrokerCommissionPolicy),
  Teams: lazy(loaders.Teams),
  BuyerMarketAnalytics: lazy(loaders.BuyerMarketAnalytics),
  BuyerBidHistory: lazy(loaders.BuyerBidHistory),
  AddVendorCode: lazy(loaders.AddVendorCode),
  ListVendorCode: lazy(loaders.ListVendorCode),
  AddExpense: lazy(loaders.AddExpense),
  ListExpense: lazy(loaders.ListExpense),
};

export default LazyPages;
