import { Suspense, lazy, useEffect, useState } from "react";
import {
  FaGavel,
  FaBook,
  FaBoxOpen,
  FaChartLine,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import api from "../../utils/apiClient/apiClient";
import { toTitleCase } from "../../utils/textUtils/textUtils";

const Cards = lazy(() => import("../../common/Cards/Cards"));

const BuyerDashboard = () => {
  const { user, mobile } = useAuth();
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [showAllConsignee, setShowAllConsignee] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!mobile) return;

        const response = await api.get(`/buyers?mobile=${mobile}`);
        if (response.data?.length > 0) {
          setBuyerProfile(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching buyer profile:", error);
      }
    };
    if (mobile) fetchProfile();
  }, [mobile]);

  const colors = [
    "bg-indigo-50 text-indigo-600",
    "bg-emerald-50 text-emerald-600",
    "bg-amber-50 text-amber-600",
    "bg-rose-50 text-rose-600",
  ];

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
      title: "Participate Bid List",
      count: "View",
      icon: FaGavel,
      link: "/manage-bids/bid-list/participate-bid-admin",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6">
        <header className="mb-10 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900">
              Welcome Mr. {toTitleCase(user?.name || "")},
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
                {(buyerProfile.companyNames || []).length > 0
                  ? buyerProfile.companyNames.join(", ")
                  : toTitleCase(buyerProfile.companyName || "")}
              </h3>
              {buyerProfile.group && (
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500">
                  Group: {toTitleCase(buyerProfile.group)}
                </p>
              )}
            </div>
          )}
        </header>

        {buyerProfile?.companyNames?.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  Your Companies
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {buyerProfile.companyNames.map((name, idx) => (
                <div
                  key={`${name}-${idx}`}
                  className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-white shadow-sm border border-slate-200"
                >
                  {toTitleCase(name)}
                </div>
              ))}
            </div>
          </section>
        )}

        {buyerProfile?.consignee?.length > 0 && (
          <section className="mb-10">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50/30 to-sky-50/40 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                    <FaMapMarkerAlt className="text-sm" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                      Consignees
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Delivery points mapped to your buyer account
                    </p>
                  </div>
                </div>

                {buyerProfile.consignee.length > 3 && (
                  <button
                    onClick={() => setShowAllConsignee(!showAllConsignee)}
                    className="px-3 py-1.5 rounded-lg text-xs text-indigo-700 font-semibold bg-white border border-indigo-100 hover:bg-indigo-50 transition-colors"
                  >
                    {showAllConsignee ? "Show Less" : "View All"}
                  </button>
                )}
              </div>

              <div
                className={`flex flex-wrap gap-2.5 sm:gap-3 transition-all duration-300 ${
                  showAllConsignee
                    ? "max-h-[500px]"
                    : "max-h-[76px] overflow-hidden"
                }`}
              >
                {buyerProfile.consignee.map((c, idx) => {
                  const color = colors[idx % colors.length];

                  return (
                    <div
                      key={c.id || idx}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                    >
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg ${color} group-hover:scale-110 transition`}
                      >
                        <FaMapMarkerAlt className="text-[12px]" />
                      </span>

                      <span className="truncate">{c.label || c}</span>
                    </div>
                  );
                })}
              </div>
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
