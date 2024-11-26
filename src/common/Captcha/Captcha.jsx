import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  AiOutlineReload,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
} from "react-icons/ai";

const generateCaptcha = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!~`@#$%^&*(){}[]_-+=";
  const captchaText = Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");

  const colors = [
    "#1F2937",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
  ];
  const backgroundColors = [
    "#F3F4F6",
    "#E5E7EB",
    "#D1D5DB",
    "#9CA3AF",
    "#6B7280",
    "#4B5563",
  ];
  const backgroundColor =
    backgroundColors[Math.floor(Math.random() * backgroundColors.length)];

  const svgCaptcha = `
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50">
      <rect width="150" height="50" fill="${backgroundColor}" />
      ${captchaText
        .split("")
        .map(
          (char, index) => `
        <!-- Shadow Layers -->
        <text
          x="${10 + index * 20}"
          y="35"
          font-family="Arial"
          font-size="24"
          fill="rgba(0, 0, 0, 0.3)"
          dx="2" dy="2"
          transform="rotate(${Math.random() * 15 - 7}, ${10 + index * 20}, 35)"
        >
          ${char}
        </text>
        <text
          x="${10 + index * 20}"
          y="35"
          font-family="Arial"
          font-size="24"
          fill="rgba(0, 0, 0, 0.2)"
          dx="1" dy="1"
          transform="rotate(${Math.random() * 15 - 7}, ${10 + index * 20}, 35)"
        >
          ${char}
        </text>
        <!-- Main Text -->
        <text
          x="${10 + index * 20}"
          y="35"
          font-family="Arial"
          font-size="24"
          fill="${colors[index % colors.length]}"
          transform="rotate(${Math.random() * 15 - 7}, ${10 + index * 20}, 35)"
        >
          ${char}
        </text>`
        )
        .join("")}
    </svg>`;
  return {
    text: captchaText,
    image: `data:image/svg+xml;base64,${btoa(svgCaptcha)}`,
  };
};

const Captcha = ({ onValidate }) => {
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [isValid, setIsValid] = useState(null);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setIsValid(null);
  };

  useEffect(() => {
    if (captchaInput) {
      const isValidCaptcha = captchaInput === captcha.text;
      setIsValid(isValidCaptcha);
      onValidate(isValidCaptcha);
    } else {
      setIsValid(null);
    }
  }, [captchaInput, captcha.text, onValidate]);

  return (
    <div className="flex items-center gap-4">
      <img
        src={captcha.image}
        alt="captcha"
        className="block w-36 h-12 rounded-md shadow-md select-none"
        style={{ userSelect: "none" }}
      />

      <AiOutlineReload
        size={24}
        className="text-blue-500 cursor-pointer"
        onClick={refreshCaptcha}
        title="Refresh CAPTCHA"
      />
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={captchaInput}
          onChange={(e) => setCaptchaInput(e.target.value)}
          placeholder="Enter CAPTCHA"
          maxLength={6}
          minLength={6}
          className="p-2 w-40 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:border-blue-500"
        />
        {isValid === true && (
          <AiOutlineCheckCircle
            size={24}
            className="text-green-500"
            title="Valid CAPTCHA"
          />
        )}
        {isValid === false && (
          <AiOutlineCloseCircle
            size={24}
            className="text-red-500"
            title="Invalid CAPTCHA"
          />
        )}
      </div>
    </div>
  );
};

Captcha.propTypes = {
  onValidate: PropTypes.func.isRequired,
};

export default Captcha;
