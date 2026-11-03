export const getCurrentFinancialYear = (date = new Date()) =>
  date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;

export const formatFinancialYear = (startYear) =>
  `${startYear}-${String(startYear + 1).slice(-2)}`;
