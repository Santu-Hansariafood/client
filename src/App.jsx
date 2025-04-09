import { BrowserRouter } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext/AuthContext";
import Loading from "./common/Loading/Loading";
import CacheHandler from "./utils/CacheHandler/CacheHandler";
// import KeepAlive from "./utils/KeepAlive/KeepAlive";
import CriticalRoutes from "./routes/CriticalRoutes/CriticalRoutes";
import PrivateRoutes from "./routes/PrivateRoutes/PrivateRoutes";
import { Suspense } from "react";
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
        </Helmet>

        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            {/* <KeepAlive /> */}
            <CriticalRoutes />
            <PrivateRoutes hydrated={hydrated} />
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
