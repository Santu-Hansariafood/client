import { toast } from "react-toastify";

/**
 * Robustly downloads a file (jsPDF instance, Blob, or Data URI), handling mobile WebView/APK edge cases.
 * @param {import('jspdf').jsPDF | Blob | string} source - The source to download.
 * @param {string} filename - The desired filename.
 * @param {string} mimeType - The MIME type (optional, for Data URIs).
 */
export const downloadFile = async (source, filename, mimeType = "application/pdf") => {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // 1. Handle jsPDF instance first
    if (source && typeof source.output === 'function') {
      if (isMobile) {
        try {
          // Strategy 1: Try jsPDF's native save() method first
          console.log("Trying jsPDF native save()");
          source.save(filename);
          return;
        } catch (e1) {
          console.warn("jsPDF native save() failed:", e1);
          
          try {
            // Strategy 2: Try blob + URL.createObjectURL + anchor
            console.log("Trying blob + anchor download");
            const blob = source.output('blob');
            const url = URL.createObjectURL(blob);
            await triggerDownloadWithFallback(url, filename, isMobile, isAndroid);
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            return;
          } catch (e2) {
            console.warn("Blob + anchor failed:", e2);
            
            try {
              // Strategy 3: Try data URI direct navigation
              console.log("Trying data URI navigation");
              const dataUri = source.output('datauristring');
              window.location.href = dataUri;
              return;
            } catch (e3) {
              console.error("All download strategies failed for jsPDF:", e3);
              toast.error("Could not download PDF. Please try a different device/browser.");
            }
          }
        }
      }
      source.save(filename);
      return;
    }

    // 2. Handle Blob
    if (source instanceof Blob) {
      const url = URL.createObjectURL(source);
      try {
        await triggerDownloadWithFallback(url, filename, isMobile, isAndroid);
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      return;
    }

    // 3. Handle Data URI or URL
    if (typeof source === 'string') {
      if (isMobile && source.startsWith('data:')) {
        try {
          // Convert data URI to blob first for better compatibility
          const response = await fetch(source);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          await triggerDownloadWithFallback(url, filename, isMobile, isAndroid);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          return;
        } catch (e) {
          console.warn("Fetch fallback for data URI failed, trying direct:", e);
        }
      }
      
      await triggerDownloadWithFallback(source, filename, isMobile, isAndroid);
      return;
    }

    throw new Error("Unsupported source type for downloadFile");
  } catch (error) {
    console.error("File Download Error:", error);
    toast.error("Failed to download file. Please try again.");
  }
};

/**
 * Helper with multiple fallback strategies to trigger download
 */
async function triggerDownloadWithFallback(url, filename, isMobile, isAndroid) {
  // Strategy 1: Standard anchor tag click
  console.log("Strategy 1: Anchor tag download");
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    if (isMobile) {
      link.target = "_blank";
    }
    document.body.appendChild(link);
    
    // Try multiple click events for better compatibility
    link.click();
    setTimeout(() => link.click(), 100);
    
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    }, 200);
    return;
  } catch (e) {
    console.warn("Anchor click failed:", e);
  }
  
  // Strategy 2: Hidden iframe (good for WebViews)
  if (isMobile) {
    console.log("Strategy 2: Hidden iframe");
    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 10000);
      return;
    } catch (e) {
      console.warn("Hidden iframe failed:", e);
    }
  }
  
  // Strategy 3: For Android WebView specifically - try direct navigation
  if (isAndroid) {
    console.log("Strategy 3: Android WebView direct navigation");
    try {
      window.location.href = url;
      return;
    } catch (e) {
      console.warn("Android navigation failed:", e);
    }
  }
  
  // Strategy 4: Window open
  if (isMobile) {
    console.log("Strategy 4: Window open");
    try {
      window.open(url, "_blank");
      return;
    } catch (e) {
      console.warn("Window open failed:", e);
    }
  }
  
  throw new Error("All download strategies exhausted");
}
