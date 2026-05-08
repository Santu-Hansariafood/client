const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

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
    phone: entity.phone || entity.mobile || entity.phoneNumber || "",
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
    phone: entity.phone || entity.mobile || entity.phoneNumber || "",
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
    if (typeof c === "object")
      return (c.name || c.label || c.value || "").toString();
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
        normalizeText(supplier?.companyName) ===
        normalizeText(item?.supplierCompany),
    ) || null;

  const rawBuyerKey = item?.buyerCompany ?? item?.buyer ?? "";
  const normalizedBuyerKey = normalizeText(rawBuyerKey);

  const matchingBuyer =
    (companyData || []).find((company) => {
      const idMatch =
        company?._id &&
        rawBuyerKey &&
        String(company._id) === String(rawBuyerKey);
      const nameMatch =
        normalizeText(company?.companyName) === normalizedBuyerKey;
      return idMatch || nameMatch;
    }) ||
    (buyerData || []).find((buyer) => {
      const idMatch =
        buyer?._id && rawBuyerKey && String(buyer._id) === String(rawBuyerKey);
      const nameMatch =
        normalizeText(buyer?.companyName) === normalizedBuyerKey;
      return idMatch || nameMatch;
    }) ||
    (supplierData || []).find((supplier) => {
      const idMatch =
        supplier?._id &&
        rawBuyerKey &&
        String(supplier._id) === String(rawBuyerKey);
      const nameMatch =
        normalizeText(supplier?.companyName) === normalizedBuyerKey;
      return idMatch || nameMatch;
    }) ||
    null;

  const resolvedConsigneeName =
    typeof getConsigneeDisplay === "function"
      ? getConsigneeDisplay(item)
      : normalizedConsigneeKey || item?.consignee || "N/A";

  const isSpecialConsignee = 
    normalizeText(resolvedConsigneeName).includes("self order") || 
    normalizeText(resolvedConsigneeName).includes("purchase order");

  let consigneeDetails = toConsigneeDetails(matchingConsignee);
  let buyerDetails = item?.billTo === "consignee"
    ? toUnifiedDetails(matchingConsignee)
    : toUnifiedDetails(matchingBuyer);

  if (isSpecialConsignee) {
    consigneeDetails = toConsigneeDetails(matchingBuyer);
    if (item?.billTo === "consignee") {
      buyerDetails = toUnifiedDetails(matchingBuyer);
    }
  }

  const isId = (val) => /^[0-9a-fA-F]{24}$/.test(String(val));
  const itemBuyerName = typeof item?.buyerCompany === "string" && !isId(item.buyerCompany) 
    ? item.buyerCompany 
    : typeof item?.buyer === "string" && !isId(item.buyer)
      ? item.buyer
      : "";

  const finalBuyerName = itemBuyerName || matchingBuyer?.companyName || "N/A";

  let transformed = {
    ...item,
    consignee: resolvedConsigneeName,
    consigneeDetails,
    supplierDetails: toUnifiedDetails(matchingSupplier),
    buyerDetails,
    originalBuyerDetails: toUnifiedDetails(matchingBuyer),
    originalBuyerCompany: finalBuyerName
  };

  if (item?.billTo === "consignee") {
    transformed = {
      ...transformed,
      buyer: resolvedConsigneeName,
      buyerCompany: resolvedConsigneeName,
    };
  } else {
    transformed = {
      ...transformed,
      buyer: finalBuyerName,
      buyerCompany: finalBuyerName,
    };
  }

  return transformed;
};
