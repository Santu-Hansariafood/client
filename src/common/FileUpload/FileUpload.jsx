import { useState, useCallback, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import Cropper from "react-easy-crop";
import {
  MdCheckCircle,
  MdCancel,
  MdDelete,
  MdEdit,
  MdZoomIn,
  MdZoomOut,
  MdPrint,
  MdCloudOff,
  MdCloudDone,
} from "react-icons/md";
import apiClient from "../../utils/apiClient/apiClient";
import { extractUploadUrl } from "../../utils/saudaPdf/resolveUploadUrl";

const A4_PORTRAIT_RATIO = 210 / 297;
const A4_LANDSCAPE_RATIO = 297 / 210;

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?(#.*)?$/i;
const PDF_EXT_RE = /\.pdf(\?.*)?(#.*)?$/i;
const isImageUrl = (url) => IMAGE_EXT_RE.test(url || "");
const isPdfUrl = (url) =>
  PDF_EXT_RE.test(url || "") || /^data:application\/pdf/i.test(url || "");
const toAbsoluteUrl = (url) => {
  if (!url || typeof url !== "string") return url || "";
  if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^blob:/i.test(url)) return url;
  try {
    const origin = (typeof window !== "undefined" && window.location && window.location.origin) || "";
    if (!origin) return url;
    const pathname = url.startsWith("/") ? url : `/${url}`;
    return `${origin}${pathname}`;
  } catch {
    return url;
  }
};
const isCdnUrl = (url) => /^https?:\/\//i.test(url || "") && /imagekit\.io|ik\.imagekit|cloudinary|s3\.amazonaws/i.test(url || "");

const FileUpload = ({
  label,
  accept,
  onFileChange,
  onFileRemove,
  currentUrl,
}) => {
  const [file, setFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(A4_PORTRAIT_RATIO);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [fileName, setFileName] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [showUploader, setShowUploader] = useState(!currentUrl);
  const [uploading, setUploading] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isPdf, setIsPdf] = useState(false);
  const [isLocalStored, setIsLocalStored] = useState(false);
  const pdfRef = useRef(null);
  const suppressNextPropSyncRef = useRef(false);

  useEffect(() => {
    if (suppressNextPropSyncRef.current) {
      suppressNextPropSyncRef.current = false;
      return;
    }
    setShowUploader(!currentUrl);
    setFile(null);
    setImageSrc("");
    setCroppedAreaPixels(null);
    setIsPdf(isPdfUrl(currentUrl));
    setFileName("");
    setIsLocalStored(!!currentUrl && !isCdnUrl(currentUrl) && !/^data:/i.test(currentUrl));
  }, [currentUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setIsPdf(true);
        setFileName(file.name);
        setFile(file);
        setImageSrc("");
      } else {
        setIsPdf(false);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          setImageSrc(reader.result);
          setFileName(file.name);
          setFile(file);
        };
      }
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUpload = async () => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post("/uploads", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const rawUrl = extractUploadUrl(response?.data) || response?.data?.url;
      if (!rawUrl) {
        throw new Error("Upload succeeded but no URL was returned.");
      }
      const resolvedUrl = toAbsoluteUrl(rawUrl);
      const isLocalFallback = !!response?.data?.isLocal || !!response?.data?.warning || !isCdnUrl(resolvedUrl);
      suppressNextPropSyncRef.current = true;
      onFileChange(resolvedUrl);
      setIsLocalStored(isLocalFallback && !/^data:/i.test(resolvedUrl));
      setIsPdf(isPdfUrl(resolvedUrl));
      setImageSrc("");
      setFileName("");
      setFile(null);
      setShowUploader(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        error?.message && error.message.toLowerCase().includes("url")
          ? error.message
          : "Failed to upload file. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (currentUrl) {
      try {
        await apiClient.delete("/uploads", { data: { url: currentUrl } });
        onFileRemove && onFileRemove();
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete file. Please try again.");
        return;
      }
    }
    setShowUploader(true);
    setFile(null);
    setImageSrc("");
    setCroppedAreaPixels(null);
    setIsPdf(false);
    setFileName("");
  };

  const cancelCrop = () => {
    setFile(null);
    setImageSrc("");
    setCroppedAreaPixels(null);
    setIsPdf(false);
  };

  const toggleOrientation = () => {
    setAspect(
      aspect === A4_PORTRAIT_RATIO ? A4_LANDSCAPE_RATIO : A4_PORTRAIT_RATIO,
    );
  };

  const handlePreviewZoomIn = () => {
    setPreviewZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handlePreviewZoomOut = () => {
    setPreviewZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handlePrintPdf = () => {
    const absUrl = toAbsoluteUrl(currentUrl);
    const w = window.open(absUrl, "_blank", "noopener,noreferrer");
    if (w) {
      const tryPrint = () => {
        try {
          w.focus();
          w.print && w.print();
        } catch {
          /* cross-origin or not loaded, leave to user to print manually */
        }
      };
      setTimeout(tryPrint, 1200);
    }
  };

  return (
    <div className="mb-6 w-full max-w-2xl mx-auto bg-lux-cream/80 rounded-2xl shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] p-6 border border-[#e9e2d3]">
      <div className="flex items-start justify-between mb-3 gap-3">
        <label className="block text-base font-semibold font-serif text-lux-ink">
          {label}
        </label>
        {currentUrl && !showUploader && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLocalStored ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-lux-gold/10 text-[#a3873f] border border-[#e6dcc4]"
                title="Stored locally on this server. Re-upload once ImageKit auth is fixed to get a permanent CDN link."
              >
                <MdCloudOff size={14} /> Local
              </span>
            ) : isCdnUrl(currentUrl) ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-lux-emerald/10 text-lux-emerald border border-lux-emerald/20"
                title="Stored on ImageKit CDN — URL works across all devices and won't expire."
              >
                <MdCloudDone size={14} /> ImageKit
              </span>
            ) : null}
          </div>
        )}
      </div>

      {currentUrl && !showUploader && (
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <a
              href={toAbsoluteUrl(currentUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-lux-emerald hover:text-lux-deep truncate max-w-[60%]"
              title={toAbsoluteUrl(currentUrl)}
            >
              View Document
            </a>
            <div className="flex items-center gap-2 flex-wrap">
              {isPdfUrl(currentUrl) && (
                <button
                  onClick={handlePrintPdf}
                  className="flex items-center px-3 py-2 bg-gradient-to-br from-lux-emerald to-lux-deep text-white rounded-lg text-xs font-semibold shadow hover:from-lux-deep hover:to-lux-deep transition-all duration-150"
                  type="button"
                >
                  <MdPrint size={16} className="mr-1" /> Print
                </button>
              )}
              <button
                onClick={handlePreviewZoomOut}
                className="p-2 bg-lux-ivory rounded-lg hover:bg-[#f2eee2] text-lux-ink transition-all duration-150"
                type="button"
              >
                <MdZoomOut size={18} />
              </button>
              <span className="text-sm font-medium text-lux-muted w-16 text-center">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                onClick={handlePreviewZoomIn}
                className="p-2 bg-lux-ivory rounded-lg hover:bg-[#f2eee2] text-lux-ink transition-all duration-150"
                type="button"
              >
                <MdZoomIn size={18} />
              </button>
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center px-3 py-2 bg-lux-emerald text-white rounded-lg text-xs font-semibold shadow hover:bg-lux-deep transition-all duration-150"
                type="button"
              >
                <MdEdit size={16} className="mr-1" /> Edit
              </button>
              <button
                onClick={handleRemove}
                className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold shadow hover:bg-red-600 transition-all duration-150"
                type="button"
              >
                <MdDelete size={16} className="mr-1" /> Remove
              </button>
            </div>
          </div>

          {isPdfUrl(currentUrl) && (
            <div className="mb-3 text-xs text-lux-muted bg-lux-ivory border border-[#e9e2d3] rounded-lg px-3 py-2 flex items-start gap-2">
              <MdPrint size={16} className="mt-0.5 text-lux-emerald flex-shrink-0" />
              <span>
                If preview below appears blank, click{" "}
                <a
                  href={toAbsoluteUrl(currentUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-lux-emerald underline"
                >
                  here to open the PDF in a new tab
                </a>{" "}
                or use the Print button above.
              </span>
            </div>
          )}

          <div className="border border-[#e9e2d3] rounded-xl overflow-hidden bg-lux-ivory p-4 flex justify-center">
            {isImageUrl(currentUrl) ? (
              <a
                href={toAbsoluteUrl(currentUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block max-w-full max-h-96"
              >
                <img
                  src={toAbsoluteUrl(currentUrl)}
                  alt="Document preview"
                  className="max-w-full max-h-96 object-contain transition-transform duration-200"
                  style={{ transform: `scale(${previewZoom})` }}
                  crossOrigin="anonymous"
                />
              </a>
            ) : (
              <iframe
                ref={pdfRef}
                src={toAbsoluteUrl(currentUrl)}
                className="w-full h-96"
                title="Document Preview"
                onError={(e) => {
                  console.warn("PDF iframe failed to load — opening via new tab fallback", currentUrl);
                }}
              />
            )}
          </div>
        </div>
      )}

      {showUploader && (
        <>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="w-full px-4 py-3 border border-[#e6dcc4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/50 bg-lux-cream/70 shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] transition-all duration-200 mb-4"
          />

          {imageSrc && !isPdf && (
            <>
              <div className="relative w-full h-80 bg-gradient-to-br from-lux-cream to-lux-ivory rounded-xl overflow-hidden shadow-inner border border-[#e9e2d3]">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <label className="text-sm text-lux-ink font-medium">
                    Zoom:
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-48 accent-lux-emerald h-2 rounded-lg appearance-none bg-lux-ivory focus:outline-none focus:ring-2 focus:ring-lux-gold/50"
                  />
                  <span className="text-sm text-lux-muted w-12 text-center font-medium">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleOrientation}
                    className="px-4 py-2 bg-lux-emerald text-white rounded-lg text-sm font-semibold shadow hover:bg-lux-deep transition-all duration-150"
                  >
                    {aspect === A4_PORTRAIT_RATIO ? "Landscape" : "Portrait"}{" "}
                    (A4)
                  </button>
                  <button
                    onClick={() => setCrop({ x: 0, y: 0 })}
                    className="px-4 py-2 bg-lux-muted text-white rounded-lg text-sm font-semibold shadow hover:bg-lux-ink transition-all duration-150"
                  >
                    Reset Position
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-4">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center px-6 py-3 bg-gradient-to-br from-lux-emerald to-lux-deep text-white rounded-lg font-semibold shadow hover:from-lux-deep hover:to-lux-deep transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-lux-gold/50 disabled:opacity-50"
                >
                  <MdCheckCircle size={24} className="mr-2" />{" "}
                  {uploading ? "Uploading..." : "Save & Upload"}
                </button>
                <button
                  onClick={() => {
                    cancelCrop();
                    setShowUploader(!currentUrl);
                  }}
                  disabled={uploading}
                  className="flex items-center px-6 py-3 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                >
                  <MdCancel size={24} className="mr-2" /> Cancel
                </button>
              </div>
            </>
          )}

          {isPdf && file && (
            <>
              <div className="border border-[#e9e2d3] rounded-xl overflow-hidden bg-lux-ivory p-4 mb-4">
                <div className="text-center py-8">
                  <p className="text-lux-ink mb-2 font-medium">{fileName}</p>
                  <p className="text-sm text-lux-muted">
                    PDF selected. Click Save & Upload to continue.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center px-6 py-3 bg-gradient-to-br from-lux-emerald to-lux-deep text-white rounded-lg font-semibold shadow hover:from-lux-deep hover:to-lux-deep transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-lux-gold/50 disabled:opacity-50"
                >
                  <MdCheckCircle size={24} className="mr-2" />{" "}
                  {uploading ? "Uploading..." : "Save & Upload"}
                </button>
                <button
                  onClick={() => {
                    cancelCrop();
                    setShowUploader(!currentUrl);
                  }}
                  disabled={uploading}
                  className="flex items-center px-6 py-3 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                >
                  <MdCancel size={24} className="mr-2" /> Cancel
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  label: PropTypes.string.isRequired,
  accept: PropTypes.string,
  onFileChange: PropTypes.func.isRequired,
  onFileRemove: PropTypes.func,
  currentUrl: PropTypes.string,
  loading: PropTypes.bool,
};

export default FileUpload;
