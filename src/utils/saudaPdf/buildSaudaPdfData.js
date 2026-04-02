const normalizeText = (value) => String(value || "").trim().toLowerCase();

const toUnifiedDetails = (entity) => {
  if (!entity) return null;
  return {
    ...entity,
    address: entity.address || entity.location || "",
    gstNo: entity.gstNo || entity.gst || entity.gstNumber || "",
    panNo: entity.panNo || entity.pan || entity.panNumber || "",
    pinNo: entity.pinNo || entity.pin || entity.pinCode || "",
    district: entity.district || "",
    state: entity.state || "",
  };
};

const toConsigneeDetails = (entity) => {
  if (!entity) return null;
  return {
    ...entity,
    address: entity.address || entity.location || "",
    gstNo: entity.gstNo || entity.gst || entity.gstNumber || "",
    panNo: entity.panNo || entity.pan || entity.panNumber || "",
    pin: entity.pin || entity.pinNo || entity.pinCode || "",
    district: entity.district || "",
    state: entity.state || "",
  };
};

export const buildSaudaPdfData = ({
  item,
  consigneeData = [],
  supplierData = [],
  buyerData = [],
  companyData = [],
  getConsigneeDisplay,
}) => {
  const normalizedConsigneeKey = (() => {
    const c = item?.consignee;
    if (!c) return "";
    if (typeof c === "object") return (c.name || c.label || c.value || "").toString();
    return String(c);
  })();

  const matchingConsignee =
    (consigneeData || []).find((consignee) => {
      const idMatch =
        consignee?._id &&
        normalizedConsigneeKey &&
        String(consignee._id) === String(normalizedConsigneeKey);
      if (idMatch) return true;
      return (
        normalizeText(consignee?.name || consignee?.label) ===
        normalizeText(normalizedConsigneeKey)
      );
    }) || null;

  const matchingSupplier =
    (supplierData || []).find(
      (supplier) =>
        normalizeText(supplier?.companyName) === normalizeText(item?.supplierCompany),
    ) || null;

  const rawBuyerKey = item?.buyerCompany ?? item?.buyer ?? "";
  const normalizedBuyerKey = normalizeText(rawBuyerKey);

  const matchingBuyer =
    (companyData || []).find((company) => {
      const idMatch =
        company?._id && rawBuyerKey && String(company._id) === String(rawBuyerKey);
      const nameMatch = normalizeText(company?.companyName) === normalizedBuyerKey;
      return idMatch || nameMatch;
    }) ||
    (buyerData || []).find((buyer) => {
      const idMatch = buyer?._id && rawBuyerKey && String(buyer._id) === String(rawBuyerKey);
      const nameMatch = normalizeText(buyer?.companyName) === normalizedBuyerKey;
      return idMatch || nameMatch;
    }) ||
    (supplierData || []).find((supplier) => {
      const idMatch =
        supplier?._id && rawBuyerKey && String(supplier._id) === String(rawBuyerKey);
      const nameMatch = normalizeText(supplier?.companyName) === normalizedBuyerKey;
      return idMatch || nameMatch;
    }) ||
    null;

  const resolvedConsigneeName =
    typeof getConsigneeDisplay === "function"
      ? getConsigneeDisplay(item)
      : normalizedConsigneeKey || item?.consignee || "N/A";

  let transformed = {
    ...item,
    consignee: resolvedConsigneeName,
    consigneeDetails: toConsigneeDetails(matchingConsignee),
    supplierDetails: toUnifiedDetails(matchingSupplier),
    buyerDetails:
      item?.billTo === "consignee"
        ? toUnifiedDetails(matchingConsignee)
        : toUnifiedDetails(matchingBuyer),
  };

  if (item?.billTo === "consignee") {
    transformed = {
      ...transformed,
      buyer: resolvedConsigneeName,
      buyerCompany: resolvedConsigneeName,
    };
  } else {
    const buyerName =
      matchingBuyer?.companyName ||
      (typeof item?.buyerCompany === "string" ? item.buyerCompany : "") ||
      (typeof item?.buyer === "string" ? item.buyer : "");
    transformed = {
      ...transformed,
      buyer: buyerName,
      buyerCompany: buyerName,
    };
  }

  return transformed;
};

