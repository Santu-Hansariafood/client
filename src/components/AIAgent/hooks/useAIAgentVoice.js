import { useState } from "react";

export const useAIAgentVoice = (
  setMessages,
  setInput,
  handleSend,
  setIsListening,
  setThinkingPath,
) => {
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

  return { startListening };
};
