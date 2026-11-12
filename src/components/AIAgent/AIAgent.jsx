import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { SARIA_AI_ORDER_EDIT_RESULT_EVENT } from "../../utils/sariaAIOrderEdit";
import { SARIA_AI_ACTION_RESULT_EVENT } from "../../utils/sariaAIAction";
import { useAIAgentCore } from "./hooks/useAIAgentCore";
import { useAIAgentLearning } from "./hooks/useAIAgentLearning";
import { useAIAgentAPI } from "./hooks/useAIAgentAPI";
import { useAIAgentVoice } from "./hooks/useAIAgentVoice";
import { useAIAgentCommands } from "./hooks/useAIAgentCommands";
import AIAgentHeader from "./components/AIAgentHeader";
import AIAgentMessages from "./components/AIAgentMessages";
import AIAgentInput from "./components/AIAgentInput";
import AIAgentFab from "./components/AIAgentFab";

const AIAgent = () => {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const userName = user?.name || user?.username || "";

  const {
    isOpen,
    setIsOpen,
    isMinimized,
    setIsMinimized,
    input,
    setInput,
    isListening,
    setIsListening,
    isLoadingData,
    setIsLoadingData,
    thinkingPath,
    setThinkingPath,
    messages,
    setMessages,
    scrollRef,
    getApiSignal,
    clearHistory,
    pageHistory,
    currentPath,
  } = useAIAgentCore(userName);

  useEffect(() => {
    const handleOrderEditResult = (event) => {
      if (!event.detail?.content) return;
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: event.detail.content },
      ]);
    };

    window.addEventListener(
      SARIA_AI_ORDER_EDIT_RESULT_EVENT,
      handleOrderEditResult,
    );
    window.addEventListener(
      SARIA_AI_ACTION_RESULT_EVENT,
      handleOrderEditResult,
    );
    return () => {
      window.removeEventListener(
        SARIA_AI_ORDER_EDIT_RESULT_EVENT,
        handleOrderEditResult,
      );
      window.removeEventListener(
        SARIA_AI_ACTION_RESULT_EVENT,
        handleOrderEditResult,
      );
    };
  }, [setMessages]);

  const { trackInteraction, getDynamicSuggestions, checkSafety } =
    useAIAgentLearning();

  const apiMethods = useAIAgentAPI(
    setIsLoadingData,
    setThinkingPath,
    getApiSignal,
    (contextSuggestions, responseText) =>
      getDynamicSuggestions(
        contextSuggestions,
        responseText,
        currentPath,
        pageHistory,
      ),
  );

  const { handleSend, liveSuggestions } = useAIAgentCommands({
    input,
    setInput,
    setMessages,
    messages,
    isLoadingData,
    navigate,
    apiMethods,
    learningMethods: { trackInteraction, checkSafety, getDynamicSuggestions },
    userName,
    currentPath,
    pageHistory,
    userRole,
    user,
  });

  const { startListening } = useAIAgentVoice(
    setMessages,
    setInput,
    handleSend,
    setIsListening,
    setThinkingPath,
  );

  if (userRole !== "Admin" && userRole !== "Employee") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end">
      {isOpen && !isMinimized && (
        <div className="mb-4 w-[90vw] sm:w-[400px] max-w-[450px] h-[70vh] sm:h-[500px] lux-card rounded-3xl shadow-2xl shadow-lux-emerald/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          <AIAgentHeader
            setIsMinimized={setIsMinimized}
            clearHistory={clearHistory}
            setIsOpen={setIsOpen}
            currentPath={currentPath}
          />

          <AIAgentMessages
            messages={messages}
            isLoadingData={isLoadingData}
            thinkingPath={thinkingPath}
            handleSend={handleSend}
            scrollRef={scrollRef}
          />

          <AIAgentInput
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            startListening={startListening}
            isListening={isListening}
            suggestions={liveSuggestions}
          />
        </div>
      )}

      <AIAgentFab
        isOpen={isOpen}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        setIsOpen={setIsOpen}
      />
    </div>
  );
};

export default AIAgent;
