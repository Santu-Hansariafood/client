import { BrowserRouter } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext/AuthContext";
import { NotificationProvider } from "./context/NotificationContext/NotificationContext";
import Loading from "./common/Loading/Loading";
import CacheHandler from "./utils/CacheHandler/CacheHandler";
import RouteSEO from "./common/SEO/RouteSEO";
import AppRoutes from "./routes/AppRoutes";
import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import { ErrorBoundary } from "react-error-boundary";
import "./App.css";

const ErrorFallback = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md w-full text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        Something went wrong
      </h2>
      <p className="text-slate-600 mb-6">
        The application encountered an error. Please try restarting the app.
      </p>
      <pre className="text-xs bg-slate-100 p-4 rounded-lg overflow-auto text-left mb-6 max-h-40">
        {error.message}
      </pre>
      <button
        onClick={() => window.location.assign("/")}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
      >
        Go to Home
      </button>
    </div>
  </div>
);

const App = () => {
  const hydrated = CacheHandler();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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
    </ErrorBoundary>
  );
};

export default App;
