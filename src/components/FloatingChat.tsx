import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Sparkles, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import Markdown from 'react-markdown';
import toast from 'react-hot-toast';

interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingChat({ isOpen, onClose }: FloatingChatProps) {
  const { settings } = useStore();
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'Hi! I am your AI assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

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
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: 'You are a helpful sales assistant. Provide concise, practical advice.',
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
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[55]" 
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
          drag
          dragConstraints={{ left: -200, right: 200, top: 0, bottom: 500 }}
          dragElastic={0.1}
          className="fixed top-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[60] bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col"
          style={{ height: '400px', touchAction: 'none' }}
        >
          <div className="p-3 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-slate-100/50 dark:bg-slate-900/50 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-sm">AI Assistant</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ touchAction: 'pan-y' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                }`}>
                  {msg.role === 'user' ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                </div>
                <div className={`p-2 rounded-xl max-w-[80%] text-xs ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-tr-none' 
                    : 'bg-black/5 dark:bg-white/10 rounded-tl-none'
                }`}>
                  {msg.role === 'ai' ? (
                    <div className="prose prose-xs dark:prose-invert max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/10 rounded-tl-none flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-2 border-t border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me anything..."
                className="glass-input flex-1 !py-1.5 !px-3 !text-sm !bg-white dark:!bg-[#0a0a0a]"
                disabled={isAiTyping}
              />
              <button 
                type="submit" 
                disabled={isAiTyping || !chatInput.trim()}
                className="p-1.5 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
