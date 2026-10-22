import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaArrowLeft } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();
  const [counter, setCounter] = useState(10);

  useEffect(() => {
    if (counter === 0) {
      navigate("/");
    }
    const timer = setInterval(() => {
      setCounter((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [counter, navigate]);

  return (
    <div className="lux-canvas flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="mb-6 inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-2.5 sm:px-5">
        <p className="font-serif text-sm font-semibold text-emerald-700">
          You are not authorized! Please go back safely.
        </p>
      </div>
      <div className="lux-card lux-gold-top w-full max-w-md p-6 text-center sm:p-8 animate-fade-in-up">
        <h1 className="font-serif text-3xl font-semibold text-lux-ink mb-4 sm:text-4xl">
          404 &mdash; Page Not Found
        </h1>
        <p className="text-lux-muted mb-6">
          Redirecting in {counter} seconds...
        </p>
        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="h-4 w-4" /> Go Back
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
            onClick={() => navigate("/")}
          >
            <FaHome className="h-4 w-4" /> Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
