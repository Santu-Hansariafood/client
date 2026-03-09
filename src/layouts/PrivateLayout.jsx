import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext/AuthContext";
import Sidebar from "../components/Sidebar/Sidebar";
import { prefetchRoute } from "../utils/LazyPages/LazyPages";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-emerald-500 animate-spin" />
  </div>
);

const PrivateLayout = () => {
  const { userRole } = useAuth();

  useEffect(() => {
    prefetchRoute("/dashboard");
    const id = setTimeout(() => {
      prefetchRoute("/buyer/list");
      prefetchRoute("/manage-bids/bid-list");
      prefetchRoute("/company/list");
    }, 800);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex h-screen">
      {userRole === "Admin" && <Sidebar />}
      <main className="flex-1 p-4 overflow-auto">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default PrivateLayout;
