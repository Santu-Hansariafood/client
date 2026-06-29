const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeBankDetails = (entity) => {
  const raw = entity?.bankDetails ?? entity?.bankDetail ?? entity?.bank ?? [];
  let list = [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    } catch {
      list = [];
    }
  } else if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    list = [raw];
  }

  return list
    .map((b) => ({
      accountHolderName: b?.accountHolderName || b?.holderName || "",
      accountNumber: b?.accountNumber || b?.accountNo || b?.accNo || "",
      ifscCode: b?.ifscCode || b?.ifsc || "",
      branchName: b?.branchName || b?.branch || "",
      bankName: b?.bankName || b?.bank || "",
    }))
    .filter(
      (b) =>
        String(b.accountHolderName || "").trim() ||
        String(b.accountNumber || "").trim() ||
        String(b.ifscCode || "").trim() ||
        String(b.bankName || "").trim(),
    );
};

export const toUnifiedDetails = (entity) => {
  if (!entity) return null;
  const gstNo = entity.gstNo || entity.gst || entity.gstNumber || "";
  let panNo = entity.panNo || entity.pan || entity.panNumber || "";

  // Extract PAN from GST if missing
  if (!panNo && gstNo && gstNo.length >= 12 && gstNo !== "0") {
    panNo = gstNo.substring(2, 12).toUpperCase();
  }

  const pinValue = entity.pinNo || entity.pin || entity.pinCode || "";

  return {
    ...entity,
    address: entity.address || entity.location || "",
    gstNo,
    panNo,
    bankDetails: normalizeBankDetails(entity),
    pinNo: pinValue,
    pin: pinValue,
    msmeNo: entity.msmeNo || entity.mandiLicense || "",
    district: entity.district || "",
    state: entity.state || "",
    phone: entity.phone || entity.mobile || entity.phoneNumber || "",
  };
};

export const toConsigneeDetails = (entity) => {
  if (!entity) return null;
  const gstNo = entity.gstNo || entity.gst || entity.gstNumber || "";
  let panNo = entity.panNo || entity.pan || entity.panNumber || "";

  // Extract PAN from GST if missing
  if (!panNo && gstNo && gstNo.length >= 12 && gstNo !== "0") {
    panNo = gstNo.substring(2, 12).toUpperCase();
  }

  const pinValue = entity.pin || entity.pinNo || entity.pinCode || "";

  return {
    ...entity,
    address: entity.address || entity.location || "",
    gstNo,
    panNo,
    pin: pinValue,
    pinNo: pinValue,
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
  qualityParameterData = [],
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
    
    // Handle if key is an object (like a populated Mongo ref)
    const searchKey = (typeof key === 'object' && key?._id) ? String(key._id) : String(key);
    const normalizedKey = normalizeText(searchKey);
    
    // 1. Match by ID
    const byId = dataList.find(d => d._id && String(d._id) === searchKey);
    if (byId) return byId;

    // 2. Match by exact name
    const exactName = dataList.find(d => normalizeText(d[nameField]) === normalizedKey);
    if (exactName) return exactName;

    // 3. Fuzzy match: starts with or is contained within
    const fuzzyMatch = dataList.find(d => {
      const dName = normalizeText(d[nameField]);
      if (!dName) return false;
      return normalizedKey.includes(dName) || dName.includes(normalizedKey);
    });
    return fuzzyMatch || null;
  };

  const resolveId = (value) => {
    if (!value) return "";
    if (typeof value === "object" && value?._id) return String(value._id);
    return String(value);
  };

  const isMongoId = (val) => /^[0-9a-fA-F]{24}$/.test(String(val || ""));

  const findCompanyById = (id) => {
    const resolved = resolveId(id);
    if (!resolved) return null;
    return companyData.find((c) => c?._id && String(c._id) === resolved) || null;
  };

  const matchingConsignee = 
    findBestMatch(consigneeData, item?.consignee, 'name') || 
    findBestMatch(consigneeData, item?.consignee, 'label');

  const supplierId = item?.supplier?._id || item?.supplier;
  const matchingSellerProfile = sellerProfileData.find(
    (seller) => String(seller._id) === String(supplierId),
  );

  const normalizedSupplierKey = (() => {
    const s = item?.supplierCompany;
    if (!s) return "";
    if (typeof s === "object")
      return (s.companyName || s.name || s.label || s.value || "").toString();
    return String(s);
  })();

  const findSupplierByCandidate = (candidate) =>
    findBestMatch(supplierData, candidate, "companyName") ||
    findBestMatch(supplierData, candidate, "name");

  const supplierCandidates = [
    normalizedSupplierKey,
    ...(Array.isArray(matchingSellerProfile?.companies)
      ? matchingSellerProfile.companies
      : []),
  ].filter(Boolean);

  const matchingSupplier = supplierCandidates.reduce((best, candidate) => {
    const found = findSupplierByCandidate(candidate);
    if (!found) return best;
    const foundHasAccount = normalizeBankDetails(found).some(
      (b) => String(b.accountNumber || "").trim(),
    );
    if (!best) return found;
    const bestHasAccount = normalizeBankDetails(best).some(
      (b) => String(b.accountNumber || "").trim(),
    );
    if (!bestHasAccount && foundHasAccount) return found;
    return best;
  }, null);

  const matchingCommodity = findBestMatch(commodityData, item?.commodity, 'name');

  const rawBuyerKey = item?.buyerCompany ?? item?.buyer ?? "";
  
  const companyIdFromItem = item?.companyId || item?.company?._id || item?.company;
  const companyFromCompanyId = findCompanyById(companyIdFromItem);
  const companyFromBuyerKeyId = isMongoId(rawBuyerKey)
    ? findCompanyById(rawBuyerKey)
    : null;
  const companyFromBuyerName = findBestMatch(companyData, rawBuyerKey, "companyName");

  const matchingBuyerProfile =
    findBestMatch(buyerData, rawBuyerKey, "name") || null;

  const companyFromBuyerProfile = (() => {
    const ids = matchingBuyerProfile?.companyIds;
    if (!Array.isArray(ids) || ids.length === 0) return null;
    if (companyFromCompanyId) return companyFromCompanyId;
    return findCompanyById(ids[0]);
  })();

  const matchingBuyer =
    companyFromCompanyId ||
    companyFromBuyerKeyId ||
    companyFromBuyerName ||
    companyFromBuyerProfile ||
    matchingBuyerProfile;

  const resolvedConsigneeName =
    typeof getConsigneeDisplay === "function"
      ? getConsigneeDisplay(item)
      : normalizedConsigneeKey || item?.consignee || "N/A";

  const isSpecialConsignee = 
    normalizeText(resolvedConsigneeName).includes("self order") || 
    normalizeText(resolvedConsigneeName).includes("purchase order");

  const itemBuyerName = typeof item?.buyerCompany === "string" && !isMongoId(item.buyerCompany) 
    ? item.buyerCompany 
    : typeof item?.buyer === "string" && !isMongoId(item.buyer)
      ? item.buyer
      : "";

  const finalBuyerName = itemBuyerName || matchingBuyer?.companyName || matchingBuyer?.name || "N/A";
  const finalBuyerDetails = toUnifiedDetails(
    companyFromCompanyId ||
      companyFromBuyerKeyId ||
      companyFromBuyerName ||
      companyFromBuyerProfile ||
      matchingBuyer,
  );
  
  const itemConsigneeDetails = item?.consigneeDetails ? toConsigneeDetails(item.consigneeDetails) : null;
  const finalConsigneeDetails = 
    toConsigneeDetails(matchingConsignee) || 
    (isSpecialConsignee ? toConsigneeDetails(matchingBuyer) : null) ||
    itemConsigneeDetails;

  const billToConsignee = String(item?.billTo || "").toLowerCase() === "consignee";

  // Find matching commodity to get _id
  const commodityMatch = findBestMatch(commodityData, item?.commodity, 'name');
  const commodityId = commodityMatch?._id;

  // Build parameters from company data if available
  let parameters = [];
  if (matchingBuyer && commodityId) {
    const companyCommodity = matchingBuyer.commodities?.find(cc => 
      String(cc.commodityId) === String(commodityId)
    );
    
    if (companyCommodity?.parameters) {
      parameters = companyCommodity.parameters.map(cp => {
        const qualityParam = qualityParameterData.find(qp => 
          String(qp._id) === String(cp.parameterId)
        );
        // Get first values entry (since values is array per companyCommodityParameter)
        const value = cp.values?.[0] || {};
        
        return {
          _id: cp.parameterId,
          parameter: qualityParam?.name || 'Unknown Parameter',
          baseValue: value.baseValue,
          maxValue: value.maxValue,
          // Keep original value for backwards compatibility
          value: value.baseValue
        };
      });
    }
  }
  
  // If no company parameters found, use item parameters (for self order or existing data)
  if (parameters.length === 0 && item.parameters) {
    parameters = item.parameters.map(param => {
      const qualityParam = qualityParameterData.find(qp => 
        String(qp._id) === String(param.id || param._id || param.parameterId)
      );
      return {
        ...param,
        _id: param.id || param._id || param.parameterId,
        parameter: qualityParam?.name || param.parameter || 'Unknown Parameter',
        baseValue: param.baseValue ?? param.value,
        maxValue: param.maxValue ?? '',
      };
    });
  }

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
    parameters: parameters.length > 0 ? parameters : item.parameters, // Fallback to item parameters if no company parameters
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
