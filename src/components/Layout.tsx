import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle } from 'lucide-react';
import { FloatingChat } from './FloatingChat';

const INSPIRATIONAL_QUOTES = [
  "Every sale has five basic obstacles: no need, no money, no hurry, no desire, no trust.",
  "Success is walking from failure to failure with no loss of enthusiasm.",
  "The harder you work, the luckier you get.",
  "Don't watch the clock; do what it does. Keep going.",
  "Quality performance starts with a positive attitude.",
  "Opportunities don't happen. You create them.",
  "Make a customer, not a sale.",
  "Your attitude, not your aptitude, will determine your altitude."
];

export function Layout() {
  const { settings, loadSettings } = useStore();
  const navigate = useNavigate();
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(INSPIRATIONAL_QUOTES[0]);

  useEffect(() => {
    if (isIslandExpanded) {
      setCurrentQuote(INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)]);
    }
  }, [isIslandExpanded]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!settings) return null;

  const isApiActive = settings.aiApiKey && settings.aiApiKey.startsWith('AIza');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white transition-colors duration-300 overflow-hidden flex flex-col relative">
      {/* Optimized Background Gradients - Dark Glassmorphism */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top left bright light leak */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-white/5 to-transparent blur-3xl opacity-80" />
        {/* Subtle green glow in center */}
        <div className="absolute top-[30%] left-[20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-emerald-500/0 to-transparent blur-3xl" />
        {/* Subtle dark glow bottom right */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Dynamic Island */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-safe-top mt-2 pointer-events-none">
        <motion.div
          layout
          className={`pointer-events-auto bg-black text-white rounded-full flex items-center gap-2 shadow-2xl border border-white/10 overflow-hidden ${
            isIslandExpanded 
              ? 'p-0' 
              : settings.profilePhoto 
                ? 'pr-4 pl-0.5 py-0.5' 
                : 'px-4 py-2'
          }`}
          animate={{
            width: isIslandExpanded ? 320 : 'auto',
            height: isIslandExpanded ? 140 : 40,
            borderRadius: isIslandExpanded ? 24 : 9999,
          }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {!isIslandExpanded ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 whitespace-nowrap cursor-pointer"
                onClick={() => setIsIslandExpanded(true)}
              >
                {settings.profilePhoto && (
                  <img src={settings.profilePhoto} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-white/20" />
                )}
                <div className={`w-2 h-2 rounded-full animate-pulse ${isApiActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="font-medium text-sm shine-text">{settings.userName}</span>
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col justify-between p-4 relative"
              >
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsIslandExpanded(false)}>
                  <div className="flex items-center gap-2">
                    {settings.profilePhoto && (
                      <img src={settings.profilePhoto} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                    )}
                    <span className="font-semibold">{settings.userName}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isApiActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </div>
                <div className="text-xs text-white/80 italic text-center px-2 py-1 cursor-pointer" onClick={() => setIsIslandExpanded(false)}>
                  "{currentQuote}"
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-slate-400">{settings.storeLocation}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsChatOpen(true);
                      setIsIslandExpanded(false);
                    }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-emerald-400"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <FloatingChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto pb-24 pt-16 px-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
