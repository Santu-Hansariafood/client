import { useEffect, useState } from "react";

const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

const CacheHandler = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cacheTimestamp = sessionStorage.getItem("cacheTimestamp");
    const currentTime = Date.now();
    if (cacheTimestamp && currentTime - cacheTimestamp > CACHE_EXPIRY_TIME) {
      sessionStorage.removeItem("lastVisitedPage");
      sessionStorage.removeItem("cacheTimestamp");
    }
    sessionStorage.setItem("cacheTimestamp", currentTime);
    setHydrated(true);
  }, []);

  return hydrated;
};

export default CacheHandler;
