import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaTimes,
  FaMinus,
  FaTrash,
  FaArrowRight,
  FaSpinner,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import api from "../../utils/apiClient/apiClient";
import dashboardData from "../../data/dashboardData.json";

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
        "Hello! I am your Deep Intelligence Agent. I have full control over the system data and navigation. Ask me anything about Saudas, Loadings, Sellers, Buyers, or Payments. I can also open any page for you!",
      suggestions: [
        "Show sidebar menu",
        "Total sauda today",
        "Open Buyer List",
        "Active bids",
      ],
    },
  ]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const { userRole, user } = useAuth();

  const sidebarModules = dashboardData.sections;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [
    messages,
    scrollToBottom,
    isOpen,
    isMinimized,
    isLoadingData,
    thinkingPath,
  ]);

  if (userRole !== "Admin" && userRole !== "Employee") return null;

  const handleSend = (text) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    processCommand(userMessage.toLowerCase());
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
            `*Seller Profile: ${s.sellerName}*\n\n` +
            `• *Mobile:* ${s.phoneNumbers?.[0]?.value || "N/A"}\n` +
            `• *Status:* ${s.status || "Active"}\n` +
            `• *Commodities:* ${s.commodities?.map((c) => c.name).join(", ") || "N/A"}\n` +
            `• *Created:* ${new Date(s.createdAt).toLocaleDateString()}`,
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
            `*Buyer Profile: ${b.name}*\n\n` +
            `• *Mobile:* ${b.mobile || "N/A"}\n` +
            `• *Group:* ${b.groupId?.groupName || "N/A"}\n` +
            `• *Companies:* ${b.companyIds?.length || 0} registered`,
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

    if (/^\d{3,5}$/.test(query)) {
      setThinkingPath("Checking Sauda Records...");
      const saudaRes = await fetchSaudaDetails(query);
      if (saudaRes && !saudaRes.content.includes("I couldn't find")) {
        setIsLoadingData(false);
        setThinkingPath("");
        return saudaRes;
      }
    }

    setThinkingPath("Scanning Vehicles and Invoices...");
    const [lorryRes, billRes] = await Promise.all([
      /\d{2}/.test(query) ? fetchLorryDetails(query) : Promise.resolve(null),
      /^\d+$/.test(query) ? fetchDetailsByBillNo(query) : Promise.resolve(null),
    ]);

    if (lorryRes && !lorryRes.content.includes("No records found")) {
      setIsLoadingData(false);
      setThinkingPath("");
      return lorryRes;
    }
    if (billRes && !billRes.content.includes("not found in system")) {
      setIsLoadingData(false);
      setThinkingPath("");
      return billRes;
    }

    setThinkingPath("Searching Partners and Companies...");
    const [seller, buyer, company] = await Promise.all([
      fetchSellerDetails(query),
      fetchBuyerDetails(query),
      fetchCompanyStatus(query),
    ]);

    setIsLoadingData(false);
    setThinkingPath("");

    if (seller) return seller;
    if (buyer) return buyer;
    if (company && !company.content.includes("No records for company"))
      return company;

    return {
      role: "assistant",
      content: `I've performed a deep scan for "*${query}*" across all Saudas, Invoices, Vehicles, and Partners, but no direct match was found.`,
      suggestions: ["Total sauda today", "Active bids", "Highest rate today"],
    };
  };

  const fetchSaudaDetails = async (saudaNo) => {
    setIsLoadingData(true);
    setThinkingPath(`Accessing Full MIS for Sauda ${saudaNo}...`);
    try {
      const response = await api.get(`/self-order/details/${saudaNo}`);
      const { order: sauda, entries: loadings, payments } = response.data;

      if (sauda) {
        let content =
          `*Deep Control Profile: Sauda No ${saudaNo}*\n\n` +
          `• *Buyer:* ${sauda.buyerCompany || sauda.buyer}\n` +
          `• *Supplier:* ${sauda.supplierCompany || "N/A"}\n` +
          `• *Commodity:* ${sauda.commodity}\n` +
          `• *Quantity:* ${sauda.quantity} MT | *Pending:* ${sauda.pendingQuantity || 0} MT\n` +
          `• *Rate:* ₹${sauda.rate} | *CD:* ${sauda.cd}% | *GST:* ${sauda.gst}%\n` +
          `• *Location:* ${sauda.location || sauda.state || "N/A"}\n` +
          `• *Status:* ${sauda.status?.toUpperCase() || "ACTIVE"}\n\n`;

        if (loadings && loadings.length > 0) {
          content += `*Linked Deliveries (${loadings.length}):*\n`;
          loadings.slice(0, 5).forEach((l, idx) => {
            content += `${idx + 1}. *Lorry:* ${l.lorryNumber} | *Bill:* ${l.billNumber || "N/A"} | *Wt:* ${l.loadingWeight} MT\n`;
          });
          if (loadings.length > 5)
            content += `*+ ${loadings.length - 5} more loadings*\n`;
        }

        if (payments && payments.length > 0) {
          content += `\n*Payment History (${payments.length}):*\n`;
          payments.slice(0, 3).forEach((p, idx) => {
            content += `• ₹${p.amount} on ${new Date(p.date).toLocaleDateString()} (${p.paymentMode || "N/A"})\n`;
          });
        }

        return {
          role: "assistant",
          content: content,
          suggestions: [
            `Payment of Sauda ${saudaNo}`,
            `Add loading for ${saudaNo}`,
          ],
        };
      } else {
        const searchRes = await api.get(`/self-order?saudaNo=${saudaNo}`);
        const data = searchRes.data.data || searchRes.data;
        const fallbackSauda = Array.isArray(data) ? data[0] : null;

        if (fallbackSauda) {
          return {
            role: "assistant",
            content: `*Sauda ${saudaNo} found (Limited Details):*\n\n• *Buyer:* ${fallbackSauda.buyerCompany}\n• *Quantity:* ${fallbackSauda.quantity} MT`,
          };
        }

        return {
          role: "assistant",
          content: `I couldn't find any Sauda with number *${saudaNo}*.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content:
          "Error in deep sauda fetch. Please check if Sauda No is correct.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchDetailsByDate = async (dateStr) => {
    setIsLoadingData(true);
    setThinkingPath(`Searching system logs for ${dateStr}...`);
    try {
      let normalizedDate = dateStr;
      if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts[0].length === 2) {
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
          content: `System was inactive on *${dateStr}*. No records found.`,
        };
      }

      let content = `*System Logs for ${dateStr}*\n\n`;

      if (saudas.length > 0) {
        content += `*Saudas Created (${saudas.length}):*\n`;
        saudas.slice(0, 3).forEach((s) => {
          content += `• *Sauda ${s.saudaNo}*: ${s.buyerCompany} | ${s.commodity}\n`;
        });
        if (saudas.length > 3)
          content += `*+${saudas.length - 3} more saudas*\n`;
        content += "\n";
      }

      if (loadings.length > 0) {
        content += `*Loadings Recorded (${loadings.length}):*\n`;
        loadings.slice(0, 3).forEach((l) => {
          content += `• *Lorry ${l.lorryNumber}*: Sauda ${l.saudaNo} | ${l.loadingWeight} MT\n`;
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
    setThinkingPath("Scanning all active bids...");
    try {
      const response = await api.get("/bids?status=active");
      const bids = response.data.data || response.data;

      if (bids && bids.length > 0) {
        let content = `*Live Bids Status*\n\n`;
        bids.forEach((bid, idx) => {
          content += `${idx + 1}. *${bid.commodity}* | ${bid.location} | Ends: ${bid.endTime}\n`;
        });
        return {
          role: "assistant",
          content: content,
          suggestions: [`Interactions for ${bids[0].commodity}`],
        };
      } else {
        return {
          role: "assistant",
          content: "No active bids found in the system right now.",
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error fetching live bids.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
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
        let content = `*System Sauda Summary (${new Date().toLocaleDateString()})*\n\n`;
        content += `Total Count: *${saudas.length}*\n\n`;
        saudas.slice(0, 5).forEach((s, idx) => {
          content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.buyerCompany} | ${s.commodity}\n`;
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
    setThinkingPath(`Querying company: ${companyName}...`);
    try {
      const response = await api.get(`/companies?search=${companyName}`);
      const companies = response.data.data || response.data;

      if (companies && companies.length > 0) {
        const comp = companies[0];
        return {
          role: "assistant",
          content:
            `*Deep Status: ${comp.companyName}*\n\n` +
            `• *GST:* ${comp.gstNo || "N/A"}\n` +
            `• *District/State:* ${comp.district || "N/A"}, ${comp.state || "N/A"}\n` +
            `• *Contact:* ${comp.mobile || "N/A"}\n` +
            `• *Status:* VERIFIED`,
          suggestions: [`Saudas for ${comp.companyName}`],
        };
      } else {
        return {
          role: "assistant",
          content: `No records for company *${companyName}*.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in company query.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchBidInteractions = async (commodity) => {
    setIsLoadingData(true);
    setThinkingPath(`Analyzing interactions for ${commodity}...`);
    try {
      const response = await api.get(`/participateBids?search=${commodity}`);
      const interactions = response.data.data || response.data;

      if (interactions && interactions.length > 0) {
        let content = `*Interaction Analytics: ${commodity}*\n\n`;
        interactions.slice(0, 5).forEach((item, idx) => {
          content += `${idx + 1}. *${item.sellerName}*: ₹${item.rate} | ${item.quantity} MT\n`;
        });
        return {
          role: "assistant",
          content: content,
        };
      } else {
        return {
          role: "assistant",
          content: `No recent activity for *${commodity}*.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in interaction analytics.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchSaudaPayment = async (saudaNo) => {
    setIsLoadingData(true);
    setThinkingPath(`Analyzing payment ledger for Sauda ${saudaNo}...`);
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
            `*Payment Ledger Summary: Sauda ${saudaNo}*\n\n` +
            `• *Contract Quantity:* ${sauda.quantity} MT\n` +
            `• *Pending to Load:* ${sauda.pendingQuantity || 0} MT\n` +
            `• *Contract Rate:* ₹${sauda.rate}\n` +
            `• *CD/GST:* ${sauda.cd}% / ${sauda.gst}%\n` +
            `• *Terms:* ${sauda.paymentTerms || "N/A"}\n` +
            `• *Status:* ${sauda.status?.toUpperCase()}`,
          suggestions: [
            `Loading entries for Sauda ${saudaNo}`,
            `Sauda ${saudaNo} details`,
          ],
        };
      } else {
        return {
          role: "assistant",
          content: `I couldn't find any Sauda with number *${saudaNo}*.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in payment analysis.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchDetailsByBillNo = async (billNo) => {
    setIsLoadingData(true);
    setThinkingPath(`Locating invoice: ${billNo}...`);
    try {
      const response = await api.get(`/Loading-Entry?search=${billNo}`);
      const data = response.data.data || response.data;

      if (data && data.length > 0) {
        const entry =
          data.find((e) =>
            e.billNumber
              ?.toString()
              .toLowerCase()
              .includes(billNo.toLowerCase()),
          ) || data[0];

        return {
          role: "assistant",
          content:
            `*Invoice Found: ${entry.billNumber || billNo}*\n\n` +
            `• *Lorry:* ${entry.lorryNumber}\n` +
            `• *Sauda Link:* Sauda ${entry.saudaNo}\n` +
            `• *Date:* ${new Date(entry.loadingDate).toLocaleDateString()}\n` +
            `• *Weight:* ${entry.loadingWeight} MT\n` +
            `• *Buyer/Supplier:* ${entry.buyerCompany} / ${entry.supplierCompany}\n` +
            `• *Payment:* ${entry.paymentStatus === "done" ? "PAID" : "PENDING"}`,
          suggestions: [
            `Sauda ${entry.saudaNo} details`,
            `Lorry ${entry.lorryNumber} details`,
          ],
        };
      } else {
        return {
          role: "assistant",
          content: `Invoice *${billNo}* not found in system. Try searching by Sauda or Lorry.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in invoice lookup.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchDetailsByState = async (state) => {
    setIsLoadingData(true);
    setThinkingPath(`Filtering system by state: ${state}...`);
    try {
      const response = await api.get(`/self-order?search=${state}`);
      const saudas = response.data.data || response.data;

      if (saudas && saudas.length > 0) {
        let content = `*Regional Intelligence: ${state.toUpperCase()}*\n\n`;
        saudas.slice(0, 5).forEach((s, idx) => {
          content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.buyerCompany} | ${s.commodity}\n`;
        });
        if (saudas.length > 5)
          content += `\n*Showing top 5 of ${saudas.length} region records*`;

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
          content: `No records found for state *${state}*.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in regional query.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchLoadingEntriesBySauda = async (saudaNo) => {
    setIsLoadingData(true);
    setThinkingPath(`Pulling loading history for Sauda ${saudaNo}...`);
    try {
      const response = await api.get(`/Loading-Entry?saudaNo=${saudaNo}`);
      const entries = response.data.data || response.data;

      if (entries && entries.length > 0) {
        let content = `*Loading History: Sauda ${saudaNo}*\n\n`;
        entries.slice(0, 5).forEach((entry, idx) => {
          content += `${idx + 1}. *${entry.lorryNumber}* | ${new Date(entry.loadingDate).toLocaleDateString()} | ${entry.loadingWeight} MT\n`;
        });
        if (entries.length > 5)
          content += `\n*Total entries: ${entries.length}*`;

        return {
          role: "assistant",
          content: content,
          suggestions: [`Sauda ${saudaNo} details`, "View Unloading Report"],
        };
      } else {
        return {
          role: "assistant",
          content: `No delivery records for Sauda *${saudaNo}*.`,
          suggestions: [`Sauda ${saudaNo} details`],
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in delivery history fetch.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchLorryDetails = async (lorryNo) => {
    setIsLoadingData(true);
    setThinkingPath(`Tracking vehicle: ${lorryNo}...`);
    try {
      const cleanLorry = lorryNo.replace(/\s+/g, "").toUpperCase();

      const isLast4 = /^\d{4}$/.test(cleanLorry);

      const response = await api.get(
        `/Loading-Entry/lorry-wise?lorryNumber=${cleanLorry}`,
      );
      const data = response.data.data || response.data;

      if (data && data.length > 0) {
        const entries = isLast4
          ? data.filter((e) =>
              e.lorryNumber.replace(/\s+/g, "").endsWith(cleanLorry),
            )
          : data;

        if (entries.length === 0) {
          return {
            role: "assistant",
            content: `No records found for Lorry ending in *${lorryNo}*.`,
          };
        }

        const entry = entries[0];
        let content =
          entries.length > 1
            ? `*Multi-Vehicle Match (${entries.length}). Latest:*\n\n`
            : `*Vehicle Profile: ${entry.lorryNumber}*\n\n`;

        content +=
          `• *Active Sauda:* Sauda ${entry.saudaNo}\n` +
          `• *Last Loaded:* ${new Date(entry.loadingDate).toLocaleDateString()}\n` +
          `• *Current Weight:* ${entry.loadingWeight} MT\n` +
          `• *Buyer/Supplier:* ${entry.buyerCompany} / ${entry.supplierCompany}\n` +
          `• *Status:* ${entry.unloadingDate ? "UNLOADED" : "IN TRANSIT"}`;

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
          content: `No records found for Vehicle *${lorryNo}*.`,
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in vehicle tracking.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchTodayRate = async () => {
    setIsLoadingData(true);
    setThinkingPath("Calculating market rate highs...");
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

        let content = `*Today's Market Highs (${new Date().toLocaleDateString()})*\n\n`;
        Object.keys(rates).forEach((comm) => {
          const maxRate = Math.max(...rates[comm]);
          content += `• *${comm}:* High ₹${maxRate} (Range: ₹${Math.min(...rates[comm])} - ₹${maxRate})\n`;
        });

        return {
          role: "assistant",
          content: content,
        };
      } else {
        return {
          role: "assistant",
          content: "No market activity recorded today yet.",
        };
      }
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in market high calculation.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const processCommand = async (cmd) => {
    const cleanCmd = cmd.trim().toLowerCase();
    let response = null;

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
              console.log(`AI Agent navigating to: ${sidebarAction.link}`);
              navigate(sidebarAction.link);
            },
          };
        }
      }
    }

    if (response) {
      setMessages((prev) => [...prev, response]);
      if (response.action) setTimeout(() => response.action(), 1500);
      return;
    }

    const saudaMatch = cleanCmd.match(
      /(?:sauda|order)\s*(?:no|number)?\s*[:\s]*(\d+)/i,
    );
    const lorryMatch = cleanCmd.match(
      /(?:lorry|vehicle|truck)\s*(?:no|number)?\s*[:\s]*([a-z0-9\s]{4,})/i,
    );
    const billMatch = cleanCmd.match(
      /(?:bill|invoice|challan)\s*(?:no|number)?\s*[:\s]*(\d+)/i,
    );
    const stateMatch = cleanCmd.match(/(?:state|from)\s+([a-z\s]{3,})/i);
    const dateMatch = cleanCmd.match(
      /(?:date)\s*[:\s]*(\d{1,2}-\d{1,2}-\d{4})/i,
    );
    const companyMatch = cleanCmd.match(
      /(?:status of|company)\s+([a-z0-9\s]+)/i,
    );
    const interactionMatch = cleanCmd.match(
      /(?:interactions for|bid info for)\s+([a-z0-9\s]+)/i,
    );

    if (saudaMatch && billMatch && dateMatch) {
      response = await fetchSaudaDetails(saudaMatch[1]);
      if (response && response.content) {
        response.content =
          `*Cross-Referencing Sauda ${saudaMatch[1]}, Bill ${billMatch[1]} for ${dateMatch[1]}*\n\n` +
          response.content;
      }
    } else if (cleanCmd.includes("loading entry for sauda") && saudaMatch) {
      response = await fetchLoadingEntriesBySauda(saudaMatch[1]);
    } else if (
      saudaMatch &&
      (cleanCmd.includes("payment") || cleanCmd.includes("payemnt"))
    ) {
      response = await fetchSaudaPayment(saudaMatch[1]);
    } else if (saudaMatch) {
      response = await fetchSaudaDetails(saudaMatch[1]);
    } else if (billMatch) {
      response = await fetchDetailsByBillNo(billMatch[1].trim());
    } else if (dateMatch) {
      response = await fetchDetailsByDate(dateMatch[1]);
    } else if (lorryMatch) {
      response = await fetchLorryDetails(lorryMatch[1].trim());
    } else if (stateMatch && !cleanCmd.includes("loading from")) {
      response = await fetchDetailsByState(stateMatch[1].trim());
    } else if (
      cleanCmd.includes("total sauda today") ||
      (cleanCmd.includes("sauda") && cleanCmd.includes("today"))
    ) {
      response = await fetchTodaySaudas();
    } else if (
      cleanCmd.includes("active bids") ||
      cleanCmd.includes("show bids")
    ) {
      response = await fetchActiveBids();
    } else if (interactionMatch) {
      response = await fetchBidInteractions(interactionMatch[1].trim());
    } else if (companyMatch) {
      response = await fetchCompanyStatus(companyMatch[1].trim());
    } else if (
      cleanCmd.includes("rate") &&
      (cleanCmd.includes("today") ||
        cleanCmd.includes("loading") ||
        cleanCmd.includes("highest"))
    ) {
      response = await fetchTodayRate();
    } else if (cleanCmd.length >= 3) {
      response = await universalDeepSearch(cleanCmd);
    } else {
      response = {
        role: "assistant",
        content:
          "I'm not sure how to help. Try asking for *Sauda details*, *Vehicle No*, *Regional Status*, or *Market Highs*.",
        suggestions: ["Total sauda today", "Highest rate today", "Active bids"],
      };
    }

    setMessages((prev) => [...prev, response]);
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
      {isOpen && !isMinimized && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <FaRobot className="text-xl animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  Deep Intelligence Agent
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
