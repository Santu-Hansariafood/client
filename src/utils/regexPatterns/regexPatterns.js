const regexPatterns = {
  name: /^[a-zA-Z\s]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  mobile: /^(?:\+91|0)?[6-9]\d{9}$/,
  gstNo: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/i,
  panNo: /^[A-Z]{5}\d{4}[A-Z]$/i,
  ifscCode: /^[A-Z]{4}0\w{7}$/,
  aadhaarNo: /^[2-9]{1}\d{3}\s\d{4}\s\d{4}$/,
};

export default regexPatterns;
