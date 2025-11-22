// PASTE THIS ENTIRE FILE INTO src/components/UnifiedCommandModal.jsx

"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic, MicOff, Send, X, Loader2, Sparkles, Volume2, VolumeX
} from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "../api/axiosConfig"
import { aiService } from "../services/aiService"

const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 15, stiffness: 200 } },
  exit: { opacity: 0, y: -50, scale: 0.9, transition: { duration: 0.2 } },
}

const UnifiedCommandModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState("voice") // Default to voice for accessibility
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false) // TTS State
  const [input, setInput] = useState("")
  const [conversation, setConversation] = useState([])
  const [currentStep, setCurrentStep] = useState(null)
  const [formData, setFormData] = useState({})
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)

  // Initialize speech recognition
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "hi-IN"; // Default to Hindi/Indian English context

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      handleInput(transcript)
    }

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsRecording(false);
      if (event.error !== 'no-speech') toast.error("Could not hear you. Please try again.");
    }

    recognition.onend = () => setIsRecording(false)
    recognitionRef.current = recognition

    // Cleanup TTS on unmount
    return () => {
        if (synthRef.current) synthRef.current.cancel();
    }
  }, [])

  // --- TEXT TO SPEECH ENGINE ---
  const speak = (text) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Simple language detection: Check for Hindi characters
    const hasHindi = /[\u0900-\u097F]/.test(text);
    
    // Get voices
    const voices = synthRef.current.getVoices();
    // Try to find a Hindi voice if text has Hindi, otherwise standard English
    const voice = voices.find(v => hasHindi ? v.lang.includes('hi') : v.lang.includes('en-IN')) || voices[0];
    
    utterance.voice = voice;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
      if (synthRef.current) {
          synthRef.current.cancel();
          setIsSpeaking(false);
      }
  };

  const addMessage = (message, isUser = false) => {
    setConversation((prev) => [...prev, { message, isUser, timestamp: Date.now() }])
    // If it's an AI message, speak it out
    if (!isUser) {
        speak(message);
    }
  }

  const handleVoiceToggle = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
    } else {
      // Stop AI from speaking when user wants to talk
      stopSpeaking(); 
      setInput("")
      recognitionRef.current?.start()
      setIsRecording(true)
    }
  }

  const handleInput = async (inputText) => {
    if (!inputText.trim()) return

    addMessage(inputText, true)
    setInput("")
    setIsProcessing(true)

    try {
      if (!currentStep) {
        // --- STEP 1: AI INTENT PARSING ---
        const parsed = await aiService.parseUserIntent(inputText, {});
        
        if (parsed.intent === "general_query") {
            addMessage(parsed.data.description || "I can help you register issues or documents.");
        } 
        else if (parsed.intent) {
            const stepType = mapIntentToStep(parsed.intent);
            if (stepType) {
                const initialData = parsed.data || {};
                setFormData(initialData);
                
                const stepObj = { type: stepType, data: initialData };
                setCurrentStep(stepObj);
                
                const nextQ = getNextQuestion(stepObj, initialData);
                if (nextQ === "COMPLETE") {
                    await submitData(stepType, initialData);
                } else {
                    addMessage(`Starting ${stepType.replace('_', ' ')}. ${nextQ}`);
                }
            } else {
                addMessage("I understood the intent but cannot perform that action yet.");
            }
        }
      } else {
        // --- STEP 2: CONTEXTUAL UPDATE LOOP ---
        const parsed = await aiService.parseUserIntent(inputText, formData);
        const mergedData = { ...formData, ...parsed.data };
        
        setFormData(mergedData);
        setCurrentStep({ ...currentStep, data: mergedData });

        const nextQuestion = getNextQuestion(currentStep, mergedData);

        if (nextQuestion === "COMPLETE") {
          await submitData(currentStep.type, mergedData);
        } else {
          addMessage(nextQuestion);
        }
      }
    } catch (error) {
      addMessage(`Sorry, I encountered an error: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const mapIntentToStep = (aiIntent) => {
      const map = {
          'create_issue': 'issue',
          'create_document': 'document',
          'register_user': 'user'
      };
      return map[aiIntent] || null;
  }

  const getNextQuestion = (step, data) => {
    switch (step.type) {
      case "issue":
        if (!data.issueType || data.issueType === "Other") return "Could you confirm the type of issue? (e.g., Land Dispute, Aadhaar)"
        if (!data.description) return "Please describe the issue in more detail."
        return "COMPLETE"

      case "document":
        if (!data.documentType) return "What type of document is this?"
        return "COMPLETE"

      default: return "COMPLETE";
    }
  }

  const submitData = async (type, payload) => {
    setIsProcessing(true)
    const loadingToast = toast.loading(`Creating ${type}...`)

    try {
      let endpoint = ""
      if (type === "issue") endpoint = "/issues"
      else if (type === "document") {
          endpoint = "/documents/upload"; 
          toast.dismiss(loadingToast);
          addMessage("I've prepared the document details. Please attach the actual file now.");
          return; 
      }

      if (type === 'issue' && !payload.issueType) payload.issueType = "Other";

      await apiClient.post(endpoint, payload)
      toast.success("Created successfully!", { id: loadingToast })
      addMessage(`Successfully created ${type}.`)
      onSuccess()
      
      setTimeout(handleClose, 3000);

    } catch (error) {
      toast.error(`Failed: ${error.message}`, { id: loadingToast })
      addMessage(`Error: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    stopSpeaking(); // Stop TTS
    if (isRecording) recognitionRef.current?.stop()
    setIsRecording(false)
    setIsProcessing(false)
    setInput("")
    setConversation([])
    setCurrentStep(null)
    setFormData({})
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={20} />
                <h3 className="text-xl font-bold text-white">
                  NyayaSaathi Voice Agent
                </h3>
              </div>
              <div className="flex items-center gap-3">
                  {/* TTS Indicator */}
                  {isSpeaking && (
                      <div className="flex items-center gap-1 text-cyan-400 animate-pulse">
                          <Volume2 size={16} />
                          <span className="text-xs">Speaking...</span>
                      </div>
                  )}
                  <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700">
                    <X />
                  </button>
              </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px]">
              {conversation.length === 0 && (
                <div className="text-center text-slate-400 py-8">
                  <p className="text-lg mb-2">Try saying:</p>
                  <p className="text-cyan-300 italic">"Register a land dispute in Mathura"</p>
                  <p className="text-cyan-300 italic">"Mere aadhaar card mein galti hai"</p>
                </div>
              )}

              {conversation.map((msg, index) => (
                <div key={index} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.isUser ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 text-slate-200 p-3 rounded-lg flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700 flex flex-col items-center gap-4">
               <div className="flex items-center gap-4">
                   {/* Mic Button */}
                   <button
                    onClick={handleVoiceToggle}
                    disabled={isProcessing}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
                        isRecording ? "bg-red-600 animate-pulse shadow-red-500/50" : "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/50"
                    }`}
                    >
                    {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                    </button>

                    {/* Stop Speaking Button (Only visible if speaking) */}
                    {isSpeaking && (
                        <button 
                            onClick={stopSpeaking}
                            className="p-3 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                            title="Stop Speaking"
                        >
                            <VolumeX size={20} />
                        </button>
                    )}
               </div>
               
                <p className="text-sm text-slate-400">
                {isRecording ? "Listening..." : "Click mic to speak (Hindi/English)"}
                </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
export default UnifiedCommandModal