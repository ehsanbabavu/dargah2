import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Send, MessageSquare, Bot } from "lucide-react";
import chatSupportIcon from "@assets/chat_support_icon.png";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
}

function generateSessionToken(): string {
  if (typeof window === "undefined") return "guest_ssr";
  const stored = localStorage.getItem("guest_chat_token");
  if (stored) return stored;
  
  const token = "guest_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("guest_chat_token", token);
  return token;
}

function TypeWriter({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

export function GuestChatWidget() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [hasUnreadBotMessage, setHasUnreadBotMessage] = useState(false);
  const [showInitialBubble, setShowInitialBubble] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionToken] = useState(() => generateSessionToken());
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const prevMessagesCount = useRef(0);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isGuestChatsPluginEnabled, setIsGuestChatsPluginEnabled] = useState(true);

  // Check if guest chats plugin is active
  useEffect(() => {
    fetch("/api/plugins/guest-chats/public-status")
      .then((res) => (res.ok ? res.json() : { isEnabled: false }))
      .then((data) => setIsGuestChatsPluginEnabled(data.isEnabled ?? false))
      .catch(() => setIsGuestChatsPluginEnabled(false));
  }, []);

  const loadChatSession = useCallback(async () => {
    if (!isGuestChatsPluginEnabled) return;
    try {
      setIsLoadingChat(true);

      const sessionRes = await fetch("/api/guest-chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });

      if (!sessionRes.ok) throw new Error("Failed to create session");

      const messagesRes = await fetch(`/api/guest-chat/${sessionToken}/messages`);
      if (!messagesRes.ok) throw new Error("Failed to get messages");

      const { messages } = await messagesRes.json();

      const formattedMessages: ChatMessage[] = (messages || []).map(
        (msg: { id: string; message: string; sender: string }) => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender === "guest" ? "user" : "bot",
        })
      );

      if (formattedMessages.length === 0) {
        setChatMessages([{ id: "welcome", text: "سلام! چطور می‌تونم کمکتون کنم؟", sender: "bot" }]);
      } else {
        setChatMessages(formattedMessages);
      }
      prevMessagesCount.current = formattedMessages.length;
    } catch (error) {
      console.warn("Chat session offline or not available:", error);
      setChatMessages([{ id: "welcome", text: "سلام! چطور می‌تونم کمکتون کنم؟", sender: "bot" }]);
    } finally {
      setIsLoadingChat(false);
    }
  }, [sessionToken, isGuestChatsPluginEnabled]);

  useEffect(() => {
    if (isGuestChatsPluginEnabled) {
      loadChatSession();
    }
  }, [loadChatSession, isGuestChatsPluginEnabled]);

  // Polling for incoming messages
  useEffect(() => {
    if (!isGuestChatsPluginEnabled) return;

    let isMounted = true;

    const pollMessages = async () => {
      try {
        const messagesRes = await fetch(`/api/guest-chat/${sessionToken}/messages`);
        if (!messagesRes.ok || !isMounted) return;

        const { messages } = await messagesRes.json();
        if (!isMounted) return;

        const formattedMessages: ChatMessage[] = (messages || []).map(
          (msg: { id: string; message: string; sender: string }) => ({
            id: msg.id,
            text: msg.message,
            sender: msg.sender === "guest" ? "user" : "bot",
          })
        );

        if (formattedMessages.length > prevMessagesCount.current) {
          const newMessages = formattedMessages.slice(prevMessagesCount.current);
          const hasNewBotMessage = newMessages.some((m) => m.sender === "bot");
          if (hasNewBotMessage && !isContactOpen) {
            setHasUnreadBotMessage(true);
            setIsShaking(true);
            if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
            shakeTimeoutRef.current = setTimeout(() => {
              if (isMounted) setIsShaking(false);
            }, 3000);
          }
        }

        if (formattedMessages.length > 0 && isMounted) {
          setChatMessages(formattedMessages);
          prevMessagesCount.current = formattedMessages.length;
        }
      } catch (error) {
        // Handle transient network or polling errors gracefully
        console.warn("Guest chat polling temporarily offline:", error instanceof Error ? error.message : error);
      }
    };

    const intervalMs = isContactOpen ? 3000 : 15000;
    const interval = setInterval(pollMessages, intervalMs);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sessionToken, isContactOpen, isGuestChatsPluginEnabled]);

  useEffect(() => {
    if (isContactOpen) {
      setHasUnreadBotMessage(false);
      setShowInitialBubble(false);
    } else {
      setShowInitialBubble(true);
    }
  }, [isContactOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);
    setShowInitialBubble(false);

    const tempId = "temp_" + Date.now();
    setChatMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: messageText,
        sender: "user",
      },
    ]);

    try {
      const response = await fetch(`/api/guest-chat/${sessionToken}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const messagesRes = await fetch(`/api/guest-chat/${sessionToken}/messages`);
      if (messagesRes.ok) {
        const { messages } = await messagesRes.json();
        const formattedMessages: ChatMessage[] = messages.map(
          (msg: { id: string; message: string; sender: string }) => ({
            id: msg.id,
            text: msg.message,
            sender: msg.sender === "guest" ? "user" : "bot",
          })
        );
        setChatMessages(formattedMessages);
        prevMessagesCount.current = formattedMessages.length;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  if (!isGuestChatsPluginEnabled) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Container at bottom-left / bottom-right */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 select-none flex-row-reverse"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Floating Bubble with animated text preview (to the left of the button in RTL layout) */}
        <AnimatePresence>
          {!isContactOpen && (hasUnreadBotMessage || showInitialBubble) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative hidden sm:flex items-center gap-2.5 bg-white text-gray-800 px-4 py-2.5 rounded-2xl shadow-xl border border-purple-100 max-w-xs cursor-pointer group hover:border-purple-300 transition-colors"
              onClick={() => setIsContactOpen(true)}
              dir="rtl"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <div className="absolute -bottom-1 right-6 w-3 h-3 bg-white border-l border-b border-purple-100 rotate-45 group-hover:border-purple-300 transition-colors" />
              <p className="text-xs text-gray-800 font-medium leading-tight">
                {hasUnreadBotMessage ? (
                  <TypeWriter
                    text={
                      chatMessages[chatMessages.length - 1]?.text
                        ? chatMessages[chatMessages.length - 1].text.substring(0, 45) + "..."
                        : "پیام جدید دریافت شد!"
                    }
                    speed={30}
                  />
                ) : showInitialBubble ? (
                  <TypeWriter
                    text={
                      chatMessages[0]?.text
                        ? chatMessages[0].text.substring(0, 45) + "..."
                        : "سلام! چطور می‌تونم کمکتون کنم؟"
                    }
                    speed={30}
                  />
                ) : null}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Trigger Button */}
        <motion.button
          key={`chat-btn-${hasUnreadBotMessage}`}
          onClick={() => setIsContactOpen(!isContactOpen)}
          className={`relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-all flex-shrink-0 group focus:outline-hidden ${
            isContactOpen
              ? "w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 text-white shadow-2xl"
              : "bg-transparent"
          }`}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          animate={
            isContactOpen
              ? { rotate: 180 }
              : isShaking || hasUnreadBotMessage
              ? { x: [0, -12, 12, -12, 0] }
              : { rotate: 0 }
          }
          transition={
            isShaking || hasUnreadBotMessage
              ? { repeat: isShaking ? 2 : Infinity, repeatDelay: 4, duration: 0.4 }
              : undefined
          }
          title="پشتیبانی و چت آنلاین"
        >
          <AnimatePresence mode="wait">
            {isContactOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full flex items-center justify-center text-white"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full flex items-center justify-center relative select-none"
              >
                <img
                  src="/images/chat_support_icon.png"
                  alt="پشتیبانی آنلاین"
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(37,99,235,0.3)] hover:drop-shadow-[0_12px_20px_rgba(37,99,235,0.45)] transition-all"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = chatSupportIcon;
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Online status indicator */}
          {!isContactOpen && !hasUnreadBotMessage && (
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full z-20 shadow-md">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
            </span>
          )}

          {/* Unread dot indicator */}
          {hasUnreadBotMessage && !isContactOpen && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white z-20 shadow-md">
              !
            </span>
          )}
        </motion.button>
      </motion.div>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isContactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setIsContactOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isContactOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed right-4 bottom-24 sm:right-6 sm:bottom-24 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[460px] bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden border border-purple-100/80"
            dir="rtl"
          >
            {/* Header with Bot Avatar & Status */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-md">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md ring-2 ring-white/30 overflow-hidden">
                  <img
                    src={chatSupportIcon}
                    alt="پشتیبانی آنلاین"
                    className="w-full h-full rounded-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/chat_support_icon.png";
                    }}
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white">
                  <motion.div
                    className="w-full h-full bg-emerald-300 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
              </div>

              {/* Header Details */}
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>پشتیبانی آنلاین</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-[11px] text-white/90">پاسخگویی سریع ۲۴ ساعته</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsContactOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white"
                title="بستن پنجره"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gradient-to-b from-gray-50 via-white to-purple-50/20">
              {chatMessages.map((msg, index) => (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className={`flex items-end gap-2 ${
                    msg.sender === "user" ? "justify-start flex-row-reverse" : "justify-start"
                  }`}
                >
                  {/* Bot Icon */}
                  {msg.sender === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-blue-100 p-0.5 flex-shrink-0 flex items-center justify-center border border-blue-200 overflow-hidden">
                      <img
                        src={chatSupportIcon}
                        alt="پشتیبانی آنلاین"
                        className="w-full h-full rounded-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/images/chat_support_icon.png";
                        }}
                      />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs"
                        : "bg-white text-gray-800 rounded-bl-xs border border-purple-100/90 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* User Icon */}
                  {msg.sender === "user" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0 flex items-center justify-center text-white text-xs shadow-xs">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoadingChat && chatMessages.length === 0 && (
                <div className="flex justify-center items-center py-8 text-xs text-gray-400">
                  <span>در حال اتصال...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-purple-100 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
                title="ارسال پیام"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default GuestChatWidget;
