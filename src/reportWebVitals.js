const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    import("web-vitals")
      .then((webVitals) => {
        webVitals.getCLS(onPerfEntry);
        webVitals.getFID(onPerfEntry);
        webVitals.getFCP(onPerfEntry);
        webVitals.getLCP(onPerfEntry);
        webVitals.getTTFB(onPerfEntry);
      })
      .catch((error) => {
        console.error("Failed to load web-vitals module:", error);
      });
  }
};

export default reportWebVitals;
