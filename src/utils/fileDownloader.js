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
        try {
          const dataUri = source.output('datauristring');
          openInNewTab(dataUri);
          return;
        } catch (e) {
          console.error("jsPDF Data URI preview failed:", e);
        }
      }
      source.save(filename);
      return;
    }

    // 2. Handle Blob
    if (source instanceof Blob) {
      if (isMobile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          openInNewTab(reader.result);
        };
        reader.readAsDataURL(source);
        return;
      } else {
        const url = URL.createObjectURL(source);
        triggerDownload(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
    }

    // 3. Handle Data URI or URL
    if (typeof source === 'string') {
      if (isMobile) {
        openInNewTab(source);
      } else {
        triggerDownload(source, filename);
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
 * Helper to open content in a new tab/window, compatible with mobile WebViews.
 */
function openInNewTab(url) {
  const newWindow = window.open();
  if (newWindow) {
    // For Data URIs, sometimes writing an iframe is more reliable in WebViews
    if (url.startsWith('data:')) {
      newWindow.document.write(
        `<html><body style="margin:0;"><iframe width="100%" height="100%" frameborder="0" src="${url}"></iframe></body></html>`
      );
    } else {
      newWindow.location.href = url;
    }
  } else {
    // Fallback if window.open is blocked
    window.location.href = url;
  }
}

/**
 * Helper to trigger a traditional anchor-based download.
 */
function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
