import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
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
  const { userRole } = useAuth();

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
  } = useAIAgentCore();

  const { trackInteraction, getDynamicSuggestions } = useAIAgentLearning();

  const apiMethods = useAIAgentAPI(
    setIsLoadingData,
    setThinkingPath,
    getApiSignal,
    getDynamicSuggestions,
  );

  const { handleSend } = useAIAgentCommands({
    input,
    setInput,
    setMessages,
    isLoadingData,
    navigate,
    apiMethods,
    learningMethods: { trackInteraction, getDynamicSuggestions },
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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {isOpen && !isMinimized && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          <AIAgentHeader
            setIsMinimized={setIsMinimized}
            clearHistory={clearHistory}
            setIsOpen={setIsOpen}
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
