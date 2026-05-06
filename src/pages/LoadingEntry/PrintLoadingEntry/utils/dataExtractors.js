import {
  normalizeText,
  normalizeLoose,
  firstNonEmpty,
  isObjectId,
} from "./pdfUtils";
import {
  safeGet,
  getAllConsigneeRows,
  fetchConsigneeById,
  fetchConsigneeBySearch,
  pickBestConsigneeMatch,
} from "./dataFetchers";

export const extractBuyerInfoFromSauda = (saudaData) => {
  if (!saudaData || typeof saudaData !== "object") return {};

  const buyerName =
    saudaData.buyerCompany ||
    saudaData.buyerName ||
    saudaData.partyName ||
    saudaData.customerName ||
    (saudaData.buyer && typeof saudaData.buyer === "object"
      ? saudaData.buyer.companyName || saudaData.buyer.name
      : null) ||
    null;

  const buyerAddress =
    saudaData.buyerAddress ||
    saudaData.deliveryAddress ||
    (saudaData.buyer && typeof saudaData.buyer === "object"
      ? saudaData.buyer.address
      : null) ||
    saudaData.partyAddress ||
    saudaData.customerAddress ||
    null;

  const buyerGst =
    saudaData.buyerGstNo ||
    saudaData.buyerGstNumber ||
    saudaData.buyerGst ||
    (saudaData.buyer && typeof saudaData.buyer === "object"
      ? saudaData.buyer.gstNo || saudaData.buyer.gstNumber
      : null) ||
    saudaData.partyGstNo ||
    saudaData.customerGstNo ||
    saudaData.gstNo ||
    null;

  const buyerPan =
    saudaData.buyerPanNo ||
    saudaData.buyerPanNumber ||
    saudaData.buyerPan ||
    (saudaData.buyer && typeof saudaData.buyer === "object"
      ? saudaData.buyer.panNo || saudaData.buyer.panNumber
      : null) ||
    saudaData.partyPanNo ||
    saudaData.customerPanNo ||
    saudaData.panNo ||
    null;

  const buyerState =
    saudaData.buyerState ||
    saudaData.deliveryState ||
    (saudaData.buyer && typeof saudaData.buyer === "object"
      ? saudaData.buyer.state
      : null) ||
    saudaData.partyState ||
    saudaData.customerState ||
    saudaData.state ||
    null;

  return {
    buyerName,
    buyerAddress,
    buyerGst,
    buyerPan,
    buyerState,
  };
};

export const shouldShowConsigneeInBuyerAccount = (saudaData) => {
  if (!saudaData) return false;

  if (saudaData.selectedPartyType === "consignee") return true;
  if (saudaData.selectedPartyType === "buyer") return false;

  const saudaBuyerInfo = extractBuyerInfoFromSauda(saudaData);
  const hasCompleteConsignee =
    saudaData.consignee &&
    (typeof saudaData.consignee === "object"
      ? saudaData.consignee.name || saudaData.consignee.companyName
      : true);

  const hasCompleteBuyer = saudaBuyerInfo.buyerName;

  if (hasCompleteConsignee && !hasCompleteBuyer) return true;

  if (hasCompleteConsignee && hasCompleteBuyer) {
    const consigneeName =
      typeof saudaData.consignee === "object"
        ? saudaData.consignee.name || saudaData.consignee.companyName
        : saudaData.consignee;

    if (
      consigneeName &&
      saudaBuyerInfo.buyerName &&
      normalizeText(consigneeName) === normalizeText(saudaBuyerInfo.buyerName)
    ) {
      return true;
    }
  }

  return false;
};

export const extractConsigneeId = (candidate) => {
  if (!candidate) return "";
  if (typeof candidate === "string") {
    return isObjectId(candidate) ? candidate.trim() : "";
  }
  if (typeof candidate !== "object") return "";
  const nestedValue = candidate.value;
  const direct =
    candidate._id ||
    candidate.id ||
    (typeof nestedValue === "string" ? nestedValue : "") ||
    (nestedValue && typeof nestedValue === "object"
      ? nestedValue._id || nestedValue.id || ""
      : "");
  return isObjectId(direct) ? String(direct) : "";
};

export const extractConsigneeTextValues = (candidate) => {
  if (!candidate) return [];

  if (typeof candidate === "string") {
    const text = candidate.trim();
    return text ? [text] : [];
  }

  if (typeof candidate !== "object") return [];

  const nestedValue = candidate.value;
  const values = [
    candidate.name,
    candidate.label,
    candidate.consigneeName,
    candidate.displayName,
    typeof nestedValue === "string" ? nestedValue : "",
    nestedValue && typeof nestedValue === "object" ? nestedValue.name : "",
    nestedValue && typeof nestedValue === "object" ? nestedValue.label : "",
    nestedValue && typeof nestedValue === "object"
      ? nestedValue.consigneeName
      : "",
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return Array.from(new Set(values));
};

export const isConsigneeAddressLike = (details) =>
  Boolean(
    details &&
      typeof details === "object" &&
      (details.address ||
        details.location ||
        details.district ||
        details.state ||
        details.pin ||
        details.pinNo ||
        details.pincode ||
        details.pinCode),
  );

export const pickBestShipToCandidate = (candidates) => {
  const list = (candidates || []).filter(Boolean);
  const withId = list.find((c) => Boolean(extractConsigneeId(c)));
  if (withId) return withId;
  const withAddress = list.find((c) => isConsigneeAddressLike(c));
  if (withAddress) return withAddress;
  return firstNonEmpty(...list);
};

export const deriveShipToSearchKey = (raw) => {
  if (!raw) return "";
  let text = "";
  if (typeof raw === "string") {
    text = raw;
  } else if (typeof raw === "object") {
    const nested = raw.value;
    text =
      raw.name ||
      raw.label ||
      raw.consigneeName ||
      (typeof nested === "string" ? nested : "") ||
      "";
  }
  text = String(text || "").trim();
  if (!text) return "";
  const beforeDash = text.split("-")[0]?.trim();
  return beforeDash || text;
};

export const findExactConsigneeMatch = (rows, candidate) => {
  const exactId = extractConsigneeId(candidate);
  if (exactId) {
    const byId = (rows || []).find(
      (row) => String(row?._id || row?.id || "") === String(exactId),
    );
    if (byId) return byId;
  }

  const exactTexts = new Set(
    extractConsigneeTextValues(candidate).map((value) => normalizeLoose(value)),
  );
  if (!exactTexts.size) return null;

  return (
    (rows || []).find((row) =>
      [
        row?.name,
        row?.label,
        row?.consigneeName,
        row?.displayName,
        row?.address,
      ]
        .map((value) => normalizeLoose(value))
        .some((value) => value && exactTexts.has(value)),
    ) || null
  );
};

export const resolveConsigneeDetails = async (candidates) => {
  const list = (Array.isArray(candidates) ? candidates : [candidates]).filter(
    Boolean,
  );

  for (const candidate of list) {
    const id = extractConsigneeId(candidate);
    if (!id) continue;
    const byId = await fetchConsigneeById(id);
    if (byId) return byId;
  }

  const allRows = await getAllConsigneeRows();
  for (const candidate of list) {
    const exactMatch = findExactConsigneeMatch(allRows, candidate);
    if (exactMatch) return exactMatch;
  }

  for (const candidate of list) {
    const searchKeys = extractConsigneeTextValues(candidate);
    for (const key of searchKeys) {
      const bySearch = await fetchConsigneeBySearch(key);
      if (bySearch) return bySearch;
    }
  }

  return null;
};
