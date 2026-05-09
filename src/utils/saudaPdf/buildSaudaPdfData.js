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

  const findBestMatch = (dataList, key, nameField) => {
    if (!key) return null;
    const normalizedKey = normalizeText(key);
    
    // 1. Try exact ID match
    const byId = dataList.find(d => d._id && String(d._id) === String(key));
    if (byId) return byId;

    // 2. Try exact Name match
    const exactName = dataList.find(d => normalizeText(d[nameField]) === normalizedKey);
    if (exactName) return exactName;

    // 3. Try fuzzy match (if key contains the name or vice versa)
    // This handles "Company Name - Branch" matching with "Company Name"
    const fuzzyMatch = dataList.find(d => {
      const dName = normalizeText(d[nameField]);
      return dName && (normalizedKey.startsWith(dName) || dName.startsWith(normalizedKey));
    });
    return fuzzyMatch || null;
  };

  const matchingConsignee = findBestMatch(consigneeData, normalizedConsigneeKey, 'name') || 
                           findBestMatch(consigneeData, normalizedConsigneeKey, 'label');

  const matchingSupplier = findBestMatch(supplierData, item?.supplierCompany, 'companyName');

  const rawBuyerKey = item?.buyerCompany ?? item?.buyer ?? "";
  
  const matchingBuyer = 
    findBestMatch(companyData, rawBuyerKey, 'companyName') ||
    findBestMatch(buyerData, rawBuyerKey, 'companyName') ||
    findBestMatch(supplierData, rawBuyerKey, 'companyName');

  const resolvedConsigneeName =
    typeof getConsigneeDisplay === "function"
      ? getConsigneeDisplay(item)
      : normalizedConsigneeKey || item?.consignee || "N/A";

  const isSpecialConsignee = 
    normalizeText(resolvedConsigneeName).includes("self order") || 
    normalizeText(resolvedConsigneeName).includes("purchase order");

  const isId = (val) => /^[0-9a-fA-F]{24}$/.test(String(val));
  const itemBuyerName = typeof item?.buyerCompany === "string" && !isId(item.buyerCompany) 
    ? item.buyerCompany 
    : typeof item?.buyer === "string" && !isId(item.buyer)
      ? item.buyer
      : "";

  const finalBuyerName = itemBuyerName || matchingBuyer?.companyName || "N/A";
  const finalBuyerDetails = toUnifiedDetails(matchingBuyer);
  
  // Try to find consignee details from matching data, or fallback to item's own details if available
  const itemConsigneeDetails = item?.consigneeDetails ? toConsigneeDetails(item.consigneeDetails) : null;
  const finalConsigneeDetails = 
    toConsigneeDetails(matchingConsignee) || 
    (isSpecialConsignee ? toConsigneeDetails(matchingBuyer) : itemConsigneeDetails);

  const billToConsignee = String(item?.billTo || "").toLowerCase() === "consignee";

  let transformed = {
    ...item,
    consignee: resolvedConsigneeName,
    consigneeDetails: finalConsigneeDetails,
    supplierDetails: toUnifiedDetails(matchingSupplier),
    buyerDetails: billToConsignee ? finalConsigneeDetails : finalBuyerDetails,
    originalBuyerDetails: finalBuyerDetails,
    originalBuyerCompany: finalBuyerName,
    billTo: item?.billTo || ""
  };

  if (billToConsignee) {
    transformed.buyer = resolvedConsigneeName;
    transformed.buyerCompany = resolvedConsigneeName;
    // CRITICAL FIX: Ensure buyerDetails uses the consignee's specific details 
    // instead of falling back to the main company details
    transformed.buyerDetails = finalConsigneeDetails;
  } else {
    transformed.buyer = finalBuyerName;
    transformed.buyerCompany = finalBuyerName;
    transformed.buyerDetails = finalBuyerDetails;
  }

  // Final fallback: If buyerDetails is still empty but we have originalBuyerDetails, use it
  // ONLY if billTo is not consignee. If billTo is consignee, we should respect that even if details are sparse.
  if (!transformed.buyerDetails && !billToConsignee && transformed.originalBuyerDetails) {
    transformed.buyerDetails = transformed.originalBuyerDetails;
  }

  // If billTo is consignee and we still don't have details, try matching buyer details as a last resort 
  // ONLY if the names are similar (e.g. branch of same company)
  if (billToConsignee && !transformed.buyerDetails && transformed.originalBuyerDetails) {
    const bName = normalizeText(transformed.originalBuyerCompany);
    const cName = normalizeText(transformed.consignee);
    if (cName.startsWith(bName) || bName.startsWith(cName)) {
      transformed.buyerDetails = transformed.originalBuyerDetails;
    }
  }

  return transformed;
};
