import { BrowserRouter } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext/AuthContext";
import { NotificationProvider } from "./context/NotificationContext/NotificationContext";
import Loading from "./common/Loading/Loading";
import CacheHandler from "./utils/CacheHandler/CacheHandler";
import RouteSEO from "./common/SEO/RouteSEO";
import AppRoutes from "./routes/AppRoutes";
import { Suspense, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { prefetchRoute } from "./utils/LazyPages/LazyPages";
import "./App.css";
import StartupAd from "./components/Ads/StartupAd";

const App = () => {
  const hydrated = CacheHandler();

  useEffect(() => {
    const scheduleIdlePrefetch =
      window.requestIdleCallback || ((cb) => setTimeout(cb, 150));

    scheduleIdlePrefetch(() => {
      [
        "/dashboard",
        "/employee/dashboard",
        "/buyer/dashboard",
        "/seller/dashboard",
        "/transporter/dashboard",
        "/buyer/list",
        "/seller-details/list",
        "/commodity/list",
        "/Loading-Entry/list-loading-entry",
        "/manage-order/list-self-order",
      ].forEach((route) => prefetchRoute(route));
    });
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <Helmet>
          <title>Hansaria Food Private Limited</title>
          <meta
            name="description"
            content="Hansaria Food Private Limited — poultry & feed meal trading and brokerage."
          />
        </Helmet>

        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <StartupAd />
            <RouteSEO />
            <ToastContainer
              position={window.innerWidth < 640 ? "top-center" : "top-right"}
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            <AppRoutes hydrated={hydrated} />
          </Suspense>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
