import { useState } from "react";

export const useAIAgentLearning = () => {
  const [learningData, setLearningData] = useState(() => {
    const saved = localStorage.getItem("saria_ai_learning_v2");
    return saved
      ? JSON.parse(saved)
      : {
          recentQueries: [],
          frequentTopics: {},
          intentPatterns: {},
          entityMemory: { saudaNo: null, partner: null, commodity: null },
          workflowScores: { sauda: 0, loading: 0, payment: 0, bid: 0 },
        };
  });

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
  };

  const WORKFLOWS = {
    sauda: ["Add Loading Entry", "Payment List"],
    loading: ["Payment List", "Track Lorry"],
    bid: ["Active Bids", "Total Sauda Today"],
    participation: ["Bid Interactions", "Sauda Profile"]
  };

  const HARMFUL_CONTENT_LIST = [
    "abuse", "hack", "script", "select * from", "drop table", "<script>",
    "fuck", "shit", "bitch", "asshole", "bastard", "idiot", "stupid", "dumb"
  ];

  const checkSafety = (text) => {
    const lowerText = text.toLowerCase();
    return HARMFUL_CONTENT_LIST.some(harm => lowerText.includes(harm));
  };

  const trackInteraction = (text, responseContent = "") => {
    if (!text || text.length < 3) return;

    const query = text.toLowerCase();

    setLearningData((prev) => {
      const newRecent = [
        text,
        ...prev.recentQueries.filter((q) => q !== text),
      ].slice(0, 10);

      const saudaMatch = query.match(/(\d{3,5})/);
      const newEntityMemory = { ...prev.entityMemory };
      if (saudaMatch) newEntityMemory.saudaNo = saudaMatch[0];

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
      if (query.includes("sauda")) newWorkflowScores.sauda += 1;
      if (query.includes("loading")) newWorkflowScores.loading += 1;
      if (query.includes("payment")) newWorkflowScores.payment += 1;
      if (query.includes("bid")) newWorkflowScores.bid += 1;

      const lastTopic = prev.recentQueries[0];
      const newPatterns = { ...prev.intentPatterns };
      if (lastTopic && lastTopic !== text) {
        if (!newPatterns[lastTopic]) newPatterns[lastTopic] = {};
        newPatterns[lastTopic][text] = (newPatterns[lastTopic][text] || 0) + 1;
      }

      const newState = {
        recentQueries: newRecent,
        frequentTopics: newFreq,
        intentPatterns: newPatterns,
        entityMemory: newEntityMemory,
        workflowScores: newWorkflowScores,
      };

      localStorage.setItem("saria_ai_learning_v2", JSON.stringify(newState));
      return newState;
    });
  };

  const getDynamicSuggestions = (
    contextSuggestions = [],
    responseText = "",
  ) => {
    let suggestions = [...contextSuggestions];
    const { entityMemory, workflowScores, intentPatterns, recentQueries } =
      learningData;

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

    if (workflowScores.sauda > workflowScores.loading) {
      if (!suggestions.some((s) => s.includes("loading")))
        suggestions.push("Add Loading Entry");
    }
    if (workflowScores.loading > workflowScores.payment) {
      if (!suggestions.some((s) => s.includes("payment")))
        suggestions.push("Payment List");
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

    return [...new Set(suggestions)].slice(0, 5);
  };

  return { 
    learningData, 
    trackInteraction, 
    getDynamicSuggestions,
    checkSafety
  };
};
