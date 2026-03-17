import React, { Suspense, lazy } from "react";
import {
  FaUserTie,
  FaUsers,
  FaStore,
  FaTruck,
  FaClipboardList,
} from "react-icons/fa";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";

const Cards = lazy(() => import("../../common/Cards/Cards"));

const EmployeeDashboard = () => {
  const { user } = useAuth();

  const dashboardData = [
    {
      title: "Buyer List",
      count: "Manage",
      icon: FaUsers,
      link: "/buyer/list",
    },
    {
      title: "Seller List",
      count: "Manage",
      icon: FaStore,
      link: "/seller-details/list",
    },
    {
      title: "Consignee List",
      count: "Manage",
      icon: FaTruck,
      link: "/consignee/list",
    },
    {
      title: "Self Orders",
      count: "View",
      icon: FaClipboardList,
      link: "/manage-order/list-self-order",
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-orange-50/30 p-6 sm:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-amber-900/5">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <FaUserTie size={44} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                  Employee Portal
                </h1>
                <p className="text-amber-600 font-semibold tracking-wide uppercase text-sm">
                  Operations & Management
                </p>
              </div>
            </div>
            <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <span className="text-slate-400 text-sm font-medium mr-2">
                Status:
              </span>
              <span className="text-orange-600 font-bold uppercase text-xs tracking-widest bg-orange-50 px-3 py-1 rounded-full">
                On Duty
              </span>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dashboardData.map((item, index) => (
              <div key={index} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-xl border border-amber-100 hover:scale-[1.02] transition-all duration-300">
                  <Cards
                    title={item.title}
                    count={item.count}
                    icon={item.icon}
                    link={item.link}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default EmployeeDashboard;
