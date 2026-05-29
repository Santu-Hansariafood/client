import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaTimes,
  FaMinus,
  FaTrash,
  FaArrowRight,
  FaSpinner,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import api from "../../utils/apiClient/apiClient";
import dashboardData from "../../data/dashboardData.json";

const AIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [thinkingPath, setThinkingPath] = useState("");
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your Ansaria AI. I have full control over the system data and navigation. Ask me anything about Saudas, Loadings, Sellers, Buyers, or Payments. I can also open any page for you!",
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const getApiSignal = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  };

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

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, your browser does not support voice search.",
        },
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setThinkingPath("Listening...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setThinkingPath("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setThinkingPath("");
    };

    recognition.start();
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
      const response = await api.get(`/sellers?search=${name}`, {
        signal: getApiSignal(),
      });
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
      if (e.name === "AbortError") return null;
      console.error("Error fetching seller details:", e);
      return null;
    }
  };

  const fetchBuyerDetails = async (name) => {
    setThinkingPath("Searching Buyers...");
    try {
      const response = await api.get(`/buyers?search=${name}`, {
        signal: getApiSignal(),
      });
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
      if (e.name === "AbortError") return null;
      console.error("Error fetching buyer details:", e);
      return null;
    }
  };

  const fetchCommodities = async () => {
    setIsLoadingData(true);
    setThinkingPath("Listing all system commodities...");
    try {
      const response = await api.get("/commodities", {
        signal: getApiSignal(),
      });
      const commodities = response.data.data || response.data;
      if (commodities && commodities.length > 0) {
        let content = "*Available Commodities:*\n\n";
        commodities.forEach((c, idx) => {
          content += `${idx + 1}. *${c.name}*\n`;
        });
        return {
          role: "assistant",
          content,
          suggestions: ["Total sauda today", "Active bids"],
        };
      }
      return {
        role: "assistant",
        content: "No commodities found in the system.",
      };
    } catch (e) {
      if (e.name === "AbortError") return null;
      return {
        role: "assistant",
        content: "Error fetching commodities.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchAccountStatus = async () => {
    setIsLoadingData(true);
    setThinkingPath("Analyzing your account status...");
    try {
      const signal = getApiSignal();
      const [saudaRes, loadingRes, paymentRes] = await Promise.all([
        api.get("/self-order?limit=1", { signal }),
        api.get("/loading-entries?limit=1", { signal }),
        api.get("/payment-received?limit=1", { signal }),
      ]);

      const totalSaudas = saudaRes.data.total || 0;
      const totalLoadings = loadingRes.data.total || 0;
      const totalPayments = paymentRes.data.total || 0;

      return {
        role: "assistant",
        content:
          `*Full System Account Status*\n\n` +
          `• *Total Sauda Contracts:* ${totalSaudas}\n` +
          `• *Total Loading Entries:* ${totalLoadings}\n` +
          `• *Total Payment Records:* ${totalPayments}\n` +
          `• *System Health:* Optimal\n` +
          `• *Last Update:* ${new Date().toLocaleString()}`,
        suggestions: ["Total sauda today", "Active bids"],
      };
    } catch (e) {
      return {
        role: "assistant",
        content: "Error fetching account status.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchWeather = async () => {
    setIsLoadingData(true);
    setThinkingPath("Checking local weather forecast...");
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.23&current_weather=true",
      );
      const data = await res.json();
      const weather = data.current_weather;

      const getCondition = (code) => {
        if (code === 0) return "Clear Sky";
        if (code <= 3) return "Partly Cloudy";
        if (code <= 48) return "Foggy";
        if (code <= 67) return "Rainy";
        if (code <= 77) return "Snowy";
        if (code <= 82) return "Showers";
        if (code <= 99) return "Thunderstorm";
        return "Unknown";
      };

      return {
        role: "assistant",
        content:
          `*Current Weather in New Delhi*\n\n` +
          `• *Temperature:* ${weather.temperature}°C\n` +
          `• *Condition:* ${getCondition(weather.weathercode)}\n` +
          `• *Wind Speed:* ${weather.windspeed} km/h\n` +
          `• *Time:* ${new Date().toLocaleTimeString()}`,
      };
    } catch (e) {
      return {
        role: "assistant",
        content:
          "I couldn't fetch the weather right now. Please try again later.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchFullPartnerDetails = async (name, type) => {
    setIsLoadingData(true);
    setThinkingPath(`Extracting full ${type} intelligence...`);
    try {
      const signal = getApiSignal();
      const endpoint = type === "Buyer" ? "/buyers" : "/sellers";
      const response = await api.get(`${endpoint}?search=${name}`, { signal });
      const partners = response.data.data || response.data;

      if (partners && partners.length > 0) {
        const p = partners[0];
        const partnerName = type === "Buyer" ? p.name : p.sellerName;
        const mobile = type === "Buyer" ? p.mobile : p.phoneNumbers?.[0]?.value;

        const [saudaRes, loadingRes, paymentRes] = await Promise.all([
          api.get(`/self-order?search=${partnerName}`, { signal }),
          api.get(`/loading-entries?search=${partnerName}`, { signal }),
          api.get(`/payment-received?search=${partnerName}`, { signal }),
        ]);

        const saudas = saudaRes.data.data || saudaRes.data || [];
        const loadings = loadingRes.data.data || loadingRes.data || [];
        const payments = paymentRes.data.data || paymentRes.data || [];

        let totalQtyDone = 0;
        loadings.forEach(
          (l) => (totalQtyDone += l.unloadingWeight || l.loadingWeight || 0),
        );

        let totalPaid = 0;
        payments.forEach((p) => (totalPaid += p.amount || 0));

        let content =
          `*Full ${type} Intelligence: ${partnerName}*\n\n` +
          `*Contact Details:*\n` +
          `• *Mobile:* ${mobile || "N/A"}\n` +
          `• *Email:* ${p.email || p.emails?.[0]?.value || "N/A"}\n` +
          `• *Status:* ${p.status?.toUpperCase() || "ACTIVE"}\n\n`;

        if (type === "Buyer" && p.companyIds && p.companyIds.length > 0) {
          content += `*Registered Companies:*\n`;
          p.companyIds.forEach((c) => {
            content += `• ${c.companyName || c.name || "N/A"}\n`;
          });
          content += "\n";
        } else if (type === "Seller" && p.companies && p.companies.length > 0) {
          content += `*Registered Companies:*\n`;
          p.companies.forEach((c) => {
            content += `• ${c}\n`;
          });
          content += "\n";
        }

        content +=
          `*Financial & Work Summary:*\n` +
          `• *Total Saudas:* ${saudas.length}\n` +
          `• *Quantity Delivered:* ${totalQtyDone.toFixed(2)} Tons\n` +
          `• *Total Payments:* ₹${totalPaid.toLocaleString("en-IN")}\n` +
          `• *Total Loadings:* ${loadings.length}\n\n`;

        if (type === "Seller") {
          const validCommodities =
            p.commodities?.filter((c) => c.name && c.brokerage) || [];
          if (validCommodities.length > 0) {
            content += `*Brokerage Config:*\n`;
            validCommodities.forEach((c) => {
              content += `• *${c.name}:* ₹${c.brokerage}/Tons\n`;
            });
            content += "\n";
          }
        } else {
          const validBrokerage = Object.entries(p.brokerage || {}).filter(
            ([comm, rate]) => comm && rate,
          );
          if (validBrokerage.length > 0) {
            content += `*Brokerage Config:*\n`;
            validBrokerage.forEach(([comm, rate]) => {
              content += `• *${comm}:* ₹${rate}/Tons\n`;
            });
            content += "\n";
          }
        }

        if (saudas.length > 0) {
          const latestSauda = saudas[0];
          if (latestSauda.parameters && latestSauda.parameters.length > 0) {
            content += `*Standard Quality Parameters (Latest):*\n`;
            latestSauda.parameters.forEach((param) => {
              content += `• ${param.name || param.label}: ${param.value}\n`;
            });
            content += "\n";
          }
        }

        return {
          role: "assistant",
          content,
          suggestions: [`Saudas for ${partnerName}`, "Active bids"],
        };
      }
      return {
        role: "assistant",
        content: `I couldn't find any ${type} matching "*${name}*".`,
      };
    } catch (e) {
      return {
        role: "assistant",
        content: `Error fetching full ${type} details.`,
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchPendingSaudaByEntity = async (entityName) => {
    setIsLoadingData(true);
    setThinkingPath(`Searching pending saudas for ${entityName}...`);
    try {
      const response = await api.get(
        `/self-order?search=${entityName}&status=active`,
        { signal: getApiSignal() },
      );
      const allSaudas = response.data.data || response.data || [];
      const pendingSaudas = allSaudas.filter(
        (s) => (s.pendingQuantity || 0) > 0,
      );

      if (pendingSaudas.length === 0) {
        return {
          role: "assistant",
          content: `No pending saudas found for "*${entityName}*". All matching contracts are fully loaded or closed.`,
        };
      }

      let content = `*Pending Sauda Report: ${entityName}*\n\n`;
      pendingSaudas.forEach((s, idx) => {
        const buyer = s.buyerCompany || s.buyer || "N/A";
        const seller = s.supplierCompany || "N/A";
        content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.commodity}\n`;
        content += `   Buyer: ${buyer} | Seller: ${seller}\n`;
        content += `   Pending: *${s.pendingQuantity} Tons* of ${s.quantity} Tons\n\n`;
      });
      content += `*Total Pending Saudas:* ${pendingSaudas.length}`;

      return {
        role: "assistant",
        content,
        suggestions: [`Sauda ${pendingSaudas[0].saudaNo} details`],
      };
    } catch (e) {
      if (e.name === "AbortError") return null;
      return {
        role: "assistant",
        content: `Error fetching pending saudas for ${entityName}.`,
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchRelationshipContext = async (buyerName, sellerName) => {
    setIsLoadingData(true);
    setThinkingPath(
      `Analyzing relationship between ${buyerName} and ${sellerName}...`,
    );
    try {
      const signal = getApiSignal();
      const [buyerRes, sellerRes] = await Promise.all([
        api.get(`/buyers?search=${buyerName}`, { signal }),
        api.get(`/sellers?search=${sellerName}`, { signal }),
      ]);

      const buyers = buyerRes.data.data || buyerRes.data;
      const sellers = sellerRes.data.data || sellerRes.data;

      if (buyers?.length > 0 && sellers?.length > 0) {
        const b = buyers[0];
        const s = sellers[0];

        const saudaRes = await api.get(
          `/self-order?search=${b.name}&supplierCompany=${s.sellerName}`,
          { signal },
        );
        const saudas = saudaRes.data.data || saudaRes.data || [];

        let content = `*Relationship Intelligence: ${b.name} & ${s.sellerName}*\n\n`;

        content += `*Buyer Groups:* ${b.groupId?.groupName || "N/A"}\n`;
        content += `*Seller Groups:* ${s.groups?.map((g) => g.name).join(", ") || "N/A"}\n\n`;

        content += `*Trade Summary:*\n`;
        content += `• *Total Shared Saudas:* ${saudas.length}\n`;

        if (saudas.length > 0) {
          const totalQty = saudas.reduce(
            (acc, curr) => acc + (curr.quantity || 0),
            0,
          );
          content += `• *Total Contracted Volume:* ${totalQty.toFixed(2)} Tons\n`;
          content += `• *Common Commodities:* ${[...new Set(saudas.map((s) => s.commodity))].join(", ")}\n\n`;

          content += `*Recent Shared Saudas:*\n`;
          saudas.slice(0, 5).forEach((s, idx) => {
            content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.commodity} | ${s.quantity} Tons | ${new Date(s.poDate).toLocaleDateString()}\n`;
          });
        }

        return {
          role: "assistant",
          content,
          suggestions:
            saudas.length > 0
              ? [`Sauda ${saudas[0].saudaNo} details`]
              : ["Total sauda today"],
        };
      }
      return null;
    } catch (e) {
      return null;
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchSaudasByCompanyAndConsignee = async (
    companyName,
    consigneeName,
  ) => {
    setIsLoadingData(true);
    setThinkingPath(
      `Searching saudas for ${companyName} to ${consigneeName}...`,
    );
    try {
      const response = await api.get(
        `/self-order?search=${companyName}&consignee=${consigneeName}`,
        { signal: getApiSignal() },
      );
      const saudas = response.data.data || response.data || [];

      if (saudas.length > 0) {
        let content = `*Matching Saudas for ${companyName} ➔ ${consigneeName}*\n\n`;
        saudas.forEach((s, idx) => {
          content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.commodity}\n`;
          content += `   • *Buyer:* ${s.buyerCompany || s.buyer}\n`;
          content += `   • *Seller:* ${s.supplierCompany}\n`;
          content += `   • *Qty:* ${s.quantity} Tons | *Pending:* ${s.pendingQuantity || 0} Tons\n`;
          content += `   • *Date:* ${s.poDate ? new Date(s.poDate).toLocaleDateString() : "N/A"}\n`;
          content += `   • *Delivery:* ${s.deliveryDate ? new Date(s.deliveryDate).toLocaleDateString() : "N/A"}\n\n`;
        });

        return {
          role: "assistant",
          content,
          suggestions: [`Sauda ${saudas[0].saudaNo} details`],
        };
      }
      return {
        role: "assistant",
        content: `No saudas found matching company "*${companyName}*" and consignee "*${consigneeName}*".`,
      };
    } catch (e) {
      if (e.name === "AbortError") return null;
      return {
        role: "assistant",
        content: "Error searching for matching saudas.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchSellerSaudaStatus = async (sellerName, type) => {
    setIsLoadingData(true);
    setThinkingPath(`Analyzing ${type} saudas for ${sellerName}...`);
    try {
      const signal = getApiSignal();
      const sellerRes = await api.get(`/sellers?search=${sellerName}`, {
        signal,
      });
      const sellers = sellerRes.data.data || sellerRes.data;
      if (!sellers || sellers.length === 0) {
        return {
          role: "assistant",
          content: `I couldn't find any seller matching "*${sellerName}*".`,
        };
      }
      const seller = sellers[0];
      const sId = seller._id;
      const sName = seller.sellerName;

      if (type === "pending") {
        const response = await api.get(
          `/self-order?search=${sName}&status=active`,
          { signal },
        );
        const allSaudas = response.data.data || response.data || [];
        const pendingSaudas = allSaudas.filter(
          (s) => (s.pendingQuantity || 0) > 0,
        );

        if (pendingSaudas.length === 0) {
          return {
            role: "assistant",
            content: `No pending saudas found for *${sName}*. All contracts are fully loaded or closed.`,
          };
        }

        let content = `*Pending Sauda List: ${sName}*\n\n`;
        pendingSaudas.forEach((s, idx) => {
          content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.commodity} | Pending: *${s.pendingQuantity} Tons* of ${s.quantity} Tons\n`;
        });
        content += `\n*Total Pending Saudas:* ${pendingSaudas.length}`;

        return {
          role: "assistant",
          content,
          suggestions: [`Sauda ${pendingSaudas[0].saudaNo} details`],
        };
      } else if (type === "due") {
        const loadingRes = await api.get(
          `/loading-entries?search=${sName}&paymentStatus=pending&limit=100`,
          { signal },
        );
        const entries = loadingRes.data.data || loadingRes.data || [];

        if (entries.length === 0) {
          return {
            role: "assistant",
            content: `No due amounts found for *${sName}*. All delivered loads are fully paid.`,
          };
        }

        const saudaGroups = {};
        for (const entry of entries) {
          if (!saudaGroups[entry.saudaNo]) {
            saudaGroups[entry.saudaNo] = {
              saudaNo: entry.saudaNo,
              commodity: entry.commodity,
              entries: [],
              totalDue: 0,
            };
          }
          saudaGroups[entry.saudaNo].entries.push(entry);
        }

        const saudaNos = Object.keys(saudaGroups);
        const saudaDetailsRes = await api.get(
          `/self-order?saudaNo=${saudaNos.join(",")}`,
          { signal },
        );
        const saudaData =
          saudaDetailsRes.data.data || saudaDetailsRes.data || [];
        const saudaMap = saudaData.reduce((acc, s) => {
          acc[s.saudaNo] = s;
          return acc;
        }, {});

        let content = `*Due Sauda Report: ${sName}*\n\n`;
        let grandTotalDue = 0;

        Object.values(saudaGroups).forEach((group, idx) => {
          const order = saudaMap[group.saudaNo];
          if (order) {
            let saudaDue = 0;
            group.entries.forEach((entry) => {
              const weight = entry.unloadingWeight || entry.loadingWeight || 0;
              const rate = order.rate || 0;
              const cdPercent = order.cd || 0;
              const gstPercent = order.gst || 0;

              const grossAmount = weight * rate;
              const taxableAmount =
                grossAmount - grossAmount * (cdPercent / 100);
              const netAmount =
                taxableAmount + taxableAmount * (gstPercent / 100);
              saudaDue += netAmount - (entry.paidAmount || 0);
            });

            if (saudaDue > 1) {
              content += `${idx + 1}. *Sauda ${group.saudaNo}*: ${group.commodity}\n`;
              content += `   Due Amount: *₹${saudaDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}*\n`;
              grandTotalDue += saudaDue;
            }
          }
        });

        content += `\n*Total Outstanding Due: ₹${grandTotalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}*`;

        return {
          role: "assistant",
          content,
          suggestions: [
            `Sauda ${saudaNos[0]} details`,
            `Payment of Sauda ${saudaNos[0]}`,
          ],
        };
      }
    } catch (e) {
      console.error(e);
      return {
        role: "assistant",
        content: `Error analyzing sauda status for ${sellerName}.`,
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const universalDeepSearch = async (query) => {
    setIsLoadingData(true);
    setThinkingPath("Initiating System-Wide Scan...");

    if (/^\d{3,5}$/.test(query) || /(\d{3,5})\s*(?:sauda|order)/i.test(query)) {
      setThinkingPath("Checking Sauda Records...");
      const sNum = query.match(/(\d{3,5})/)[1];
      const saudaRes = await fetchSaudaDetails(sNum);
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
      content: `I've performed a Ansaria AI scan for "*${query}*" across all Saudas, Invoices, Vehicles, and Partners, but no direct match was found.`,
      suggestions: ["Total sauda today", "Active bids", "Highest rate today"],
    };
  };

  const fetchSaudaDetails = async (saudaNo) => {
    setIsLoadingData(true);
    setThinkingPath(`Accessing Full MIS for Sauda ${saudaNo}...`);
    try {
      const signal = getApiSignal();
      const response = await api.get(`/self-order/details/${saudaNo}`, {
        signal,
      });
      const { order: sauda, entries: loadings, payments } = response.data;

      if (sauda) {
        let content =
          `*Ansaria AI Profile:*\n\n` +
          `•Sauda No ${saudaNo}*\n` +
          `• *Buyer:* ${sauda.buyerCompany || sauda.buyer}\n` +
          `• *Supplier:* ${sauda.supplierCompany || "N/A"}\n` +
          `• *Consignee:* ${sauda.consignee || "N/A"}\n` +
          `• *Commodity:* ${sauda.commodity}\n` +
          `• *Quantity:* ${sauda.quantity} Tons | *Pending:* ${sauda.pendingQuantity || 0} Tons\n` +
          `• *Rate:* ₹${sauda.rate} | *CD:* ${sauda.cd}% | *GST:* ${sauda.gst}%\n` +
          `• *Sauda Date:* ${sauda.poDate ? new Date(sauda.poDate).toLocaleDateString() : "N/A"}\n` +
          `• *Delivery Date:* ${sauda.deliveryDate ? new Date(sauda.deliveryDate).toLocaleDateString() : "N/A"}\n` +
          // `• *Location:* ${sauda.location || sauda.state || "N/A"}\n` +
          `• *Status:* ${sauda.status?.toUpperCase() || "ACTIVE"}\n\n`;

        if (loadings && loadings.length > 0) {
          content += `*Linked Deliveries (${loadings.length}):*\n`;
          loadings.forEach((l, idx) => {
            content += `${idx + 1}. *Lorry:* ${l.lorryNumber} | *Bill:* ${l.billNumber || "N/A"} | *Wt:* ${l.loadingWeight} Tons\n`;
          });
        }

        if (payments && payments.length > 0) {
          content += `\n*Payment History (${payments.length}):*\n`;
          payments.forEach((p, idx) => {
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
        const searchRes = await api.get(`/self-order?saudaNo=${saudaNo}`, {
          signal,
        });
        const data = searchRes.data.data || searchRes.data;
        const fallbackSauda = Array.isArray(data) ? data[0] : null;

        if (fallbackSauda) {
          return {
            role: "assistant",
            content: `*Sauda ${saudaNo} found (Limited Details):*\n\n• *Buyer:* ${fallbackSauda.buyerCompany}\n• *Quantity:* ${fallbackSauda.quantity} Tons`,
          };
        }

        return {
          role: "assistant",
          content: `I couldn't find any Sauda with number *${saudaNo}*.`,
        };
      }
    } catch (error) {
      if (error.name === "AbortError") return null;
      return {
        role: "assistant",
        content:
          "Error in Ansaria AIsauda fetch. Please check if Sauda No is correct.",
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
      const parseDate = (str) => {
        const months = [
          "jan",
          "feb",
          "mar",
          "apr",
          "may",
          "jun",
          "jul",
          "aug",
          "sep",
          "oct",
          "nov",
          "dec",
        ];
        const cleanStr = str.toLowerCase().trim();

        if (cleanStr.includes("/") || cleanStr.includes("-")) {
          const parts = cleanStr.split(/[\/-]/);
          let d = parts[0],
            m = parts[1],
            y = parts[2] || new Date().getFullYear();
          if (y.toString().length === 2) y = "20" + y;
          return `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
        }

        const words = cleanStr.split(/\s+/);
        if (words.length >= 2) {
          const d = words[0];
          const monthIdx = months.findIndex((m) => words[1].startsWith(m)) + 1;
          if (monthIdx > 0) {
            let y = words[2] || new Date().getFullYear();
            return `${y}-${monthIdx.toString().padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
        }
        return null;
      };

      const normalizedDate = parseDate(dateStr);
      if (!normalizedDate) {
        return {
          role: "assistant",
          content: `I couldn't understand the date format "*${dateStr}*". Please use DD/MM/YY or "22 March".`,
        };
      }

      const signal = getApiSignal();
      const [saudaRes, loadingRes] = await Promise.all([
        api.get(
          `/self-order?startDate=${normalizedDate}&endDate=${normalizedDate}`,
          { signal },
        ),
        api.get(
          `/Loading-Entry?startDate=${normalizedDate}&endDate=${normalizedDate}`,
          { signal },
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
        saudas.forEach((s) => {
          content += `• *Sauda ${s.saudaNo}*: ${s.buyerCompany} | ${s.commodity}\n`;
        });
        content += "\n";
      }

      if (loadings.length > 0) {
        content += `*Loadings Recorded (${loadings.length}):*\n`;
        loadings.forEach((l) => {
          content += `• *Lorry ${l.lorryNumber}*: Sauda ${l.saudaNo} | ${l.loadingWeight} Tons\n`;
        });
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

  const fetchLastSauda = async () => {
    setIsLoadingData(true);
    setThinkingPath("Locating the most recent Sauda contract...");
    try {
      const response = await api.get(
        "/self-order?limit=1&sortBy=createdAt&sortOrder=desc",
        { signal: getApiSignal() },
      );
      const saudas = response.data.data || response.data;
      const lastSauda = Array.isArray(saudas) ? saudas[0] : null;

      if (lastSauda) {
        return await fetchSaudaDetails(lastSauda.saudaNo);
      }
      return {
        role: "assistant",
        content: "No Sauda records found in the system.",
      };
    } catch (e) {
      if (e.name === "AbortError") return null;
      return {
        role: "assistant",
        content: "Error fetching the latest Sauda.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchActiveBids = async () => {
    setIsLoadingData(true);
    setThinkingPath("Scanning all active bids with full intelligence...");
    try {
      const response = await api.get("/bids?status=active", {
        signal: getApiSignal(),
      });
      const bids = response.data.data || response.data;

      if (bids && bids.length > 0) {
        let content = `*Full Live Bids Intelligence*\n\n`;
        bids.forEach((bid, idx) => {
          const bDate = bid.bidDate
            ? new Date(bid.bidDate).toLocaleDateString()
            : "N/A";
          content += `${idx + 1}. *${bid.commodity}* at *${bid.origin || bid.location || "N/A"}*\n`;
          content += `   • *Base Rate:* ₹${bid.rate || bid.baseRate || "N/A"}\n`;
          content += `   • *Quantity:* ${bid.quantity || "N/A"} Tons\n`;
          content += `   • *Date:* ${bDate}\n`;
          content += `   • *Time:* ${bid.startTime || "N/A"} - ${bid.endTime || "N/A"}\n`;
          content += `   • *Status:* ${bid.status?.toUpperCase()}\n\n`;
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
      if (error.name === "AbortError") return null;
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
        { signal: getApiSignal() },
      );
      const saudas = response.data.data || response.data;

      if (saudas && saudas.length > 0) {
        let content = `*System Sauda Summary (${new Date().toLocaleDateString()})*\n\n`;
        content += `Total Count: *${saudas.length}*\n\n`;
        saudas.forEach((s, idx) => {
          content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.buyerCompany} | ${s.commodity}\n`;
        });

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
      if (error.name === "AbortError") return null;
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
      const response = await api.get(`/companies?search=${companyName}`, {
        signal: getApiSignal(),
      });
      const companies = response.data.data || response.data;

      if (companies && companies.length > 0) {
        const comp = companies[0];
        return {
          role: "assistant",
          content:
            `*Ansaria AI Status: ${comp.companyName}*\n\n` +
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
      if (error.name === "AbortError") return null;
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
      const response = await api.get(`/participateBids?search=${commodity}`, {
        signal: getApiSignal(),
      });
      const interactions = response.data.data || response.data;

      if (interactions && interactions.length > 0) {
        let content = `*Interaction Analytics: ${commodity}*\n\n`;
        interactions.forEach((item, idx) => {
          content += `${idx + 1}. *${item.sellerName}*: ₹${item.rate} | ${item.quantity} Tons\n`;
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
      if (error.name === "AbortError") return null;
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
      const response = await api.get(`/self-order?saudaNo=${saudaNo}`, {
        signal: getApiSignal(),
      });
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
            `• *Contract Quantity:* ${sauda.quantity} Tons\n` +
            `• *Pending to Load:* ${sauda.pendingQuantity || 0} Tons\n` +
            `• *Contract Rate:* ₹${sauda.rate}\n` +
            `• *CD/GST:* ${sauda.cd}% / ${sauda.gst}%\n` +
            `• *Terms:* ${sauda.paymentTerms || "N/A"} Days\n` +
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
      if (error.name === "AbortError") return null;
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
      const response = await api.get(`/Loading-Entry?search=${billNo}`, {
        signal: getApiSignal(),
      });
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
            `• *Lorry No:* ${entry.lorryNumber}\n` +
            `• *Sauda Link:* Sauda ${entry.saudaNo}\n` +
            `• *Date:* ${new Date(entry.loadingDate).toLocaleDateString()}\n` +
            `• *Weight:* ${entry.loadingWeight} Tons\n` +
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
      if (error.name === "AbortError") return null;
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
      const response = await api.get(`/self-order?search=${state}`, {
        signal: getApiSignal(),
      });
      const saudas = response.data.data || response.data;

      if (saudas && saudas.length > 0) {
        let content = `*Regional Intelligence: ${state.toUpperCase()}*\n\n`;
        saudas.forEach((s, idx) => {
          content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.buyerCompany} | ${s.commodity}\n`;
        });

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
      if (error.name === "AbortError") return null;
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
      const response = await api.get(`/Loading-Entry?saudaNo=${saudaNo}`, {
        signal: getApiSignal(),
      });
      const entries = response.data.data || response.data;

      if (entries && entries.length > 0) {
        let content = `*Loading History: Sauda ${saudaNo}*\n\n`;
        entries.forEach((entry, idx) => {
          content += `${idx + 1}. *${entry.lorryNumber}* | ${new Date(entry.loadingDate).toLocaleDateString()} | ${entry.loadingWeight} Tons\n`;
        });

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
      if (error.name === "AbortError") return null;
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
        { signal: getApiSignal() },
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
          `• *Current Weight:* ${entry.loadingWeight} Tons\n` +
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
      if (error.name === "AbortError") return null;
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
        { signal: getApiSignal() },
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
      if (error.name === "AbortError") return null;
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

    const saudaMatch =
      cleanCmd.match(/(?:sauda|order)\s*(?:no|number)?\s*[:\s]*(\d+)/i) ||
      cleanCmd.match(/(\d+)\s*(?:sauda|order)/i);

    const lorryMatch = cleanCmd.match(
      /(?:lorry|vehicle|truck)\s*(?:no|number)?\s*[:\s]*([a-z0-9\s]{4,})/i,
    );
    const billMatch = cleanCmd.match(
      /(?:bill|invoice|challan)\s*(?:no|number)?\s*[:\s]*(\d+)/i,
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
      response = await fetchCommodities();
    } else if (
      cleanCmd.includes("current sauda") ||
      cleanCmd.includes("last sauda")
    ) {
      response = await fetchLastSauda();
    } else if (cleanCmd.includes("account status")) {
      response = await fetchAccountStatus();
    } else if (cleanCmd.includes("weather")) {
      response = await fetchWeather();
    } else if (companyConsigneeMatch) {
      response = await fetchSaudasByCompanyAndConsignee(
        companyConsigneeMatch[1].trim(),
        companyConsigneeMatch[2].trim(),
      );
    } else if (relationshipMatch) {
      response = await fetchRelationshipContext(
        relationshipMatch[1].trim(),
        relationshipMatch[2].trim(),
      );
    } else if (dueMatch && !cleanCmd.includes("sauda no")) {
      response = await fetchSellerSaudaStatus(dueMatch[1].trim(), "due");
    } else if (pendingMatch && !cleanCmd.includes("sauda no")) {
      response = await fetchPendingSaudaByEntity(pendingMatch[1].trim());
    } else if (cleanCmd.includes("contact") && !buyerMatch && !sellerMatch) {
      response = {
        role: "assistant",
        content:
          `*Ansaria AI Contact Support*\n\n` +
          `• *Admin Hotline:* +91 98765 43210\n` +
          `• *Tech Support:* info@hansariafood.com\n` +
          `• *Operating Hours:* 10:00 AM - 07:00 PM` +
          `• *Website:* https://www.hansariafood.com`,
      };
    } else if (buyerMatch) {
      response = await fetchFullPartnerDetails(buyerMatch[1].trim(), "Buyer");
    } else if (sellerMatch) {
      response = await fetchFullPartnerDetails(sellerMatch[1].trim(), "Seller");
    } else if (saudaMatch && billMatch && dateMatch) {
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
        content: "System cache cleared. Ansaria AI is ready.",
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
                <h3 className="font-bold text-sm tracking-wide">Ansaria AI</h3>
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
              <button
                onClick={startListening}
                disabled={isListening}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title="Voice Search"
              >
                {isListening ? (
                  <FaMicrophoneSlash size={16} />
                ) : (
                  <FaMicrophone size={16} />
                )}
              </button>
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
              Powered by Ansaria AI • Minimal Commands Supported
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-end gap-3">
        {isMinimized && isOpen && (
          <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-5 duration-300 mb-2">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Ansaria AI is active
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
