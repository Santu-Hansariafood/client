import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext/AuthContext";
import Loading from "./common/Loading/Loading";
import "./App.css";

const CacheHandler = lazy(() => import("./utils/CacheHandler/CacheHandler"));
const KeepAlive = lazy(() => import("./utils/KeepAlive/KeepAlive"));
const CriticalRoutes = lazy(() =>
  import("./routes/CriticalRoutes/CriticalRoutes")
);
const PrivateRoutes = lazy(() =>
  import("./routes/PrivateRoutes/PrivateRoutes")
);

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <HelmetProvider>
        <AuthProvider>
          <Helmet>
            <title>Hansaria Food Private Limited</title>
            <meta
              name="description"
              content="Hansaria Food Private Limited specializes in premium food products."
            />
          </Helmet>

          <BrowserRouter>
            <CacheHandler />
            <KeepAlive />
            <CriticalRoutes />
            <PrivateRoutes />
          </BrowserRouter>
        </AuthProvider>
      </HelmetProvider>
    </Suspense>
  );
};

export default App;
