import { lazy } from "react";

const LazyPages = {
  Login: lazy(() => import("../pages/Login/Login")),
  Dashboard: lazy(() => import("../pages/Dashboard/Dashboard")),
  AddBuyer: lazy(() => import("../pages/Buyer/AddBuyer/AddBuyer")),
  ListBuyer: lazy(() => import("../pages/Buyer/BuyerList/BuyerList")),
  AddCommodity: lazy(() =>
    import("../pages/Commodity/AddCommodity/AddCommodity")
  ),
  ListCommodity: lazy(() =>
    import("../pages/Commodity/ListCommodity/ListCommodity")
  ),
  AddCompany: lazy(() => import("../pages/Company/AddCompany/AddCompany")),
  ListCompany: lazy(() => import("../pages/Company/ListCompany/ListCompany")),
  AddConsignee: lazy(() =>
    import("../pages/Consignee/AddConsignee/AddConsignee")
  ),
  ListConsignee: lazy(() =>
    import("../pages/Consignee/ListConsignee/ListConsignee")
  ),
  AddGroupOfCompany: lazy(() =>
    import("../pages/GroupofCompany/AddGroupOfCompany/AddGroupOfCompany")
  ),
  ListGroupOfCompany: lazy(() =>
    import("../pages/GroupofCompany/ListGroupOfCompany/ListGroupOfCompany")
  ),
  AddQualityParameter: lazy(() =>
    import("../pages/QualityParameter/AddQualityParameter/AddQualityParameter")
  ),
  ListQualityParameter: lazy(() =>
    import("../pages/QualityParameter/ListQualityParameter/ListQualityParameter")
  ),
  AddSellerDetails: lazy(() =>
    import("../pages/SellerDetails/AddSellerDetails/AddSellerDetails")
  ),
  ListSellerDetails: lazy(() =>
    import("../pages/SellerDetails/ListSellerDetails/ListSellerDetails")
  ),
  AddSellerCompany: lazy(() =>
    import("../pages/SellerCompany/AddSellerCompany/AddSellerCompany")
  ),
  ListSellerCompany: lazy(() =>
    import("../pages/SellerCompany/ListSellerCompany/ListSellerCompany")
  ),
  BuyerBid: lazy(() => import("../pages/ManageBids/BuyerBid/BuyerBid")),
  BidLocation: lazy(() =>
    import("../pages/ManageBids/BidLocation/BidLocation")
  ),
  AddSoudabook: lazy(() => import("../pages/Soudabook/AddSoudabook/AddSoudabook")),
  ListSoudabook: lazy(() => import("../pages/Soudabook/ListSoudabook/ListSoudabook")),
  BidList: lazy(() => import("../pages/ManageBids/BidList/BidList")),
  AddSelfOrder: lazy(() => import("../pages/ManageSelfOrder/SelfOrder/SelfOrder")),
  ListSelfOrder: lazy(() =>
    import("../pages/ManageSelfOrder/SelfOrderList/SelfOrderList")
  ),
  AddLoadingEntry: lazy(() =>
    import("../pages/LoadingEntry/AddLoadingEntry/AddLoadingEntry")
  ),
  ListLoadingEntry: lazy(() =>
    import("../pages/LoadingEntry/ListLoadingEntry/ListLoadingEntry")
  ),
};

export default LazyPages;
