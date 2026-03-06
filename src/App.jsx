import { BrowserRouter } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext/AuthContext";
import Loading from "./common/Loading/Loading";
import CacheHandler from "./utils/CacheHandler/CacheHandler";
import RouteSEO from "./common/SEO/RouteSEO";
import CriticalRoutes from "./routes/CriticalRoutes/CriticalRoutes";
import PrivateRoutes from "./routes/PrivateRoutes/PrivateRoutes";
import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "./App.css";

const App = () => {
  const hydrated = CacheHandler();

  return (
    <HelmetProvider>
      <AuthProvider>
        <Helmet>
          <title>Hansaria Food Private Limited</title>
          <meta
            name="description"
            content="Hansaria Food Private Limited specializes in premium food products."
          />
          <meta name="robots" content="index,follow" />
        </Helmet>

        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <RouteSEO />
            <ToastContainer position="top-right" autoClose={3000} />
            <CriticalRoutes />
            <PrivateRoutes hydrated={hydrated} />
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
