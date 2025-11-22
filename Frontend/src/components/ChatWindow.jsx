// PASTE THIS ENTIRE FILE INTO src/components/ChatWindow.jsx

"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Loader2, User, RefreshCw, MessageSquare } from "lucide-react"
import apiClient from "../api/axiosConfig"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"

const ChatWindow = ({ issueId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await apiClient.get(`/messages/${issueId}`);
      // Handle case where conversation might not exist yet (returns empty array or specific structure)
      setMessages(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Optional: Simple polling every 10 seconds to keep chat fresh
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [issueId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await apiClient.post(`/messages/${issueId}`, {
        content: newMessage
      });
      
      // Append new message locally to feel instant
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 rounded-t-xl">
        <div className="flex items-center gap-2">
            <MessageSquare className="text-cyan-600 dark:text-cyan-400" size={20} />
            <h3 className="font-bold text-slate-800 dark:text-white">Case Discussion</h3>
        </div>
        <button onClick={fetchMessages} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors text-slate-500" title="Refresh Chat">
            <RefreshCw size={16} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        {loading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
        ) : messages.length === 0 ? (
            <div className="text-center text-slate-400 mt-20">
                <p>No messages yet.</p>
                <p className="text-sm">Start the conversation with the assigned paralegal.</p>
            </div>
        ) : (
            messages.map((msg) => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                    <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] ${isMe ? "order-1" : "order-2"}`}>
                            <div className={`p-3 rounded-lg text-sm ${
                                isMe 
                                ? "bg-cyan-600 text-white rounded-br-none" 
                                : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-bl-none"
                            }`}>
                                {msg.content}
                            </div>
                            <div className={`text-[10px] text-slate-400 mt-1 ${isMe ? "text-right" : "text-left"}`}>
                                {msg.sender?.fullName || "User"} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    </div>
                );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-xl">
        <div className="flex gap-2">
            <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..." 
                className="input-style flex-1"
                disabled={sending}
            />
            <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary px-4">
                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;