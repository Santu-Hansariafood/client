import { useState, useCallback, useRef, useEffect } from "react";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const useAIAgentLearning = () => {
  const [learningData, setLearningData] = useState(() => {
    const saved = localStorage.getItem("saria_ai_learning_v3");
    return saved
      ? JSON.parse(saved)
      : {
          recentQueries: [],
          frequentTopics: {},
          intentPatterns: {},
          entityMemory: { saudaNo: null, partner: null, commodity: null, lorryNo: null, companyName: null },
          workflowScores: { sauda: 0, loading: 0, payment: 0, bid: 0, company: 0 },
          userFeedback: [], // New field for user feedback on responses
          customIntents: [], // New field for user-trained intents
        };
  });

  // Ref to hold latest learningData for debounced save
  const latestLearningDataRef = useRef(learningData);
  useEffect(() => {
    latestLearningDataRef.current = learningData;
  }, [learningData]);

  // Debounced save to localStorage
  const debouncedSaveToLocalStorage = useRef(
    debounce(() => {
      localStorage.setItem("saria_ai_learning_v3", JSON.stringify(latestLearningDataRef.current));
    }, 500)
  ).current;

  // Save to localStorage whenever learningData changes (debounced)
  useEffect(() => {
    debouncedSaveToLocalStorage();
    // Cleanup debounce on unmount
    return () => {
      debouncedSaveToLocalStorage.cancel?.();
    };
  }, [learningData, debouncedSaveToLocalStorage]);

  const INTENT_CLUSTERS = {
    commercial: [
      "rate",
      "payment",
      "due",
      "outstanding",
      "ledger",
      "price",
      "brokerage",
      "cd",
      "gst",
      "broker",
    ],
    logistics: [
      "lorry",
      "vehicle",
      "loading",
      "unloading",
      "dispatch",
      "transit",
      "bill",
      "invoice",
      "truck",
    ],
    participation: [
      "bid",
      "active bids",
      "participate",
      "interactions",
      "bidders",
      "tender",
    ],
    relationship: ["buyer", "seller", "partner", "company", "trade", "profile"],
    selfOrder: ["self order", "add order", "create order", "add self order"],
    greeting: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
  };

  const WORKFLOWS = {
    sauda: ["Add Loading Entry", "Payment List"],
    loading: ["Payment List", "Track Lorry"],
    bid: ["Active Bids", "Total Sauda Today"],
    participation: ["Bid Interactions", "Sauda Profile"],
    company: ["Saudas for {company}", "Company Details"],
  };

  const HARMFUL_CONTENT_LIST = [
    "abuse", "hack", "script", "select * from", "drop table", "<script>",
    "fuck", "shit", "bitch", "asshole", "bastard", "idiot", "stupid", "dumb"
  ];

  const checkSafety = useCallback((text) => {
    const lowerText = text.toLowerCase();
    return HARMFUL_CONTENT_LIST.some(harm => lowerText.includes(harm));
  }, []);

  // New function: Extract entities from query
  const extractEntities = useCallback((query) => {
    const lowerQuery = query.toLowerCase();
    const entities = {
      saudaNo: null,
      lorryNo: null,
      commodity: null,
      companyName: null,
    };

    // Extract sauda numbers (3-5 digits)
    const saudaMatch = query.match(/\b(\d{3,5})\b/);
    if (saudaMatch) entities.saudaNo = saudaMatch[1];

    // Extract lorry numbers (basic pattern like HR26AB1234)
    const lorryMatch = query.match(/\b([A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,2}\s?\d{3,4})\b/i);
    if (lorryMatch) entities.lorryNo = lorryMatch[1].toUpperCase();

    return entities;
  }, []);

  const trackInteraction = useCallback((text, responseContent = "") => {
    if (!text || text.length < 3) return;

    const query = text.toLowerCase();
    const entities = extractEntities(query);

    setLearningData((prev) => {
      const newRecent = [
        text,
        ...prev.recentQueries.filter((q) => q !== text),
      ].slice(0, 15); // Increased to 15

      const newEntityMemory = { ...prev.entityMemory };
      if (entities.saudaNo) newEntityMemory.saudaNo = entities.saudaNo;
      if (entities.lorryNo) newEntityMemory.lorryNo = entities.lorryNo;

      let detectedCluster = "general";
      for (const [cluster, keywords] of Object.entries(INTENT_CLUSTERS)) {
        if (keywords.some((k) => query.includes(k))) {
          detectedCluster = cluster;
          break;
        }
      }

      const newFreq = { ...prev.frequentTopics };
      newFreq[text] = (newFreq[text] || 0) + 1;
      if (detectedCluster !== "general") {
        newFreq[detectedCluster] = (newFreq[detectedCluster] || 0) + 1.5; // Weight clusters higher
      }

      const newWorkflowScores = { ...prev.workflowScores };
      if (query.includes("sauda") || query.includes("self order")) newWorkflowScores.sauda += 1;
      if (query.includes("loading") || query.includes("lorry")) newWorkflowScores.loading += 1;
      if (query.includes("payment") || query.includes("due")) newWorkflowScores.payment += 1;
      if (query.includes("bid")) newWorkflowScores.bid += 1;
      if (query.includes("company")) newWorkflowScores.company += 1;

      const lastTopic = prev.recentQueries[0];
      const newPatterns = { ...prev.intentPatterns };
      if (lastTopic && lastTopic !== text) {
        if (!newPatterns[lastTopic]) newPatterns[lastTopic] = {};
        newPatterns[lastTopic][text] = (newPatterns[lastTopic][text] || 0) + 1;
      }

      const newState = {
        ...prev,
        recentQueries: newRecent,
        frequentTopics: newFreq,
        intentPatterns: newPatterns,
        entityMemory: newEntityMemory,
        workflowScores: newWorkflowScores,
      };

      return newState;
    });
  }, [extractEntities]);

  // New function: Record user feedback
  const recordFeedback = useCallback((query, response, isHelpful, correction = "") => {
    setLearningData((prev) => {
      const newFeedback = [
        {
          query,
          response,
          isHelpful,
          correction,
          timestamp: new Date().toISOString(),
        },
        ...prev.userFeedback,
      ].slice(0, 100); // Keep last 100 feedbacks

      const newState = {
        ...prev,
        userFeedback: newFeedback,
      };

      return newState;
    });
  }, []);

  // New function: Train custom intent
  const trainCustomIntent = useCallback((query, expectedAction) => {
    setLearningData((prev) => {
      const newCustomIntents = [
        ...prev.customIntents,
        {
          query: query.toLowerCase(),
          expectedAction,
          timestamp: new Date().toISOString(),
        }
      ];
      
      const newState = {
        ...prev,
        customIntents: newCustomIntents,
      };

      return newState;
    });
  }, []);

  // New function: Clear all learning data
  const clearLearningData = useCallback(() => {
    setLearningData({
      recentQueries: [],
      frequentTopics: {},
      intentPatterns: {},
      entityMemory: { saudaNo: null, partner: null, commodity: null, lorryNo: null, companyName: null },
      workflowScores: { sauda: 0, loading: 0, payment: 0, bid: 0, company: 0 },
      userFeedback: [],
      customIntents: [],
    });
    localStorage.removeItem("saria_ai_learning_v3");
  }, []);

  const getDynamicSuggestions = useCallback((
    contextSuggestions = [],
    responseText = "",
    currentPath = "",
    pageHistory = []
  ) => {
    let suggestions = [...contextSuggestions];
    const { entityMemory, workflowScores, intentPatterns, recentQueries } =
      learningData;

    // Add context-aware suggestions based on current page
    if (currentPath) {
      const pageSuggestions = getPageSpecificSuggestions(currentPath);
      pageSuggestions.forEach(s => {
        if (!suggestions.includes(s)) suggestions.push(s);
      });
    }

    // Add page history suggestions (recent pages)
    if (pageHistory && pageHistory.length > 0) {
      const recentPageLinks = pageHistory.slice(1, 4).map(page => {
        const action = findActionByPath(page.path);
        return action ? `Go back to ${action.name}` : null;
      }).filter(Boolean);
      
      recentPageLinks.forEach(s => {
        if (!suggestions.includes(s)) suggestions.push(s);
      });
    }

    if (entityMemory.saudaNo) {
      if (
        responseText.includes("Sauda Profile") ||
        responseText.includes(entityMemory.saudaNo)
      ) {
        const saudaActions = [
          `Add loading for Sauda ${entityMemory.saudaNo}`,
          `Payment of Sauda ${entityMemory.saudaNo}`,
          `Loading entries for Sauda ${entityMemory.saudaNo}`,
        ];
        saudaActions.forEach((a) => {
          if (!suggestions.includes(a)) suggestions.push(a);
        });
      }
    }

    if (entityMemory.lorryNo) {
      if (!suggestions.some((s) => s.includes("Lorry"))) {
        suggestions.push(`Lorry details for ${entityMemory.lorryNo}`);
      }
    }

    if (workflowScores.sauda > workflowScores.loading) {
      if (!suggestions.some((s) => s.includes("loading")))
        suggestions.push("Add Loading Entry");
    }
    if (workflowScores.loading > workflowScores.payment) {
      if (!suggestions.some((s) => s.includes("payment")))
        suggestions.push("Payment List");
    }
    if (workflowScores.company > 2 && !suggestions.some((s) => s.includes("Company"))) {
      suggestions.push("Company List");
    }

    if (responseText) {
      const resp = responseText.toLowerCase();
      if (
        resp.includes("pending") &&
        !suggestions.some((s) => s.includes("Pending"))
      ) {
        suggestions.push("Show all pending saudas");
      }
      if (
        (resp.includes("₹") || resp.includes("rate")) &&
        !suggestions.some((s) => s.includes("Highest"))
      ) {
        suggestions.push("Highest rate today");
      }
      if (
        resp.includes("bid") &&
        !suggestions.some((s) => s.includes("active bids"))
      ) {
        suggestions.push("Active bids");
      }
    }

    const lastQuery = recentQueries[0]?.toLowerCase() || "";
    if (lastQuery) {
      // Use WORKFLOWS to suggest next steps based on the last query's intent
      for (const [workflowKey, nextSteps] of Object.entries(WORKFLOWS)) {
        if (lastQuery.includes(workflowKey)) {
          nextSteps.forEach(step => {
            if (!suggestions.includes(step)) suggestions.push(step);
          });
        }
      }

      if (intentPatterns[lastQuery]) {
        const predicted = Object.entries(intentPatterns[lastQuery])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map((entry) => entry[0]);
        predicted.forEach((p) => {
          if (!suggestions.includes(p)) suggestions.push(p);
        });
      }
    }

    const topFreq = Object.entries(learningData.frequentTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0])
      .filter((f) => !Object.keys(INTENT_CLUSTERS).includes(f)); // Don't suggest raw cluster names

    topFreq.forEach((f) => {
      if (suggestions.length < 6 && !suggestions.includes(f)) {
        suggestions.push(f);
      }
    });

    // Also add suggestions from custom intents if applicable
    if (learningData.customIntents.length > 0) {
      learningData.customIntents.slice(0, 2).forEach(intent => {
        if (!suggestions.includes(intent.expectedAction)) {
          suggestions.push(intent.expectedAction);
        }
      });
    }

    return [...new Set(suggestions)].slice(0, 5);
  }, [learningData]);

  // Helper function to get page-specific suggestions
  const getPageSpecificSuggestions = (path) => {
    const suggestions = [];
    
    // Dashboard
    if (path.includes("/dashboard")) {
      suggestions.push("Show recent saudas");
      suggestions.push("Check loading entries");
      suggestions.push("View payment status");
    }
    
    // Loading Entry pages
    if (path.includes("/Loading-Entry/")) {
      if (path.includes("add")) {
        suggestions.push("View recent loadings");
      } else if (path.includes("list")) {
        suggestions.push("Add a new loading entry");
      }
      suggestions.push("Check pending saudas");
    }
    
    // Payments pages
    if (path.includes("/payments/")) {
      if (path.includes("received")) {
        suggestions.push("View payment ledger");
      }
      suggestions.push("Check due payments");
    }
    
    // Buyer/Seller pages
    if (path.includes("/buyer/")) {
      suggestions.push("Add a new buyer");
    }
    if (path.includes("/seller-")) {
      suggestions.push("Add a new seller company");
    }
    
    return suggestions;
  };

  // Helper function to find action by path
  const findActionByPath = (path) => {
    // Import dashboard data here or pass it in
    // For now, we'll create a simple mapping
    const pathMap = {
      "/dashboard": { name: "Dashboard" },
      "/buyer/list": { name: "Buyer List" },
      "/buyer/add": { name: "Add Buyer" },
      "/company/list": { name: "Company List" },
      "/Loading-Entry/list-loading-entry": { name: "Loading Entry List" },
      "/Loading-Entry/add-loading-entry": { name: "Add Loading Entry" },
      "/manage-order/list-self-order": { name: "Self Order List" },
      "/manage-order/add-self-order": { name: "Add Self Order" },
      "/payments/received/list": { name: "Payment Ledger" },
    };
    return pathMap[path] || null;
  };

  return { 
    learningData, 
    trackInteraction, 
    getDynamicSuggestions,
    checkSafety,
    recordFeedback,
    trainCustomIntent,
    clearLearningData,
    extractEntities
  };
};
