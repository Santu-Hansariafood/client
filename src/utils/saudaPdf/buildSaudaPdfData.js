const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const toUnifiedDetails = (entity) => {
  if (!entity) return null;
  const gstNo = entity.gstNo || entity.gst || entity.gstNumber || "";
  let panNo = entity.panNo || entity.pan || entity.panNumber || "";

  // Extract PAN from GST if missing
  if (!panNo && gstNo && gstNo.length >= 12 && gstNo !== "0") {
    panNo = gstNo.substring(2, 12).toUpperCase();
  }

  return {
    ...entity,
    address: entity.address || entity.location || "",
    gstNo,
    panNo,
    pinNo: entity.pinNo || entity.pin || entity.pinCode || "",
    msmeNo: entity.msmeNo || entity.mandiLicense || "",
    district: entity.district || "",
    state: entity.state || "",
    phone: entity.phone || entity.mobile || entity.phoneNumber || "",
  };
};

const toConsigneeDetails = (entity) => {
  if (!entity) return null;
  const gstNo = entity.gstNo || entity.gst || entity.gstNumber || "";
  let panNo = entity.panNo || entity.pan || entity.panNumber || "";

  // Extract PAN from GST if missing
  if (!panNo && gstNo && gstNo.length >= 12 && gstNo !== "0") {
    panNo = gstNo.substring(2, 12).toUpperCase();
  }

  return {
    ...entity,
    address: entity.address || entity.location || "",
    gstNo,
    panNo,
    pin: entity.pin || entity.pinNo || entity.pinCode || "",
    msmeNo: entity.msmeNo || entity.mandiLicense || "",
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
  commodityData = [],
  sellerProfileData = [],
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
    
    const byId = dataList.find(d => d._id && String(d._id) === String(key));
    if (byId) return byId;

    const exactName = dataList.find(d => normalizeText(d[nameField]) === normalizedKey);
    if (exactName) return exactName;

    const fuzzyMatch = dataList.find(d => {
      const dName = normalizeText(d[nameField]);
      return dName && (normalizedKey.startsWith(dName) || dName.startsWith(normalizedKey));
    });
    return fuzzyMatch || null;
  };

  const matchingConsignee = 
    findBestMatch(consigneeData, normalizedConsigneeKey, 'name') || 
    findBestMatch(consigneeData, normalizedConsigneeKey, 'label');

  const matchingSupplier = 
    findBestMatch(supplierData, item?.supplierCompany, 'companyName') ||
    findBestMatch(supplierData, item?.supplierCompany, 'name');

  const matchingCommodity = findBestMatch(commodityData, item?.commodity, 'name');

  const matchingSellerProfile = sellerProfileData.find(
    (seller) => String(seller._id) === String(item.supplier),
  );

  const rawBuyerKey = item?.buyerCompany ?? item?.buyer ?? "";
  
  const matchingBuyer = 
    findBestMatch(companyData, rawBuyerKey, 'companyName') ||
    findBestMatch(buyerData, rawBuyerKey, 'name') ||
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
    billTo: item?.billTo || "",
    hsnCode: matchingCommodity?.hsnCode || "",
    sellerProfile: matchingSellerProfile,
  };

  // Ensure bank and GST details are present from profile if missing from company
  if (matchingSellerProfile) {
    if (!transformed.supplierDetails) {
      transformed.supplierDetails = {
        gstNo: matchingSellerProfile.gstNumber || "",
        bankDetails: [
          {
            bankName: matchingSellerProfile.bankName || "",
            ifscCode: matchingSellerProfile.ifscCode || "",
            accountNumber: "", // Seller model is missing accountNumber
            accountHolderName: matchingSellerProfile.sellerName || "",
          },
        ],
      };
    } else {
      // Fallback for missing fields in existing supplierDetails
      if (!transformed.supplierDetails.gstNo) {
        transformed.supplierDetails.gstNo = matchingSellerProfile.gstNumber || "";
      }

      if (!transformed.supplierDetails.bankDetails?.length) {
        transformed.supplierDetails.bankDetails = [
          {
            bankName: matchingSellerProfile.bankName || "",
            ifscCode: matchingSellerProfile.ifscCode || "",
            accountNumber: "",
            accountHolderName: matchingSellerProfile.sellerName || "",
          },
        ];
      }
    }
  }

  // Ensure fields are not "N/A" if we have partial info
  if (transformed.supplierDetails?.bankDetails?.[0]) {
    const b = transformed.supplierDetails.bankDetails[0];
    if (b.accountNumber === "N/A") b.accountNumber = "";
  }

  if (billToConsignee) {
    transformed.buyer = resolvedConsigneeName;
    transformed.buyerCompany = resolvedConsigneeName;
    transformed.buyerDetails = finalConsigneeDetails;
  } else {
    transformed.buyer = finalBuyerName;
    transformed.buyerCompany = finalBuyerName;
    transformed.buyerDetails = finalBuyerDetails;
  }

  if (!transformed.buyerDetails && !billToConsignee && transformed.originalBuyerDetails) {
    transformed.buyerDetails = transformed.originalBuyerDetails;
  }

  if (billToConsignee && !transformed.buyerDetails && transformed.originalBuyerDetails) {
    const bName = normalizeText(transformed.originalBuyerCompany);
    const cName = normalizeText(transformed.consignee);
    if (cName.startsWith(bName) || bName.startsWith(cName)) {
      transformed.buyerDetails = transformed.originalBuyerDetails;
    }
  }

  return transformed;
};
