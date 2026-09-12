import { motion, useAnimation } from 'framer-motion';
import { useState, useEffect } from 'react';

type MascotState = 'home' | 'services' | 'pricing' | 'news' | 'faq';

const mascotMessages: Record<MascotState, string> = {
  home: 'خوش آمدید! 👋',
  services: 'خدمات عالی ما! 🚀',
  pricing: 'بهترین قیمت‌ها! 💎',
  news: 'آپدیت‌های تازه! 📰',
  faq: 'سوالات متداول! 💬'
};

const mascotPositions: Record<MascotState, { x: number; y: number; scale: number }> = {
  home: { x: 15, y: 100, scale: 1 },
  services: { x: -25, y: 400, scale: 0.95 },
  pricing: { x: 18, y: 150, scale: 1 },
  news: { x: -35, y: 200, scale: 0.9 },
  faq: { x: 25, y: 180, scale: 0.98 }
};

export function AnimatedMascot() {
  const [currentState, setCurrentState] = useState<MascotState>('home');
  const [isVisible, setIsVisible] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Text-to-Speech Function using browser API
  const speakMessage = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech error:', err);
      setIsSpeaking(false);
    }
  };

  // Load voices immediately
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const home = document.getElementById('home');
      const services = document.getElementById('services');
      const pricing = document.getElementById('pricing');
      const news = document.getElementById('news');
      const faq = document.getElementById('faq');

      const scrollY = window.scrollY + 200;

      if (faq && scrollY >= faq.offsetTop) {
        setCurrentState('faq');
      } else if (news && scrollY >= news.offsetTop) {
        setCurrentState('news');
      } else if (pricing && scrollY >= pricing.offsetTop) {
        setCurrentState('pricing');
      } else if (services && scrollY >= services.offsetTop) {
        setCurrentState('services');
      } else {
        setCurrentState('home');
      }

      setIsVisible(true);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Speak message when it changes
  useEffect(() => {
    const message = mascotMessages[currentState];
    speakMessage(message);
  }, [currentState]);

  const position = mascotPositions[currentState];
  const message = mascotMessages[currentState];

  return (
    <motion.div
      className="fixed bottom-6 z-40 pointer-events-none"
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0,
        right: `${position.x}%`,
      }}
      transition={{
        duration: 0.6,
        ease: 'easeOut'
      }}
    >
      {/* Message Bubble */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.8 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-4 bg-gradient-to-br from-purple-600/90 to-blue-600/90 backdrop-blur-sm text-white px-5 py-3 rounded-3xl rounded-br-none shadow-xl text-sm font-semibold pointer-events-auto border border-purple-400/30 relative overflow-hidden group flex items-center gap-2"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
        {message}
        
        {/* Sound Wave Animation */}
        {isSpeaking && (
          <motion.div className="flex items-center gap-0.5 relative z-10">
            <motion.div
              animate={{ height: ['4px', '12px', '4px'] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="w-1 bg-white rounded-full"
            />
            <motion.div
              animate={{ height: ['4px', '16px', '4px'] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
              className="w-1 bg-white rounded-full"
            />
            <motion.div
              animate={{ height: ['4px', '12px', '4px'] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              className="w-1 bg-white rounded-full"
            />
          </motion.div>
        )}
      </motion.div>

      {/* Logo Motion Container */}
      <div className="relative w-40 h-40 flex items-center justify-center perspective-1000">
        
        {/* Rotating Cyber Rings (Behind) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 pointer-events-none opacity-40"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#grad1)" strokeWidth="0.5" strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="url(#grad1)" strokeWidth="0.2" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 pointer-events-none opacity-30 scale-75"
        >
           <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#60A5FA" strokeWidth="0.5" strokeDasharray="10 10" />
          </svg>
        </motion.div>

        {/* Mascot Character with Float & Glitch Effect */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="relative w-32 h-32 z-10"
        >
           {/* Glow behind */}
           <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full animate-pulse"></div>

          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10">
          <defs>
            <linearGradient id="robotGradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="screenGradient" x1="50" y1="50" x2="150" y2="150" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1F2937" />
              <stop offset="1" stopColor="#111827" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Antenna */}
          <motion.g
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "100px", originY: "50px" }}
          >
            <path d="M100 50V30" stroke="url(#robotGradient)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="100" cy="25" r="6" fill="#F472B6">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
          </motion.g>

          {/* Head */}
          <rect x="50" y="50" width="100" height="90" rx="30" fill="url(#robotGradient)" />
          
          {/* Face Screen */}
          <rect x="60" y="65" width="80" height="50" rx="15" fill="url(#screenGradient)" />
          
          {/* Eyes */}
          <g className="eyes">
            <circle cx="80" cy="85" r="6" fill="#60A5FA">
              <animate attributeName="r" values="6;6;1;6" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="120" cy="85" r="6" fill="#60A5FA">
              <animate attributeName="r" values="6;6;1;6" dur="4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Blush */}
          <circle cx="70" cy="95" r="4" fill="#F472B6" opacity="0.3" />
          <circle cx="130" cy="95" r="4" fill="#F472B6" opacity="0.3" />

          {/* Body/Neck */}
          <path d="M80 140V150C80 160 120 160 120 150V140" fill="url(#robotGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          </svg>
          
          {/* Scanning Light Effect */}
          <motion.div
            animate={{ top: ['0%', '100%', '0%'], opacity: [0, 0.5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-blue-400/50 blur-sm z-20 pointer-events-none"
            style={{ mixBlendMode: 'overlay' }}
          />
        </motion.div>

        {/* Orbiting Particles */}
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
           className="absolute w-full h-full pointer-events-none"
        >
           <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full blur-[1px] shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
        </motion.div>

         <motion.div
           animate={{ rotate: -360 }}
           transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
           className="absolute w-3/4 h-3/4 pointer-events-none"
        >
           <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full blur-[1px] shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
        </motion.div>

      </div>
    </motion.div>
  );
}
