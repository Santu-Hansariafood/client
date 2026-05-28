import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext/AuthContext";

const SecurityWrapper = ({ children }) => {
  const { userRole, user } = useAuth();

  const [blocked, setBlocked] = useState(false);
  const [warning, setWarning] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (userRole === "Admin") return;

    const style = document.createElement("style");

    style.innerHTML = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }

      body {
        overflow: hidden !important;
      }

      img {
        pointer-events: none !important;
        -webkit-user-drag: none !important;
      }

      .security-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.97);
        backdrop-filter: blur(25px);
        z-index: 999999999;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        color: white;
        text-align: center;
        font-family: sans-serif;
        transition: all 0.2s ease;
      }

      .security-watermark {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(-30deg);
        font-size: 42px;
        font-weight: bold;
        color: rgba(255,255,255,0.06);
        z-index: 99999;
        pointer-events: none;
        white-space: nowrap;
      }

      .security-protected {
        filter: blur(20px) brightness(0.3);
        pointer-events: none !important;
      }
    `;

    document.head.appendChild(style);

    const activateProtection = (msg = "Unauthorized action detected") => {
      setWarning(msg);
      setBlocked(true);

      clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setBlocked(false);
      }, 2500);
    };

    const handleBlur = () => {
      activateProtection("Screen visibility lost");
    };

    const handleVisibility = () => {
      if (document.hidden) {
        activateProtection("Tab switch detected");
      }
    };

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      const blockedKeys =
        e.key === "PrintScreen" ||
        e.keyCode === 44 ||
        (e.ctrlKey && ["u", "s", "p", "c"].includes(key)) ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        e.key === "F12" ||
        (e.metaKey && e.shiftKey);

      if (blockedKeys) {
        e.preventDefault();
        e.stopPropagation();

        navigator.clipboard?.writeText?.("");

        activateProtection("Restricted keyboard shortcut");
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      activateProtection("Right click disabled");
    };

    const blockAction = (e) => {
      e.preventDefault();
      activateProtection("Copy action blocked");
    };

    const handleDrag = (e) => {
      e.preventDefault();
    };

    const devToolsChecker = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;

      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if (widthThreshold || heightThreshold) {
        activateProtection("Developer tools detected");
      }
    }, 1000);

    window.onbeforeprint = () => {
      activateProtection("Printing blocked");
      return false;
    };

    const enableFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        activateProtection("Fullscreen request failed");
      }
    };

    enableFullscreen();

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    window.addEventListener("keydown", handleKeyDown, true);

    window.addEventListener("contextmenu", handleContextMenu);

    document.addEventListener("copy", blockAction);
    document.addEventListener("cut", blockAction);
    document.addEventListener("paste", blockAction);

    document.addEventListener("dragstart", handleDrag);

    return () => {
      clearInterval(devToolsChecker);

      window.removeEventListener("blur", handleBlur);

      document.removeEventListener("visibilitychange", handleVisibility);

      window.removeEventListener("keydown", handleKeyDown, true);

      window.removeEventListener("contextmenu", handleContextMenu);

      document.removeEventListener("copy", blockAction);
      document.removeEventListener("cut", blockAction);
      document.removeEventListener("paste", blockAction);

      document.removeEventListener("dragstart", handleDrag);

      document.head.removeChild(style);

      clearTimeout(timeoutRef.current);
    };
  }, [userRole]);

  if (userRole === "Admin") {
    return children;
  }

  return (
    <>
      <div className="security-watermark">
        CONFIDENTIAL • {user?.name || "PROTECTED"} •{" "}
        {new Date().toLocaleString()}
      </div>

      <div className={blocked ? "security-protected" : ""}>{children}</div>

      {blocked && (
        <div className="security-overlay">
          <h1
            style={{
              fontSize: "32px",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            SECURITY ALERT
          </h1>

          <p
            style={{
              fontSize: "18px",
              opacity: 0.9,
            }}
          >
            {warning}
          </p>

          <p
            style={{
              marginTop: "12px",
              fontSize: "14px",
              opacity: 0.6,
            }}
          >
            Screenshot, recording, inspection and copying are restricted.
          </p>
        </div>
      )}
    </>
  );
};

export default SecurityWrapper;
