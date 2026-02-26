import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { HeadphonesIcon, PhoneCall, Globe, Send, Sparkles, User, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

export function CRM() {
  const { settings, crmIssues, loadCRMIssues, addCRMIssue, updateCRMIssue } = useStore();
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'ai'>('log');
  
  const [formData, setFormData] = useState({
    category: 'Complaint' as 'Installation' | 'Complaint' | 'Stock Issue',
    customerName: '',
    contactNumber: '',
    product: '',
    message: '',
  });

  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'Hello! I am your AI assistant. How can I help you with troubleshooting today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCRMIssues();
  }, [loadCRMIssues]);

  useEffect(() => {
    if (activeTab === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleLogIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCRMIssue({
      ...formData,
      date: format(new Date(), 'yyyy-MM-dd'),
      timestamp: Date.now(),
      status: 'Open'
    });
    toast.success('Issue logged successfully');
    
    // Reset form
    setFormData({
      category: 'Complaint',
      customerName: '',
      contactNumber: '',
      product: '',
      message: '',
    });

    // Redirect logic
    if (settings?.brandWebsite) {
      setTimeout(() => {
        window.open(settings.brandWebsite, '_blank');
      }, 1500);
    }
    
    setActiveTab('history');
  };

  const handleToggleStatus = async (issue: any) => {
    await updateCRMIssue({
      ...issue,
      status: issue.status === 'Open' ? 'Closed' : 'Open'
    });
    toast.success(`Issue marked as ${issue.status === 'Open' ? 'Closed' : 'Open'}`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (!settings?.aiApiKey && !process.env.GEMINI_API_KEY && !(import.meta as any).env.VITE_GEMINI_API_KEY) {
      toast.error('Please configure your AI API Key in Settings first.');
      return;
    }

    const apiKey = settings?.aiApiKey || process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: 'You are a helpful customer support and troubleshooting assistant for home appliances (like mixers, geysers, irons). Provide concise, practical troubleshooting steps.',
        }
      });

      if (response.text) {
        setChatMessages(prev => [...prev, { role: 'ai', text: response.text || '' }]);
      } else {
        throw new Error('No response text');
      }
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Failed to get AI response. Check your API key.');
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error connecting to the server.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
      </div>

      {/* Brand Quick Links */}
      <div className="grid grid-cols-2 gap-4 shrink-0">
        <a 
          href={settings?.tollFree ? `tel:${settings.tollFree}` : '#'}
          className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-colors"
          onClick={(e) => !settings?.tollFree && e.preventDefault()}
        >
          <div className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            <PhoneCall className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-center">Toll Free</span>
        </a>
        <a 
          href={settings?.brandWebsite || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-colors"
          onClick={(e) => !settings?.brandWebsite && e.preventDefault()}
        >
          <div className="p-3 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <Globe className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-center">Brand Website</span>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl shrink-0">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'log' ? 'bg-white dark:bg-slate-800 shadow-md' : 'opacity-70 hover:opacity-100'}`}
        >
          Log Issue
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 shadow-md' : 'opacity-70 hover:opacity-100'}`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'ai' ? 'bg-white dark:bg-slate-800 shadow-md text-slate-800 dark:text-slate-200' : 'opacity-70 hover:opacity-100'}`}
        >
          <Sparkles className="w-4 h-4" /> AI Assist
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'log' && (
          <div className="glass-panel p-6 rounded-3xl overflow-y-auto">
            <form onSubmit={handleLogIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="glass-input w-full !bg-slate-100 dark:!bg-[#0a0a0a] !border-none"
                >
                  <option value="Complaint">Complaint</option>
                  <option value="Installation">Installation</option>
                  <option value="Stock Issue">Stock Issue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Customer Name</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="glass-input w-full !bg-slate-100 dark:!bg-[#0a0a0a] !border-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Contact Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Please enter exactly 10 digits"
                  value={formData.contactNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) {
                      setFormData({ ...formData, contactNumber: val });
                    }
                  }}
                  className="glass-input w-full !bg-slate-100 dark:!bg-[#0a0a0a] !border-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Product</label>
                <input
                  type="text"
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="glass-input w-full !bg-slate-100 dark:!bg-[#0a0a0a] !border-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">Message / Details</label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="glass-input w-full !bg-slate-100 dark:!bg-[#0a0a0a] !border-none resize-none"
                ></textarea>
              </div>
              <button type="submit" className="glass-button w-full flex items-center justify-center gap-2 mt-4">
                <Send className="w-5 h-5" /> Submit & Open Brand Link
              </button>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 overflow-y-auto pb-4">
            {crmIssues.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl text-center opacity-50">
                <p>No issues logged yet.</p>
              </div>
            ) : (
              crmIssues.map((issue) => (
                <div key={issue.id} className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          issue.category === 'Complaint' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                          issue.category === 'Installation' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                          'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                        }`}>
                          {issue.category}
                        </span>
                        <span className="text-xs opacity-50">{format(new Date(issue.timestamp), 'MMM d, HH:mm')}</span>
                      </div>
                      <h3 className="font-semibold">{issue.customerName}</h3>
                      <p className="text-sm opacity-80">{issue.contactNumber}</p>
                    </div>
                    <button 
                      onClick={() => handleToggleStatus(issue)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${
                        issue.status === 'Open' 
                          ? 'border-yellow-500/50 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10' 
                          : 'border-slate-500/50 text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      {issue.status === 'Open' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {issue.status}
                    </button>
                  </div>
                  <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl text-sm">
                    <p className="font-medium mb-1">{issue.product}</p>
                    <p className="opacity-80">{issue.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="glass-panel rounded-3xl flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-black/5 dark:bg-white/10 rounded-tl-none'
                  }`}>
                    {msg.role === 'ai' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/10 rounded-tl-none flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-md">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about an issue..."
                  className="glass-input flex-1 !py-2 !bg-white dark:!bg-[#0a0a0a]"
                  disabled={isAiTyping}
                />
                <button 
                  type="submit" 
                  disabled={isAiTyping || !chatInput.trim()}
                  className="p-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

