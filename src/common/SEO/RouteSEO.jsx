import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://bid.hansariafood.in";
const SITE_NAME = "Hansaria Food Private Limited";
const OG_IMAGE = `${SITE_URL}/images/og-image.png`;
const OG_IMAGE_ALT = "Hansaria Food Private Limited poultry and feed meal trading platform";

const DEFAULT_TITLE =
  "Hansaria Food Private Limited | Poultry & Feed Meal Trading Portal";
const DEFAULT_DESC =
  "Hansaria Food Private Limited offers a trusted B2B platform for poultry, feed meal, and agricultural commodity trading in India with secure brokerage and transparent bidding.";
const DEFAULT_KEYWORDS =
  "Hansaria Food, poultry trading India, feed meal brokerage, agricultural commodity portal, B2B trading India, poultry feed ingredients, maize trading, soya meal trading, commodity bidding";

const COMMODITY_LIST_DESC =
  "Browse the Hansaria Food commodity catalog with HSN codes, quality parameters, and poultry and feed ingredient trading details.";
const COMMODITY_ADD_DESC =
  "Create commodity entries with HSN codes and quality parameters for efficient bid management on the Hansaria Food platform.";

const PUBLIC_ROUTES = [
  /^\/$/,
  /^\/login$/,
  /^\/privacy-policy$/,
  /^\/terms-conditions$/,
  /^\/broker-commission-policy$/,
  /^\/teams$/,
  /^\/blog\/.*/,
  /^\/news-archive$/,
];

const ROUTE_META = [
  {
    match: /^\/$/,
    title: DEFAULT_TITLE,
    desc: DEFAULT_DESC,
    keywords: DEFAULT_KEYWORDS,
  },
  {
    match: /^\/login$/,
    title: "Login | Hansaria Food Bid Portal",
    desc: "Secure login to Hansaria Food’s commodity trading and brokerage platform.",
    keywords: "Hansaria Food login, commodity trading login, feed meal brokerage portal",
  },
  {
    match: /^\/news-archive$/,
    title: "News Archive | Hansaria Food",
    desc: "Read the latest news, updates, and market insights from Hansaria Food for poultry and feed meal trading.",
    keywords: "Hansaria Food news, poultry industry news, feed meal updates, commodity trading news",
  },
  {
    match: /^\/blog\/.*/,
    title: "Hansaria Food News | Poultry & Feed Insights",
    desc: "Read latest industry news and trading updates from Hansaria Food.",
    keywords: "Hansaria Food news, poultry market news, commodity trading updates",
  },
  {
    match: /^\/dashboard$/,
    title: "Dashboard | Hansaria Food",
    desc: "Administrative overview of buyers, sellers, consignees, and orders for Hansaria Food operations.",
  },
  {
    match: /^\/buyer\/add$/,
    title: "Add Buyer | Hansaria Food",
    desc: "Create buyer profiles for commodity access, brokerage, and bidding on Hansaria Food.",
  },
  {
    match: /^\/buyer\/list$/,
    title: "Buyer List | Hansaria Food",
    desc: "Browse and manage buyers in the Hansaria Food trading ecosystem.",
  },
  {
    match: /^\/company\/add$/,
    title: "Add Company | Hansaria Food",
    desc: "Register companies with consignees, commodity details, and trading parameters.",
  },
  {
    match: /^\/company\/list$/,
    title: "Companies | Hansaria Food",
    desc: "List companies connected to groups and commodity trading operations.",
  },
  {
    match: /^\/group-of-company\/add$/,
    title: "Add Group of Company | Hansaria Food",
    desc: "Create business groups to organize companies and commodity trading relationships.",
  },
  {
    match: /^\/group-of-company\/list$/,
    title: "Groups of Companies | Hansaria Food",
    desc: "Manage company groups for efficient commodity sourcing and trading workflows.",
  },
  {
    match: /^\/consignee\/add$/,
    title: "Add Consignee | Hansaria Food",
    desc: "Register consignee details for logistics and delivery coordination in bidding operations.",
  },
  {
    match: /^\/consignee\/list$/,
    title: "Consignee List | Hansaria Food",
    desc: "Browse consignees supporting poultry and feed commodity movement across the platform.",
  },
  {
    match: /^\/commodity\/add$/,
    title: "Add Commodity | Hansaria Food",
    desc: COMMODITY_ADD_DESC,
    keywords:
      "commodity, HSN, quality parameters, poultry, feed meal, agricultural commodities, Hansaria Food",
  },
  {
    match: /^\/commodity\/list$/,
    title: "Commodity Catalog | Hansaria Food",
    desc: COMMODITY_LIST_DESC,
    keywords:
      "commodity list, poultry commodities, feed meal, HSN code, quality parameters, commodity trading India, Hansaria Food",
  },
  {
    match: /^\/quality-parameter\/add$/,
    title: "Add Quality Parameter | Hansaria Food",
    desc: "Define quality parameters for commodity grading and buyer-seller transparency.",
  },
  {
    match: /^\/quality-parameter\/list$/,
    title: "Quality Parameters | Hansaria Food",
    desc: "Review quality parameters used across commodity listings and trading workflows.",
  },
  {
    match: /^\/manage-bids\/bid-list$/,
    title: "Bid List | Hansaria Food",
    desc: "View bids across commodity, quantity, rate, and consignee dimensions.",
  },
  {
    match: /^\/manage-bids\/bid-location$/,
    title: "Bid Location | Hansaria Food",
    desc: "Manage the bid locations and origins for commodity trading operations.",
  },
  {
    match: /^\/manage-order\/list-self-order$/,
    title: "Self Orders | Hansaria Food",
    desc: "Track self orders, rates, quantities, and trade confirmations in one place.",
  },
  {
    match: /^\/Loading-Entry\/list-loading-entry$/,
    title: "Loading Entry List | Hansaria Food",
    desc: "Review loading entries and dispatch records for commodity transactions.",
  },
  {
    match: /^\/seller-company\/list$/,
    title: "Seller Companies | Hansaria Food",
    desc: "Browse and manage seller companies for commodity supply and brokerage.",
  },
  {
    match: /^\/seller-details\/list$/,
    title: "Seller Details | Hansaria Food",
    desc: "Review seller details linked to commodity transactions and bidding workflows.",
  },
  {
    match: /^\/privacy-policy$/,
    title: "Privacy Policy | Hansaria Food",
    desc: "Read Hansaria Food’s privacy policy for secure handling of your data.",
  },
  {
    match: /^\/terms-conditions$/,
    title: "Terms & Conditions | Hansaria Food",
    desc: "Understand the terms and conditions for using Hansaria Food’s trading platform.",
  },
  {
    match: /^\/broker-commission-policy$/,
    title: "Broker Commission Policy | Hansaria Food",
    desc: "Learn about Hansaria Food’s broker commission policy for commodity brokerage.",
  },
  {
    match: /^\/teams$/,
    title: "Our Team | Hansaria Food",
    desc: "Meet the professionals behind Hansaria Food’s commodity trading platform.",
  },
];

function shouldNoIndex(pathname) {
  const isPublic = PUBLIC_ROUTES.some((re) => re.test(pathname));
  if (!isPublic) return true;

  if (pathname.includes("/edit-")) return true;
  return false;
}

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function buildCanonical(pathname) {
  const normalizedPath = normalizePath(pathname);
  return normalizedPath === "/" ? SITE_URL : `${SITE_URL}${normalizedPath}`;
}

const RouteSEO = () => {
  const { pathname } = useLocation();
  const normalizedPath = normalizePath(pathname);
  const canonical = buildCanonical(pathname);
  const noindex = shouldNoIndex(pathname);
  const meta = ROUTE_META.find((m) => m.match.test(normalizedPath));
  const title = meta?.title || DEFAULT_TITLE;
  const desc = meta?.desc || DEFAULT_DESC;
  const keywords = meta?.keywords || DEFAULT_KEYWORDS;
  const robots = noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      ...(normalizedPath !== "/"
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: meta?.title?.split(" | ")[0] || "Page",
              item: canonical,
            },
          ]
        : []),
    ],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/android-chrome-512x512.png`,
    description:
      "Hansaria Food Private Limited offers poultry, feed meal, and agricultural commodity trading services with transparent brokerage and secure bidding.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-XXXXXXXXXX",
      contactType: "customer service",
      email: "info@hansariafood.com",
      areaServed: ["IN", "Worldwide"],
      availableLanguage: ["English", "Hindi"],
    },
  };

  return (
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={SITE_NAME} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="theme-color" content="#064e3b" />
      <meta name="format-detection" content="telephone=no" />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en-in" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:alt" content={OG_IMAGE_ALT} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={OG_IMAGE} />
      <meta name="twitter:image:alt" content={OG_IMAGE_ALT} />
      <meta name="twitter:site" content="@hansariafood" />

      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />

      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};

export default RouteSEO;
