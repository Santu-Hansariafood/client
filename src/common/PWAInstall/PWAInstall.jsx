import { useEffect, useState } from "react";

const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    });
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome) {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
  };

  if (!canInstall) return null;
  return (
    <button
      onClick={install}
      className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/15 hover:bg-white/25 text-yellow-100 border border-green-300/30 transition"
      title="Install App"
    >
      Install App
    </button>
  );
};

export default PWAInstall;
