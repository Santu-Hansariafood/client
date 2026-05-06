import api from "../../../../utils/apiClient/apiClient";
import { normalizeLoose, isObjectId } from "./pdfUtils";

export const safeFetch = async (url) => {
  try {
    const res = await api.get(url);
    return res.data?.data || res.data || [];
  } catch {
    return [];
  }
};

export const safeGet = async (url) => {
  try {
    const res = await api.get(url);
    return res.data?.data || res.data || null;
  } catch {
    return null;
  }
};

export const fetchConsigneePages = async ({ search = "" } = {}) => {
  const limit = 200;
  const maxPages = 100;
  const rows = [];
  const seenIds = new Set();

  for (let page = 1; page <= maxPages; page += 1) {
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) query.set("search", search);

      const res = await api.get(`/consignees?${query.toString()}`);
      const payload = res.data || {};
      const pageRows = Array.isArray(payload?.data) ? payload.data : [];

      pageRows.forEach((row) => {
        const rowId = String(row?._id || "");
        const dedupeKey = rowId || JSON.stringify(row);
        if (seenIds.has(dedupeKey)) return;
        seenIds.add(dedupeKey);
        rows.push(row);
      });

      const pages = Number(payload?.pages || 0);
      if (pages && page >= pages) break;
      if (pageRows.length === 0 || pageRows.length < limit) break;
    } catch {
      break;
    }
  }

  return rows;
};

let allConsigneeRowsPromise = null;
export const getAllConsigneeRows = async () => {
  if (!allConsigneeRowsPromise) {
    allConsigneeRowsPromise = fetchConsigneePages();
  }
  return allConsigneeRowsPromise;
};

export const fetchConsigneeById = async (id) => {
  if (!isObjectId(id)) return null;
  const direct = await safeGet(`/consignees/${id}`);
  if (direct && typeof direct === "object") return direct;

  const allRows = await getAllConsigneeRows();
  return (
    allRows.find((consignee) => String(consignee?._id) === String(id)) ||
    null
  );
};

export const fetchConsigneeBySearch = async (key) => {
  if (!key) return null;

  const searchedRows = await fetchConsigneePages({ search: key });
  const searchedMatch = pickBestConsigneeMatch(searchedRows, key);
  if (searchedMatch) return searchedMatch;

  const allRows = await getAllConsigneeRows();
  return pickBestConsigneeMatch(allRows, key);
};

export const pickBestConsigneeMatch = (rows, key) => {
  const needle = normalizeLoose(key);
  if (!needle) return null;
  const needleTokens = new Set(needle.split(" ").filter(Boolean));
  let best = null;
  let bestScore = -1;
  for (const row of rows || []) {
    const hay = normalizeLoose(row?.name);
    if (!hay) continue;
    let score = 0;
    if (hay === needle) score = 100;
    else if (hay.includes(needle) || needle.includes(hay)) score = 85;
    else {
      const hayTokens = hay.split(" ").filter(Boolean);
      const common = hayTokens.reduce(
        (acc, t) => acc + (needleTokens.has(t) ? 1 : 0),
        0,
      );
      score = (common / Math.max(1, needleTokens.size)) * 70;
    }
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return bestScore >= 40 ? best : null;
};
