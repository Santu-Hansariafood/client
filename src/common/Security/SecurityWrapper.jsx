import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext/AuthContext";

const SecurityWrapper = ({ children }) => {
  const { userRole } = useAuth();
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    if (userRole === "Admin") {
      setIsProtected(false);
      document.body.classList.remove("protection-active");
      return;
    }

    const handleBlur = () => {
      setIsProtected(true);
      document.body.classList.add("protection-active");
    };

    const handleFocus = () => {
      setIsProtected(false);
      document.body.classList.remove("protection-active");
    };

    const handleKeyDown = (e) => {
      // Prevent PrintScreen, Cmd+Shift+3, Cmd+Shift+4, etc.
      // Note: PrintScreen is hard to catch in all browsers, but blur handles it well
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4"))) {
        setIsProtected(true);
        setTimeout(() => setIsProtected(false), 2000);
      }
    };

    // Add listeners for non-admin users
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("keydown", handleKeyDown);
    
    // Initial state for print protection
    document.body.classList.add("protection-active");

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("protection-active");
    };
  }, [userRole]);

  return (
    <>
      <div className={`security-overlay ${isProtected ? "active" : ""}`}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-widest">Security Alert</h2>
          <p className="text-slate-400">Screenshots and unauthorized viewing are restricted for this account.</p>
        </div>
      </div>
      {children}
    </>
  );
};

export default SecurityWrapper;
