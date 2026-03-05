import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const routeMeta = [
  { match: /^\/$/, title: "Hansaria Food Private Limited", desc: "Poultry & feed meal trading and brokerage across India and globally." },
  { match: /^\/login$/, title: "Login | Hansaria Food", desc: "Access your Hansaria Food dashboard." },
  { match: /^\/dashboard$/, title: "Dashboard | Hansaria Food", desc: "Overview of buyers, sellers, consignees and orders." },
  { match: /^\/buyer\/add$/, title: "Add Buyer | Hansaria Food", desc: "Create a new buyer profile." },
  { match: /^\/buyer\/list$/, title: "Buyer List | Hansaria Food", desc: "Browse and manage buyers." },
  { match: /^\/company\/list$/, title: "Companies | Hansaria Food", desc: "Browse and manage companies." },
  { match: /^\/commodity\/list$/, title: "Commodities | Hansaria Food", desc: "Browse commodity catalog and parameters." },
  { match: /^\/manage-bids\/bid-list$/, title: "Bids | Hansaria Food", desc: "View and manage bids." },
  { match: /^\/manage-order\/list-self-order$/, title: "Self Orders | Hansaria Food", desc: "List and manage self orders." }
];

const RouteSEO = () => {
  const { pathname } = useLocation();
  const meta = routeMeta.find((m) => m.match.test(pathname));
  if (!meta) return null;
  const canonical = `https://hansariafood.shop${pathname}`;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.desc} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content="index,follow" />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.desc} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.desc} />
    </Helmet>
  );
};

export default RouteSEO;

