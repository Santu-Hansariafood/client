import { useState, useRef, useEffect, useCallback } from 'react';
import { FaRobot, FaPaperPlane, FaTimes, FaMinus, FaTrash, FaMagic, FaHistory, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import api from '../../utils/apiClient/apiClient';

const AIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello Admin! I am your AI assistant. I can help you with quick actions or fetch specific data for you. Just tell me what you need!',
      suggestions: [
        'Sauda 123 details',
        'Loading entry for Sauda 123',
        'Lorry HR38X1234 details',
        'Today\'s loading rate',
        'Create Self Order'
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
  }, [messages, scrollToBottom, isOpen, isMinimized, isLoadingData]);

  if (userRole !== 'Admin') return null;

  const handleSend = (text) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    processCommand(userMessage.toLowerCase());
  };

  const fetchSaudaDetails = async (saudaNo) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/self-order?saudaNo=${saudaNo}`);
      const data = response.data;
      const sauda = Array.isArray(data) ? data[0] : (data.data ? data.data[0] : null);

      if (sauda) {
        return {
          role: 'assistant',
          content: `**Sauda Details for ${saudaNo}**\n\n` +
            `• **Buyer:** ${sauda.buyerCompany || sauda.buyer}\n` +
            `• **Supplier:** ${sauda.supplierCompany || 'N/A'}\n` +
            `• **Commodity:** ${sauda.commodity}\n` +
            `• **Quantity:** ${sauda.quantity} MT\n` +
            `• **Rate:** ₹${sauda.rate}\n` +
            `• **Pending:** ${sauda.pendingQuantity || 0} MT\n` +
            `• **Payment Terms:** ${sauda.paymentTerms || 'N/A'}\n` +
            `• **Status:** ${sauda.status || 'Active'}\n` +
            `• **PO Number:** ${sauda.poNumber || 'N/A'}`,
          suggestions: [`Payment of Sauda ${saudaNo}`, `Loading entry for Sauda ${saudaNo}`]
        };
      } else {
        return {
          role: 'assistant',
          content: `I couldn't find any Sauda with number **${saudaNo}**. Please check the number and try again.`,
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Sorry, I encountered an error while fetching Sauda details.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchActiveBids = async () => {
    setIsLoadingData(true);
    try {
      const response = await api.get('/bids?status=active');
      const bids = response.data.data || response.data;

      if (bids && bids.length > 0) {
        let content = `**Active Bids Today**\n\n`;
        bids.forEach((bid, idx) => {
          content += `${idx + 1}. **${bid.commodity}** | ${bid.location} | End: ${bid.endTime}\n`;
        });
        return {
          role: 'assistant',
          content: content,
          suggestions: [`Interactions for ${bids[0].commodity}`]
        };
      } else {
        return {
          role: 'assistant',
          content: "There are no active bids at the moment.",
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error fetching active bids.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchTodaySaudas = async () => {
    setIsLoadingData(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/self-order?startDate=${today}&endDate=${today}`);
      const saudas = response.data.data || response.data;

      if (saudas && saudas.length > 0) {
        let content = `**Total Saudas Today (${new Date().toLocaleDateString()})**\n\n`;
        content += `Count: **${saudas.length}**\n\n`;
        saudas.slice(0, 5).forEach((s, idx) => {
          content += `${idx + 1}. **Sauda ${s.saudaNo}**: ${s.buyerCompany} | ${s.commodity} | ${s.quantity} MT\n`;
        });
        if (saudas.length > 5) content += `\n*Showing 5 of ${saudas.length} saudas.*`;
        
        return {
          role: 'assistant',
          content: content,
          suggestions: [`Sauda ${saudas[0].saudaNo} details`]
        };
      } else {
        return {
          role: 'assistant',
          content: "No saudas have been created today yet.",
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error fetching today's saudas.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchCompanyStatus = async (companyName) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/companies?search=${companyName}`);
      const companies = response.data.data || response.data;

      if (companies && companies.length > 0) {
        const comp = companies[0];
        return {
          role: 'assistant',
          content: `**Company Status: ${comp.companyName}**\n\n` +
            `• **Location:** ${comp.location || 'N/A'}\n` +
            `• **GST:** ${comp.gstNo || 'N/A'}\n` +
            `• **Status:** Active\n` +
            `• **Contact:** ${comp.mobile || 'N/A'}`,
          suggestions: [`Saudas for ${comp.companyName}`]
        };
      } else {
        return {
          role: 'assistant',
          content: `I couldn't find any company matching **${companyName}**.`,
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error fetching company status.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchBidInteractions = async (commodity) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/participateBids?search=${commodity}`);
      const interactions = response.data.data || response.data;

      if (interactions && interactions.length > 0) {
        let content = `**Latest Bid Interactions for ${commodity}**\n\n`;
        interactions.slice(0, 5).forEach((item, idx) => {
          content += `${idx + 1}. **${item.sellerName}**: ₹${item.rate} | ${item.quantity} MT | ${new Date(item.createdAt).toLocaleTimeString()}\n`;
        });
        return {
          role: 'assistant',
          content: content,
        };
      } else {
        return {
          role: 'assistant',
          content: `No interactions found for **${commodity}**.`,
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error fetching bid interactions.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchSaudaPayment = async (saudaNo) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/self-order?saudaNo=${saudaNo}`);
      const data = response.data;
      const sauda = Array.isArray(data) ? data[0] : (data.data ? data.data[0] : null);

      if (sauda) {
        return {
          role: 'assistant',
          content: `**Payment Details for Sauda ${saudaNo}**\n\n` +
            `• **Total Quantity:** ${sauda.quantity} MT\n` +
            `• **Pending Quantity:** ${sauda.pendingQuantity || 0} MT\n` +
            `• **Rate:** ₹${sauda.rate}\n` +
            `• **Payment Terms:** ${sauda.paymentTerms || 'N/A'}\n` +
            `• **CD:** ${sauda.cd}% | **GST:** ${sauda.gst}%\n` +
            `• **Status:** ${sauda.status || 'Active'}\n\n` +
            `*Tip: You can check loading entries for this sauda to see actual delivered weight.*`,
          suggestions: [`Loading entries for Sauda ${saudaNo}`, `Sauda ${saudaNo} details`]
        };
      } else {
        return {
          role: 'assistant',
          content: `I couldn't find any Sauda with number **${saudaNo}**.`,
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error fetching sauda payment details.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchLoadingEntriesBySauda = async (saudaNo) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/Loading-Entry?saudaNo=${saudaNo}`);
      const entries = response.data.data || response.data;

      if (entries && entries.length > 0) {
        let content = `**Loading Entries for Sauda ${saudaNo}**\n\n`;
        entries.slice(0, 5).forEach((entry, idx) => {
          content += `${idx + 1}. **Lorry:** ${entry.lorryNumber} | **Date:** ${new Date(entry.loadingDate).toLocaleDateString()} | **Weight:** ${entry.loadingWeight} MT\n`;
        });
        if (entries.length > 5) content += `\n*Showing 5 of ${entries.length} entries.*`;
        
        return {
          role: 'assistant',
          content: content,
          suggestions: [`Sauda ${saudaNo} details`, 'View Unloading Report']
        };
      } else {
        return {
          role: 'assistant',
          content: `No loading entries found for Sauda **${saudaNo}**.`,
          suggestions: [`Sauda ${saudaNo} details`]
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error fetching loading entries. Please try again.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchLorryDetails = async (lorryNo) => {
    setIsLoadingData(true);
    try {
      const response = await api.get(`/Loading-Entry/lorry-wise?lorryNumber=${lorryNo}`);
      const data = response.data.data || response.data;

      if (data && data.length > 0) {
        const entry = data[0];
        return {
          role: 'assistant',
          content: `**Latest Loading for Lorry ${lorryNo}**\n\n` +
            `• **Sauda No:** ${entry.saudaNo}\n` +
            `• **Date:** ${new Date(entry.loadingDate).toLocaleDateString()}\n` +
            `• **Weight:** ${entry.loadingWeight} MT\n` +
            `• **Buyer:** ${entry.buyerCompany}\n` +
            `• **Supplier:** ${entry.supplierCompany}\n` +
            `• **Status:** ${entry.unloadingDate ? 'Unloaded' : 'In Transit'}`,
          suggestions: [`Sauda ${entry.saudaNo} details`, 'Generate Lorry Challan']
        };
      } else {
        return {
          role: 'assistant',
          content: `No records found for Lorry **${lorryNo}**.`,
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error fetching lorry details.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchTodayRate = async () => {
    setIsLoadingData(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/Loading-Entry?startDate=${today}&endDate=${today}`);
      const entries = response.data.data || response.data;

      if (entries && entries.length > 0) {
        const rates = {};
        entries.forEach(e => {
          if (e.commodity && e.rate) {
            if (!rates[e.commodity]) rates[e.commodity] = [];
            rates[e.commodity].push(e.rate);
          }
        });

        let content = `**Today's Loading Rates (${new Date().toLocaleDateString()})**\n\n`;
        Object.keys(rates).forEach(comm => {
          const avg = (rates[comm].reduce((a, b) => a + b, 0) / rates[comm].length).toFixed(2);
          content += `• **${comm}:** Avg ₹${avg} (Range: ₹${Math.min(...rates[comm])} - ₹${Math.max(...rates[comm])})\n`;
        });

        return {
          role: 'assistant',
          content: content,
        };
      } else {
        return {
          role: 'assistant',
          content: "No loading entries found for today yet, so I can't determine today's rates.",
        };
      }
    } catch (error) {
      return {
        role: 'assistant',
        content: "Error fetching today's rates.",
      };
    } finally {
      setIsLoadingData(false);
    }
  };

  const processCommand = async (cmd) => {
    let response = null;

    // Data Queries
    const saudaMatch = cmd.match(/sauda\s*(\d+)/i);
    const lorryMatch = cmd.match(/lorry\s*([a-z0-9]+)/i);
    const companyMatch = cmd.match(/(?:status of|company)\s+([a-z0-9\s]+)/i);
    const interactionMatch = cmd.match(/(?:interactions for|bid info for)\s+([a-z0-9\s]+)/i);

    if (cmd.includes('loading entry for sauda') && saudaMatch) {
      response = await fetchLoadingEntriesBySauda(saudaMatch[1]);
    } else if (saudaMatch && (cmd.includes('payment') || cmd.includes('payemnt'))) {
      response = await fetchSaudaPayment(saudaMatch[1]);
    } else if (saudaMatch && (cmd.includes('details') || cmd.includes('pending'))) {
      response = await fetchSaudaDetails(saudaMatch[1]);
    } else if (lorryMatch) {
      response = await fetchLorryDetails(lorryMatch[1].toUpperCase());
    } else if (cmd.includes('total sauda today') || (cmd.includes('sauda') && cmd.includes('today'))) {
      response = await fetchTodaySaudas();
    } else if (cmd.includes('active bids') || cmd.includes('show bids')) {
      response = await fetchActiveBids();
    } else if (interactionMatch) {
      response = await fetchBidInteractions(interactionMatch[1].trim());
    } else if (companyMatch) {
      response = await fetchCompanyStatus(companyMatch[1].trim());
    } else if (cmd.includes('rate') && (cmd.includes('today') || cmd.includes('loading'))) {
      response = await fetchTodayRate();
    } 
    // Navigation Commands
    else if (cmd.includes('self order') || cmd.includes('create order')) {
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
        suggestions: ['Today\'s total sauda', 'Active bids', 'Create Self Order']
      };
    } else {
      response = {
        role: 'assistant',
        content: "I'm not sure how to help with that yet. Try asking for **Total Sauda Today**, **Active Bids**, **Company Status**, or **Bid Interactions**.",
        suggestions: [
          'Total sauda today',
          'Active bids',
          'Status of company Hansaria',
          'Interactions for Maize'
        ]
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
            {isLoadingData && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <FaSpinner className="animate-spin text-emerald-600" />
                  <span className="text-sm text-slate-500 font-medium">Fetching details...</span>
                </div>
              </div>
            )}
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
