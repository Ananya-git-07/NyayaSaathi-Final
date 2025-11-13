// PASTE THIS ENTIRE FILE INTO src/components/SmartAssistantModal.jsx

"use client"

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, X, MessageSquare, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { aiService } from "../services/aiService";
import toast from "react-hot-toast";

const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 250 },
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

const AIMessage = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter((part) => part);
  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </div>
  );
};

const SmartAssistantModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleAutoSubmit(transcript);
    };

    recognition.onerror = (event) => toast.error(`Microphone error: ${event.error}`);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }, [i18n.language]);

  useEffect(() => {
    if (isOpen) {
      setConversation([
        {
          role: "assistant",
          content: t("assistant.welcome"),
        },
      ]);
      setInput("");
      if (isRecording) {
        recognitionRef.current?.stop();
      }
    }
  }, [isOpen, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleAutoSubmit = async (query) => {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: "user", content: query };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setInput("");
    setIsLoading(true);

    try {
      const history = newConversation.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      const aiResponse = await aiService.getChatResponse(history.slice(0, -1), userMessage.content);
      setConversation((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error) {
      setConversation((prev) => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    handleAutoSubmit(input);
  };

  const handleVoiceCommand = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        toast.error("Speech recognition is not available on this browser.");
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                  <MessageSquare size={20} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t("assistant.title")}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 items-start ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={16} className="text-cyan-600 dark:text-cyan-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3 rounded-xl ${
                      msg.role === "user"
                        ? "bg-cyan-600 text-white rounded-br-none"
                        : "bg-slate-100 text-slate-800 rounded-bl-none dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <AIMessage text={msg.content} />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 items-start justify-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 text-slate-800 rounded-bl-none dark:bg-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Loader2 className="animate-spin" size={14} /> {t("assistant.typing")}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("assistant.placeholder")}
                  className="input-style flex-1"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleVoiceCommand}
                  disabled={isLoading}
                  className={`p-3 rounded-lg transition-colors duration-200 ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Mic size={18} />
                </button>
                <button
                  type="submit"
                  className="btn-primary p-3"
                  disabled={isLoading || !input.trim()}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SmartAssistantModal;