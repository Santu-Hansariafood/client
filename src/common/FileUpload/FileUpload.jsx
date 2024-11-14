import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Cropper from "react-easy-crop";
import { MdCheckCircle, MdCancel } from "react-icons/md";

const FileUpload = ({ label, accept, onFileChange, minWidth, minHeight }) => {
  const [file, setFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [fileName, setFileName] = useState("");
  const [imageSrc, setImageSrc] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
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
    } else {
      alert(`Minimum size required is ${minWidth}x${minHeight}px.`);
    }
  };

  const cancelCrop = () => {
    setFile(null);
    setImageSrc("");
    setCroppedAreaPixels(null);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
      />
      {imageSrc && (
        <div className="relative w-full h-64 bg-gray-200">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={minWidth / minHeight}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}
      {imageSrc && (
        <div className="flex justify-end mt-2 space-x-4">
          <button
            onClick={validateAndUpload}
            className="text-green-500 hover:text-green-700 flex items-center"
            title="Confirm Crop"
          >
            <MdCheckCircle size={24} className="mr-1" /> Save
          </button>
          <button
            onClick={cancelCrop}
            className="text-red-500 hover:text-red-700 flex items-center"
            title="Cancel Crop"
          >
            <MdCancel size={24} className="mr-1" /> Cancel
          </button>
        </div>
      )}
      {fileName && !imageSrc && (
        <span className="text-sm text-gray-500">{fileName}</span>
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
