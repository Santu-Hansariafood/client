import { toast } from "react-toastify";

/**
 * Robustly downloads a file (jsPDF instance, Blob, or Data URI), handling mobile WebView/APK edge cases.
 * @param {import('jspdf').jsPDF | Blob | string} source - The source to download.
 * @param {string} filename - The desired filename.
 * @param {string} mimeType - The MIME type (optional, for Data URIs).
 */
export const downloadFile = async (source, filename, mimeType = "application/octet-stream") => {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // 1. Handle jsPDF instance
    if (source && typeof source.output === 'function') {
      if (isMobile) {
        // For mobile, converting to blob and using an anchor is more reliable than data URI
        const blob = source.output('blob');
        const url = URL.createObjectURL(blob);
        triggerDownload(url, filename, true);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return;
      }
      source.save(filename);
      return;
    }

    // 2. Handle Blob
    if (source instanceof Blob) {
      const url = URL.createObjectURL(source);
      if (isMobile) {
        triggerDownload(url, filename, true);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        triggerDownload(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      return;
    }

    // 3. Handle Data URI or URL
    if (typeof source === 'string') {
      if (isMobile && source.startsWith('data:')) {
        try {
          // Convert data URI to blob for better mobile compatibility
          const response = await fetch(source);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          triggerDownload(url, filename, true);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (e) {
          console.warn("Fetch fallback for data URI failed, using direct link:", e);
          triggerDownload(source, filename, true);
        }
      } else {
        triggerDownload(source, filename, isMobile);
      }
      return;
    }

    throw new Error("Unsupported source type for downloadFile");
  } catch (error) {
    console.error("File Download Error:", error);
    toast.error("Failed to download file. Please try again.");
  }
};

/**
 * Helper to trigger a traditional anchor-based download.
 * @param {string} url - The URL to download.
 * @param {string} filename - The filename.
 * @param {boolean} isMobile - Whether the environment is mobile.
 */
function triggerDownload(url, filename, isMobile = false) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  
  if (isMobile) {
    // In some WebViews, target="_blank" helps trigger the system's download manager 
    // or opens the file in a new internal view instead of trying to open an external app.
    link.target = "_blank";
  }

  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    if (link.parentNode) {
      document.body.removeChild(link);
    }
  }, 100);
}
