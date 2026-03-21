import React, { Suspense, lazy } from "react";
import { FaGavel, FaBook, FaBoxOpen, FaUserCircle } from "react-icons/fa";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";

const Cards = lazy(() => import("../../common/Cards/Cards"));

const BuyerDashboard = () => {
  const { user } = useAuth();
  
  const dashboardData = [
    {
      title: "Bid List",
      count: "View",
      icon: FaGavel,
      link: "/manage-bids/bid-list",
    },
    {
      title: "Create Bid",
      count: "Add",
      icon: FaGavel,
      link: "/manage-bids/buyer",
    },
    {
      title: "Soudabook",
      count: "List",
      icon: FaBook,
      link: "/sodabook/list",
    },
    {
      title: "Your Orders",
      count: "Check",
      icon: FaBoxOpen,
      link: "/manage-order/list-self-order",
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-6 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name}!</h1>
            <p className="text-slate-500">Here is your Buyer Dashboard.</p>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dashboardData.map((item, index) => (
            <div key={index} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-xl border border-blue-100 hover:scale-[1.02] transition-all duration-300">
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

        <UserProfileCard user={user} />

      </div>
    </Suspense>
  );
};

export default BuyerDashboard;