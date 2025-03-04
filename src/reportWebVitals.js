const reportWebVitals = async (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    try {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import("web-vitals");
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    } catch (error) {
      console.error("Failed to load web-vitals module:", error);
    }
  }
};

export default reportWebVitals;
