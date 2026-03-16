import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Typewriter = ({ text, speed = 100, className = "", delay = 0 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timeout;
    
    if (index < text.length) {
      const waitTime = (index === 0 && delay > 0) ? delay : speed;
      timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, waitTime);
    }

    return () => clearTimeout(timeout);
  }, [index, text, speed, delay]);

  return <span className={className}>{displayedText}</span>;
};

Typewriter.propTypes = {
  text: PropTypes.string.isRequired,
  speed: PropTypes.number,
  className: PropTypes.string,
  delay: PropTypes.number,
};

export default Typewriter;
