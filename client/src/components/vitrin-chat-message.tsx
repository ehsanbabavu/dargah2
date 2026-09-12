import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles, User, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

export function ChatMessage({ role, content, isTyping }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex gap-4 p-6 w-full max-w-4xl mx-auto rounded-2xl transition-colors pt-[12px] pb-[12px]",
        role === "assistant" 
          ? "dark:bg-secondary/10 bg-[#8888f74d] flex-row-reverse" 
          : "bg-white/50 border border-border/50"
      )}
    >
      <div className="shrink-0 mt-1">
        <Avatar className={cn(
          "w-10 h-10 border border-border/50 shadow-sm",
          role === "assistant" ? "bg-primary/10" : "bg-muted"
        )}>
          {role === "assistant" ? (
            <div className="w-full h-full flex items-center justify-center text-[#6c5ce0]">
              <Sparkles className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <User className="w-5 h-5" />
            </div>
          )}
        </Avatar>
      </div>
      <div className="flex-1 space-y-2 text-right">
        <div className="flex items-center justify-end">
          <span className="font-bold text-[#040f87cc] text-[12px]">
            {role === "assistant" ? "پشتیبان" : "شما"}
          </span>
        </div>
        
        <div className="text-foreground/90 whitespace-pre-wrap text-[12px]">
          {isTyping ? (
            <span className="flex gap-1 items-center h-6">
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
            </span>
          ) : (
            content
          )}
        </div>
      </div>
    </motion.div>
  );
}
