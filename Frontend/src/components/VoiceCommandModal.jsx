import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, X, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axiosConfig';

const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 15, stiffness: 200 } },
  exit: { opacity: 0, y: -50, scale: 0.9, transition: { duration: 0.2 } },
};

const VoiceCommandModal = ({ isOpen, onClose, onSuccess }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState('');
  const [parsedCommand, setParsedCommand] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false; // We want to process after the user stops talking
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Or 'hi-IN' for Hindi

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscribedText(transcript);
      processCommand(transcript); // Automatically process when recording stops
    };
    recognition.onerror = (event) => { setError(`Mic error: ${event.error}.`); setIsRecording(false); };
    recognition.onend = () => setIsRecording(false);
    
    recognitionRef.current = recognition;
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setError('');
      setTranscribedText('');
      setParsedCommand(null);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // --- Simple NLP Keyword Matching ---
  const processCommand = (text) => {
    setIsProcessing(true);
    const lowerText = text.toLowerCase();
    
    // Rule for creating an issue
    if (lowerText.startsWith("create issue") || lowerText.startsWith("new issue")) {
        const descriptionMatch = lowerText.match(/(?:description is|that says|about)\s(.+)/);
        const typeMatch = lowerText.match(/type is\s(.*?)(?:\s|$)/);

        const issueTypes = ["aadhaar issue", "pension issue", "land dispute", "court summon", "certificate missing", "fraud case"];
        const foundType = issueTypes.find(t => lowerText.includes(t));

        setParsedCommand({
            type: 'issue',
            data: {
                issueType: foundType ? foundType.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : (typeMatch ? typeMatch[1] : 'Other'),
                description: descriptionMatch ? descriptionMatch[1].charAt(0).toUpperCase() + descriptionMatch[1].slice(1) : "No description provided.",
            },
        });
    } 
    // Rule for creating a document
    else if (lowerText.startsWith("create document") || lowerText.startsWith("new document")) {
        const issueIdMatch = lowerText.match(/for issue\s(.{24})/); // Matches a 24-char Mongo ID
        const docTypeMatch = lowerText.match(/type is\s(.*?)(?:\s|$)/);

        setParsedCommand({
            type: 'document',
            data: {
                issueId: issueIdMatch ? issueIdMatch[1] : null,
                documentType: docTypeMatch ? docTypeMatch[1].charAt(0).toUpperCase() + docTypeMatch[1].slice(1) : 'Unspecified',
                fileUrl: 'https://example.com/placeholder.pdf' // Voice can't upload, so use a placeholder
            },
        });
    } else {
        setError("Command not understood. Try 'Create issue...' or 'Create document...'.");
        setParsedCommand(null);
    }
    setIsProcessing(false);
  };

  const handleSubmit = async () => {
    if (!parsedCommand) return toast.error("No valid command to submit.");
    
    const endpoint = parsedCommand.type === 'issue' ? '/issues' : '/documents';
    const successMsg = `New ${parsedCommand.type} created successfully!`;
    const errorMsg = `Failed to create ${parsedCommand.type}.`;

    setIsProcessing(true);
    const loadingToast = toast.loading('Submitting to backend...');
    try {
      await apiClient.post(endpoint, parsedCommand.data);
      toast.success(successMsg, { id: loadingToast });
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error(`${errorMsg} ${err.message}`, { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleClose = () => {
      if (isRecording) recognitionRef.current.stop();
      setIsRecording(false);
      setIsProcessing(false);
      setTranscribedText('');
      setError('');
      setParsedCommand(null);
      onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className='text-cyan-400'/> Voice Command</h3>
              <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700"><X /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center text-slate-300">
                <p>Say <strong className="text-cyan-300">"Create issue..."</strong> or <strong className="text-cyan-300">"Create document..."</strong></p>
                <p className="text-xs mt-1">e.g., "Create issue type is land dispute and description is there is a problem with my farm land."</p>
              </div>
              <div className="flex flex-col items-center justify-center pt-4">
                  <button onClick={handleToggleRecording} className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
                      {isRecording ? <MicOff size={32}/> : <Mic size={32} />}
                  </button>
                  <p className="text-center text-sm text-slate-400 mt-2 h-4">{isRecording ? 'Listening...' : 'Click to start command.'}</p>
              </div>
              {error && <div className="text-red-400 text-center">{error}</div>}
              {transcribedText && <div className="p-3 bg-slate-900 rounded-lg text-center">"{transcribedText}"</div>}
              {parsedCommand && (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <h4 className="font-bold text-green-300">Understood Command:</h4>
                    <pre className="text-sm text-slate-200 whitespace-pre-wrap break-all mt-2">{JSON.stringify(parsedCommand, null, 2)}</pre>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 bg-slate-900/50 border-t border-slate-700 rounded-b-xl">
              <button onClick={handleSubmit} disabled={isProcessing || !parsedCommand} className="btn-primary w-auto flex items-center gap-2">
                {isProcessing ? <Loader2 className="animate-spin"/> : <Send/>}
                Confirm & Submit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceCommandModal;