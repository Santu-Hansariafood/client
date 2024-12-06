import { useRef, useState } from "react";
import PropTypes from "prop-types";
import useIntersectionObserver from "../../utils/useIntersectionObserver/useIntersectionObserver";

const LazyImage = ({ src, alt, placeholder, className, ...rest }) => {
  const imgRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isIntersecting = useIntersectionObserver(imgRef, { threshold: 0.1 });

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ position: "relative" }}
    >
      {!imageLoaded && placeholder && (
        <img
          src={placeholder}
          alt="Placeholder"
          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-50"
        />
      )}

      {isIntersecting && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          {...rest}
        />
      )}
    </div>
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

export default LazyImage;
