"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic,
  MicOff,
  Send,
  X,
  MessageSquare,
  Loader2,
  Sparkles,
  FileText,
  AlertCircle,
  User,
  Building,
  Users,
} from "lucide-react"
import toast from "react-hot-toast"
import apiClient from "../api/axiosConfig"

const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 15, stiffness: 200 } },
  exit: { opacity: 0, y: -50, scale: 0.9, transition: { duration: 0.2 } },
}

const UnifiedCommandModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState("text") // 'text' or 'voice'
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [input, setInput] = useState("")
  const [conversation, setConversation] = useState([])
  const [currentStep, setCurrentStep] = useState(null)
  const [formData, setFormData] = useState({})
  const recognitionRef = useRef(null)

  // Initialize speech recognition
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      handleInput(transcript)
    }

    recognition.onerror = (event) => {
      toast.error(`Speech recognition error: ${event.error}`)
      setIsRecording(false)
    }

    recognition.onend = () => setIsRecording(false)
    recognitionRef.current = recognition
  }, [])

  const addMessage = (message, isUser = false) => {
    setConversation((prev) => [...prev, { message, isUser, timestamp: Date.now() }])
  }

  const handleVoiceToggle = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
    } else {
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
        // Initial command processing
        const command = parseInitialCommand(inputText)
        if (command) {
          setCurrentStep(command)
          addMessage(getNextQuestion(command, {}))
        } else {
          addMessage(
            "I can help you create issues, documents, or manage other data. Try saying 'create issue' or 'add document'.",
          )
        }
      } else {
        // Handle step-by-step data collection
        const updatedData = await handleStepInput(inputText)
        const nextQuestion = getNextQuestion(currentStep, updatedData)

        if (nextQuestion === "COMPLETE") {
          await submitData()
        } else {
          addMessage(nextQuestion)
        }
      }
    } catch (error) {
      addMessage(`Error: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const parseInitialCommand = (text) => {
    const lowerText = text.toLowerCase()

    if (lowerText.includes("issue") || lowerText.includes("problem") || lowerText.includes("legal")) {
      return { type: "issue", data: {} }
    }
    if (lowerText.includes("document") || lowerText.includes("file") || lowerText.includes("upload")) {
      return { type: "document", data: {} }
    }
    if (lowerText.includes("user") || lowerText.includes("citizen")) {
      return { type: "user", data: {} }
    }
    if (lowerText.includes("employee") || lowerText.includes("staff")) {
      return { type: "employee", data: {} }
    }
    if (lowerText.includes("kiosk") || lowerText.includes("center")) {
      return { type: "kiosk", data: {} }
    }
    if (lowerText.includes("paralegal") || lowerText.includes("lawyer")) {
      return { type: "paralegal", data: {} }
    }

    return null
  }

  const handleStepInput = async (inputText) => {
    let updatedData = { ...formData }

    switch (currentStep.type) {
      case "issue":
        updatedData = handleIssueStep(inputText, updatedData)
        break
      case "document":
        updatedData = handleDocumentStep(inputText, updatedData)
        break
      case "user":
        updatedData = handleUserStep(inputText, updatedData)
        break
      case "employee":
        updatedData = handleEmployeeStep(inputText, updatedData)
        break
      case "kiosk":
        updatedData = handleKioskStep(inputText, updatedData)
        break
      case "paralegal":
        updatedData = handleParalegalStep(inputText, updatedData)
        break
    }

    setFormData(updatedData)
    setCurrentStep({ ...currentStep, data: updatedData })
    return updatedData
  }

  const handleIssueStep = (input, data) => {
    if (!data.issueType) {
      const issueTypes = [
        "Aadhaar Issue",
        "Pension Issue",
        "Land Dispute",
        "Court Summon",
        "Certificate Missing",
        "Fraud Case",
        "Other",
      ]
      const foundType = issueTypes.find((type) => input.toLowerCase().includes(type.toLowerCase()))
      data.issueType = foundType || input
    } else if (!data.description) {
      data.description = input
    } else if (!data.priority) {
      const priorities = ["Low", "Medium", "High", "Urgent"]
      const foundPriority = priorities.find((p) => input.toLowerCase().includes(p.toLowerCase()))
      data.priority = foundPriority || "Medium"
    }
    return data
  }

  const handleDocumentStep = (input, data) => {
    if (!data.documentType) {
      data.documentType = input
    } else if (!data.issueId) {
      data.issueId = input
    }
    return data
  }

  const handleUserStep = (input, data) => {
    if (!data.fullName) {
      data.fullName = input
    } else if (!data.email) {
      data.email = input
    } else if (!data.aadhaarNumber) {
      data.aadhaarNumber = input
    } else if (!data.password) {
      data.password = input
    } else if (!data.role) {
      const roles = ["citizen", "paralegal", "employee", "admin"]
      const foundRole = roles.find((r) => input.toLowerCase().includes(r))
      data.role = foundRole || "citizen"
    }
    return data
  }

  const handleEmployeeStep = (input, data) => {
    if (!data.fullName) {
      data.fullName = input
    } else if (!data.email) {
      data.email = input
    } else if (!data.aadhaarNumber) {
      data.aadhaarNumber = input
    } else if (!data.password) {
      data.password = input
    } else if (!data.department) {
      data.department = input
    } else if (!data.designation) {
      data.designation = input
    }
    return data
  }

  const handleKioskStep = (input, data) => {
    if (!data.location) {
      data.location = input
    } else if (!data.village) {
      data.village = input
    } else if (!data.district) {
      data.district = input
    } else if (!data.operatorName) {
      data.operatorName = input
    } else if (!data.organizationType) {
      data.organizationType = input
    } else if (!data.organizationName) {
      data.organizationName = input
    }
    return data
  }

  const handleParalegalStep = (input, data) => {
    if (!data.fullName) {
      data.fullName = input
    } else if (!data.email) {
      data.email = input
    } else if (!data.aadhaarNumber) {
      data.aadhaarNumber = input
    } else if (!data.password) {
      data.password = input
    } else if (!data.phoneNumber) {
      data.phoneNumber = input
    } else if (!data.areasOfExpertise) {
      data.areasOfExpertise = input.split(",").map((s) => s.trim())
    }
    return data
  }

  const getNextQuestion = (step, data) => {
    switch (step.type) {
      case "issue":
        if (!data.issueType)
          return "What type of legal issue do you have? (e.g., Aadhaar Issue, Land Dispute, Pension Issue)"
        if (!data.description) return "Please describe your issue in detail:"
        if (!data.priority) return "What's the priority level? (Low, Medium, High, Urgent)"
        return "COMPLETE"

      case "document":
        if (!data.documentType) return "What type of document do you want to add? (e.g., Aadhaar Card, Land Papers)"
        if (!data.issueId) return "Enter the Issue ID this document relates to (or 'none' if not related):"
        return "COMPLETE"

      case "user":
        if (!data.fullName) return "What's the full name?"
        if (!data.email) return "What's the email address?"
        if (!data.aadhaarNumber) return "What's the Aadhaar number? (12 digits)"
        if (!data.password) return "Set a password:"
        if (!data.role) return "What's the role? (citizen, paralegal, employee, admin)"
        return "COMPLETE"

      case "employee":
        if (!data.fullName) return "What's the employee's full name?"
        if (!data.email) return "What's the email address?"
        if (!data.aadhaarNumber) return "What's the Aadhaar number?"
        if (!data.password) return "Set a password:"
        if (!data.department) return "Which department?"
        if (!data.designation) return "What's the designation?"
        return "COMPLETE"

      case "kiosk":
        if (!data.location) return "Where is the kiosk located?"
        if (!data.village) return "Which village?"
        if (!data.district) return "Which district?"
        if (!data.operatorName) return "Who is the operator?"
        if (!data.organizationType) return "What type of organization?"
        if (!data.organizationName) return "What's the organization name?"
        return "COMPLETE"

      case "paralegal":
        if (!data.fullName) return "What's the paralegal's full name?"
        if (!data.email) return "What's the email address?"
        if (!data.aadhaarNumber) return "What's the Aadhaar number?"
        if (!data.password) return "Set a password:"
        if (!data.phoneNumber) return "What's the phone number?"
        if (!data.areasOfExpertise) return "What are their areas of expertise? (comma-separated)"
        return "COMPLETE"

      default:
        return "I'm not sure how to help with that."
    }
  }

  const submitData = async () => {
    setIsProcessing(true)
    const loadingToast = toast.loading(`Creating ${currentStep.type}...`)

    try {
      let endpoint = ""
      const payload = formData

      switch (currentStep.type) {
        case "issue":
          endpoint = "/issues"
          break
        case "document":
          endpoint = "/documents"
          // For voice/text, we can't upload files, so use a placeholder
          payload.fileUrl = "https://example.com/placeholder.pdf"
          break
        case "user":
          endpoint = "/auth/register"
          break
        case "employee":
          endpoint = "/auth/register"
          payload.role = "employee"
          break
        case "kiosk":
          endpoint = "/kiosks"
          payload.isActive = true
          payload.numberOfEmployees = 0
          payload.employees = []
          break
        case "paralegal":
          endpoint = "/auth/register"
          payload.role = "paralegal"
          break
      }

      await apiClient.post(endpoint, payload)
      toast.success(`${currentStep.type.charAt(0).toUpperCase() + currentStep.type.slice(1)} created successfully!`, {
        id: loadingToast,
      })
      addMessage(`✅ ${currentStep.type.charAt(0).toUpperCase() + currentStep.type.slice(1)} created successfully!`)
      onSuccess()

      // Reset for next command
      setTimeout(() => {
        setCurrentStep(null)
        setFormData({})
        addMessage("What else can I help you with?")
      }, 2000)
    } catch (error) {
      toast.error(`Failed to create ${currentStep.type}: ${error.message}`, { id: loadingToast })
      addMessage(`❌ Failed to create ${currentStep.type}: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (isRecording) recognitionRef.current?.stop()
    setIsRecording(false)
    setIsProcessing(false)
    setInput("")
    setConversation([])
    setCurrentStep(null)
    setFormData({})
    onClose()
  }

  const getIcon = () => {
    switch (currentStep?.type) {
      case "issue":
        return <AlertCircle className="text-red-400" size={20} />
      case "document":
        return <FileText className="text-blue-400" size={20} />
      case "user":
        return <User className="text-green-400" size={20} />
      case "employee":
        return <Users className="text-purple-400" size={20} />
      case "kiosk":
        return <Building className="text-orange-400" size={20} />
      case "paralegal":
        return <User className="text-cyan-400" size={20} />
      default:
        return <Sparkles className="text-cyan-400" size={20} />
    }
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
                {getIcon()}
                <h3 className="text-xl font-bold text-white">
                  Smart Assistant
                  {currentStep && (
                    <span className="text-sm font-normal text-slate-400 ml-2">- Creating {currentStep.type}</span>
                  )}
                </h3>
              </div>
              <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700">
                <X />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("text")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    mode === "text" ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <MessageSquare size={16} />
                  Text
                </button>
                <button
                  onClick={() => setMode("voice")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    mode === "voice" ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <Mic size={16} />
                  Voice
                </button>
              </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px] max-h-[400px]">
              {conversation.length === 0 && (
                <div className="text-center text-slate-400 py-8">
                  <Sparkles className="mx-auto mb-4 text-cyan-400" size={48} />
                  <p className="text-lg mb-2">How can I help you today?</p>
                  <p className="text-sm">Try: "Create issue", "Add document", "Add user", "Create kiosk", etc.</p>
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
                    Processing...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700">
              {mode === "text" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleInput(input)}
                    placeholder="Type your message..."
                    className="flex-1 input-style"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={() => handleInput(input)}
                    disabled={isProcessing || !input.trim()}
                    className="btn-primary w-auto flex items-center gap-2"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleVoiceToggle}
                    disabled={isProcessing}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all ${
                      isRecording ? "bg-red-600 animate-pulse" : "bg-cyan-600 hover:bg-cyan-700"
                    }`}
                  >
                    {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <p className="text-center text-sm text-slate-400">
                    {isRecording ? "Listening... Click to stop" : "Click to start speaking"}
                  </p>
                  {input && (
                    <div className="w-full p-3 bg-slate-900 rounded-lg text-center text-slate-200">"{input}"</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
export default UnifiedCommandModal