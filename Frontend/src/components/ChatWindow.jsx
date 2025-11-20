import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import axiosInstance from '../api/axiosConfig';

const ChatWindow = ({ issueId, currentUser, paralegalInfo }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  useEffect(() => {
    // Only scroll if it's not the initial load and messages were actually added
    if (!isInitialLoadRef.current && messages.length > prevMessagesLengthRef.current) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/messages/issue/${issueId}`);
        setMessages(response.data.data || []);
        
        // Get conversation ID from the first message if it exists
        if (response.data.data && response.data.data.length > 0) {
          setConversationId(response.data.data[0].conversationId);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
        // Mark initial load as complete after a short delay
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    fetchMessages();
  }, [issueId]);

  useEffect(() => {
    // Initialize socket connection only after we have the conversationId
    if (!conversationId && messages.length === 0) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const newSocket = io(socketUrl, {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      // Join conversation room with conversationId
      if (conversationId) {
        newSocket.emit('join_conversation', conversationId);
        console.log('Joined conversation:', conversationId);
      }
    });

    newSocket.on('new_message', (message) => {
      console.log('Received new message:', message);
      setMessages(prev => {
        // Avoid duplicates by checking if message already exists
        if (prev.some(m => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [conversationId, messages.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const response = await axiosInstance.post(`/messages/issue/${issueId}`, {
        content: messageContent
      });

      if (response.data.success) {
        const sentMessage = response.data.data;
        
        // Set conversationId if this is the first message
        if (!conversationId && sentMessage.conversationId) {
          setConversationId(sentMessage.conversationId);
        }
        
        // Optimistically add the message to the UI
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          if (prev.some(m => m._id === sentMessage._id)) {
            return prev;
          }
          return [...prev, sentMessage];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setNewMessage(messageContent); // Restore message on error
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <div className="bg-blue-600 dark:bg-blue-700 p-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          💬 {t('Case Discussion')}
        </h3>
        <p className="text-sm text-blue-100 mt-1">
          {paralegalInfo ? `${paralegalInfo.name} - ${paralegalInfo.specialization}` : 'Open discussion'}
        </p>
      </div>

      {/* Messages area */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwnMessage = msg.sender?._id === currentUser?._id;
              return (
                <motion.div
                  key={msg._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {!isOwnMessage && (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {msg.sender?.fullName || 'Unknown'}
                        </p>
                        {msg.sender?.role && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            msg.sender.role === 'paralegal' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            msg.sender.role === 'employee' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            msg.sender.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {msg.sender.role.charAt(0).toUpperCase() + msg.sender.role.slice(1)}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('Type your message...')}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {t('Send')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
