import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaTimes,
  FaMinus,
  FaTrash,
  FaMagic,
  FaHistory,
  FaArrowRight,
  FaSpinner,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import api from "../../utils/apiClient/apiClient";

const AIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [thinkingPath, setThinkingPath] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your Deep Intelligence Agent. I have full control over the system data. Ask me anything about Saudas, Loadings, Sellers, Buyers, Bids, or Payments.",
      suggestions: [
        "Total sauda today",
        "Active bids",
        "Highest rate today",
        "Lorry status",
      ],
    },
  ]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const { userRole, user } = useAuth();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, isOpen, isMinimized, isLoadingData, thinkingPath]);

  if (userRole !== "Admin" && userRole !== "Employee") return null;

  const handleSend = (text) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    processCommand(userMessage.toLowerCase());
  };

  const fetchSellerDetails = async (name) => {
    setThinkingPath("Searching Sellers...");
    try {
      const response = await api.get(`/sellers?search=${name}`);
      const sellers = response.data.data || response.data;
      if (sellers && sellers.length > 0) {
        const s = sellers[0];
        return {
          role: "assistant",
          content:
            `**Seller Profile: ${s.sellerName}**\n\n` +
            `• **Mobile:** ${s.phoneNumbers?.[0]?.value || "N/A"}\n` +
            `• **Status:** ${s.status || "Active"}\n` +
            `• **Commodities:** ${s.commodities?.map((c) => c.name).join(", ") || "N/A"}\n` +
            `• **Created:** ${new Date(s.createdAt).toLocaleDateString()}`,
          suggestions: [`Saudas for ${s.sellerName}`, "Active bids"],
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const fetchBuyerDetails = async (name) => {
    setThinkingPath("Searching Buyers...");
    try {
      const response = await api.get(`/buyers?search=${name}`);
      const buyers = response.data.data || response.data;
      if (buyers && buyers.length > 0) {
        const b = buyers[0];
        return {
          role: "assistant",
          content:
            `**Buyer Profile: ${b.name}**\n\n` +
            `• **Mobile:** ${b.mobile || "N/A"}\n` +
            `• **Group:** ${b.groupId?.groupName || "N/A"}\n` +
            `• **Companies:** ${b.companyIds?.length || 0} registered`,
          suggestions: [`Saudas for ${b.name}`, "Create Self Order"],
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const universalDeepSearch = async (query) => {
    setIsLoadingData(true);
    setThinkingPath("Initiating System-Wide Scan...");

    // Parallelize all possible searches for maximum speed
    const searchTasks = [
      // 1. Try Lorry Search (if it has digits)
      /\d{2}/.test(query) ? fetchLorryDetails(query) : Promise.resolve(null),
      // 2. Try Sauda Search (if it looks like a number)
      /^\d+$/.test(query) ? fetchSaudaDetails(query) : Promise.resolve(null),
      // 3. Try Invoice Search
      /^\d+$/.test(query) ? fetchDetailsByBillNo(query) : Promise.resolve(null),
      // 4. Try Seller/Buyer/Company names
      fetchSellerDetails(query),
      fetchBuyerDetails(query),
      fetchCompanyStatus(query)
    ];

    const results = await Promise.all(searchTasks);
    
    // Find the first valid result (ignore "not found" messages)
    const validResult = results.find(r => 
      r && r.content && 
      !r.content.includes('I couldn\'t find') && 
      !r.content.includes('not found in system') &&
      !r.content.includes('No records found')
    );

    setIsLoadingData(false);
    setThinkingPath("");

    if (validResult) return validResult;

    return {
      role: 'assistant',
      content: `I've performed a deep scan for "**${query}**" across all Saudas, Invoices, Vehicles, and Partners, but no direct match was found.`,
      suggestions: ["Total sauda today", "Active bids", "Highest rate today"]
    };
  };

  const fetchSaudaDetails = async (saudaNo) => {
    setIsLoadingData(true);
    setThinkingPath(`Accessing Full MIS for Sauda ${saudaNo}...`);
    try {
      // Use the dedicated details route for better performance and complete data
      const response = await api.get(`/self-order/details/${saudaNo}`);
      const { order: sauda, entries: loadings, payments } = response.data;

      if (sauda) {
        let content = `**Deep Control Profile: Sauda No ${saudaNo}**\n\n` +
          `• **Buyer:** ${sauda.buyerCompany || sauda.buyer}\n` +
          `• **Supplier:** ${sauda.supplierCompany || 'N/A'}\n` +
          `• **Commodity:** ${sauda.commodity}\n` +
          `• **Quantity:** ${sauda.quantity} MT | **Pending:** ${sauda.pendingQuantity || 0} MT\n` +
          `• **Rate:** ₹${sauda.rate} | **CD:** ${sauda.cd}% | **GST:** ${sauda.gst}%\n` +
          `• **Location:** ${sauda.location || sauda.state || 'N/A'}\n` +
          `• **Status:** ${sauda.status?.toUpperCase() || 'ACTIVE'}\n\n`;

        if (loadings && loadings.length > 0) {
          content += `**Linked Deliveries (${loadings.length}):**\n`;
          loadings.slice(0, 5).forEach((l, idx) => {
            content += `${idx + 1}. **Lorry:** ${l.lorryNumber} | **Bill:** ${l.billNumber || 'N/A'} | **Wt:** ${l.loadingWeight} MT\n`;
          });
          if (loadings.length > 5) content += `*+ ${loadings.length - 5} more loadings*\n`;
        }

        if (payments && payments.length > 0) {
          content += `\n**Payment History (${payments.length}):**\n`;
          payments.slice(0, 3).forEach((p, idx) => {
            content += `• ₹${p.amount} on ${new Date(p.date).toLocaleDateString()} (${p.paymentMode || 'N/A'})\n`;
          });
        }

        return {
          role: 'assistant',
          content: content,
          suggestions: [`Payment of Sauda ${saudaNo}`, `Add loading for ${saudaNo}`]
        };
      } else {
        // Fallback to basic search if details route fails
        const searchRes = await api.get(`/self-order?saudaNo=${saudaNo}`);
        const data = searchRes.data.data || searchRes.data;
        const fallbackSauda = Array.isArray(data) ? data[0] : null;
        
        if (fallbackSauda) {
          return {
            role: 'assistant',
            content: `**Sauda ${saudaNo} found (Limited Details):**\n\n• **Buyer:** ${fallbackSauda.buyerCompany}\n• **Quantity:** ${fallbackSauda.quantity} MT`,
          };
        }

        return {
          role: 'assistant',
          content: `I couldn't find any Sauda with number **${saudaNo}**.`,
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error in deep sauda fetch. Please check if Sauda No is correct.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath('');
    }
  };

  const fetchDetailsByDate = async (dateStr) => {
    setIsLoadingData(true);
    setThinkingPath(`Searching system logs for ${dateStr}...`);
    try {
      // Normalize date from DD-MM-YYYY or similar to YYYY-MM-DD
      let normalizedDate = dateStr;
      if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts[0].length === 2) {
          // DD-MM-YYYY
          normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const [saudaRes, loadingRes] = await Promise.all([
        api.get(
          `/self-order?startDate=${normalizedDate}&endDate=${normalizedDate}`,
        ),
        api.get(
          `/Loading-Entry?startDate=${normalizedDate}&endDate=${normalizedDate}`,
        ),
      ]);

      const saudas = saudaRes.data.data || saudaRes.data || [];
      const loadings = loadingRes.data.data || loadingRes.data || [];

      if (saudas.length === 0 && loadings.length === 0) {
        return {
          role: "assistant",
          content: `System was inactive on **${dateStr}**. No records found.`,
        };
      }

      let content = `**System Logs for ${dateStr}**\n\n`;

      if (saudas.length > 0) {
        content += `**Saudas Created (${saudas.length}):**\n`;
        saudas.slice(0, 3).forEach((s) => {
          content += `• **Sauda ${s.saudaNo}**: ${s.buyerCompany} | ${s.commodity}\n`;
        });
        if (saudas.length > 3)
          content += `*+${saudas.length - 3} more saudas*\n`;
        content += "\n";
      }

      if (loadings.length > 0) {
        content += `**Loadings Recorded (${loadings.length}):**\n`;
        loadings.slice(0, 3).forEach((l) => {
          content += `• **Lorry ${l.lorryNumber}**: Sauda ${l.saudaNo} | ${l.loadingWeight} MT\n`;
        });
        if (loadings.length > 3)
          content += `*+${loadings.length - 3} more loadings*\n`;
      }

      return {
        role: "assistant",
        content: content,
        suggestions:
          saudas.length > 0 ? [`Sauda ${saudas[0].saudaNo} details`] : [],
      };
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in daily log search.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchActiveBids = async () => {
    setIsLoadingData(true);
    try {
      const response = await api.get("/bids?status=active");
      const bids = response.data.data || response.data;

      if (bids && bids.length > 0) {
        let content = `**Active Bids Today**\n\n`;
        bids.forEach((bid, idx) => {
          content += `${idx + 1}. **${bid.commodity}** | ${bid.location} | End: ${bid.endTime}\n`;
        });
        return {
          role: "assistant",
          content: content,
          suggestions: [`Interactions for ${bids[0].commodity}`],
        };
      } else {
        return {
          role: "assistant",
          content: "There are no active bids at the moment.",
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error fetching active bids.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchTodaySaudas = async () => {
    setIsLoadingData(true);
    setThinkingPath("Calculating today's sauda statistics...");
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(
        `/self-order?startDate=${today}&endDate=${today}`,
      );
      const saudas = response.data.data || response.data;

      if (saudas && saudas.length > 0) {
        let content = `**System Sauda Summary (${new Date().toLocaleDateString()})**\n\n`;
        content += `Total Count: **${saudas.length}**\n\n`;
        saudas.slice(0, 5).forEach((s, idx) => {
          content += `${idx + 1}. **Sauda ${s.saudaNo}**: ${s.buyerCompany} | ${s.commodity}\n`;
        });
        if (saudas.length > 5)
          content += `\n*Showing top 5 of ${saudas.length}*`;

        return {
          role: "assistant",
          content: content,
          suggestions: [`Sauda ${saudas[0].saudaNo} details`],
        };
      } else {
        return {
          role: "assistant",
          content: "System shows 0 saudas created today.",
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in sauda summary fetch.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchCompanyStatus = async (companyName) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/companies?search=${companyName}`);
      const companies = response.data.data || response.data;

      if (companies && companies.length > 0) {
        const comp = companies[0];
        return {
          role: "assistant",
          content:
            `**Company Status: ${comp.companyName}**\n\n` +
            `• **Location:** ${comp.location || "N/A"}\n` +
            `• **GST:** ${comp.gstNo || "N/A"}\n` +
            `• **Status:** Active\n` +
            `• **Contact:** ${comp.mobile || "N/A"}`,
          suggestions: [`Saudas for ${comp.companyName}`],
        };
      } else {
        return {
          role: "assistant",
          content: `I couldn't find any company matching **${companyName}**.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error fetching company status.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchBidInteractions = async (commodity) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/participateBids?search=${commodity}`);
      const interactions = response.data.data || response.data;

      if (interactions && interactions.length > 0) {
        let content = `**Latest Bid Interactions for ${commodity}**\n\n`;
        interactions.slice(0, 5).forEach((item, idx) => {
          content += `${idx + 1}. **${item.sellerName}**: ₹${item.rate} | ${item.quantity} MT | ${new Date(item.createdAt).toLocaleTimeString()}\n`;
        });
        return {
          role: "assistant",
          content: content,
        };
      } else {
        return {
          role: "assistant",
          content: `No interactions found for **${commodity}**.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error fetching bid interactions.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchSaudaPayment = async (saudaNo) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/self-order?saudaNo=${saudaNo}`);
      const data = response.data;
      const sauda = Array.isArray(data)
        ? data[0]
        : data.data
          ? data.data[0]
          : null;

      if (sauda) {
        return {
          role: "assistant",
          content:
            `**Payment Details for Sauda ${saudaNo}**\n\n` +
            `• **Total Quantity:** ${sauda.quantity} MT\n` +
            `• **Pending Quantity:** ${sauda.pendingQuantity || 0} MT\n` +
            `• **Rate:** ₹${sauda.rate}\n` +
            `• **Payment Terms:** ${sauda.paymentTerms || "N/A"}\n` +
            `• **CD:** ${sauda.cd}% | **GST:** ${sauda.gst}%\n` +
            `• **Status:** ${sauda.status || "Active"}\n\n` +
            `*Tip: You can check loading entries for this sauda to see actual delivered weight.*`,
          suggestions: [
            `Loading entries for Sauda ${saudaNo}`,
            `Sauda ${saudaNo} details`,
          ],
        };
      } else {
        return {
          role: "assistant",
          content: `I couldn't find any Sauda with number **${saudaNo}**.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error fetching sauda payment details.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchDetailsByBillNo = async (billNo) => {
    setIsLoadingData(true);
    setThinkingPath(`Locating invoice: ${billNo}...`);
    try {
      // Try exact bill number first, then search
      const response = await api.get(`/Loading-Entry?search=${billNo}`);
      const data = response.data.data || response.data;

      if (data && data.length > 0) {
        // Find the best match for the bill number
        const entry = data.find(e => 
          e.billNumber?.toString().toLowerCase().includes(billNo.toLowerCase())
        ) || data[0];

        return {
          role: 'assistant',
          content: `**Invoice Found: ${entry.billNumber || billNo}**\n\n` +
            `• **Lorry:** ${entry.lorryNumber}\n` +
            `• **Sauda Link:** Sauda ${entry.saudaNo}\n` +
            `• **Date:** ${new Date(entry.loadingDate).toLocaleDateString()}\n` +
            `• **Weight:** ${entry.loadingWeight} MT\n` +
            `• **Buyer/Supplier:** ${entry.buyerCompany} / ${entry.supplierCompany}\n` +
            `• **Payment:** ${entry.paymentStatus === 'done' ? 'PAID' : 'PENDING'}`,
          suggestions: [`Sauda ${entry.saudaNo} details`, `Lorry ${entry.lorryNumber} details`]
        };
      } else {
        return {
          role: 'assistant',
          content: `Invoice **${billNo}** not found in system. Try searching by Sauda or Lorry.`,
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error in invoice lookup.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath('');
    }
  };

  const fetchDetailsByState = async (state) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/self-order?search=${state}`);
      const saudas = response.data.data || response.data;

      if (saudas && saudas.length > 0) {
        let content = `**Recent Saudas for State: ${state.toUpperCase()}**\n\n`;
        saudas.slice(0, 5).forEach((s, idx) => {
          content += `${idx + 1}. **Sauda ${s.saudaNo}**: ${s.buyerCompany} | ${s.commodity} | ${s.quantity} MT\n`;
        });
        if (saudas.length > 5)
          content += `\n*Showing 5 of ${saudas.length} saudas.*`;

        return {
          role: "assistant",
          content: content,
          suggestions: [
            `Sauda ${saudas[0].saudaNo} details`,
            `Today's total sauda`,
          ],
        };
      } else {
        return {
          role: "assistant",
          content: `No saudas found for State: **${state}**.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error fetching state-wise details.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchLoadingEntriesBySauda = async (saudaNo) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/Loading-Entry?saudaNo=${saudaNo}`);
      const entries = response.data.data || response.data;

      if (entries && entries.length > 0) {
        let content = `**Loading Entries for Sauda ${saudaNo}**\n\n`;
        entries.slice(0, 5).forEach((entry, idx) => {
          content += `${idx + 1}. **Lorry:** ${entry.lorryNumber} | **Date:** ${new Date(entry.loadingDate).toLocaleDateString()} | **Weight:** ${entry.loadingWeight} MT\n`;
        });
        if (entries.length > 5)
          content += `\n*Showing 5 of ${entries.length} entries.*`;

        return {
          role: "assistant",
          content: content,
          suggestions: [`Sauda ${saudaNo} details`, "View Unloading Report"],
        };
      } else {
        return {
          role: "assistant",
          content: `No loading entries found for Sauda **${saudaNo}**.`,
          suggestions: [`Sauda ${saudaNo} details`],
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error fetching loading entries. Please try again.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchLorryDetails = async (lorryNo) => {
    setIsLoadingData(true);
    try {
      // Clean the lorry number (remove spaces)
      const cleanLorry = lorryNo.replace(/\s+/g, "").toUpperCase();

      // If it's 4 digits, we assume it's the last 4 digits
      const isLast4 = /^\d{4}$/.test(cleanLorry);
      const url = isLast4
        ? `/Loading-Entry/lorry-wise?lorryNumber=${cleanLorry}`
        : `/Loading-Entry/lorry-wise?lorryNumber=${cleanLorry}`;

      const response = await api.get(url);
      const data = response.data.data || response.data;

      if (data && data.length > 0) {
        // If we searched by last 4 digits, we might get multiple results
        const entries = isLast4
          ? data.filter((e) =>
              e.lorryNumber.replace(/\s+/g, "").endsWith(cleanLorry),
            )
          : data;

        if (entries.length === 0) {
          return {
            role: "assistant",
            content: `No records found for Lorry ending in **${lorryNo}**.`,
          };
        }

        const entry = entries[0];
        let content =
          entries.length > 1
            ? `**Found ${entries.length} lorries matching "${lorryNo}". Showing latest:**\n\n`
            : `**Latest Loading for Lorry ${entry.lorryNumber}**\n\n`;

        content +=
          `• **Sauda No:** ${entry.saudaNo}\n` +
          `• **Date:** ${new Date(entry.loadingDate).toLocaleDateString()}\n` +
          `• **Weight:** ${entry.loadingWeight} MT\n` +
          `• **Buyer:** ${entry.buyerCompany}\n` +
          `• **Supplier:** ${entry.supplierCompany}\n` +
          `• **Status:** ${entry.unloadingDate ? "Unloaded" : "In Transit"}`;

        return {
          role: "assistant",
          content: content,
          suggestions: [
            `Sauda ${entry.saudaNo} details`,
            "Generate Lorry Challan",
          ],
        };
      } else {
        return {
          role: "assistant",
          content: `No records found for Lorry **${lorryNo}**.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error fetching lorry details.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchTodayRate = async () => {
    setIsLoadingData(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(
        `/Loading-Entry?startDate=${today}&endDate=${today}`,
      );
      const entries = response.data.data || response.data;

      if (entries && entries.length > 0) {
        const rates = {};
        entries.forEach((e) => {
          if (e.commodity && e.rate) {
            if (!rates[e.commodity]) rates[e.commodity] = [];
            rates[e.commodity].push(e.rate);
          }
        });

        let content = `**Today's Highest Loading Rates (${new Date().toLocaleDateString()})**\n\n`;
        Object.keys(rates).forEach((comm) => {
          const maxRate = Math.max(...rates[comm]);
          content += `• **${comm}:** Highest ₹${maxRate} (Range: ₹${Math.min(...rates[comm])} - ₹${maxRate})\n`;
        });

        return {
          role: "assistant",
          content: content,
        };
      } else {
        return {
          role: "assistant",
          content:
            "No loading entries found for today yet, so I can't determine today's rates.",
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error fetching today's rates.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const processCommand = async (cmd) => {
    const cleanCmd = cmd.trim().toLowerCase();
    let response = null;

    // 1. Specific Data Queries (Regex Patterns)
    const saudaMatch = cleanCmd.match(/sauda\s*(?:no)?\s*[:\s]*(\d+)/i);
    const lorryMatch = cleanCmd.match(/lorry\s*(?:no)?\s*[:\s]*([a-z0-9\s]+)/i);
    const billMatch = cleanCmd.match(/(?:bill|invoice)\s*(?:no)?\s*[:\s]*([a-z0-9\s]+)/i);
    const stateMatch = cleanCmd.match(/(?:state|from)\s+([a-z\s]{3,})/i);
    const dateMatch = cleanCmd.match(/(?:date)\s*[:\s]*(\d{1,2}-\d{1,2}-\d{4})/i);
    const companyMatch = cleanCmd.match(/(?:status of|company)\s+([a-z0-9\s]+)/i);
    const interactionMatch = cleanCmd.match(/(?:interactions for|bid info for)\s+([a-z0-9\s]+)/i);

    if (saudaMatch && billMatch && dateMatch) {
      response = await fetchSaudaDetails(saudaMatch[1]);
      if (response && response.content) {
        response.content = `**Cross-Referencing Sauda ${saudaMatch[1]}, Bill ${billMatch[1]} for ${dateMatch[1]}**\n\n` + response.content;
      }
    } else if (cleanCmd.includes('loading entry for sauda') && saudaMatch) {
      response = await fetchLoadingEntriesBySauda(saudaMatch[1]);
    } else if (saudaMatch && (cleanCmd.includes('payment') || cleanCmd.includes('payemnt'))) {
      response = await fetchSaudaPayment(saudaMatch[1]);
    } else if (saudaMatch) {
      response = await fetchSaudaDetails(saudaMatch[1]);
    } else if (billMatch) {
      response = await fetchDetailsByBillNo(billMatch[1].trim());
    } else if (dateMatch) {
      response = await fetchDetailsByDate(dateMatch[1]);
    } else if (lorryMatch) {
      response = await fetchLorryDetails(lorryMatch[1].trim());
    } else if (stateMatch && !cleanCmd.includes('loading from')) {
      response = await fetchDetailsByState(stateMatch[1].trim());
    } else if (cleanCmd.includes('total sauda today') || (cleanCmd.includes('sauda') && cleanCmd.includes('today'))) {
      response = await fetchTodaySaudas();
    } else if (cleanCmd.includes('active bids') || cleanCmd.includes('show bids')) {
      response = await fetchActiveBids();
    } else if (interactionMatch) {
      response = await fetchBidInteractions(interactionMatch[1].trim());
    } else if (companyMatch) {
      response = await fetchCompanyStatus(companyMatch[1].trim());
    } else if (cleanCmd.includes('rate') && (cleanCmd.includes('today') || cleanCmd.includes('loading') || cleanCmd.includes('highest'))) {
      response = await fetchTodayRate();
    } 
    // 2. Navigation...
    else if (cleanCmd.includes('self order') || cleanCmd.includes('create order')) {
      response = {
        role: 'assistant',
        content: "Opening **Self Order** creation interface...",
        action: () => navigate('/manage-order/add-self-order')
      };
    } else if (cleanCmd.includes('loading entry') || cleanCmd.includes('add loading')) {
      response = {
        role: 'assistant',
        content: "Accessing **Add Loading Entry**...",
        action: () => navigate('/Loading-Entry/add-loading-entry')
      };
    } else if (cleanCmd.includes('lorry challan') || cleanCmd.includes('generate challan') || cleanCmd.includes('print challan')) {
      response = {
        role: 'assistant',
        content: "Opening **Loading List** for challan generation...",
        action: () => navigate('/Loading-Entry/list-loading-entry')
      };
    } else if (cleanCmd.includes('unloading report') || cleanCmd.includes('receiving list') || cleanCmd.includes('view unloading')) {
      response = {
        role: 'assistant',
        content: "Fetching **Receiving List** for unloading logs...",
        action: () => navigate('/Loading-Entry/receiving-list')
      };
    } else if (cleanCmd.includes('dashboard')) {
      response = {
        role: 'assistant',
        content: "Returning to main **Dashboard**.",
        action: () => navigate('/dashboard')
      };
    } else if (cleanCmd.includes('hello') || cleanCmd.includes('hi')) {
      response = {
        role: 'assistant',
        content: `Hello ${user?.name || 'User'}! I am ready to scan the system for you. What details do you need?`,
        suggestions: ['Today\'s total sauda', 'Active bids', 'Highest rate today']
      };
    } 
    // 3. Universal Fallback (Deep Intelligence)
    else if (cleanCmd.length >= 3) {
      response = await universalDeepSearch(cleanCmd);
    }
    else {
      response = {
        role: 'assistant',
        content: "I'm not sure how to help. Try asking for **Sauda details**, **Vehicle No**, **Regional Status**, or **Market Highs**.",
        suggestions: ['Total sauda today', 'Highest rate today', 'Active bids']
      };
    }

    setMessages(prev => [...prev, response]);
    if (response.action) {
      setTimeout(() => response.action(), 1500);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        role: "assistant",
        content: "System cache cleared. Deep Intelligence is ready.",
        suggestions: [
          "Total sauda today",
          "Active bids",
          "Highest rate today",
          "Create Self Order",
        ],
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <FaRobot className="text-xl animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  Hansaria AI Agent
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[10px] text-emerald-100 font-medium uppercase tracking-wider">
                    Online
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Minimize"
              >
                <FaMinus size={14} />
              </button>
              <button
                onClick={clearHistory}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Clear History"
              >
                <FaTrash size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Close"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth no-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  {msg.suggestions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s)}
                          className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all flex items-center gap-1.5 group"
                        >
                          {s}
                          <FaArrowRight
                            size={8}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(isLoadingData || thinkingPath) && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <FaSpinner className="animate-spin text-emerald-600" />
                  <span className="text-sm text-slate-500 font-medium italic">
                    {thinkingPath || "Fetching details..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a command..."
                className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
              >
                <FaPaperPlane size={16} />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-center text-slate-400 font-medium">
              Powered by Hansaria Admin AI • Minimal Commands Supported
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="flex flex-col items-end gap-3">
        {isMinimized && isOpen && (
          <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-5 duration-300 mb-2">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              AI Agent is active
            </p>
          </div>
        )}

        <button
          onClick={() => {
            if (isOpen && isMinimized) {
              setIsMinimized(false);
            } else {
              setIsOpen(!isOpen);
            }
          }}
          className={`
            group relative w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-2xl
            ${
              isOpen && !isMinimized
                ? "bg-slate-800 rotate-90 scale-90"
                : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-110 hover:-translate-y-1 active:scale-95 shadow-emerald-200"
            }
          `}
        >
          {isOpen && !isMinimized ? (
            <FaTimes className="text-white text-2xl -rotate-90" />
          ) : (
            <>
              <div className="absolute inset-0 bg-white/20 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <FaRobot className="text-white text-3xl drop-shadow-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-white rounded-full shadow-sm" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIAgent;
