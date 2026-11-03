export const calculateTotalAmount = (items) =>
  (Array.isArray(items) ? items : []).reduce(
    (totalCents, item) =>
      totalCents +
      Math.round(
        (Number(item.quantity ?? 1) || 0) *
          Math.round((Number(item.amount) || 0) * 100),
      ),
    0,
  ) / 100;

export const calculateLineTotal = (item) =>
  (
    Math.round(
      (Number(item.quantity ?? 1) || 0) *
        Math.round((Number(item.amount) || 0) * 100),
    ) / 100
  ).toFixed(2);
