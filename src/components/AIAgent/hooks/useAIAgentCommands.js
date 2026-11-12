import { useRef, useMemo } from "react";
import dashboardData from "../../../data/dashboardData.json";
import api from "../../../utils/apiClient/apiClient";
import {
  parseSariaTargetedOrderEditCommand,
  SARIA_AI_ORDER_EDIT_EVENT,
} from "../../../utils/sariaAIOrderEdit";
import { openSariaAIAction } from "../../../utils/sariaAIAction";

const SYSTEM_DICTIONARY = [
  "sauda",
  "order",
  "lorry",
  "vehicle",
  "truck",
  "bill",
  "invoice",
  "challan",
  "call",
  "phone",
  "employee",
  "consignee",
  "payment",
  "due",
  "outstanding",
  "commodity",
  "commodities",
  "buyer",
  "seller",
  "bid",
  "bids",
  "participate",
  "active",
  "pending",
  "accepted",
  "today",
  "sidebar",
  "menu",
  "modules",
  "weather",
  "account",
  "status",
  "loading",
  "unloading",
  "dispatch",
];

// Exact words that are faster to fix from a lookup than by edit distance.
const TYPO_ALIASES = {
  saller: "seller",
  byuer: "buyer",
  emploee: "employee",
  employe: "employee",
  cosignee: "consignee",
  phne: "phone",
  cal: "call",
  payemnt: "payment",
  loadng: "loading",
};

// A bare keyword is ambiguous, so instead of guessing (or sending the word to
// the agent) Saria AI answers with a short menu of what it can do. Every chip
// below is a command the local engine or the agent already understands.
const SHORT_QUERY_OPTIONS = {
  sauda: {
    title: "Sauda",
    items: [
      "Total sauda today",
      "Active bids",
      "Open List SelfOrder",
      "Open Pending Sauda",
    ],
  },
  order: {
    title: "Sauda / Order",
    items: [
      "Total sauda today",
      "Open List SelfOrder",
      "Open Pending Sauda",
      "Active bids",
    ],
  },
  buyer: {
    title: "Buyer",
    items: ["Open Buyer List", "Buyer Report", "Total sauda today"],
  },
  seller: {
    title: "Seller",
    items: ["Seller Report", "Open Seller Details List", "Total sauda today"],
  },
  consignee: {
    title: "Consignee",
    items: ["Open Consignee List", "Total sauda today"],
  },
  lorry: {
    title: "Lorry / Vehicle",
    items: [
      "Open List Loading Entry",
      "Open Loading Report",
      "Open Lorry Wise Report",
    ],
  },
  vehicle: {
    title: "Lorry / Vehicle",
    items: ["Open List Loading Entry", "Open Lorry Wise Report"],
  },
  truck: {
    title: "Lorry / Vehicle",
    items: ["Open List Loading Entry", "Open Lorry Wise Report"],
  },
  bill: {
    title: "Bill / Invoice",
    items: ["Payment status report", "Open List SelfOrder"],
  },
  invoice: {
    title: "Bill / Invoice",
    items: ["Payment status report", "Open List SelfOrder"],
  },
  challan: {
    title: "Bill / Invoice",
    items: ["Payment status report", "Open List SelfOrder"],
  },
  payment: {
    title: "Payment",
    items: [
      "Payment status report",
      "Open Due List",
      "Open Add Received",
      "Open Ledger",
    ],
  },
  due: {
    title: "Due",
    items: ["Open Due List", "Payment status report"],
  },
  loading: {
    title: "Loading",
    items: [
      "Open List Loading Entry",
      "Open Add Loading Entry",
      "Open Loading Report",
    ],
  },
  unloading: {
    title: "Unloading",
    items: ["Open List Loading Entry", "Open Loading Report"],
  },
  dispatch: {
    title: "Dispatch",
    items: ["Open List Loading Entry", "Open Pending Summary"],
  },
  commodity: {
    title: "Commodity",
    items: ["Commodities", "Open Commodity List", "Highest rate today"],
  },
  commodities: {
    title: "Commodity",
    items: ["Commodities", "Open Commodity List", "Highest rate today"],
  },
  bid: {
    title: "Bid",
    items: [
      "Active bids",
      "Open Bid List",
      "Open Participate Bid",
      "Highest rate today",
    ],
  },
  rate: {
    title: "Rate",
    items: ["Highest rate today", "Active bids", "Open Bid List"],
  },
  report: {
    title: "Report",
    items: [
      "Generate report",
      "Payment status report",
      "Open Buyer Report",
      "Open Finance Report",
    ],
  },
  help: {
    title: "Help",
    items: ["Show sidebar menu", "Train AI", "Contact support"],
  },
  list: {
    title: "Lists",
    items: [
      "Open Buyer List",
      "Open Consignee List",
      "Open Commodity List",
      "Open Due List",
    ],
  },
  home: {
    title: "Home",
    items: ["Show sidebar menu", "Open Dashboard", "Total sauda today"],
  },
  today: {
    title: "Today",
    items: ["Total sauda today", "Highest rate today", "Active bids"],
  },
  status: {
    title: "Status",
    items: ["Account status", "Payment status report", "Active bids"],
  },
};

// Shown in the live suggestion list when what is typed does not match a known
// command yet, so typing anything always surfaces something useful.
const FEATURED_SUGGESTIONS = [
  "Total sauda today",
  "Active bids",
  "Highest rate today",
  "Payment status report",
  "Show sidebar menu",
];

// Flattens every command Saria AI understands (keyword menus, common commands
// and the sidebar) into one searchable list that powers the live suggestions
// shown while the user is typing.
const buildSuggestionCatalog = (sidebarModules) => {
  const catalog = [];
  const seen = new Set();

  const push = (text) => {
    const value = String(text || "").trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    catalog.push(value);
  };

  Object.values(SHORT_QUERY_OPTIONS).forEach((option) =>
    option.items.forEach(push),
  );
  FEATURED_SUGGESTIONS.forEach(push);
  sidebarModules.forEach((section) =>
    section.actions.forEach((action) => push(`Open ${action.name}`)),
  );

  return catalog;
};

// Ranks catalog entries against the typed text: prefix matches first, then
// word matches, then anything containing the text. If nothing matches at all
// the featured commands are returned so suggestions always appear.
const matchSuggestions = (catalog, text, limit = 6) => {
  const query = String(text || "").trim().toLowerCase();
  if (!query) return [];

  const words = query.split(/\s+/).filter(Boolean);
  const scored = [];

  catalog.forEach((item, order) => {
    const lower = item.toLowerCase();
    if (lower === query) return;
    if (!words.every((word) => lower.includes(word))) return;

    const parts = lower.split(/\s+/);
    const score = lower.startsWith(query)
      ? 0
      : words.every((word) => parts.some((part) => part.startsWith(word)))
        ? 1
        : 2;

    scored.push({ item, order, score });
  });

  scored.sort((a, b) => a.score - b.score || a.order - b.order);

  const matches = scored.slice(0, limit).map((entry) => entry.item);
  return matches.length > 0 ? matches : FEATURED_SUGGESTIONS.slice(0, 4);
};

const CONTACT_SUPPORT_TEXT =
  `*Saria AI Contact Support*\n\n` +
  `• *Admin Hotline:* +91 98765 43210\n` +
  `• *Tech Support:* info@hSariafood.com\n` +
  `• *Operating Hours:* 10:00 AM - 07:00 PM` +
  `• *Website:* https://www.hSariafood.com`;

const getLevenshteinDistance = (a, b, maxDistance = 2) => {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  if (a.length > b.length) [a, b] = [b, a];

  const matrix = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = i;

  for (let i = 1; i <= b.length; i++) {
    let prev = i;
    let minRow = Infinity;
    for (let j = 1; j <= a.length; j++) {
      const curr =
        a[j - 1] === b[i - 1]
          ? matrix[j - 1]
          : Math.min(matrix[j - 1], matrix[j], prev) + 1;
      matrix[j - 1] = prev;
      prev = curr;
      if (curr < minRow) minRow = curr;
    }
    matrix[a.length] = prev;
    if (minRow > maxDistance) return maxDistance + 1;
  }
  return matrix[a.length];
};

const normalizeKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");

export const useAIAgentCommands = ({
  input,
  setInput,
  setMessages,
  messages,
  navigate,
  apiMethods,
  learningMethods,
  userName,
  currentPath,
  pageHistory,
  userRole,
  user,
}) => {
  const debounceTimerRef = useRef(null);
  const typoCacheRef = useRef({});

  const sidebarModules = useMemo(
    () =>
      dashboardData.sections
        .map((section) => {
          const filteredActions = section.actions.filter((action) => {
            if (
              action.link === "/dashboard" ||
              action.link === "/employee/dashboard"
            ) {
              return true;
            }

            if (
              userRole === "Employee" &&
              user?.allowedPermissions &&
              user.allowedPermissions.length > 0
            ) {
              return user.allowedPermissions.some((permission) => {
                const normalizedPermission = permission.startsWith("/")
                  ? permission
                  : `/${permission}`;
                const normalizedLink = action.link.startsWith("/")
                  ? action.link
                  : `/${action.link}`;

                return normalizedLink === normalizedPermission;
              });
            }

            if (!action.roles) return true;
            return action.roles.includes(userRole);
          });

          return { ...section, actions: filteredActions };
        })
        .filter((section) => section.actions.length > 0),
    [userRole, user],
  );

  // Pre-built lookup tables so navigation matching is a hash-map hit instead
  // of three full scans of the sidebar on every message.
  const sidebarIndex = useMemo(() => {
    const byName = new Map();
    const entries = [];
    const sections = [];

    sidebarModules.forEach((section) => {
      sections.push({
        key: normalizeKey(section.section),
        action: section.actions[0],
      });
      section.actions.forEach((action) => {
        const key = normalizeKey(action.name);
        if (key && !byName.has(key)) byName.set(key, action);
        entries.push({ key, action });
      });
    });

    return { byName, entries, sections };
  }, [sidebarModules]);

  const suggestionCatalog = useMemo(
    () => buildSuggestionCatalog(sidebarModules),
    [sidebarModules],
  );

  // Commands matching what the user has typed so far, shown above the input.
  const liveSuggestions = useMemo(
    () => matchSuggestions(suggestionCatalog, input),
    [suggestionCatalog, input],
  );

  const rectifyTypo = (text) => {
    if (typoCacheRef.current[text]) return typoCacheRef.current[text];

    const words = text.split(/\s+/);
    const correctedWords = words.map((word) => {
      if (word.length < 3 || /^\d+$/.test(word)) return word;

      const lower = word.toLowerCase();
      if (TYPO_ALIASES[lower]) return TYPO_ALIASES[lower];

      let bestMatch = word;
      let minDistance = 2;

      for (const term of SYSTEM_DICTIONARY) {
        const distance = getLevenshteinDistance(lower, term, minDistance);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = term;
        }
        if (minDistance === 0) break;
      }
      return bestMatch;
    });

    const result = correctedWords.join(" ");
    typoCacheRef.current[text] = result;
    if (Object.keys(typoCacheRef.current).length > 100) {
      typoCacheRef.current = {};
    }
    return result;
  };

  const findSidebarLink = (query) => {
    const cleanQuery = normalizeKey(query);
    if (!cleanQuery) return null;

    const exactName = sidebarIndex.byName.get(cleanQuery);
    if (exactName) return exactName;

    const exactLink = sidebarIndex.entries.find(
      (entry) => entry.action.link === query,
    );
    if (exactLink) return exactLink.action;

    const fuzzy = sidebarIndex.entries.find(
      (entry) =>
        (entry.key && cleanQuery.includes(entry.key)) ||
        (entry.key && entry.key.includes(cleanQuery)),
    );
    if (fuzzy) return fuzzy.action;

    const section = sidebarIndex.sections.find(
      (entry) =>
        cleanQuery === entry.key ||
        cleanQuery.includes(entry.key) ||
        entry.key.includes(cleanQuery),
    );
    return section?.action || null;
  };

  const sectionOf = (link) =>
    sidebarModules.find((section) =>
      section.actions.some((action) => action.link === link),
    )?.section || "System Module";

  const getSidebarSummary = () => {
    let content = "*System Modules & Navigation:*\n\n";
    sidebarModules.forEach((s) => {
      content += `• *${s.section}*: ${s.actions.map((a) => `_${a.name}_`).join(", ")}\n`;
    });
    content +=
      "\n*Tip: Type a module name to get its details here, or ask for specific records like Sauda, Lorry, Buyer, Seller, or Payment details.*";
    return {
      role: "assistant",
      content,
      suggestions: [
        "Buyer List",
        "Loading Entry",
        "Payment List",
        "Add SelfOrder",
      ],
    };
  };

  const getModuleResult = (action) => ({
    role: "assistant",
    content:
      `*${action.name}*\n\n` +
      `• *Section:* ${action.section || "System Module"}\n` +
      `• *Path:* ${action.link}\n` +
      `• *Mode:* Inline result only. I will not redirect automatically.\n\n` +
      `Ask me for the exact data you want from *${action.name}*, and I will provide the result here.`,
    suggestions: [
      "Total sauda today",
      "Active bids",
      "Sauda 1 details",
      "Lorry details",
    ],
  });

  // Turns a single bare word into a short, clickable menu. Returns null for
  // anything else so normal queries keep flowing to the agent.
  const buildShortQueryHelp = (cleanCmd) => {
    const word = cleanCmd.replace(/^[\s?!.,;:'"]+|[\s?!.,;:'"]+$/g, "");
    if (!/^[a-z]{2,}$/.test(word)) return null;

    const option =
      SHORT_QUERY_OPTIONS[word] || SHORT_QUERY_OPTIONS[word.replace(/s$/, "")];
    if (option) {
      return {
        role: "assistant",
        content:
          `*${option.title} — what do you need?*\n\n` +
          option.items.map((item) => `• ${item}`).join("\n") +
          `\n\nTap an option, or add a number or name — for example _Sauda 12345 details_.`,
        suggestions: option.items,
      };
    }

    // Fall back to a sidebar module name (for example "commodity").
    const action = findSidebarLink(cleanCmd);
    return action
      ? getModuleResult({ ...action, section: sectionOf(action.link) })
      : null;
  };

  // Every regex the local engine needs, evaluated once per message.
  const buildMatches = (cleanCmd) => ({
    sauda:
      cleanCmd.match(/(?:sauda|order)\s*(?:no|number)?\s*[:\s]*(\d+)/i) ||
      cleanCmd.match(/(\d+)\s*(?:sauda|order)/i),
    lorry: cleanCmd.match(
      /(?:lorry|vehicle|truck)\s*(?:no|number)?\s*[:\s]*([a-z0-9\s]{4,})/i,
    ),
    bill: cleanCmd.match(
      /(?:bill|invoice|challan)\s*(?:no|number)?\s*[:\s]*(\d+)/i,
    ),
    addLoading: cleanCmd.match(
      /(?:add|create)\s*(?:loading|entry)\s*(?:for|on)?\s*(?:sauda)?\s*[:\s]*(\d+)/i,
    ),
    state: cleanCmd.match(/(?:state|from)\s+([a-z\s]{3,})/i),
    date:
      cleanCmd.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/) ||
      cleanCmd.match(
        /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{0,4})/i,
      ),
    company: cleanCmd.match(/(?:status of|company)\s+([a-z0-9\s]+)/i),
    interaction: cleanCmd.match(
      /(?:interactions for|bid info for)\s+([a-z0-9\s]+)/i,
    ),
    downloadLorry: cleanCmd.match(
      /(?:download lorry report|generate lorry report)\s*([a-z0-9\s]+)/i,
    ),
    financeReport: cleanCmd.match(
      /(?:finance|sauda adjustment|adjustment)\s+(?:report|summary|status)/i,
    ),
    paymentReport: cleanCmd.match(
      /(?:payment|due|outstanding)\s+(?:(?:status\s+)?report|list)/i,
    ),
    appReport: cleanCmd.match(
      /(?:generate|show|display)\s+(?:the\s+)?(?:app|system|overall)\s+report/i,
    ),
    reminder: cleanCmd.match(
      /(?:check|show|create|generate)?\s*(?:sauda|order)?\s*(?:reminder|follow[- ]?up)\s*(?:for)?\s*(?:sauda|order)?\s*(\d+)/i,
    ),
    call: cleanCmd.match(/(?:call|phone|dial)\s+(buyer|seller|employee)\s+(.+)/i),
    emailTarget: cleanCmd.match(/\bto\s+(buyer|seller)\s+(.+)$/i),
    emailSauda: cleanCmd.match(
      /\bsend\b.*?\b(?:sauda|order)\s*(?:no|number)?\s*[:#]?\s*(\d+)/i,
    ),
    emailLorry: cleanCmd.match(
      /\b(?:lorry|vehicle|truck)\s*(?:no|number)?\s*[:#-]?\s*([a-z0-9-]+)/i,
    ),
    moreTopSellers: cleanCmd.match(
      /(?:show|give|get)\s+more\s+(?:top\s+)?sellers?\s+(?:for|of)\s+(?:consignee\s+)?(.+)/i,
    ),
    topSellers: cleanCmd.match(
      /(?:show|give|get)?\s*(?:top|best)\s+sellers?\s+(?:for|of)\s+(?:consignee\s+)?(.+)/i,
    ),
    bidComponent: cleanCmd.match(
      /(?:analyze|break down|components of)\s+([a-z0-9\s]+)\s+bid/i,
    ),
    buyer: cleanCmd.match(/(?:buyer)\s+([a-z0-9\s]+)/i),
    seller: cleanCmd.match(/(?:seller)\s+([a-z0-9\s]+)/i),
    due:
      cleanCmd.match(
        /(?:due|outstanding)\s*(?:sauda|amount|list)?\s*(?:for|of)?\s+([a-z0-9\s]+)/i,
      ) ||
      cleanCmd.match(
        /([a-z0-9\s]+)\s+(?:due|outstanding)\s*(?:sauda|amount|list)?/i,
      ),
    pending:
      cleanCmd.match(
        /(?:pending)\s*(?:sauda|order|list)?\s*(?:for|of|on)?\s+([a-z0-9\s]+)/i,
      ) ||
      cleanCmd.match(/([a-z0-9\s]+)\s+(?:pending)\s*(?:sauda|order|list)?/i),
    companyConsignee: cleanCmd.match(
      /(?:sauda|order)?\s*(?:for|on)?\s*company\s+([a-z0-9\s]+)\s*(?:to|and|consignee)?\s*consignee\s+([a-z0-9\s]+)/i,
    ),
    relationship:
      cleanCmd.match(
        /(?:relationship|trade|info)\s*(?:between|for)?\s*buyer\s+([a-z0-9\s]+)\s*(?:and|with)?\s*seller\s+([a-z0-9\s]+)/i,
      ) ||
      cleanCmd.match(
        /buyer\s+([a-z0-9\s]+)\s*(?:and|with)?\s*seller\s+([a-z0-9\s]+)/i,
      ),
  });

  // Ordered local fallback. The first rule whose `test` passes runs, so the
  // order here is the priority order of the engine.
  const buildLocalRules = (cleanCmd, matches) => [
    {
      test: () =>
        cleanCmd.includes("commodity") || cleanCmd.includes("commodities"),
      run: () => apiMethods.fetchCommodities(),
    },
    {
      test: () =>
        cleanCmd.includes("send") && (matches.emailTarget || matches.emailSauda),
      run: () => {
        const targetType = matches.emailTarget?.[1].toLowerCase() || "both";
        const targetName = matches.emailTarget?.[2].trim() || "";
        const reportType = cleanCmd.includes("claim")
          ? "Claim"
          : cleanCmd.includes("payment") || cleanCmd.includes("ledger")
            ? "Payment"
            : "Sauda";
        const requestedSauda = cleanCmd.match(
          /(?:sauda|order)\s*(?:no|number)?\s*[:#]?\s*(\d+)/i,
        )?.[1];
        return apiMethods.prepareEmailReport({
          reportType,
          targetType,
          targetName,
          saudaNo: requestedSauda,
          lorryNo: matches.emailLorry?.[1],
        });
      },
    },
    {
      test: () => Boolean(matches.call),
      run: () =>
        apiMethods.fetchContactForCall(matches.call[2].trim(), matches.call[1]),
    },
    {
      test: () => Boolean(matches.moreTopSellers),
      run: () =>
        apiMethods.fetchTopSellersByConsignee(
          matches.moreTopSellers[1].trim(),
          true,
        ),
    },
    {
      test: () => Boolean(matches.topSellers),
      run: () =>
        apiMethods.fetchTopSellersByConsignee(matches.topSellers[1].trim()),
    },
    {
      test: () => Boolean(matches.financeReport),
      run: () => apiMethods.fetchFinanceReport(),
    },
    {
      test: () => Boolean(matches.paymentReport),
      run: () => apiMethods.fetchPaymentStatusReport(),
    },
    {
      test: () => Boolean(matches.appReport) || cleanCmd === "generate report",
      run: () => apiMethods.fetchAccountStatus(),
    },
    {
      test: () => Boolean(matches.reminder),
      run: () => apiMethods.fetchSaudaReminderReport(matches.reminder[1]),
    },
    {
      test: () =>
        cleanCmd.includes("current sauda") || cleanCmd.includes("last sauda"),
      run: () => apiMethods.fetchLastSauda(),
    },
    {
      test: () => cleanCmd.includes("account status"),
      run: () => apiMethods.fetchAccountStatus(),
    },
    {
      test: () => cleanCmd.includes("weather"),
      run: () => apiMethods.fetchWeather(),
    },
    {
      test: () => Boolean(matches.companyConsignee),
      run: () =>
        apiMethods.fetchSaudasByCompanyAndConsignee(
          matches.companyConsignee[1].trim(),
          matches.companyConsignee[2].trim(),
        ),
    },
    {
      test: () => Boolean(matches.relationship),
      run: () =>
        apiMethods.fetchRelationshipContext(
          matches.relationship[1].trim(),
          matches.relationship[2].trim(),
        ),
    },
    {
      test: () => Boolean(matches.due) && !cleanCmd.includes("sauda no"),
      run: () =>
        apiMethods.fetchSellerSaudaStatus(matches.due[1].trim(), "due"),
    },
    {
      test: () => Boolean(matches.pending) && !cleanCmd.includes("sauda no"),
      run: () => apiMethods.fetchPendingSaudaByEntity(matches.pending[1].trim()),
    },
    {
      test: () =>
        cleanCmd.includes("contact") && !matches.buyer && !matches.seller,
      run: () => ({ role: "assistant", content: CONTACT_SUPPORT_TEXT }),
    },
    {
      test: () => Boolean(matches.downloadLorry),
      run: async () => {
        const lorryNo = matches.downloadLorry[1].trim();
        const result = await apiMethods.fetchLorryDetails(lorryNo);
        if (result?.content) {
          result.content = `*Lorry ${lorryNo} Result:*\n\n` + result.content;
        }
        return result;
      },
    },
    {
      test: () => Boolean(matches.bidComponent),
      run: () =>
        apiMethods.fetchBidComponentAnalysis(matches.bidComponent[1].trim()),
    },
    {
      test: () => Boolean(matches.addLoading),
      run: async () => {
        const saudaNo = matches.addLoading[1];
        const result = await apiMethods.fetchSaudaDetails(saudaNo);
        if (result?.content) {
          result.content = `*Sauda ${saudaNo} Result:*\n\n` + result.content;
        }
        return result;
      },
    },
    {
      test: () => Boolean(matches.buyer),
      run: async () =>
        (await apiMethods.fetchFullPartnerDetails(
          matches.buyer[1].trim(),
          "Buyer",
        )) || {
          role: "assistant",
          content: `I couldn't find any Buyer matching "*${matches.buyer[1].trim()}*".`,
        },
    },
    {
      test: () => Boolean(matches.seller),
      run: async () =>
        (await apiMethods.fetchFullPartnerDetails(
          matches.seller[1].trim(),
          "Seller",
        )) || {
          role: "assistant",
          content: `I couldn't find any Seller matching "*${matches.seller[1].trim()}*".`,
        },
    },
    {
      test: () =>
        Boolean(matches.sauda && matches.bill && matches.date),
      run: async () => {
        const result = await apiMethods.fetchSaudaDetails(matches.sauda[1]);
        if (result?.content) {
          result.content =
            `*Cross-Referencing Sauda ${matches.sauda[1]}, Bill ${matches.bill[1]} for ${matches.date[1]}*\n\n` +
            result.content;
        }
        return result;
      },
    },
    {
      test: () =>
        cleanCmd.includes("loading entry for sauda") && Boolean(matches.sauda),
      run: () => apiMethods.fetchLoadingEntriesBySauda(matches.sauda[1]),
    },
    {
      test: () =>
        Boolean(matches.sauda) && cleanCmd.includes("payment"),
      run: () => apiMethods.fetchSaudaPayment(matches.sauda[1]),
    },
    {
      test: () => Boolean(matches.sauda),
      run: () => apiMethods.fetchSaudaDetails(matches.sauda[1]),
    },
    {
      test: () => Boolean(matches.bill),
      run: () => apiMethods.fetchDetailsByBillNo(matches.bill[1].trim()),
    },
    {
      test: () => Boolean(matches.date),
      run: () => apiMethods.fetchDetailsByDate(matches.date[1]),
    },
    {
      test: () => Boolean(matches.lorry),
      run: () => apiMethods.fetchLorryDetails(matches.lorry[1].trim()),
    },
    {
      test: () => Boolean(matches.state) && !cleanCmd.includes("loading from"),
      run: () => apiMethods.fetchDetailsByState(matches.state[1].trim()),
    },
    {
      test: () =>
        cleanCmd.includes("total sauda today") ||
        (cleanCmd.includes("sauda") && cleanCmd.includes("today")),
      run: () => apiMethods.fetchTodaySaudas(),
    },
    {
      test: () =>
        cleanCmd.includes("active bids") || cleanCmd.includes("show bids"),
      run: () => apiMethods.fetchActiveBids(),
    },
    {
      test: () => Boolean(matches.interaction),
      run: () => apiMethods.fetchBidInteractions(matches.interaction[1].trim()),
    },
    {
      test: () => Boolean(matches.company),
      run: async () =>
        (await apiMethods.fetchFullCompanyDetails(matches.company[1].trim())) || {
          role: "assistant",
          content: `No records for company *${matches.company[1].trim()}*.`,
        },
    },
    {
      test: () =>
        cleanCmd.includes("rate") &&
        (cleanCmd.includes("today") ||
          cleanCmd.includes("loading") ||
          cleanCmd.includes("highest") ||
          cleanCmd.includes("bid")),
      run: () =>
        cleanCmd.includes("bid") || cleanCmd.includes("list")
          ? apiMethods.fetchBidRateAnalysis()
          : apiMethods.fetchTodayRate(),
    },
  ];

  const processCommand = async (cmd) => {
    const {
      trackInteraction,
      checkSafety,
      learningData,
      trainCustomIntent,
      forgetCustomIntent,
    } = learningMethods;

    const respond = (nextResponse) => {
      if (!nextResponse) return;
      setMessages((prev) => [...prev, nextResponse]);
      if (nextResponse.content) trackInteraction(cmd, nextResponse.content);
    };

    if (checkSafety(cmd)) {
      respond({
        role: "assistant",
        content:
          "⚠️ **Warning:** I detected potentially harmful content or inappropriate language in your message. Please keep our conversation professional and focused on system data.",
        suggestions: ["Total sauda today", "Active bids"],
      });
      return;
    }

    const rawCmd = cmd.trim().toLowerCase();
    const cleanCmd = rectifyTypo(rawCmd);
    const isOrderEditPage = /^\/manage-order\/edit-self-order\/[^/]+\/?$/.test(
      currentPath,
    );

    // Contextual interceptors run in priority order; the first non-null answer
    // wins. Each returns a response object (or a promise for one) or null.
    const interceptors = [
      // "Sauda no 123, change commodity to Wheat" from anywhere.
      async () => {
        const targeted = parseSariaTargetedOrderEditCommand(cmd);
        if (!targeted) return null;

        try {
          const orderResponse = await api.get(
            `/self-order?saudaNo=${encodeURIComponent(targeted.saudaNo)}`,
          );
          const responseData = orderResponse.data?.data ?? orderResponse.data;
          const orders = Array.isArray(responseData)
            ? responseData
            : responseData
              ? [responseData]
              : [];
          const order = orders.find(
            (item) => String(item.saudaNo) === targeted.saudaNo,
          );

          if (!order?._id) {
            return {
              role: "assistant",
              content: `I could not find Sauda ${targeted.saudaNo}. Check the number and try again.`,
              suggestions: ["Show recent saudas", "Total sauda today"],
            };
          }

          if (isOrderEditPage && currentPath.endsWith(`/${order._id}`)) {
            const editEvent = new CustomEvent(SARIA_AI_ORDER_EDIT_EVENT, {
              cancelable: true,
              detail: { command: targeted.editCommand },
            });
            window.dispatchEvent(editEvent);
            return {
              role: "assistant",
              content:
                editEvent.detail.response ||
                `I could not apply the requested change to Sauda ${targeted.saudaNo}.`,
              suggestions: ["yes", "no"],
            };
          }

          navigate(`/manage-order/edit-self-order/${order._id}`, {
            state: {
              orderData: order,
              aiOrderEditCommand: targeted.editCommand,
            },
          });
          return {
            role: "assistant",
            content: `Opening Sauda ${targeted.saudaNo} and staging your requested change. I will ask you to confirm before saving.`,
            suggestions: ["yes", "no"],
          };
        } catch (error) {
          console.error("Saria AI order lookup failed:", error);
          return {
            role: "assistant",
            content: `I could not load Sauda ${targeted.saudaNo}. Please try again.`,
            suggestions: ["Show recent saudas", "Total sauda today"],
          };
        }
      },

      // Free-form edit or yes/no confirmation while an order edit page is open.
      async () => {
        if (!isOrderEditPage) return null;
        const isEditSpeech = /^(?:please\s+)?(?:change|set|update|edit|clear)\b/i.test(
          cmd.trim(),
        );
        const isConfirmation = /^(?:yes|no|cancel|confirm|save)\s*[.!]?$/i.test(
          cmd.trim(),
        );
        if (!isEditSpeech && !isConfirmation) return null;

        let resolveResponse;
        const responsePromise = new Promise((resolve) => {
          resolveResponse = resolve;
        });
        const editEvent = new CustomEvent(SARIA_AI_ORDER_EDIT_EVENT, {
          cancelable: true,
          detail: { command: cmd, respond: resolveResponse },
        });
        const wasHandled = window.dispatchEvent(editEvent) === false;

        return {
          role: "assistant",
          content: wasHandled
            ? await responsePromise
            : "I could not connect to the open order form. Reopen Saria AI and try again.",
          suggestions: ["yes", "no", "Sauda no 123, change Commodity to Wheat"],
        };
      },

      // Teach / forget shortcuts.
      () => {
        const rememberMatch = rawCmd.match(
          /remember\s+(?:that\s+)?when\s+(?:i\s+)?(?:say|ask)\s+["']?(.+?)["']?\s*,?\s*(?:show|do|open|run)\s+(.+)/i,
        );
        if (rememberMatch) {
          const trigger = rememberMatch[1].trim();
          const action = rememberMatch[2].trim();
          trainCustomIntent(trigger, action);
          return {
            role: "assistant",
            content: `I will remember this after reloads: when you say *${trigger}*, I will *${action}*.`,
            suggestions: [trigger, "Show learned commands", "Train AI"],
          };
        }

        const forgetMatch = rawCmd.match(
          /forget\s+(?:the\s+)?(?:command|rule)?\s*["']?(.+?)["']?$/i,
        );
        if (forgetMatch && forgetCustomIntent) {
          forgetCustomIntent(forgetMatch[1].trim());
          return {
            role: "assistant",
            content: `I removed the learned command *${forgetMatch[1].trim()}*.`,
            suggestions: ["Train AI", "Show learned commands"],
          };
        }
        return null;
      },

      // Previously taught shortcuts.
      () => {
        const matching = learningData?.customIntents?.find((intent) =>
          cleanCmd.includes(intent.query),
        );
        if (!matching) return null;

        let result = {
          role: "assistant",
          content: `Performing: ${matching.expectedAction}...`,
          suggestions: ["Total sauda today", "Active bids"],
        };
        if (matching.expectedAction.includes("Open")) {
          const sidebarLink = findSidebarLink(matching.expectedAction);
          if (sidebarLink?.link) {
            result = getModuleResult({
              ...sidebarLink,
              section: sectionOf(sidebarLink.link),
            });
          }
        }
        return result;
      },

      // Greeting, training help and the "when I say X, do Y" pattern.
      () => {
        if (
          cleanCmd.includes("custom command") ||
          cleanCmd.includes("train custom")
        ) {
          return {
            role: "assistant",
            content:
              "Okay! To train a custom command, say something like: 'When I ask about rate, show highest rate today' or 'When I say go to buyers, open Buyer List'.",
            suggestions: ["Total sauda today", "Active bids"],
          };
        }

        if (cleanCmd.includes("train") || cleanCmd.includes("teach")) {
          return {
            role: "assistant",
            content:
              "Great! You can train me in two ways: \n1. By giving feedback on my responses, or \n2. By teaching custom commands! For example, you can say: 'When I ask X, do Y'",
            suggestions: [
              "Total sauda today",
              "Active bids",
              "Train custom command",
            ],
          };
        }

        if (
          cleanCmd === "hi" ||
          cleanCmd === "hello" ||
          cleanCmd === "hey" ||
          cleanCmd.includes("hi there") ||
          cleanCmd.includes("hello there")
        ) {
          return {
            role: "assistant",
            content: userName
              ? `Welcome Mr ${userName}! I am your Saria AI. How can I help you today?`
              : "Hello! I am your Saria AI. How can I help you today?",
            suggestions: [
              "Show sidebar menu",
              "Total sauda today",
              "Open Buyer List",
              "Active bids",
              "Train AI",
            ],
          };
        }

        const trainingMatch = rawCmd.match(
          /when i say (.+), (?:do|show|open|go to) (.+)/i,
        );
        if (trainingMatch) {
          const trigger = trainingMatch[1].trim().toLowerCase();
          const action = trainingMatch[2].trim();
          trainCustomIntent(trigger, action);
          return {
            role: "assistant",
            content: `Okay! I've learned that when you say '${trigger}', you want me to '${action}'. I'll remember that! 📝`,
            suggestions: ["Total sauda today", "Active bids"],
          };
        }
        return null;
      },

      // "Go back to <page>".
      () => {
        if (
          !cleanCmd.includes("go back to") &&
          !cleanCmd.includes("back to")
        ) {
          return null;
        }

        const targetName = cleanCmd
          .replace("go back to", "")
          .replace("back to", "")
          .trim();
        let targetPath = null;

        for (const page of pageHistory) {
          const action = findSidebarLink(page.path);
          if (action && action.name.toLowerCase().includes(targetName)) {
            targetPath = page.path;
            break;
          }
        }

        if (!targetPath) {
          const action = findSidebarLink(targetName);
          if (action) targetPath = action.link;
        }

        if (!targetPath) {
          return {
            role: "assistant",
            content: `I couldn't find the page "${targetName}" in your history. Try another page!`,
            suggestions: ["Show sidebar menu"],
          };
        }

        const targetAction = findSidebarLink(targetPath);
        return targetAction
          ? getModuleResult({
              ...targetAction,
              section: sectionOf(targetAction.link),
            })
          : {
              role: "assistant",
              content:
                `I found the page *${targetPath}*, but I will provide results here instead of redirecting.\n\n` +
                `Ask for the exact data you want from that module.`,
            };
      },

      // Recent page history.
      () => {
        if (
          !cleanCmd.includes("page history") &&
          !cleanCmd.includes("recent pages") &&
          !cleanCmd.includes("history")
        ) {
          return null;
        }

        if (pageHistory.length === 0) {
          return { role: "assistant", content: "No page history available yet!" };
        }

        let historyText = "*Your Recent Pages:*\n\n";
        pageHistory.slice(0, 5).forEach((page, idx) => {
          const action = findSidebarLink(page.path);
          historyText += `${idx + 1}. ${action?.name || page.path}\n`;
        });
        historyText += "\nUse 'Go back to [page name]' to navigate!";
        return {
          role: "assistant",
          content: historyText,
          suggestions: pageHistory
            .slice(1, 3)
            .map((page) => {
              const action = findSidebarLink(page.path);
              return action ? `Go back to ${action.name}` : null;
            })
            .filter(Boolean),
        };
      },

      // Full sidebar menu.
      () => {
        const wantsMenu =
          cleanCmd === "sidebar" ||
          cleanCmd === "menu" ||
          cleanCmd === "modules" ||
          cleanCmd.includes("all modules") ||
          cleanCmd.includes("sidebar menu") ||
          cleanCmd.includes("show modules");
        return wantsMenu ? getSidebarSummary() : null;
      },

      // Direct module name or "open/show <module>".
      () => {
        const sidebarAction = findSidebarLink(cleanCmd);
        if (!sidebarAction) return null;

        const isDirectNameMatch =
          cleanCmd === sidebarAction.name.toLowerCase() ||
          cleanCmd === sidebarAction.name.toLowerCase().replace(/\s+/g, "");
        const hasNavigationKeyword =
          cleanCmd.includes("go to") ||
          cleanCmd.includes("open") ||
          cleanCmd.includes("show") ||
          cleanCmd.includes("navigate");

        if (!isDirectNameMatch && !hasNavigationKeyword) return null;
        return getModuleResult({
          ...sidebarAction,
          section: sectionOf(sidebarAction.link),
        });
      },

      // Bare one-word query, for example "sauda", "payment" or "loading".
      () => buildShortQueryHelp(cleanCmd),
    ];

    for (const intercept of interceptors) {
      const intercepted = await intercept();
      if (intercepted) {
        respond(intercepted);
        return;
      }
    }

    const matches = buildMatches(cleanCmd);

    // Client-side action flows (email confirmation, tap-to-call, client PDF
    // generation, loading staging) must stay in the browser. Every other
    // request is answered by the n8n agent; if it is unreachable or not
    // configured, the local rule engine below still handles the request.
    const isLocalAction =
      (cleanCmd.includes("send") && (matches.emailTarget || matches.emailSauda)) ||
      Boolean(matches.call || matches.downloadLorry || matches.addLoading);

    if (!isLocalAction) {
      const agentResponse = await apiMethods.askSariaAI(
        cmd,
        (messages || [])
          .filter(
            (message) => message.role === "user" || message.role === "assistant",
          )
          .slice(-10)
          .map((message) => ({ role: message.role, content: message.content })),
        {
          path: currentPath,
          pageHistory: (pageHistory || []).map((page) => page.path),
          userName,
          userRole,
        },
      );

      if (agentResponse) {
        setMessages((prev) => [...prev, agentResponse]);
        trackInteraction(cmd, agentResponse.content);

        if (agentResponse.action) {
          const actionNote = await openSariaAIAction(
            api,
            navigate,
            agentResponse.action,
            currentPath,
          );
          if (actionNote) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: actionNote },
            ]);
          }
        }
        return;
      }
    }

    const matchedRule = buildLocalRules(cleanCmd, matches).find((rule) =>
      rule.test(),
    );

    let response = matchedRule
      ? await matchedRule.run()
      : cleanCmd.length >= 3
        ? await apiMethods.universalDeepSearch(cleanCmd)
        : {
            role: "assistant",
            content:
              "I'm not sure how to help. Try asking for *Sauda details*, *Vehicle No*, *Regional Status*, or *Market Highs*.",
            suggestions: [
              "Total sauda today",
              "Highest rate today",
              "Active bids",
            ],
          };

    if (response?.content && cleanCmd !== rawCmd) {
      response = {
        ...response,
        content: `_Showing results for "${cleanCmd}"_\n\n${response.content}`,
      };
    }

    respond(response);
  };

  const handleSend = (text, immediate = false) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const sendMessage = () => {
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setInput("");
      processCommand(userMessage);
    };

    if (immediate) {
      sendMessage();
    } else {
      debounceTimerRef.current = setTimeout(sendMessage, 150);
    }
  };

  return { handleSend, processCommand, liveSuggestions };
};
