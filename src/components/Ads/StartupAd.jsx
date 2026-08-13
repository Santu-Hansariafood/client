import { useEffect, useRef, useState } from "react";
import "./StartupAd.css";

const StartupAd = () => {
  const [open, setOpen] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [videoError, setVideoError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const videoRef = useRef(null);

  const VIDEO_URL = "/ads/banner.mp4";
  const POSTER_IMAGE = "/ads/banner.jpg";
  const VISIT_URL = "https://bid.hansariafood.in/";

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  useEffect(() => {
    if (!videoRef.current || !open) return;

    const video = videoRef.current;

    video.muted = false;
    video.volume = 1;

    const playVideo = async () => {
      try {
        await video.play();

        setSoundEnabled(true);
      } catch (error) {
        // Browser blocked autoplay with sound.
        video.muted = true;

        try {
          await video.play();
        } catch (playError) {
          console.error("Video playback failed:", playError);
        }

        setSoundEnabled(false);
      }
    };

    playVideo();
  }, [open]);

  const enableSound = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      video.muted = false;
      video.volume = 1;

      await video.play();

      setSoundEnabled(true);
    } catch (error) {
      console.error("Unable to enable sound:", error);
    }
  };

  const closeAd = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }

    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="startup-ad-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Advertisement"
    >
      <div className="startup-ad-box">

        <div className="startup-ad-topbar">
          <span className="ad-label">
            Advertisement
          </span>

          <button
            type="button"
            className="close-btn"
            onClick={closeAd}
            aria-label="Close advertisement"
          >
            ✕
          </button>
        </div>

        <div className="startup-ad-video-wrapper">

          {!videoError ? (
            <>
              <video
                ref={videoRef}
                className="ad-video"
                src={VIDEO_URL}
                poster={POSTER_IMAGE}
                autoPlay
                playsInline
                loop
                preload="auto"
                onError={() => setVideoError(true)}
              />

              {!soundEnabled && (
                <button
                  type="button"
                  className="sound-btn"
                  onClick={enableSound}
                >
                  🔊 Enable Sound
                </button>
              )}
            </>
          ) : (
            <img
              src={POSTER_IMAGE}
              alt="Hansaria Food Advertisement"
              className="ad-fallback-image"
            />
          )}
        </div>

        <div className="ad-content">

          <h2>Hansaria Food Pvt. Ltd.</h2>

          <p>
            Buy &amp; Sell Agricultural Commodities with
            Trusted Partners.
          </p>

          <a
            href={VISIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="visit-btn"
          >
            Visit Now
          </a>

          <div className="ad-footer">

            <p className="countdown">
              Closing in{" "}
              <strong>{countdown}</strong>{" "}
              seconds
            </p>

            <button
              type="button"
              className="skip-btn"
              onClick={closeAd}
            >
              Skip Ad
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupAd;