export const SARIA_AI_ORDER_EDIT_EVENT = "saria-ai-order-edit";
export const SARIA_AI_ORDER_EDIT_RESULT_EVENT =
  "saria-ai-order-edit-result";

const ORDER_EDIT_FIELDS = [
  {
    name: "Buyer",
    aliases: ["buyer", "buyer group", "buyer name", "buyer information"],
  },
  {
    name: "Buyer Company",
    aliases: ["buyer company", "company", "company name"],
  },
  {
    name: "Consignee",
    aliases: ["consignee"],
  },
  {
    name: "Commodity",
    aliases: ["commodity", "commodity information"],
  },
  {
    name: "Buyers PO Number",
    aliases: [
      "buyers po number",
      "buyers po number (optional)",
      "buyer po number",
      "po number",
      "purchase order number",
    ],
  },
  { name: "PO Date", aliases: ["po date", "purchase order date"], type: "date" },
  { name: "State", aliases: ["state", "loading state"] },
  { name: "Quantity", aliases: ["quantity"], type: "number" },
  {
    name: "Pending Quantity",
    aliases: ["pending quantity"],
    type: "number",
  },
  { name: "Rate", aliases: ["rate", "rate per ton"], type: "number" },
  { name: "GST", aliases: ["gst", "gst percent"], type: "number" },
  { name: "CD", aliases: ["cd", "cd percent"], type: "number" },
  { name: "Weight", aliases: ["weight", "weight tons"] },
  {
    name: "Supplier",
    aliases: ["supplier", "supplier name", "seller", "supplier information"],
  },
  {
    name: "Supplier Company",
    aliases: ["supplier company", "seller company"],
  },
  {
    name: "Payment Terms",
    aliases: ["payment terms", "payment terms in days"],
  },
  {
    name: "Delivery Date",
    aliases: ["delivery date"],
    type: "date",
  },
  {
    name: "Loading Date",
    aliases: ["loading date"],
    type: "date",
  },
  { name: "Location", aliases: ["location"] },
  { name: "District", aliases: ["district"] },
  { name: "PIN Code", aliases: ["pin code", "pincode"] },
  { name: "GST Number", aliases: ["gst number"] },
  { name: "PAN Number", aliases: ["pan number"] },
  { name: "Buyer Email", aliases: ["buyer email", "buyer emails"] },
  { name: "Buyer Mobile", aliases: ["buyer mobile", "buyer phone"] },
  { name: "Seller Email", aliases: ["seller email", "seller emails"] },
  { name: "Seller Mobile", aliases: ["seller mobile", "seller phone"] },
  { name: "Agent Name", aliases: ["agent name", "agent"] },
  { name: "Notes", aliases: ["note", "notes"] },
  {
    name: "Send PO to Buyer",
    aliases: ["send po to buyer", "send purchase order to buyer"],
    type: "yesNo",
  },
  {
    name: "Send PO to Supplier",
    aliases: ["send po to supplier", "send purchase order to supplier"],
    type: "yesNo",
  },
  {
    name: "Email Notification to Buyer",
    aliases: ["email notification to buyer", "notify buyer"],
    type: "yesNo",
  },
  {
    name: "Email Notification to Supplier",
    aliases: ["email notification to supplier", "notify supplier"],
    type: "yesNo",
  },
  {
    name: "Bill To",
    aliases: ["bill to"],
    type: "billTo",
  },
  {
    name: "Sauda Number",
    aliases: ["sauda number", "sauda no", "order number"],
  },
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const aliasPattern = (alias) =>
  alias
    .trim()
    .split(/\s+/)
    .map(escapeRegex)
    .join("\\s+");

export const parseSariaOrderEditCommand = (command, parameters = []) => {
  const commandMatch = command
    .trim()
    .match(
      /^(?:please\s+)?(?:(clear|change|set|update|edit)\s+)?([\s\S]+)$/i,
    );

  if (!commandMatch) return null;

  const operation = commandMatch[1]?.toLowerCase() || "set";
  const body = commandMatch[2].trim();
  const availableFields = ORDER_EDIT_FIELDS.flatMap((field) =>
    field.aliases.map((alias) => ({
      ...field,
      alias,
    })),
  );

  (Array.isArray(parameters) ? parameters : []).forEach((parameter) => {
    const label =
      typeof parameter?.parameter === "string"
        ? parameter.parameter
        : parameter?.parameter?.label ||
          parameter?.parameter?.name ||
          parameter?.label ||
          parameter?.name;
    if (!label) return;

    const parameterId =
      parameter.id || parameter.parameterId || parameter._id;
    [
      {
        name: `${label} Base Value`,
        aliases: [`${label} base value`],
        parameterField: "baseValue",
      },
      {
        name: `${label} Max Value`,
        aliases: [`${label} max value`],
        parameterField: "maxValue",
      },
    ].forEach((field) => {
      field.aliases.forEach((alias) =>
        availableFields.push({
          ...field,
          alias,
          type: "parameter",
          parameterId,
        }),
      );
    });
  });

  availableFields.sort(
    (left, right) => right.alias.length - left.alias.length,
  );

  for (const field of availableFields) {
    for (const alias of field.aliases) {
      const fieldPattern = aliasPattern(alias);
      if (operation === "clear") {
        if (new RegExp(`^(?:the\\s+)?${fieldPattern}$`, "i").test(body)) {
          return { ...field, operation, value: "" };
        }
        continue;
      }

      const assignment = body.match(
        new RegExp(
          `^(?:the\\s+)?${fieldPattern}(?:\\s+(?:to|as|is)\\s*|\\s*[:=]\\s*|\\s+)([\\s\\S]*)$`,
          "i",
        ),
      );
      if (assignment && assignment[1].trim()) {
        return { ...field, operation, value: assignment[1].trim() };
      }
    }
  }

  return { operation, invalidField: true };
};

export const parseSariaTargetedOrderEditCommand = (command) => {
  const match = command.trim().match(
    /^(?:please\s+)?(?:(?:edit|update|change)\s+)?(?:the\s+)?(?:(?:order)\s+(?:for|with)\s+)?(?:sauda|order)\s*(?:no\.?|number)?\s*#?\s*(\d+)\b(?:\s*[,;:]\s*|\s+)?([\s\S]*)$/i,
  );

  if (!match) return null;

  const editCommand = match[2]
    .trim()
    .replace(/^(?:(?:and|then)\s+)+/i, "");

  return {
    saudaNo: match[1],
    editCommand,
  };
};

export const SARIA_ORDER_EDIT_EXAMPLES = [
  "Sauda no 123, change Commodity to Wheat",
  "Sauda no 123, set Buyers PO Number to PO-123",
  "Sauda no 123, change Supplier to Hansaria Traders",
  "Sauda no 123, set Quantity to 120",
  "Sauda no 123, update Notes to Call buyer tomorrow",
];
