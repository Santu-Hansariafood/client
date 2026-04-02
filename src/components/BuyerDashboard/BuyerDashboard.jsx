import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  FaGavel,
  FaBook,
  FaBoxOpen,
  FaUserCircle,
  FaChartLine,
  FaHistory,
  FaBuilding,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import axios from "axios";

const Cards = lazy(() => import("../../common/Cards/Cards"));

const BuyerDashboard = () => {
  const { user, mobile } = useAuth();
  const [buyerProfile, setBuyerProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`/buyers?mobile=${mobile}`);
        if (response.data && response.data.length > 0) {
          setBuyerProfile(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching buyer profile:", error);
      }
    };
    if (mobile) {
      fetchProfile();
    }
  }, [mobile]);

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
      link: "/buyer/market-analytics",
      color: "from-red-400 to-red-600",
    },
    {
      title: "Bid History",
      count: "Review",
      icon: FaHistory,
      link: "/buyer/bid-history",
      color: "from-indigo-400 to-indigo-600",
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-6 bg-slate-50 min-h-screen">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Welcome, {user?.name}!
            </h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">
              Your central hub for managing bids, orders, and market insights.
            </p>
          </div>

          {buyerProfile && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <FaBuilding size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Primary Company
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {buyerProfile.companyName}
                  </p>
                </div>
              </div>
            </div>
          )}
        </header>

        {buyerProfile?.consignee && buyerProfile.consignee.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <FaMapMarkerAlt className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Associated Consignees
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {buyerProfile.consignee.map((c, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all cursor-default"
                >
                  {c.label || c}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {dashboardData.map((item, index) => (
            <div
              key={index}
              className="group relative transform hover:-translate-y-2 transition-all duration-500"
            >
              <div
                className={`absolute -inset-1 bg-gradient-to-br ${item.color} rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500`}
              ></div>
              <div className="relative rounded-[2rem] overflow-hidden shadow-xl bg-white border border-slate-100 h-full">
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

        <div className="mt-16 border-t border-slate-200 pt-10">
          <UserProfileCard user={user} />
        </div>
      </div>
    </Suspense>
  );
};

export default BuyerDashboard;
