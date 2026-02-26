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
    <div className="min-h-screen bg-slate-100 dark:bg-[#050505] text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden flex flex-col relative">
      {/* Optimized Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/30 via-blue-500/5 to-transparent" />
        <div className="absolute top-[20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/30 via-purple-500/5 to-transparent" />
        <div className="absolute bottom-[-20%] left-[20%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-500/30 via-slate-500/5 to-transparent" />
      </div>

      {/* Dynamic Island */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-safe-top mt-2 pointer-events-none">
        <motion.div
          layout
          className="pointer-events-auto bg-black text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl border border-white/10 overflow-hidden"
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
                {settings.profilePhoto ? (
                  <img src={settings.profilePhoto} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isApiActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                )}
                <span className="font-medium text-sm shine-text">{settings.userName}</span>
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col justify-between p-2 relative"
              >
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsIslandExpanded(false)}>
                  <div className="flex items-center gap-2">
                    {settings.profilePhoto && (
                      <img src={settings.profilePhoto} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-white/20" />
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
