"use client"

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, MessageSquare, Mic } from "lucide-react"; // <-- Import Mic icon
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { aiService } from "../../services/aiService";
import toast from "react-hot-toast";

const AIMessage = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part);
    return (
        <div className="whitespace-pre-wrap">
            {parts.map((part, index) => 
                part.startsWith('**') && part.endsWith('**') ? 
                <strong key={index} className="text-slate-900">{part.slice(2, -2)}</strong> : 
                part
            )}
        </div>
    );
};

const LegalHelpPage = () => {
  const { t } = useTranslation();
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // <-- State for voice recording
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null); // <-- Ref for speech recognition instance

  // --- NEW: Setup speech recognition ---
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
        console.warn("Speech recognition not supported in this browser.");
        return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleAutoSubmit(transcript); // Automatically submit after speaking
    };

    recognition.onerror = (event) => toast.error(`Microphone error: ${event.error}`);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }, []);
  
  useEffect(() => {
    setConversation([{
        role: 'assistant',
        content: "Welcome to the NyayaSaathi Legal Assistant! How can I help you today? You can ask me about Aadhaar, Land Disputes, Pension Schemes, and more."
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // --- NEW: Central submission function ---
  const handleAutoSubmit = async (query) => {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setInput("");
    setIsLoading(true);

    try {
      const history = newConversation.map(msg => ({ role: msg.role, content: msg.content }));
      const aiResponse = await aiService.getChatResponse(history.slice(0, -1), userMessage.content);
      setConversation(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      setConversation(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAutoSubmit(input);
  };
  
  // --- NEW: Function to toggle the microphone ---
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

  const handleSuggestedQuestion = (question) => {
      // Use the auto-submit function for suggested questions too
      handleAutoSubmit(question);
  };

  const suggestedQuestions = [
      "How do I update my address on my Aadhaar card?",
      "What are the steps to resolve a land dispute?",
      "Tell me about the widow pension scheme.",
      "What should I do if I receive a court summons?"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 flex flex-col h-[calc(100vh-8rem)]">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-slate-900 flex items-center justify-center gap-3">
            <MessageSquare className="text-cyan-600"/>
            AI Legal Assistant
        </h1>
        <p className="text-slate-600 mt-2">Your 24/7 partner for legal guidance powered by AI.</p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {conversation.map((msg, index) => (
                <div key={index} className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"><Sparkles size={20} className="text-cyan-600"/></div>}
                    <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                        <AIMessage text={msg.content} />
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex gap-4 items-start justify-start">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"><Sparkles size={20} className="text-cyan-600"/></div>
                    <div className="max-w-[85%] p-4 rounded-2xl bg-slate-100 text-slate-800 rounded-bl-none flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16}/> Thinking...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />

            {conversation.length <= 1 && (
                <div className="py-8">
                    <h3 className="text-center text-slate-500 font-semibold mb-4">Or try one of these suggestions:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {suggestedQuestions.map(q => (
                            <button key={q} onClick={() => handleSuggestedQuestion(q)} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left text-sm text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all">
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("legalHelpPage.placeholder", "Ask your legal question...")}
              className="input-style flex-1"
              disabled={isLoading}
            />
            {/* --- NEW: Mic Button --- */}
            <button
              type="button"
              onClick={handleVoiceCommand}
              disabled={isLoading}
              className={`p-3 rounded-lg transition-colors duration-200 ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Mic size={20} />
            </button>
            <button type="submit" className="btn-primary p-3" disabled={isLoading || !input.trim()}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LegalHelpPage;