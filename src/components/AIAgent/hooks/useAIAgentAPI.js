import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import { useRef } from "react";

export const useAIAgentAPI = (
  setIsLoadingData,
  setThinkingPath,
  getApiSignal,
  getDynamicSuggestions,
) => {
  const responseCacheRef = useRef({});
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  // Helper function to get cached response
  const getCachedResponse = (key) => {
    const cached = responseCacheRef.current[key];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    // Remove stale entry
    delete responseCacheRef.current[key];
    return null;
  };

  // Helper function to set cached response
  const setCachedResponse = (key, data) => {
    responseCacheRef.current[key] = {
      data,
      timestamp: Date.now()
    };
    // Limit cache size to 50 entries
    const keys = Object.keys(responseCacheRef.current);
    if (keys.length > 50) {
      const oldestKey = keys.sort((a, b) => 
        responseCacheRef.current[a].timestamp - responseCacheRef.current[b].timestamp
      )[0];
      delete responseCacheRef.current[oldestKey];
    }
  };
  const fetchCommodities = async () => {
    setIsLoadingData(true);
    setThinkingPath("Listing all system commodities...");
    try {
      clearApiCache();
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
      clearApiCache();
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
          content += `*Registered Companies & Brokerage Config:*\n`;
          p.companyIds.forEach((company) => {
            const companyName = company.companyName || company.name || "N/A";
            content += `• *${companyName}:*\n`;
            
            // Add company's commodity-wise brokerage
            if (company.commodities && company.commodities.length > 0) {
              company.commodities.forEach((cc) => {
                const commodityName = cc.commodityId?.name || cc.commodityName || "N/A";
                if (cc.brokerage) {
                  content += `  - *${commodityName}:* ₹${cc.brokerage}/Tons\n`;
                }
              });
            }
            content += "\n";
          });
          // Also show buyer's own brokerage as fallback
          const validBrokerage = Object.entries(p.brokerageByName || {}).filter(
            ([comm, rate]) => comm && rate,
          );
          if (validBrokerage.length > 0) {
            content += `*Buyer Default Brokerage Config:*\n`;
            validBrokerage.forEach(([comm, rate]) => {
              content += `• *${comm}:* ₹${rate}/Tons\n`;
            });
            content += "\n";
          }
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
          suggestions: getDynamicSuggestions(
            [`Saudas for ${partnerName}`, "Active bids"],
            content,
          ),
        };
      }
      return null;
    } catch (e) {
      console.error("fetchFullPartnerDetails error:", e);
      return null;
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
            content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.commodity} | ${s.quantity} Tons | ${new Date(s.poDate).toLocaleDateString("en-GB")}\n`;
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
          content += `   • *Date:* ${s.poDate ? new Date(s.poDate).toLocaleDateString("en-GB") : "N/A"}\n`;
          content += `   • *Delivery:* ${s.deliveryDate ? new Date(s.deliveryDate).toLocaleDateString("en-GB") : "N/A"}\n\n`;
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
          `*Saria AI Profile:*\n\n` +
          `• *Sauda No:* ${saudaNo}\n` +
          `• *Buyer:* ${sauda.buyerCompany || sauda.buyer}\n` +
          `• *Supplier:* ${sauda.supplierCompany || "N/A"}\n` +
          `• *Consignee:* ${sauda.consignee || "N/A"}\n` +
          `• *Commodity:* ${sauda.commodity}\n` +
          `• *Quantity:* ${sauda.quantity} Tons | *Pending:* ${sauda.pendingQuantity || 0} Tons\n` +
          `• *Rate:* ₹${sauda.rate} | *CD:* ${sauda.cd}% | *GST:* ${sauda.gst}%\n` +
          `• *Sauda Date:* ${sauda.poDate ? new Date(sauda.poDate).toLocaleDateString("en-GB") : "N/A"}\n` +
          `• *Delivery Date:* ${sauda.deliveryDate ? new Date(sauda.deliveryDate).toLocaleDateString("en-GB") : "N/A"}\n` +
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
            content += `• ₹${p.amount} on ${new Date(p.date).toLocaleDateString("en-GB")} (${p.paymentMode || "N/A"})\n`;
          });
        }

        return {
          role: "assistant",
          content: content,
          suggestions: getDynamicSuggestions(
            [`Payment of Sauda ${saudaNo}`, `Add loading for Sauda ${saudaNo}`],
            content,
          ),
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
          "Error in Saria AIsauda fetch. Please check if Sauda No is correct.",
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
          `/loading-entries?startDate=${normalizedDate}&endDate=${normalizedDate}`,
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
    setThinkingPath("Scanning all active bids and today's participation...");
    try {
      const today = new Date().toISOString().split("T")[0];
      const [bidRes, partRes] = await Promise.all([
        api.get("/bids?status=active", { signal: getApiSignal() }),
        api.get(`/participateBids?date=${today}`, { signal: getApiSignal() }),
      ]);

      const bids = bidRes.data.data || bidRes.data || [];
      const allParticipations = partRes.data.data || partRes.data || [];

      if (bids && bids.length > 0) {
        let content = `*Active Bids & Participation Status*\n\n`;
        bids.forEach((bid, idx) => {
          const bidParts = allParticipations.filter(
            (p) => p.bidId === bid._id || p.commodity === bid.commodity,
          );
          const bDate = bid.bidDate
            ? new Date(bid.bidDate).toLocaleDateString("en-GB")
            : "N/A";

          content += `${idx + 1}. *${bid.commodity}* at *${bid.origin || bid.location || "N/A"}*\n`;
          content += `   • *Base Rate:* ₹${bid.rate || bid.baseRate || "N/A"}\n`;
          content += `   • *Quantity:* ${bid.quantity || "N/A"} Tons\n`;
          content += `   • *Participants:* ${bidParts.length > 0 ? bidParts.map((p) => p.sellerName).join(", ") : "No participants yet"}\n`;
          content += `   • *Date:* ${bDate} | *Time:* ${bid.startTime || "N/A"} - ${bid.endTime || "N/A"}\n`;
          content += `   • *Status:* ${bid.status?.toUpperCase()}\n\n`;
        });
        return {
          role: "assistant",
          content: content,
          suggestions: getDynamicSuggestions(
            [`Analyze ${bids[0].commodity} bid components`],
            content,
          ),
        };
      } else {
        return {
          role: "assistant",
          content: "No active bids found in the system right now.",
        };
      }
    } catch (error) {
      if (error.name === "AbortError") return null;
      console.error("Error fetching live bids:", error);
      return {
        role: "assistant",
        content: "Error fetching live bids and participation status.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchBidRateAnalysis = async () => {
    setIsLoadingData(true);
    setThinkingPath("Analyzing bid list for market highs...");
    try {
      const response = await api.get("/bids?status=active", {
        signal: getApiSignal(),
      });
      const bids = response.data.data || response.data;

      if (bids && bids.length > 0) {
        let maxRate = 0;
        let totalQty = 0;
        let highestBid = null;

        bids.forEach((bid) => {
          const rate = bid.rate || bid.baseRate || 0;
          if (rate > maxRate) {
            maxRate = rate;
            highestBid = bid;
          }
          totalQty += bid.quantity || 0;
        });

        let content = `*Bid Market Analysis*\n\n`;
        content += `• *Highest Bid Rate:* ₹${maxRate} (${highestBid?.commodity})\n`;
        content += `• *Total Quantity Needed:* ${totalQty.toFixed(2)} Tons\n\n`;
        content += `*Active Bids Summary:*\n`;
        bids.forEach((bid, idx) => {
          content += `${idx + 1}. *${bid.commodity}*: ₹${bid.rate || bid.baseRate} | ${bid.quantity} Tons\n`;
        });

        return {
          role: "assistant",
          content,
          suggestions: ["Active bids", "Total sauda today"],
        };
      } else {
        return {
          role: "assistant",
          content: "No active bids found to analyze rates.",
        };
      }
    } catch (error) {
      if (error.name === "AbortError") return null;
      return {
        role: "assistant",
        content: "Error in bid rate analysis.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchBidComponentAnalysis = async (commodity) => {
    setIsLoadingData(true);
    setThinkingPath(`Breaking down ${commodity} bid into components...`);
    try {
      const today = new Date().toISOString().split("T")[0];
      const signal = getApiSignal();
      const [bidRes, interactionRes] = await Promise.all([
        api.get(`/bids?commodity=${commodity}&status=active`, { signal }),
        api.get(`/participateBids?date=${today}`, { signal }),
      ]);

      const bids = bidRes.data.data || bidRes.data || [];
      const allInteractions =
        interactionRes.data.data || interactionRes.data || [];

      if (bids.length > 0) {
        const bid = bids[0];
        const interactions = allInteractions.filter(
          (i) => i.bidId === bid._id || i.commodity === bid.commodity,
        );

        let content = `*Bid Component Breakdown: ${commodity} (Today)*\n\n`;

        content += `*1. Logistics Component*\n`;
        content += `   • *Origin:* ${bid.origin || bid.location || "N/A"}\n`;
        content += `   • *Destination:* ${bid.destination || "Multiple"}\n`;
        content += `   • *Quantity:* ${bid.quantity} Tons\n\n`;

        content += `*2. Commercial Component*\n`;
        content += `   • *Base Rate:* ₹${bid.rate || bid.baseRate}\n`;
        content += `   • *Target Rate:* ₹${bid.targetRate || "N/A"}\n`;
        content += `   • *CD/GST:* ${bid.cd || 0}% / ${bid.gst || 0}%\n\n`;

        content += `*3. Participation Component*\n`;
        content += `   • *Active Bidders:* ${interactions.length}\n`;
        if (interactions.length > 0) {
          const rates = interactions.map((i) => i.rate);
          const bestRate = Math.min(...rates);
          content += `   • *Best Offer:* ₹${bestRate}\n`;
          content += `   • *Avg Market Sentiment:* ₹${(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2)}\n`;
        } else {
          content += `   • *Status:* No active interactions yet\n`;
        }

        content += `\n*4. Timing Component*\n`;
        content += `   • *Date:* ${new Date(bid.bidDate).toLocaleDateString("en-GB")}\n`;
        content += `   • *Window:* ${bid.startTime} to ${bid.endTime}\n`;

        return {
          role: "assistant",
          content,
          suggestions: getDynamicSuggestions(
            [`Interactions for ${commodity}`, "Show bids"],
            content,
          ),
        };
      }
      return {
        role: "assistant",
        content: `I couldn't find an active bid for *${commodity}* to break down.`,
      };
    } catch (error) {
      return {
        role: "assistant",
        content: "Error in component analysis.",
      };
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchTodaySaudas = async () => {
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `today_saudas_${today}`;
    
    // Check cache first
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    setIsLoadingData(true);
    setThinkingPath("Calculating today's sauda statistics...");
    try {
      clearApiCache();
      const response = await api.get(
        `/self-order?startDate=${today}&endDate=${today}`,
        { signal: getApiSignal() },
      );
      const saudas = response.data.data || response.data;

      let result;
      if (saudas && saudas.length > 0) {
        let content = `*System Sauda Summary (${new Date().toLocaleDateString("en-GB")})*\n\n`;
        content += `Total Count: *${saudas.length}*\n\n`;
        saudas.forEach((s, idx) => {
          content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.buyerCompany} | ${s.commodity}\n`;
        });

        result = {
          role: "assistant",
          content: content,
          suggestions: getDynamicSuggestions([
            `Sauda ${saudas[0].saudaNo} details`,
          ]),
        };
      } else {
        result = {
          role: "assistant",
          content: "System shows 0 saudas created today.",
        };
      }

      // Cache the result
      setCachedResponse(cacheKey, result);
      return result;
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

  const fetchFullCompanyDetails = async (companyName) => {
    setIsLoadingData(true);
    setThinkingPath(`Querying company intelligence: ${companyName}...`);
    try {
      const signal = getApiSignal();
      const response = await api.get(`/companies?search=${companyName}`, {
        signal,
      });
      const companies = response.data.data || response.data;

      if (companies && companies.length > 0) {
        const comp = companies[0];
        const cName = comp.companyName;

        const saudaRes = await api.get(`/self-order?search=${cName}`, {
          signal,
        });
        const saudas = saudaRes.data.data || saudaRes.data || [];

        const supplierSaudaRes = await api.get(
          `/self-order?supplierCompany=${cName}`,
          { signal },
        );
        const supplierSaudas =
          supplierSaudaRes.data.data || supplierSaudaRes.data || [];

        let content =
          `*Full Company Intelligence: ${cName}*\n\n` +
          `*Company Details:*\n` +
          `• *GST:* ${comp.gstNumber || comp.gstNo || "N/A"}\n` +
          `• *Location:* ${comp.location || "N/A"}, ${comp.district || "N/A"}, ${comp.state || "N/A"}\n` +
          `• *Group:* ${comp.groupId?.groupName || "N/A"}\n` +
          `• *Status:* VERIFIED\n\n`;

        // Show commodity configuration
        if (comp.commodities && comp.commodities.length > 0) {
          content += `*Company Commodity Configuration:*\n`;
          comp.commodities.forEach((cc, idx) => {
            const commodityName = cc.commodityName || cc.commodityId?.name || "N/A";
            content += `${idx + 1}. *${commodityName}*\n`;
            if (cc.brokerage) {
              content += `   • Brokerage: ₹${cc.brokerage}/Ton\n`;
            }
            if (cc.parameters && cc.parameters.length > 0) {
              cc.parameters.forEach((param) => {
                const paramValues = param.values?.[0] || {};
                let paramLine = `   • ${param.parameterName || param.parameterId?.name || "Quality Parameter"}: `;
                if (paramValues.baseValue && paramValues.maxValue) {
                  paramLine += `${paramValues.baseValue}% - ${paramValues.maxValue}%`;
                } else if (paramValues.baseValue) {
                  paramLine += `${paramValues.baseValue}%`;
                } else if (paramValues.maxValue) {
                  paramLine += `${paramValues.maxValue}%`;
                }
                if (paramLine !== `   • ${param.parameterName || param.parameterId?.name || "Quality Parameter"}: `) {
                  content += `${paramLine}\n`;
                }
              });
            }
            content += `\n`;
          });
        }

        if (saudas.length > 0) {
          content += `*Trade Summary (as Buyer):*\n`;
          content += `• *Total Saudas:* ${saudas.length}\n`;
          const totalQty = saudas.reduce(
            (acc, s) => acc + (s.quantity || 0),
            0,
          );
          content += `• *Total Volume:* ${totalQty.toFixed(2)} Tons\n\n`;

          content += `*Recent Buyer Saudas:*\n`;
          saudas.slice(0, 3).forEach((s, idx) => {
            content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.commodity} | ${s.quantity} Tons\n`;
          });
          content += "\n";
        }

        if (supplierSaudas.length > 0) {
          content += `*Trade Summary (as Supplier Company):*\n`;
          content += `• *Total Saudas:* ${supplierSaudas.length}\n`;
          const totalQty = supplierSaudas.reduce(
            (acc, s) => acc + (s.quantity || 0),
            0,
          );
          content += `• *Total Volume:* ${totalQty.toFixed(2)} Tons\n\n`;

          content += `*Recent Supplier Saudas:*\n`;
          supplierSaudas.slice(0, 3).forEach((s, idx) => {
            content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.commodity} | ${s.quantity} Tons\n`;
          });
          content += "\n";
        }

        return {
          role: "assistant",
          content,
          suggestions: getDynamicSuggestions(
            [`Saudas for ${cName}`, "Active bids"],
            content,
          ),
        };
      } else {
        const supplierSaudaRes = await api.get(
          `/self-order?supplierCompany=${companyName}`,
          { signal },
        );
        const supplierSaudas =
          supplierSaudaRes.data.data || supplierSaudaRes.data || [];

        if (supplierSaudas.length > 0) {
          const cName = supplierSaudas[0].supplierCompany;
          let content =
            `*Supplier Company Intelligence: ${cName}*\n\n` +
            `• *Total Saudas:* ${supplierSaudas.length}\n`;
          const totalQty = supplierSaudas.reduce(
            (acc, s) => acc + (s.quantity || 0),
            0,
          );
          content += `• *Total Volume:* ${totalQty.toFixed(2)} Tons\n\n`;

          content += `*Recent Supplier Saudas:*\n`;
          supplierSaudas.slice(0, 5).forEach((s, idx) => {
            content += `${idx + 1}. *Sauda ${s.saudaNo}*: ${s.commodity} | ${s.quantity} Tons\n`;
          });

          return {
            role: "assistant",
            content,
            suggestions: getDynamicSuggestions(
              [`Saudas for ${cName}`],
              content,
            ),
          };
        }
      }
      return null;
    } catch (error) {
      return null;
    } finally {
      setIsLoadingData(false);
      setThinkingPath("");
    }
  };

  const fetchBidInteractions = async (commodity) => {
    setIsLoadingData(true);
    setThinkingPath(`Analyzing today's interactions for ${commodity}...`);
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(`/participateBids?date=${today}`, {
        signal: getApiSignal(),
      });
      const allInteractions = response.data.data || response.data;

      const interactions = allInteractions.filter(
        (i) =>
          i.commodity?.toLowerCase().includes(commodity.toLowerCase()) ||
          i.bidId?.commodity?.toLowerCase().includes(commodity.toLowerCase()),
      );

      if (interactions && interactions.length > 0) {
        let content = `*Interaction Analytics: ${commodity}*\n\n`;
        interactions.forEach((item, idx) => {
          content += `${idx + 1}. *${item.sellerName}*: ₹${item.rate} | ${item.quantity} Tons | Status: ${item.status?.toUpperCase() || "PENDING"}\n`;
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
      const response = await api.get(`/loading-entries?search=${billNo}`, {
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
            `• *Date:* ${new Date(entry.loadingDate).toLocaleDateString("en-GB")}\n` +
            `• *Weight:* ${entry.loadingWeight} Tons\n` +
            `• *Buyer/Supplier:* ${entry.buyerCompany} / ${entry.supplierCompany}\n` +
            `• *Payment:* ${entry.paymentStatus === "done" ? "PAID" : "PENDING"}`,
          suggestions: getDynamicSuggestions(
            [
              `Sauda ${entry.saudaNo} details`,
              `Lorry ${entry.lorryNumber} details`,
              `Add loading for Sauda ${entry.saudaNo}`,
            ],
            `Invoice Found: ${entry.billNumber || billNo}`,
          ),
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
      const response = await api.get(`/loading-entries?saudaNo=${saudaNo}`, {
        signal: getApiSignal(),
      });
      const entries = response.data.data || response.data;

      if (entries && entries.length > 0) {
        let content = `*Loading History: Sauda ${saudaNo}*\n\n`;
        entries.forEach((entry, idx) => {
          content += `${idx + 1}. *${entry.lorryNumber}* | ${new Date(entry.loadingDate).toLocaleDateString("en-GB")} | ${entry.loadingWeight} Tons\n`;
        });

        return {
          role: "assistant",
          content: content,
          suggestions: getDynamicSuggestions(
            [`Sauda ${saudaNo} details`, `Add loading for Sauda ${saudaNo}`],
            content,
          ),
        };
      } else {
        return {
          role: "assistant",
          content: `No delivery records for Sauda *${saudaNo}*.`,
          suggestions: getDynamicSuggestions([
            `Sauda ${saudaNo} details`,
            `Add loading for Sauda ${saudaNo}`,
          ]),
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
    setThinkingPath(`Extracting full Lorry Profile for ${lorryNo}...`);
    try {
      const signal = getApiSignal();
      const rawLorry = lorryNo.toUpperCase();
      const cleanLorry = lorryNo.replace(/\s+/g, "").toUpperCase();

      let response = await api.get(
        `/loading-entries/lorry-wise?lorryNumber=${encodeURIComponent(rawLorry)}`,
        { signal },
      );
      let entries = response.data.data || response.data || [];

      if (entries.length === 0 && rawLorry !== cleanLorry) {
        setThinkingPath(`Retrying without spaces: ${cleanLorry}...`);
        response = await api.get(
          `/loading-entries/lorry-wise?lorryNumber=${encodeURIComponent(cleanLorry)}`,
          { signal },
        );
        entries = response.data.data || response.data || [];
      }

      if (entries.length === 0) {
        setThinkingPath(`Searching system-wide for ${cleanLorry}...`);
        response = await api.get(
          `/loading-entries?search=${encodeURIComponent(cleanLorry)}`,
          { signal },
        );
        entries = response.data.data || response.data || [];
      }

      if (entries.length > 0) {
        let content = `*Full Lorry Saria AI Report: ${lorryNo.toUpperCase()}*\n\n`;

        const saudaNos = [...new Set(entries.map((e) => e.saudaNo))];
        const saudaDetails = await Promise.all(
          saudaNos.map((no) =>
            api
              .get(`/self-order/details/${no}`)
              .catch(() => ({ data: { order: null } })),
          ),
        );
        const saudaMap = saudaDetails.reduce((acc, res) => {
          if (res.data?.order) acc[res.data.order.saudaNo] = res.data.order;
          return acc;
        }, {});

        entries.forEach((entry, idx) => {
          const sauda = saudaMap[entry.saudaNo] || {};
          const loadingDate = entry.loadingDate
            ? new Date(entry.loadingDate).toLocaleDateString("en-GB")
            : "N/A";
          const billDate = entry.billDate
            ? new Date(entry.billDate).toLocaleDateString("en-GB")
            : "N/A";
          const totalFreight = entry.totalFreight || 0;
          const advance = entry.advanceAmount || 0;
          const loaded = (sauda.quantity || 0) - (sauda.pendingQuantity || 0);

          content += `*LISTING ENTRY #${idx + 1}*\n`;
          content += `• *Loading No:* ${entry.loadingNo || "N/A"} | *Date:* ${loadingDate}\n`;
          content += `• *Sauda No:* ${entry.saudaNo} | *Commodity:* ${entry.commodity}\n`;
          content += `• *Seller:* ${entry.supplierCompany}\n`;
          content += `• *Buyer:* ${entry.buyerCompany}\n`;
          content += `• *Consignee:* ${entry.consignee || "N/A"}\n`;
          content += `• *Payment Terms:* ${sauda.paymentTerms || "N/A"} Days\n`;
          content += `• *Weight:* Load: ${entry.loadingWeight}T | Unload: ${entry.unloadingWeight || 0}T\n`;
          content += `• *Sauda Status:* Total: ${sauda.quantity || 0}T | Loaded: ${loaded.toFixed(2)}T | Pending: ${sauda.pendingQuantity || 0}T\n`;
          content += `• *Lorry:* ${entry.lorryNumber} | *Status:* ${entry.unloadingDate ? "UNLOADED" : "IN TRANSIT"}\n`;
          content += `• *Logistics:* ${entry.transporterName || "N/A"} | Driver: ${entry.driverName || "N/A"} (${entry.driverMobile || "N/A"})\n`;
          content += `• *Freight:* Rate: ₹${entry.freightRate || 0} | Total: ₹${totalFreight} | Advance: ₹${advance} | Balance: ₹${totalFreight - advance}\n`;
          content += `• *Invoicing:* Bill No: ${entry.billNumber || "N/A"} | Issue Date: ${billDate}\n`;
          content += `• *System:* Entered By: ${entry.createdBy?.name || "System"}\n\n`;
        });

        return {
          role: "assistant",
          content: content,
          suggestions: [
            `Download Lorry Report ${cleanLorry}`,
            `Sauda ${entries[0].saudaNo} details`,
            "Active bids",
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
      console.error("Lorry fetch error:", error);
      return {
        role: "assistant",
        content:
          "Error in vehicle tracking. Please ensure the Lorry Number is correct.",
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
        `/loading-entries?startDate=${today}&endDate=${today}`,
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

        let content = `*Today's Market Highs (${new Date().toLocaleDateString("en-GB")})*\n\n`;
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

  const universalDeepSearch = async (query) => {
    setIsLoadingData(true);
    setThinkingPath("Initiating Deep Research Scan...");

    const results = [];
    let suggestions = [];

    // First check for number-based queries (sauda, lorry, bill)
    if (/^\d{3,5}$/.test(query) || /(\d{3,5})\s*(?:sauda|order)/i.test(query)) {
      setThinkingPath("Checking Sauda Records...");
      const sNum = query.match(/(\d{3,5})/)[1];
      const saudaRes = await fetchSaudaDetails(sNum);
      if (saudaRes && !saudaRes.content.includes("I couldn't find")) {
        results.push({ type: "Sauda", response: saudaRes });
      }
    }

    // Check lorry and bill in parallel
    setThinkingPath("Scanning Vehicles and Invoices...");
    const [lorryRes, billRes] = await Promise.all([
      /\d{2}/.test(query) ? fetchLorryDetails(query) : Promise.resolve(null),
      /^\d+$/.test(query) ? fetchDetailsByBillNo(query) : Promise.resolve(null),
    ]);

    if (lorryRes && !lorryRes.content.includes("No records found")) {
      results.push({ type: "Lorry", response: lorryRes });
    }
    if (billRes && !billRes.content.includes("not found in system")) {
      results.push({ type: "Bill", response: billRes });
    }

    // Now search for partners and companies in parallel
    setThinkingPath("Searching Partners and Companies...");
    const [seller, buyer, company] = await Promise.all([
      fetchFullPartnerDetails(query, "Seller"),
      fetchFullPartnerDetails(query, "Buyer"),
      fetchFullCompanyDetails(query),
    ]);

    if (seller) results.push({ type: "Seller", response: seller });
    if (buyer) results.push({ type: "Buyer", response: buyer });
    if (company) results.push({ type: "Company", response: company });

    // Also check for commodities via smart search
    setThinkingPath("Checking Commodities and Quality Parameters...");
    try {
      const smartSearchRes = await api.get("/commodities/search/smart", {
        params: { q: query },
        signal: getApiSignal(),
      });

      const { qualityParameters, companies, commodities } = smartSearchRes.data || {};
      
      if (qualityParameters && qualityParameters.length > 0) {
        let content = `*Quality Parameters Found:*\n\n`;
        qualityParameters.forEach((qp, i) => {
          content += `${i + 1}. *${qp.name}*${qp.description ? ` - ${qp.description}` : ""}\n`;
        });
        results.push({
          type: "Quality Parameter",
          response: {
            role: "assistant",
            content,
          },
        });
      }

      if (commodities && commodities.length > 0) {
        let content = `*Commodities Found:*\n\n`;
        commodities.forEach((c, i) => {
          content += `${i + 1}. *${c.name}* (HSN: ${c.hsnCode})\n`;
        });
        results.push({
          type: "Commodity",
          response: {
            role: "assistant",
            content,
          },
        });
        suggestions.push("Today's market rate");
      }
    } catch (error) {
      console.error("Smart search error:", error);
    }

    setIsLoadingData(false);
    setThinkingPath("");

    // Determine what to return
    if (results.length === 0) {
      return {
        role: "assistant",
        content: `I've performed a Saria AI deep research for "*${query}*" across all Saudas, Invoices, Vehicles, Partners, and Commodities, but no direct match was found.`,
        suggestions: ["Total sauda today", "Active bids", "Highest rate today"],
      };
    } else if (results.length === 1) {
      // Single result, return it directly
      const result = results[0];
      if (result.response.suggestions) {
        suggestions = result.response.suggestions;
      }
      return {
        ...result.response,
        suggestions: suggestions.length > 0 ? suggestions : ["Total sauda today", "Active bids"],
      };
    } else {
      // Multiple results, show a summary and let user pick
      let content = `*Deep Research Results for "${query}":*\n\n`;
      results.forEach((res, i) => {
        content += `${i + 1}. *${res.type}* Found\n`;
      });
      content += `\nShowing first result: \n---\n`;
      
      // Show first result's content
      const firstResult = results[0];
      content += firstResult.response.content;
      
      // Combine suggestions
      const allSuggestions = [];
      results.forEach(res => {
        if (res.response.suggestions) {
          allSuggestions.push(...res.response.suggestions);
        }
      });
      
      return {
        role: "assistant",
        content,
        suggestions: [...new Set(allSuggestions)].slice(0, 4), // Deduplicate and limit to 4
      };
    }
  };

  return {
    fetchCommodities,
    fetchAccountStatus,
    fetchWeather,
    fetchFullPartnerDetails,
    fetchPendingSaudaByEntity,
    fetchRelationshipContext,
    fetchSaudasByCompanyAndConsignee,
    fetchSellerSaudaStatus,
    fetchSaudaDetails,
    fetchDetailsByDate,
    fetchLastSauda,
    fetchActiveBids,
    fetchBidRateAnalysis,
    fetchBidComponentAnalysis,
    fetchTodaySaudas,
    fetchFullCompanyDetails,
    fetchBidInteractions,
    fetchSaudaPayment,
    fetchDetailsByBillNo,
    fetchDetailsByState,
    fetchLoadingEntriesBySauda,
    fetchLorryDetails,
    fetchTodayRate,
    universalDeepSearch,
  };
};
