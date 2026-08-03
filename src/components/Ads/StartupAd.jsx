import { useEffect, useState } from "react";
import "./StartupAd.css";

const StartupAd = () => {
  const [open, setOpen] = useState(true);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!open) return null;

  return (
    <div className="startup-ad-overlay">
      <div className="startup-ad-box">
        <button className="close-btn" onClick={() => setOpen(false)}>
          ✕
        </button>

        <img src="/ads/banner.jpg" alt="Advertisement" className="ad-image" />

        <div className="ad-content">
          <h2>Hansaria Food Pvt. Ltd.</h2>

          <p>Buy & Sell Agricultural Commodities with Trusted Partners.</p>

          <button className="visit-btn">Visit Now</button>

          <p className="countdown">
            Closing in <strong>{countdown}</strong> seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartupAd;
