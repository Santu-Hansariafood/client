export const SARIA_AI_ACTION_EVENT = "saria-ai-action";
export const SARIA_AI_ACTION_RESULT_EVENT = "saria-ai-action-result";

// Read/write operations the agent may stage into the app forms.
export const SARIA_AI_OPERATIONS = ["create", "edit"];

// Field catalogs for the six core trading modules. The n8n agent uses the
// names on the left when it stages a form, and the app only applies a field
// when the target form already knows that key.
export const SARIA_AI_MODULES = {
  sauda: {
    label: "Sauda",
    createRoute: "/manage-order/add-self-order",
    listRoute: "/manage-order/list-self-order",
    editRoute: (id) => `/manage-order/edit-self-order/${id}`,
    lookup: { url: "/self-order", keyField: "saudaNo" },
    fields: {
      buyer: "Buyer name (must already exist in Buyers)",
      buyerCompany: "Buyer company name (must already exist in Companies)",
      consignee: "Consignee name (must already exist in Consignees)",
      commodity: "Commodity name (must already exist in Commodities)",
      supplier: "Seller name (must already exist in Sellers)",
      supplierCompany: "Seller company name (must already exist in Seller Companies)",
      state: "Loading state name",
      location: "Loading location or district",
      quantity: "Quantity in Tons (number)",
      pendingQuantity: "Pending quantity in Tons (number)",
      rate: "Rate per Ton in Rs (number)",
      gst: "GST percent (number)",
      cd: "CD percent (number)",
      weight: "Weight in Tons (number)",
      poNumber: "Buyer PO number (text)",
      poDate: "PO date (YYYY-MM-DD)",
      paymentTerms: "Payment terms in days (text)",
      deliveryDate: "Delivery date (YYYY-MM-DD)",
      loadingDate: "Loading date (YYYY-MM-DD)",
      notes: "Notes (text)",
      agentName: "Agent name",
      buyerMobile: "Buyer mobile number",
      sellerMobile: "Seller mobile number",
    },
  },
  buyer: {
    label: "Buyer",
    createRoute: "/buyer/add",
    listRoute: "/buyer/list",
    lookup: { url: "/buyers", keyField: "name" },
    fields: {
      name: "Buyer name",
      mobile: "Mobile number, 10 digits starting with 6-9",
      email: "Email address",
      password: "Login password",
      group: "Group of company name (must already exist)",
      company: "Company name (must already exist)",
      commodity: "Commodity name (must already exist)",
      status: "active or inactive",
      consignee: "Consignee name (must already exist)",
    },
  },
  seller: {
    label: "Seller",
    createRoute: "/seller-details/add",
    listRoute: "/seller-details/list",
    editRoute: (id) => `/seller-details/edit/${id}`,
    lookup: { url: "/sellers", keyField: "sellerName" },
    fields: {
      sellerName: "Seller name",
      password: "Login password",
      phoneNumbers: "Mobile numbers, comma separated, 10 digits starting with 6-9",
      emails: "Email addresses, comma separated",
      commodities: "Commodity names, comma separated (must already exist)",
      companies: "Seller company names, comma separated (must already exist)",
      status: "active or inactive",
    },
  },
  commodity: {
    label: "Commodity",
    createRoute: "/commodity/add",
    listRoute: "/commodity/list",
    editRoute: (id) => `/commodity/edit/${id}`,
    lookup: { url: "/commodities", keyField: "name" },
    fields: {
      commodityName: "Commodity name",
      hsnCode: "HSN code",
    },
  },
  loading: {
    label: "Loading Entry",
    createRoute: "/Loading-Entry/add-loading-entry",
    listRoute: "/Loading-Entry/list-loading-entry",
    lookup: { url: "/loading-entries", keyField: "billNumber" },
    fields: {
      loadingDate: "Loading date (YYYY-MM-DD)",
      deliveryDate: "Delivery date (YYYY-MM-DD)",
      saudaNo: "Sauda number (must already exist)",
      billNumber: "Bill number",
      sellerBillNo: "Seller bill number",
      lorryNumber: "Lorry number",
      driverName: "Driver name",
      driverPhoneNumber: "Driver phone number",
      commodity: "Commodity name",
      loadingFrom: "Loading from location",
      loadingWeight: "Loading weight in Tons (number)",
      bags: "Number of bags (number)",
      unloadingWeight: "Unloading weight in Tons (number)",
      unloadingDate: "Unloading date (YYYY-MM-DD)",
      freightRate: "Freight rate (number)",
      advance: "Advance amount in Rs (number)",
      balance: "Balance amount in Rs (number)",
      dueDate: "Due date (YYYY-MM-DD)",
      remarks: "Remarks (text)",
    },
  },
  payment: {
    label: "Payment Received",
    createRoute: "/payments/received/add",
    listRoute: "/payments/received/list",
    lookup: { url: "/payment-received", keyField: "voucherNumber" },
    fields: {
      date: "Payment date (YYYY-MM-DD)",
      amount: "Amount received in Rs (number)",
      claim: "Claim amount in Rs (number)",
      tds: "TDS amount in Rs (number)",
      paymentType: "Sauda-wise or On-account",
      paymentMode: "Bank, Cash, UPI, RTGS, NEFT or Cheque",
      remarks: "Remarks (text)",
    },
  },
};

const OPERATION_ALIASES = {
  create: "create",
  add: "create",
  new: "create",
  insert: "create",
  edit: "edit",
  update: "edit",
  change: "edit",
  modify: "edit",
  set: "edit",
};

const emptyFields = (fields) =>
  fields && typeof fields === "object" && !Array.isArray(fields) ? fields : {};

export const getSariaModule = (module) =>
  SARIA_AI_MODULES[String(module || "").trim().toLowerCase()] || null;

export const getSariaModuleKey = (module) => {
  const key = String(module || "").trim().toLowerCase();
  return SARIA_AI_MODULES[key] ? key : null;
};

// Only the keys the destination form already maintains are kept, so a stray
// agent field can never reach a save payload.
export const keepSariaFormKeys = (fields, allowedKeys) => {
  const source = emptyFields(fields);
  return (allowedKeys || []).reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
    return result;
  }, {});
};

// Agent field values arrive as either a real array or a comma separated
// string; forms always expect an array.
export const sariaToFieldList = (value) =>
  (Array.isArray(value) ? value : String(value ?? "").split(/[,;]/))
    .map((item) => String(item).trim())
    .filter(Boolean);

// Matches an agent supplied name against a form's { value, label } options.
export const sariaFindOption = (options, label) =>
  (options || []).find(
    (option) =>
      String(option.label).trim().toLowerCase() ===
      String(label || "").trim().toLowerCase(),
  ) || null;

const SAUDA_TEXT_FIELDS = [
  ["buyer", "buyer"],
  ["buyerCompany", "buyer company"],
  ["consignee", "consignee"],
  ["commodity", "commodity"],
  ["supplier", "supplier"],
  ["supplierCompany", "supplier company"],
  ["state", "state"],
  ["location", "location"],
  ["poNumber", "PO number"],
  ["paymentTerms", "payment terms"],
  ["agentName", "agent name"],
  ["buyerMobile", "buyer mobile"],
  ["sellerMobile", "seller mobile"],
];

const SAUDA_NUMBER_FIELDS = [
  ["quantity", "quantity"],
  ["pendingQuantity", "pending quantity"],
  ["rate", "rate"],
  ["gst", "GST"],
  ["cd", "CD"],
  ["weight", "weight"],
];

const SAUDA_DATE_FIELDS = [
  ["poDate", "PO date"],
  ["deliveryDate", "delivery date"],
  ["loadingDate", "loading date"],
];

// Maps an agent staged sauda payload onto the Add/Edit sauda form shape.
// Returns a partial formData object plus the labels that were filled so the
// chat can confirm exactly what changed.
export const buildSaudaStagedFields = (fields = {}) => {
  const updates = {};
  const filled = [];

  SAUDA_TEXT_FIELDS.forEach(([key, label]) => {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") {
      updates[key] = String(value);
      filled.push(label);
    }
  });

  SAUDA_NUMBER_FIELDS.forEach(([key, label]) => {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        updates[key] = num;
        filled.push(label);
      }
    }
  });

  SAUDA_DATE_FIELDS.forEach(([key, label]) => {
    const value = fields[key];
    if (value) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        updates[key] = date;
        filled.push(label);
      }
    }
  });

  if (fields.notes) {
    updates.notes = sariaToFieldList(fields.notes);
    filled.push("notes");
  }

  return { updates, filled };
};

export const normalizeSariaAIAction = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const moduleKey = getSariaModuleKey(raw.module);
  const operation = OPERATION_ALIASES[String(raw.operation || "").trim().toLowerCase()];
  if (!moduleKey || !operation) return null;

  const fields = keepSariaFormKeys(
    raw.fields,
    Object.keys(SARIA_AI_MODULES[moduleKey].fields),
  );

  return {
    module: moduleKey,
    operation,
    recordId: raw.recordId ? String(raw.recordId) : "",
    recordKey: raw.recordKey ? String(raw.recordKey) : "",
    fields,
  };
};

const pickFromRecord = (record, keyField) => {
  if (!record) return "";
  return (
    record._id ||
    record.id ||
    (keyField ? record[keyField] : "") ||
    ""
  );
};

// Editing a staged record needs the target route id. The agent normally
// supplies it; otherwise the record is looked up by the key the user named.
export const resolveSariaRecordId = async (api, action) => {
  if (action.recordId) return action.recordId;

  const module = getSariaModule(action.module);
  const lookupKey = action.recordKey;
  if (!module?.lookup || !lookupKey) return "";

  try {
    const response = await api.get(
      `${module.lookup.url}?search=${encodeURIComponent(lookupKey)}&limit=5`,
    );
    const payload = response.data?.data ?? response.data;
    const rows = Array.isArray(payload) ? payload : payload ? [payload] : [];
    const normalizedKey = lookupKey.trim().toLowerCase();
    const match =
      rows.find(
        (row) =>
          String(row?.[module.lookup.keyField] || "").trim().toLowerCase() ===
          normalizedKey,
      ) || rows[0];

    return String(pickFromRecord(match, module.lookup.keyField) || "");
  } catch {
    return "";
  }
};

/**
 * Opens the app form the agent staged values into. The AI never saves:
 * it only routes the user to the real form, which stays in charge of
 * validation and of the actual write.
 *
 * When the target form is already open, values are pushed straight into it so
 * follow-up refinements do not remount the page.
 *
 * @returns {string|null} A message for the chat when the action could not run.
 */
export const openSariaAIAction = async (
  api,
  navigate,
  rawAction,
  currentPath = "",
) => {
  const action = normalizeSariaAIAction(rawAction);
  if (!action) return null;

  const module = getSariaModule(action.module);
  if (!module) return null;

  const openTarget = (targetPath, stagedAction, allowLiveDispatch = true) => {
    if (allowLiveDispatch && currentPath === targetPath) {
      const event = new CustomEvent(SARIA_AI_ACTION_EVENT, {
        cancelable: true,
        detail: { action: stagedAction },
      });
      const handled = window.dispatchEvent(event) === false;
      return handled ? event.detail.response || null : null;
    }

    navigate(targetPath, { state: { aiAction: stagedAction } });
    return null;
  };

  if (action.operation === "create") {
    return openTarget(module.createRoute, action);
  }

  if (!action.recordId && !action.recordKey) {
    return `Which ${module.label} should I open for editing? Give me the ${module.label} name or number.`;
  }

  const recordId = await resolveSariaRecordId(api, action);
  const stagedAction = recordId ? { ...action, recordId } : action;

  if (module.editRoute && recordId) {
    return openTarget(module.editRoute(recordId), stagedAction);
  }

  if (action.module === "payment" && recordId) {
    // The payment form loads the record it edits from the id query param.
    return openTarget(
      `${module.createRoute}?id=${encodeURIComponent(recordId)}`,
      stagedAction,
      false,
    );
  }

  if (module.editRoute && !recordId) {
    navigate(module.listRoute, { state: { aiAction: stagedAction } });
    return `I could not pin down that ${module.label}. Search the list and open it to edit.`;
  }

  // Buyers and loading entries are edited from a popup on their list page.
  return openTarget(module.listRoute, stagedAction);
};
