import { useState, useRef, useEffect, useCallback } from "react";

export const useAIAgentCore = (userName) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [thinkingPath, setThinkingPath] = useState("");
  const abortControllerRef = useRef(null);
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: userName 
        ? `Welcome Mr ${userName}! I am your Saria AI. How can I help you today?` 
        : "Hello! I am your Saria AI. I have full control over the system data and navigation. Ask me anything about Saudas, Loadings, Sellers, Buyers, or Payments. I can also open any page for you!",
      suggestions: [
        "Show sidebar menu",
        "Total sauda today",
        "Open Buyer List",
        "Active bids",
      ],
    },
  ]);

  const getApiSignal = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const clearHistory = () => {
    setMessages([
      {
        role: "assistant",
        content: "System cache cleared. Saria AI is ready.",
        suggestions: [
          "Total sauda today",
          "Active bids",
          "Highest rate today",
          "Create Self Order",
        ],
      },
    ]);
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized, isLoadingData, thinkingPath, scrollToBottom]);

  return {
    isOpen, setIsOpen,
    isMinimized, setIsMinimized,
    input, setInput,
    isListening, setIsListening,
    isLoadingData, setIsLoadingData,
    thinkingPath, setThinkingPath,
    messages, setMessages,
    scrollRef,
    getApiSignal,
    clearHistory
  };
};
