import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { getAIResponse } from '../services/aiService';
import { useAuth } from '../context/AuthProvider';
import { useThemeStore } from '../store/theme';
import toast from 'react-hot-toast';

export const Chat = () => {
  const { user } = useAuth();
  const { isDarkMode } = useThemeStore();
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Hello! I\'m your emergency assistance AI. I can help you with:\n\n• Emergency guidance and procedures\n• Finding nearby emergency services\n• First aid advice\n• Emergency contact numbers\n\nHow can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get AI response
      const response = await getAIResponse(input);
      
      // Add bot response
      const botResponse = {
        type: 'bot',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact emergency services directly if this is an urgent situation.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Chat Header */}
      <div className={`bg-white border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bot className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Emergency Assistant</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>24/7 AI-powered emergency support</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'bot' && (
                  <div className="bg-blue-100 p-1 rounded-full">
                    <Bot className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                )}
                <div>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <Bot className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <Loader2 className={`h-5 w-5 animate-spin ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className={`bg-white border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className={`flex-1 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isLoading || !input.trim() ? 'bg-blue-400 cursor-not-allowed' : ''
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
