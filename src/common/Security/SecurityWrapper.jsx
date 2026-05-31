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
    const isEmployee = userRole === "Employee";

    style.innerHTML = `
      ${!isEmployee ? `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      ` : ''}

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
        background: #000000 !important;
        z-index: 999999999;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        color: white;
        text-align: center;
        font-family: sans-serif;
        transition: opacity 0.3s ease;
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
        color: rgba(255, 255, 255, 0.08);
        z-index: 99999;
        pointer-events: none;
        white-space: nowrap;
      }

      .security-protected {
        filter: blur(40px) brightness(0) !important;
        pointer-events: none !important;
      }
    `;

    document.head.appendChild(style);

    const activateProtection = (msg = "Unauthorized action detected", persistent = false) => {
      setWarning(msg);
      setBlocked(true);

      clearTimeout(timeoutRef.current);

      if (!persistent) {
        timeoutRef.current = setTimeout(() => {
          setBlocked(false);
        }, 3000);
      }
    };

    const handleBlur = () => {
      // Re-enabled to prevent snapshots when focus is lost (common during screenshotting)
      activateProtection("Screen content hidden for security", false);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        activateProtection("Content protected", true);
      } else {
        // When coming back, keep it blocked for a moment to ensure no snapshots were taken
        timeoutRef.current = setTimeout(() => {
          setBlocked(false);
        }, 1000);
      }
    };

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const isEmployee = userRole === "Employee";

      // Comprehensive list of blocked keys and shortcuts
      const blockedKeys =
        e.key === "PrintScreen" ||
        e.keyCode === 44 ||
        // Windows + PrtSc or Windows + Shift + S (often hard to catch but trying)
        (e.metaKey && (e.key === "PrintScreen" || e.keyCode === 44)) ||
        (e.metaKey && e.shiftKey && (key === "s" || key === "4" || key === "3" || key === "5")) ||
        // Standard Ctrl shortcuts
        (e.ctrlKey && (isEmployee ? ["u", "s", "p"] : ["u", "s", "p", "c", "a"]).includes(key)) ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c", "s"].includes(key)) ||
        e.key === "F12" || e.keyCode === 123;

      if (blockedKeys) {
        e.preventDefault();
        e.stopPropagation();

        if (!isEmployee) {
          try {
            navigator.clipboard?.writeText?.("");
          } catch (err) {}
        }

        activateProtection("Security Alert: Restricted action blocked", false);
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      activateProtection("Right-click is disabled for security", false);
    };

    const blockAction = (e) => {
      e.preventDefault();
      activateProtection("Copy/Cut/Paste is restricted", false);
    };

    const handleDrag = (e) => {
      e.preventDefault();
    };

    // More aggressive DevTools detection
    const devToolsChecker = setInterval(() => {
      const threshold = 160;
      const isDevToolsOpen = 
        window.outerWidth - window.innerWidth > threshold || 
        window.outerHeight - window.innerHeight > threshold;

      if (isDevToolsOpen) {
        activateProtection("Security Alert: Developer tools detected", true);
      }
    }, 1000);

    window.onbeforeprint = () => {
      activateProtection("Printing is restricted on this platform", true);
      return false;
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu);

    if (!isEmployee) {
      document.addEventListener("copy", blockAction);
      document.addEventListener("cut", blockAction);
      document.addEventListener("paste", blockAction);
    }

    document.addEventListener("dragstart", handleDrag);

    return () => {
      clearInterval(devToolsChecker);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu);

      if (!isEmployee) {
        document.removeEventListener("copy", blockAction);
        document.removeEventListener("cut", blockAction);
        document.removeEventListener("paste", blockAction);
      }

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
