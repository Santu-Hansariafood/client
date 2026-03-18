import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://bid.hansariafood.in";
const OG_IMAGE = `${SITE_URL}/icons/android-chrome-512x512.png`;
const OG_IMAGE_192 = `${SITE_URL}/icons/android-chrome-192x192.png`;

const DEFAULT_TITLE = "Hansaria Food Private Limited | Bid Portal";
const DEFAULT_DESC =
  "Hansaria Food bid portal — poultry, feed meal, and agricultural commodity trading & brokerage across India. Manage commodities, bids, buyers, and consignees.";

const COMMODITY_LIST_DESC =
  "Browse Hansaria Food commodity catalog — HSN codes, quality parameters, poultry & feed ingredients. Commodity list for trading and brokerage on bid.hansariafood.in.";
const COMMODITY_ADD_DESC =
  "Add commodities with HSN codes and quality parameters for bid management — Hansaria Food trading platform.";

const PUBLIC_ROUTES = [
  /^\/$/,
  /^\/login$/,
  /^\/privacy-policy$/,
  /^\/terms-conditions$/,
  /^\/broker-commission-policy$/,
  /^\/teams$/,
];

const ROUTE_META = [
  { match: /^\/$/, title: DEFAULT_TITLE, desc: DEFAULT_DESC },
  { match: /^\/login$/, title: "Login | Hansaria Food Bid Portal", desc: "Secure login to Hansaria Food bid portal — commodity trading & brokerage." },
  { match: /^\/dashboard$/, title: "Dashboard | Hansaria Food", desc: "Admin overview — buyers, sellers, consignees, orders." },
  { match: /^\/buyer\/add$/, title: "Add Buyer | Hansaria Food", desc: "Create buyer profile — company, group, commodities, consignee." },
  { match: /^\/buyer\/list$/, title: "Buyer List | Hansaria Food", desc: "Browse and manage buyers — commodity access and brokerage." },
  { match: /^\/company\/add$/, title: "Add Company | Hansaria Food", desc: "Register company with consignees, group, and commodity parameters." },
  { match: /^\/company\/list$/, title: "Companies | Hansaria Food", desc: "List companies linked to groups and commodities." },
  { match: /^\/group-of-company\/add$/, title: "Add Group of Company | Hansaria Food", desc: "Create group to organize companies and commodities." },
  { match: /^\/group-of-company\/list$/, title: "Groups of Companies | Hansaria Food", desc: "List company groups for commodity trading structure." },
  { match: /^\/consignee\/add$/, title: "Add Consignee | Hansaria Food", desc: "Register consignee — logistics and delivery for commodity bids." },
  { match: /^\/consignee\/list$/, title: "Consignee List | Hansaria Food", desc: "Browse consignees for poultry and feed commodity flows." },
  {
    match: /^\/commodity\/add$/,
    title: "Add Commodity | Hansaria Food — HSN & Parameters",
    desc: COMMODITY_ADD_DESC,
    keywords: "commodity, HSN, quality parameters, poultry, feed meal, agricultural commodities, Hansaria Food",
  },
  {
    match: /^\/commodity\/list$/,
    title: "Commodity Catalog | Hansaria Food — Poultry & Feed Trading",
    desc: COMMODITY_LIST_DESC,
    keywords: "commodity list, poultry commodities, feed meal, HSN code, quality parameters, commodity trading India, Hansaria Food",
  },
  { match: /^\/quality-parameter\/add$/, title: "Add Quality Parameter | Hansaria Food", desc: "Define quality parameters for commodity grading." },
  { match: /^\/quality-parameter\/list$/, title: "Quality Parameters | Hansaria Food", desc: "List quality parameters used across commodities." },
  { match: /^\/manage-bids\/bid-list$/, title: "Bid List | Hansaria Food", desc: "View bids by group, consignee, commodity, rate, and quantity." },
  { match: /^\/manage-bids\/bid-list\/participate-bid-admin$/, title: "Participate Bid Admin | Hansaria Food", desc: "Admin bid participation overview." },
  { match: /^\/manage-bids\/bid-location$/, title: "Bid Location | Hansaria Food", desc: "Manage bid locations and origins for commodities." },
  { match: /^\/manage-bids\/buyer$/, title: "Buyer Bid | Hansaria Food", desc: "Buyer-side bid management for commodities." },
  { match: /^\/manage-order\/list-self-order$/, title: "Self Orders | Hansaria Food", desc: "Sauda and self orders — commodity rate and quantity." },
  { match: /^\/manage-order\/add-self-order$/, title: "Add Self Order | Hansaria Food", desc: "Create self order (noindex)." },
  { match: /^\/Loading-Entry\/list-loading-entry$/, title: "Loading Entry List | Hansaria Food", desc: "Loading entries for commodity dispatch." },
  { match: /^\/Loading-Entry\/add-loading-entry$/, title: "Add Loading Entry | Hansaria Food", desc: "Record loading entry for commodities." },
  { match: /^\/seller-company\/list$/, title: "Seller Companies | Hansaria Food", desc: "Seller companies for commodity supply." },
  { match: /^\/seller-details\/list$/, title: "Seller Details | Hansaria Food", desc: "Seller details linked to commodities." },
  { match: /^\/sodabook\/list$/, title: "Agent / Sodabook | Hansaria Food", desc: "Agent and sodabook entries." },
  { match: /^\/privacy-policy$/, title: "Privacy Policy | Hansaria Food", desc: "Our privacy policy for handling your data." },
  { match: /^\/terms-conditions$/, title: "Terms & Conditions | Hansaria Food", desc: "Our terms and conditions for using the platform." },
  { match: /^\/broker-commission-policy$/, title: "Broker Commission Policy | Hansaria Food", desc: "Our policy for broker commissions in commodity trading." },
  { match: /^\/teams$/, title: "Our Team | Hansaria Food", desc: "Meet the team behind Hansaria Food." }
];

function shouldNoIndex(pathname) {
  // Index only explicitly public routes
  const isPublic = PUBLIC_ROUTES.some((re) => re.test(pathname));
  if (!isPublic) return true;
  
  // Also noindex if it contains certain patterns even if matched above (unlikely but safe)
  if (pathname.includes("/edit-")) return true;
  return false;
}

const RouteSEO = () => {
  const { pathname } = useLocation();
  
  // Consolidate /login and / to the same canonical URL to avoid duplicate indexing
  const isLoginPage = pathname === "/" || pathname === "/login";
  const canonical = isLoginPage ? SITE_URL : `${SITE_URL}${pathname}`;
  
  const noindex = shouldNoIndex(pathname);
  const meta = ROUTE_META.find((m) => m.match.test(pathname));
  const title = meta?.title || `${DEFAULT_TITLE}${pathname !== "/" ? ` — ${pathname}` : ""}`;
  const desc = meta?.desc || DEFAULT_DESC;
  const robots = noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return (
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={desc} />
      {meta?.keywords && <meta name="keywords" content={meta.keywords} />}
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robots} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:site_name" content="Hansaria Food Bid Portal" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={OG_IMAGE} />
      <meta name="twitter:site" content="@hansariafood" />

      {/* Mobile Branding */}
      <meta name="theme-color" content="#064e3b" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  );
};

export default RouteSEO;
