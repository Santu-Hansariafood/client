import { useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import Cropper from "react-easy-crop";
import {
  MdCheckCircle,
  MdCancel,
  MdDelete,
  MdEdit,
  MdZoomIn,
  MdZoomOut,
} from "react-icons/md";
import apiClient from "../../utils/apiClient/apiClient";

const A4_PORTRAIT_RATIO = 210 / 297;
const A4_LANDSCAPE_RATIO = 297 / 210;

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
  const pdfRef = useRef(null);

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
      onFileChange(response.data.url);
      setImageSrc("");
      setFileName("");
      setShowUploader(false);
      setIsPdf(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
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
      }
    }
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

  return (
    <div className="mb-6 w-full max-w-2xl mx-auto bg-white/80 rounded-2xl shadow-lg p-6 border border-gray-100">
      <label className="block text-base font-semibold text-gray-700 mb-3">
        {label}
      </label>

      {currentUrl && !showUploader && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 truncate"
            >
              View Document
            </a>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviewZoomOut}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-150"
              >
                <MdZoomOut size={18} />
              </button>
              <span className="text-sm font-medium text-gray-600 w-16 text-center">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                onClick={handlePreviewZoomIn}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-150"
              >
                <MdZoomIn size={18} />
              </button>
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold shadow hover:bg-amber-600 transition-all duration-150"
              >
                <MdEdit size={16} className="mr-1" /> Edit
              </button>
              <button
                onClick={handleRemove}
                className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold shadow hover:bg-red-600 transition-all duration-150"
              >
                <MdDelete size={16} className="mr-1" /> Remove
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-4 flex justify-center">
            {currentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={currentUrl}
                alt="Document preview"
                className="max-w-full max-h-96 object-contain transition-transform duration-200"
                style={{ transform: `scale(${previewZoom})` }}
              />
            ) : (
              <iframe
                src={currentUrl}
                className="w-full h-96"
                title="Document Preview"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70 shadow-sm transition-all duration-200 mb-4"
          />

          {imageSrc && !isPdf && (
            <>
              <div className="relative w-full h-80 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl overflow-hidden shadow-inner border border-blue-100">
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
                  <label className="text-sm text-gray-700 font-medium">
                    Zoom:
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-48 accent-blue-500 h-2 rounded-lg appearance-none bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-sm text-gray-600 w-12 text-center font-medium">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleOrientation}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold shadow hover:bg-blue-600 transition-all duration-150"
                  >
                    {aspect === A4_PORTRAIT_RATIO ? "Landscape" : "Portrait"}{" "}
                    (A4)
                  </button>
                  <button
                    onClick={() => setCrop({ x: 0, y: 0 })}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-semibold shadow hover:bg-gray-600 transition-all duration-150"
                  >
                    Reset Position
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-4">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg font-semibold shadow hover:bg-green-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
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
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-4 mb-4">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2 font-medium">{fileName}</p>
                  <p className="text-sm text-gray-500">
                    PDF selected. Click Save & Upload to continue.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg font-semibold shadow hover:bg-green-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
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
