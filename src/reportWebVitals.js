const reportWebVitals = async (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    try {
      const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import("web-vitals");
      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    } catch (error) {
      console.error("Failed to load web-vitals module:", error);
    }
  }
};

export default reportWebVitals;
