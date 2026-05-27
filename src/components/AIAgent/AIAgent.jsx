import { useState, useRef, useEffect, useCallback } from 'react';
import { FaRobot, FaPaperPlane, FaTimes, FaMinus, FaTrash, FaMagic, FaHistory, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';

const AIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello Admin! I am your AI assistant. I can help you with quick actions. Just tell me what you need!',
      suggestions: [
        'Create Self Order',
        'Add Loading Entry',
        'Generate Lorry Challan',
        'View Unloading Report'
      ]
    }
  ]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const { userRole, user } = useAuth();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, isOpen, isMinimized]);

  if (userRole !== 'Admin') return null;

  const handleSend = (text) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    // Simulate AI thinking and processing
    setTimeout(() => {
      processCommand(userMessage.toLowerCase());
    }, 600);
  };

  const processCommand = (cmd) => {
    let response = {
      role: 'assistant',
      content: "I'm not sure how to help with that yet. Try one of these commands:",
      suggestions: [
        'Create Self Order',
        'Add Loading Entry',
        'Generate Lorry Challan',
        'View Unloading Report'
      ]
    };

    if (cmd.includes('self order') || cmd.includes('create order')) {
      response = {
        role: 'assistant',
        content: "Navigating to the **Self Order** creation page. You can fill in the details there.",
        action: () => navigate('/manage-order/add-self-order')
      };
    } else if (cmd.includes('loading entry') || cmd.includes('add loading')) {
      response = {
        role: 'assistant',
        content: "Opening the **Add Loading Entry** page for you.",
        action: () => navigate('/Loading-Entry/add-loading-entry')
      };
    } else if (cmd.includes('lorry challan') || cmd.includes('generate challan') || cmd.includes('print challan')) {
      response = {
        role: 'assistant',
        content: "Taking you to the **Loading List** where you can select an entry to generate a Lorry Challan.",
        action: () => navigate('/Loading-Entry/list-loading-entry')
      };
    } else if (cmd.includes('unloading report') || cmd.includes('receiving list') || cmd.includes('view unloading')) {
      response = {
        role: 'assistant',
        content: "Navigating to the **Receiving List** for unloading reports.",
        action: () => navigate('/Loading-Entry/receiving-list')
      };
    } else if (cmd.includes('dashboard')) {
      response = {
        role: 'assistant',
        content: "Heading back to the **Dashboard**.",
        action: () => navigate('/dashboard')
      };
    } else if (cmd.includes('hello') || cmd.includes('hi')) {
      response = {
        role: 'assistant',
        content: `Hello ${user?.name || 'Admin'}! How can I assist you with your tasks today?`,
        suggestions: ['Create Self Order', 'Add Loading Entry']
      };
    }

    setMessages(prev => [...prev, response]);
    if (response.action) {
      setTimeout(() => response.action(), 1500);
    }
  };

  const clearHistory = () => {
    setMessages([{ 
      role: 'assistant', 
      content: 'History cleared. How can I help you now?',
      suggestions: [
        'Create Self Order',
        'Add Loading Entry',
        'Generate Lorry Challan',
        'View Unloading Report'
      ]
    }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <FaRobot className="text-xl animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Admin AI Agent</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[10px] text-emerald-100 font-medium uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Minimize"
              >
                <FaMinus size={14} />
              </button>
              <button 
                onClick={clearHistory}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Clear History"
              >
                <FaTrash size={14} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Close"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth no-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.suggestions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s)}
                          className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all flex items-center gap-1.5 group"
                        >
                          {s}
                          <FaArrowRight size={8} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a command..."
                className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
              >
                <FaPaperPlane size={16} />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-center text-slate-400 font-medium">
              Powered by Hansaria Admin AI • Minimal Commands Supported
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="flex flex-col items-end gap-3">
        {isMinimized && isOpen && (
          <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-5 duration-300 mb-2">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              AI Agent is active
            </p>
          </div>
        )}
        
        <button
          onClick={() => {
            if (isOpen && isMinimized) {
              setIsMinimized(false);
            } else {
              setIsOpen(!isOpen);
            }
          }}
          className={`
            group relative w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-2xl
            ${isOpen && !isMinimized 
              ? 'bg-slate-800 rotate-90 scale-90' 
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-110 hover:-translate-y-1 active:scale-95 shadow-emerald-200'
            }
          `}
        >
          {isOpen && !isMinimized ? (
            <FaTimes className="text-white text-2xl -rotate-90" />
          ) : (
            <>
              <div className="absolute inset-0 bg-white/20 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <FaRobot className="text-white text-3xl drop-shadow-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-white rounded-full shadow-sm" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIAgent;
