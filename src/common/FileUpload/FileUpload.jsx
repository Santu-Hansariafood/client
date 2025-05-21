import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Cropper from "react-easy-crop";
import { MdCheckCircle, MdCancel } from "react-icons/md";

const FileUpload = ({ label, accept, onFileChange, minWidth, minHeight }) => {
  const [file, setFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(minWidth / minHeight);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [fileName, setFileName] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [originalDimensions, setOriginalDimensions] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height });
        };
        setImageSrc(reader.result);
        setFileName(file.name);
        setFile(file);
      };
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const validateAndUpload = () => {
    const { width, height } = croppedAreaPixels || {};
    if (width >= minWidth && height >= minHeight) {
      onFileChange(file);
      setImageSrc("");
      setFileName("");
    } else {
      alert(`Minimum size required is ${minWidth}x${minHeight}px.`);
    }
  };

  const cancelCrop = () => {
    setFile(null);
    setImageSrc("");
    setCroppedAreaPixels(null);
  };

  const resetToOriginal = () => {
    if (originalDimensions) {
      const { width, height } = originalDimensions;
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspect(width / height);
      setCroppedAreaPixels({ width, height, x: 0, y: 0 });
    }
  };

  return (
    <div className="mb-6 w-full max-w-md mx-auto bg-white/80 rounded-2xl shadow-lg p-6 border border-gray-100">
      <label className="block text-base font-semibold text-gray-700 mb-3">
        {label}
      </label>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70 shadow-sm transition-all duration-200 mb-3"
      />
      {imageSrc && (
        <>
          <div className="relative w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl overflow-hidden shadow-inner border border-blue-100">
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
          <div className="flex flex-col md:flex-row justify-between items-center mt-3 gap-3">
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <label className="text-sm text-gray-700 font-medium">Zoom:</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-32 accent-blue-500 h-2 rounded-lg appearance-none bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAspect(4 / 3)}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-semibold shadow hover:bg-blue-600 transition-all duration-150"
              >
                4:3
              </button>
              <button
                onClick={() => setAspect(16 / 9)}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-semibold shadow hover:bg-blue-600 transition-all duration-150"
              >
                16:9
              </button>
              <button
                onClick={resetToOriginal}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-semibold shadow hover:bg-blue-600 transition-all duration-150"
              >
                Original
              </button>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-4">
            <button
              onClick={validateAndUpload}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow hover:bg-green-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-400"
              title="Confirm Crop"
            >
              <MdCheckCircle size={22} className="mr-1" /> Save
            </button>
            <button
              onClick={cancelCrop}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
              title="Cancel Crop"
            >
              <MdCancel size={22} className="mr-1" /> Cancel
            </button>
          </div>
        </>
      )}
      {fileName && !imageSrc && (
        <span className="text-sm text-gray-500 font-medium">{fileName}</span>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  label: PropTypes.string.isRequired,
  accept: PropTypes.string,
  onFileChange: PropTypes.func.isRequired,
  minWidth: PropTypes.number,
  minHeight: PropTypes.number,
};

export default FileUpload;
