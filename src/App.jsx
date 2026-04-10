import { BrowserRouter } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext/AuthContext";
import Loading from "./common/Loading/Loading";
import CacheHandler from "./utils/CacheHandler/CacheHandler";
import RouteSEO from "./common/SEO/RouteSEO";
import AppRoutes from "./routes/AppRoutes";
import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "./App.css";

const App = () => {
  const hydrated = CacheHandler();

  return (
    <AuthProvider>
      <Helmet>
        <title>Hansaria Food Private Limited</title>
        <meta
          name="description"
          content="Hansaria Food Private Limited — poultry & feed meal trading and brokerage."
        />
      </Helmet>

      <BrowserRouter>
        <Suspense fallback={<Loading />}>
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
    </AuthProvider>
  );
};

export default App;
