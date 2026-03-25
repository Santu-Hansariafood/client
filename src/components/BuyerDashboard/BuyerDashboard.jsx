import React, { Suspense, lazy } from "react";
import { FaGavel, FaBook, FaBoxOpen, FaUserCircle, FaChartLine, FaHistory } from "react-icons/fa";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";

const Cards = lazy(() => import("../../common/Cards/Cards"));

const BuyerDashboard = () => {
  const { user } = useAuth();
  
  const dashboardData = [
    {
      title: "Live Bids",
      count: "View",
      icon: FaGavel,
      link: "/manage-bids/bid-list",
      color: "from-green-400 to-green-600",
    },
    {
      title: "Create New Bid",
      count: "Add",
      icon: FaGavel,
      link: "/manage-bids/buyer",
      color: "from-blue-400 to-blue-600",
    },
    {
      title: "Soudabook",
      count: "List",
      icon: FaBook,
      link: "/sodabook/list",
      color: "from-purple-400 to-purple-600",
    },
    {
      title: "Your Orders",
      count: "Check",
      icon: FaBoxOpen,
      link: "/manage-order/list-self-order",
      color: "from-yellow-400 to-yellow-600",
    },
    {
      title: "Market Analytics",
      count: "Analyze",
      icon: FaChartLine,
      link: "/market-analytics", // Example link, adjust as needed
      color: "from-red-400 to-red-600",
    },
    {
      title: "Bid History",
      count: "Review",
      icon: FaHistory,
      link: "/bid-history", // Example link, adjust as needed
      color: "from-indigo-400 to-indigo-600",
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-6 bg-gray-50 min-h-screen">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Welcome, {user?.name}!</h1>
          <p className="text-slate-500 mt-2 text-lg">Your central hub for managing bids, orders, and market insights.</p>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData.map((item, index) => (
            <div key={index} className="group relative transform hover:-translate-y-1 transition-transform duration-300">
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.color} rounded-3xl blur-md opacity-50 group-hover:opacity-75 transition duration-500`}></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100">
                <Cards
                  title={item.title}
                  count={item.count}
                  icon={item.icon}
                  link={item.link}
                  color={item.color}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <UserProfileCard user={user} />
        </div>

      </div>
    </Suspense>
  );
};

export default BuyerDashboard;