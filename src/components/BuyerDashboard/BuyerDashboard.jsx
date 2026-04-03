import { Suspense, lazy, useEffect, useState } from "react";
import {
  FaGavel,
  FaBook,
  FaBoxOpen,
  FaChartLine,
  FaHistory,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import axios from "axios";
import { toTitleCase } from "../../utils/textUtils/textUtils";

const Cards = lazy(() => import("../../common/Cards/Cards"));

const BuyerDashboard = () => {
  const { user, mobile } = useAuth();
  const [buyerProfile, setBuyerProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`/buyers?mobile=${mobile}`);
        if (response.data?.length > 0) {
          setBuyerProfile(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching buyer profile:", error);
      }
    };
    if (mobile) fetchProfile();
  }, [mobile]);

  const dashboardData = [
    {
      title: "Live Bids",
      count: "View",
      icon: FaGavel,
      link: "/manage-bids/bid-list",
      color: "from-emerald-400 to-green-600",
    },
    {
      title: "Create New Bid",
      count: "Add",
      icon: FaGavel,
      link: "/manage-bids/buyer",
      color: "from-blue-400 to-indigo-600",
    },
    {
      title: "Soudabook",
      count: "List",
      icon: FaBook,
      link: "/sodabook/list",
      color: "from-violet-400 to-purple-600",
    },
    {
      title: "Your Orders",
      count: "Check",
      icon: FaBoxOpen,
      link: "/manage-order/list-self-order",
      color: "from-amber-400 to-orange-500",
    },
    {
      title: "Market Analytics",
      count: "Analyze",
      icon: FaChartLine,
      link: "/buyer/market-analytics",
      color: "from-rose-400 to-red-600",
    },
    {
      title: "Bid History",
      count: "Review",
      icon: FaHistory,
      link: "/buyer/bid-history",
      color: "from-indigo-400 to-blue-600",
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6">
        <header className="mb-10 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900">
              Welcome,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {toTitleCase(user?.name)}
              </span>
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Manage bids, orders & analytics in one place.
            </p>
          </div>

          {buyerProfile && (
            <div className="relative z-10 flex flex-col gap-1">
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-indigo-500">
                    Trustable Buyer
                  </span>
                  <div className="relative flex items-center justify-center">
                    <span className="w-4 h-4 flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] shadow-md">
                      ✓
                    </span>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50 animate-pulseSlow"></span>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 
      transition-all duration-300 hover:scale-105"
                >
                  <img
                    src="/icons/favicon-16x16.png"
                    alt="Hansaria Food"
                    className="w-4 h-4 rounded-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
                {toTitleCase(buyerProfile.companyName)}
              </h3>
            </div>
          )}
        </header>

        {buyerProfile?.consignee?.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <FaMapMarkerAlt className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Consignees
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {buyerProfile.consignee.map((c, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  {c.label || c}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {dashboardData.map((item, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden"
            >
              <div
                className="
                            relative 
                            bg-white 
                            border border-slate-200 
                            shadow-md 
                            rounded-2xl 
                            p-3 sm:p-4
                            transition-all duration-300
                            hover:shadow-2xl hover:-translate-y-1
                            active:scale-95
                    "
              >
                <div
                  className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-all duration-300 bg-gradient-to-br ${item.color}`}
                ></div>

                <div className="absolute -top-6 -right-6 w-20 h-20 bg-slate-100 rounded-full opacity-40"></div>

                <div className="relative z-10">
                  <Cards
                    title={item.title}
                    count={item.count}
                    icon={item.icon}
                    link={item.link}
                    color={item.color}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-lg p-6">
            <UserProfileCard user={user} />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default BuyerDashboard;
