const regexPatterns = {
  name: /^[a-zA-Z\s]+$/,
  email: /^[\w.%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  mobile: /^[6-9]\d{9}$/,
  gstNo: /^\d{2}[A-Z]{5}\d{4}[A-Z]\w{1}Z\w{1}$/,
  panNo: /^[A-Z]{5}\d{4}[A-Z]$/,
  ifscCode: /^[A-Z]{4}0\w{7}$/,
  aadhaarNo: /^[2-9]{1}\d{3}\s\d{4}\s\d{4}$/,
};

export default regexPatterns;