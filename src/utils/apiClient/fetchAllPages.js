import axios from "axios";

const toItemsArray = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};

const toPositiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const fetchAllPages = async (
  url,
  { params = {}, limit = 200, maxPages = 100, signal } = {},
) => {
  const allItems = [];
  let page = 1;

  while (page <= maxPages) {
    const response = await axios.get(url, {
      params: { ...params, page, limit },
      signal,
    });
    const payload = response?.data;
    const pageItems = toItemsArray(payload);

    allItems.push(...pageItems);

    const totalPages = toPositiveNumber(payload?.totalPages);
    const totalItems = toPositiveNumber(payload?.total);

    if (totalPages && page >= totalPages) break;
    if (totalItems && allItems.length >= totalItems) break;

    if (pageItems.length === 0) break;

    page += 1;
  }

  return allItems;
};
