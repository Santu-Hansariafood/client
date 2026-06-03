import { useRef } from "react";
import dashboardData from "../../../data/dashboardData.json";

export const useAIAgentCommands = ({
  input,
  setInput,
  setMessages,
  isLoadingData,
  navigate,
  apiMethods,
  learningMethods,
}) => {
  const debounceTimerRef = useRef(null);
  const sidebarModules = dashboardData.sections;

  const SYSTEM_DICTIONARY = [
    "sauda", "order", "lorry", "vehicle", "truck", "bill", "invoice", "challan",
    "payment", "due", "outstanding", "commodity", "commodities", "buyer", "seller",
    "bid", "bids", "participate", "active", "pending", "accepted", "today", "sidebar",
    "menu", "modules", "weather", "account", "status", "loading", "unloading", "dispatch"
  ];

  const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const rectifyTypo = (text) => {
    const words = text.split(/\s+/);
    const correctedWords = words.map(word => {
      if (word.length < 3 || /^\d+$/.test(word)) return word;
      
      let bestMatch = word;
      let minDistance = 2;

      SYSTEM_DICTIONARY.forEach(term => {
        const distance = getLevenshteinDistance(word, term);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = term;
        }
      });
      return bestMatch;
    });
    return correctedWords.join(" ");
  };

  const findSidebarLink = (query) => {
    const cleanQuery = query.toLowerCase().trim().replace(/\s+/g, "");

    for (const section of sidebarModules) {
      for (const action of section.actions) {
        const actionName = action.name.toLowerCase().replace(/\s+/g, "");
        if (
          cleanQuery === actionName ||
          cleanQuery.includes(actionName) ||
          actionName.includes(cleanQuery)
        ) {
          return action;
        }
      }
    }

    for (const section of sidebarModules) {
      const sectionName = section.section.toLowerCase().replace(/\s+/g, "");
      if (
        cleanQuery === sectionName ||
        cleanQuery.includes(sectionName) ||
        sectionName.includes(cleanQuery)
      ) {
        return section.actions[0];
      }
    }
    return null;
  };

  const getSidebarSummary = () => {
    let content = "*System Modules & Navigation:*\n\n";
    sidebarModules.forEach((s) => {
      content += `• *${s.section}*: ${s.actions.map((a) => `_${a.name}_`).join(", ")}\n`;
    });
    content += "\n*Tip: Just type the name of any module to go there!*";
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

  const processCommand = async (cmd) => {
    const { trackInteraction, checkSafety } = learningMethods;

    // Safety Check for harmful content or profanity
    if (checkSafety(cmd)) {
      const warningResponse = {
        role: "assistant",
        content: "⚠️ **Warning:** I detected potentially harmful content or inappropriate language in your message. Please keep our conversation professional and focused on system data.",
        suggestions: ["Total sauda today", "Active bids"]
      };
      setMessages((prev) => [...prev, warningResponse]);
      return;
    }

    const rawCmd = cmd.trim().toLowerCase();
    const cleanCmd = rectifyTypo(rawCmd); // Auto-rectify typos
    let response = null;

    if (cleanCmd !== rawCmd) {
      console.log(`Auto-corrected: "${rawCmd}" -> "${cleanCmd}"`);
    }

    if (
      cleanCmd === "sidebar" ||
      cleanCmd === "menu" ||
      cleanCmd === "modules" ||
      cleanCmd.includes("all modules") ||
      cleanCmd.includes("sidebar menu") ||
      cleanCmd.includes("show modules")
    ) {
      response = getSidebarSummary();
    } else {
      const sidebarAction = findSidebarLink(cleanCmd);
      if (sidebarAction) {
        const isDirectNameMatch =
          cleanCmd === sidebarAction.name.toLowerCase() ||
          cleanCmd === sidebarAction.name.toLowerCase().replace(/\s+/g, "");
        const hasNavigationKeyword =
          cleanCmd.includes("go to") ||
          cleanCmd.includes("open") ||
          cleanCmd.includes("show") ||
          cleanCmd.includes("navigate");

        if (isDirectNameMatch || hasNavigationKeyword) {
          response = {
            role: "assistant",
            content: `Redirecting you to *${sidebarAction.name}*...`,
            action: () => {
              navigate(sidebarAction.link);
            },
          };
        }
      }
    }

    if (response) {
      setMessages((prev) => [...prev, response]);
      trackInteraction(cmd, response.content); // Track interaction with response context
      if (response.action) setTimeout(() => response.action(), 1500);
      return;
    }

    const saudaMatch =
      cleanCmd.match(/(?:sauda|order)\s*(?:no|number)?\s*[:\s]*(\d+)/i) ||
      cleanCmd.match(/(\d+)\s*(?:sauda|order)/i);

    const lorryMatch = cleanCmd.match(
      /(?:lorry|vehicle|truck)\s*(?:no|number)?\s*[:\s]*([a-z0-9\s]{4,})/i,
    );
    const billMatch = cleanCmd.match(
      /(?:bill|invoice|challan)\s*(?:no|number)?\s*[:\s]*(\d+)/i,
    );
    const addLoadingMatch = cleanCmd.match(
      /(?:add|create)\s*(?:loading|entry)\s*(?:for|on)?\s*(?:sauda)?\s*[:\s]*(\d+)/i,
    );
    const stateMatch = cleanCmd.match(/(?:state|from)\s+([a-z\s]{3,})/i);

    const dateMatch =
      cleanCmd.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/) ||
      cleanCmd.match(
        /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{0,4})/i,
      );

    const companyMatch = cleanCmd.match(
      /(?:status of|company)\s+([a-z0-9\s]+)/i,
    );
    const interactionMatch = cleanCmd.match(
      /(?:interactions for|bid info for)\s+([a-z0-9\s]+)/i,
    );
    const downloadLorryMatch = cleanCmd.match(
      /(?:download lorry report|generate lorry report)\s*([a-z0-9\s]+)/i,
    );
    const bidComponentMatch = cleanCmd.match(
      /(?:analyze|break down|components of)\s+([a-z0-9\s]+)\s+bid/i,
    );
    const buyerMatch = cleanCmd.match(/(?:buyer)\s+([a-z0-9\s]+)/i);
    const sellerMatch = cleanCmd.match(/(?:seller)\s+([a-z0-9\s]+)/i);

    const dueMatch =
      cleanCmd.match(
        /(?:due|outstanding)\s*(?:sauda|amount|list)?\s*(?:for|of)?\s+([a-z0-9\s]+)/i,
      ) ||
      cleanCmd.match(
        /([a-z0-9\s]+)\s+(?:due|outstanding)\s*(?:sauda|amount|list)?/i,
      );

    const pendingMatch =
      cleanCmd.match(
        /(?:pending)\s*(?:sauda|order|list)?\s*(?:for|of|on)?\s+([a-z0-9\s]+)/i,
      ) ||
      cleanCmd.match(/([a-z0-9\s]+)\s+(?:pending)\s*(?:sauda|order|list)?/i);

    const companyConsigneeMatch = cleanCmd.match(
      /(?:sauda|order)?\s*(?:for|on)?\s*company\s+([a-z0-9\s]+)\s*(?:to|and|consignee)?\s*consignee\s+([a-z0-9\s]+)/i,
    );
    const relationshipMatch =
      cleanCmd.match(
        /(?:relationship|trade|info)\s*(?:between|for)?\s*buyer\s+([a-z0-9\s]+)\s*(?:and|with)?\s*seller\s+([a-z0-9\s]+)/i,
      ) ||
      cleanCmd.match(
        /buyer\s+([a-z0-9\s]+)\s*(?:and|with)?\s*seller\s+([a-z0-9\s]+)/i,
      );

    if (cleanCmd.includes("commodity") || cleanCmd.includes("commodities")) {
      response = await apiMethods.fetchCommodities();
    } else if (
      cleanCmd.includes("current sauda") ||
      cleanCmd.includes("last sauda")
    ) {
      response = await apiMethods.fetchLastSauda();
    } else if (cleanCmd.includes("account status")) {
      response = await apiMethods.fetchAccountStatus();
    } else if (cleanCmd.includes("weather")) {
      response = await apiMethods.fetchWeather();
    } else if (companyConsigneeMatch) {
      response = await apiMethods.fetchSaudasByCompanyAndConsignee(
        companyConsigneeMatch[1].trim(),
        companyConsigneeMatch[2].trim(),
      );
    } else if (relationshipMatch) {
      response = await apiMethods.fetchRelationshipContext(
        relationshipMatch[1].trim(),
        relationshipMatch[2].trim(),
      );
    } else if (dueMatch && !cleanCmd.includes("sauda no")) {
      response = await apiMethods.fetchSellerSaudaStatus(dueMatch[1].trim(), "due");
    } else if (pendingMatch && !cleanCmd.includes("sauda no")) {
      response = await apiMethods.fetchPendingSaudaByEntity(pendingMatch[1].trim());
    } else if (cleanCmd.includes("contact") && !buyerMatch && !sellerMatch) {
      response = {
        role: "assistant",
        content:
          `*Saria AI Contact Support*\n\n` +
          `• *Admin Hotline:* +91 98765 43210\n` +
          `• *Tech Support:* info@hSariafood.com\n` +
          `• *Operating Hours:* 10:00 AM - 07:00 PM` +
          `• *Website:* https://www.hSariafood.com`,
      };
    } else if (downloadLorryMatch) {
      const lNo = downloadLorryMatch[1].trim();
      response = {
        role: "assistant",
        content: `Redirecting you to the **Loading List** to download the full Excel report for Lorry *${lNo}*...`,
        action: () => {
          navigate(`/Loading-Entry/list-loading-entry?lorryNumber=${lNo}`);
        },
      };
    } else if (bidComponentMatch) {
      response = await apiMethods.fetchBidComponentAnalysis(bidComponentMatch[1].trim());
    } else if (addLoadingMatch) {
      const sNo = addLoadingMatch[1];
      response = {
        role: "assistant",
        content: `Opening *Add Loading Entry* for Sauda ${sNo}...`,
        action: () => {
          navigate(`/Loading-Entry/add-loading-entry?saudaNo=${sNo}`);
        },
      };
    } else if (buyerMatch) {
      const details = await apiMethods.fetchFullPartnerDetails(buyerMatch[1].trim(), "Buyer");
      response = details || {
        role: "assistant",
        content: `I couldn't find any Buyer matching "*${buyerMatch[1].trim()}*".`,
      };
    } else if (sellerMatch) {
      const details = await apiMethods.fetchFullPartnerDetails(sellerMatch[1].trim(), "Seller");
      response = details || {
        role: "assistant",
        content: `I couldn't find any Seller matching "*${sellerMatch[1].trim()}*".`,
      };
    } else if (saudaMatch && billMatch && dateMatch) {
      response = await apiMethods.fetchSaudaDetails(saudaMatch[1]);
      if (response && response.content) {
        response.content =
          `*Cross-Referencing Sauda ${saudaMatch[1]}, Bill ${billMatch[1]} for ${dateMatch[1]}*\n\n` +
          response.content;
      }
    } else if (cleanCmd.includes("loading entry for sauda") && saudaMatch) {
      response = await apiMethods.fetchLoadingEntriesBySauda(saudaMatch[1]);
    } else if (
      saudaMatch &&
      (cleanCmd.includes("payment") || cleanCmd.includes("payemnt"))
    ) {
      response = await apiMethods.fetchSaudaPayment(saudaMatch[1]);
    } else if (saudaMatch) {
      response = await apiMethods.fetchSaudaDetails(saudaMatch[1]);
    } else if (billMatch) {
      response = await apiMethods.fetchDetailsByBillNo(billMatch[1].trim());
    } else if (dateMatch) {
      response = await apiMethods.fetchDetailsByDate(dateMatch[1]);
    } else if (lorryMatch) {
      response = await apiMethods.fetchLorryDetails(lorryMatch[1].trim());
    } else if (stateMatch && !cleanCmd.includes("loading from")) {
      response = await apiMethods.fetchDetailsByState(stateMatch[1].trim());
    } else if (
      cleanCmd.includes("total sauda today") ||
      (cleanCmd.includes("sauda") && cleanCmd.includes("today"))
    ) {
      response = await apiMethods.fetchTodaySaudas();
    } else if (
      cleanCmd.includes("active bids") ||
      cleanCmd.includes("show bids")
    ) {
      response = await apiMethods.fetchActiveBids();
    } else if (interactionMatch) {
      response = await apiMethods.fetchBidInteractions(interactionMatch[1].trim());
    } else if (companyMatch) {
      const details = await apiMethods.fetchFullCompanyDetails(companyMatch[1].trim());
      response = details || {
        role: "assistant",
        content: `No records for company *${companyMatch[1].trim()}*.`,
      };
    } else if (
      cleanCmd.includes("rate") &&
      (cleanCmd.includes("today") ||
        cleanCmd.includes("loading") ||
        cleanCmd.includes("highest") ||
        cleanCmd.includes("bid"))
    ) {
      if (cleanCmd.includes("bid") || cleanCmd.includes("list")) {
        response = await apiMethods.fetchBidRateAnalysis();
      } else {
        response = await apiMethods.fetchTodayRate();
      }
    } else if (cleanCmd.length >= 3) {
      response = await apiMethods.universalDeepSearch(cleanCmd);
    } else {
      response = {
        role: "assistant",
        content:
          "I'm not sure how to help. Try asking for *Sauda details*, *Vehicle No*, *Regional Status*, or *Market Highs*.",
        suggestions: ["Total sauda today", "Highest rate today", "Active bids"],
      };
    }

    setMessages((prev) => [...prev, response]);
    
    if (response && response.content) {
      if (cleanCmd !== rawCmd) {
        response.content = `_Showing results for "${cleanCmd}"_\n\n` + response.content;
      }
      trackInteraction(cmd, response.content);
    }

    if (response.action) {
      setTimeout(() => response.action(), 1500);
    }
  };

  const handleSend = (text) => {
    const userMessage = text || input.trim();
    if (!userMessage || isLoadingData) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setInput("");
      processCommand(userMessage.toLowerCase());
    }, 300);
  };

  return { handleSend, processCommand };
};
