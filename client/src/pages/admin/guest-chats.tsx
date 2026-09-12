import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  X,
  User,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  MessageCircle,
  Search,
  MoreVertical,
  AlertCircle,
  Zap,
  Inbox
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import type { GuestChatSession, GuestChatMessage } from "@shared/schema";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const messageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};


export default function GuestChats() {
  const [selectedSession, setSelectedSession] = useState<GuestChatSession | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery<GuestChatSession[]>({
    queryKey: ["/api/admin/guest-chats"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/admin/guest-chats");
      if (!response.ok) throw new Error("خطا در دریافت چت‌ها");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<GuestChatMessage[]>({
    queryKey: ["/api/admin/guest-chats/messages", selectedSession?.id],
    queryFn: async () => {
      if (!selectedSession) return [];
      const response = await createAuthenticatedRequest(`/api/admin/guest-chats/${selectedSession.id}/messages`);
      if (!response.ok) throw new Error("خطا در دریافت پیام‌ها");
      return response.json();
    },
    enabled: !!selectedSession,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: string; message: string }) => {
      const response = await createAuthenticatedRequest(`/api/admin/guest-chats/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("خطا در ارسال پیام");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guest-chats/messages", selectedSession?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guest-chats"] });
      setMessageInput("");
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "ارسال پیام با مشکل مواجه شد",
        variant: "destructive",
      });
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await createAuthenticatedRequest(`/api/admin/guest-chats/${sessionId}/close`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("خطا در بستن جلسه");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guest-chats"] });
      setSelectedSession(null);
      toast({
        title: "موفق",
        description: "جلسه چت بسته شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "بستن جلسه با مشکل مواجه شد",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedSession) return;
    
    sendMessageMutation.mutate({
      sessionId: selectedSession.id,
      message: messageInput.trim(),
    });
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }).format(date);
  };

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const activeSessions = sessions.filter(s => s.isActive);
  const closedSessions = sessions.filter(s => !s.isActive);
  
  const filteredActiveSessions = activeSessions.filter(s => 
    (s.guestName || "مهمان").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.guestPhone || "").includes(searchQuery)
  );

  return (
    <DashboardLayout title="چت مهمانان">
      <motion.div 
        className="space-y-2 h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div 
          className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-lg p-3 border border-blue-200/20 backdrop-blur-sm"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  چت‌های مهمانان
                </h1>
                <p className="text-xs text-muted-foreground">مدیریت و پاسخگویی</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-300/30"
              >
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">{activeSessions.length}</span>
                </div>
              </motion.div>
              
              {sessions.length > 0 && (
                <div className="px-2 py-1 bg-gradient-to-r from-slate-500/20 to-slate-500/20 rounded-full border border-slate-300/30">
                  <div className="flex items-center gap-1">
                    <Inbox className="h-3 w-3 text-slate-600" />
                    <span className="text-xs font-medium text-slate-600">{sessions.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Chat Section */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[calc(100vh-280px)]"
          variants={itemVariants}
        >
          {/* Sessions List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg h-full overflow-hidden">
              <CardHeader className="pb-2 pt-2 px-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="relative">
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="جستجو..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-8 border border-blue-200/50 rounded-lg focus:border-blue-400 focus:ring-blue-400/20 text-sm h-8"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-360px)]">
                  {isLoading ? (
                    <motion.div 
                      className="flex items-center justify-center py-4"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-200 border-t-blue-600"></div>
                    </motion.div>
                  ) : sessions.length === 0 ? (
                    <motion.div 
                      className="text-center py-6 text-muted-foreground"
                      variants={itemVariants}
                    >
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">هنوز چتی وجود ندارد</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="divide-y"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {/* Active Sessions */}
                      <AnimatePresence>
                        {filteredActiveSessions.map((session, idx) => (
                          <motion.div
                            key={session.id}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: -20 }}
                            onClick={() => setSelectedSession(session)}
                            className={`p-2 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 ${
                              selectedSession?.id === session.id 
                                ? "bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-blue-500" 
                                : ""
                            }`}
                            whileHover={{ paddingRight: 4 }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <motion.div 
                                  className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0"
                                  whileHover={{ scale: 1.1 }}
                                >
                                  <User className="h-4 w-4 text-white" />
                                </motion.div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-xs truncate">
                                    {session.guestIpAddress ? `${session.guestIpAddress}` : session.guestName || "مهمان"}
                                  </p>
                                  {session.guestPhone && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                                      <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                                      <span className="truncate text-xs">{session.guestPhone}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              <motion.div
                                animate={(session.unreadByAdmin || 0) > 0 ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                              >
                                {(session.unreadByAdmin || 0) > 0 && (
                                  <Badge className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-pink-500 animate-pulse">
                                    {session.unreadByAdmin}
                                  </Badge>
                                )}
                              </motion.div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                {formatDate(session.lastMessageAt)}
                              </span>
                              <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-300/50 text-green-700 h-5">
                                فعال
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Closed Sessions */}
                      {closedSessions.length > 0 && (
                        <>
                          <motion.div 
                            className="px-3 py-2 bg-slate-50 text-xs text-muted-foreground font-medium sticky top-0 z-10"
                            variants={itemVariants}
                          >
                            بسته ({closedSessions.length})
                          </motion.div>
                          <AnimatePresence>
                            {closedSessions.map((session) => (
                              <motion.div
                                key={session.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, x: -20 }}
                                onClick={() => setSelectedSession(session)}
                                className={`p-2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity ${
                                  selectedSession?.id === session.id ? "bg-slate-100" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-slate-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-xs truncate">
                                      {session.guestIpAddress ? `${session.guestIpAddress}` : session.guestName || "مهمان"}
                                    </p>
                                    {session.guestPhone && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                                        <Phone className="h-2.5 w-2.5" />
                                        <span className="truncate">{session.guestPhone}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatDate(session.lastMessageAt)}
                                </p>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </>
                      )}
                    </motion.div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-lg h-full overflow-hidden flex flex-col">
              {selectedSession ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="pb-2 pt-2 px-3 border-b bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.div 
                          className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                        >
                          <User className="h-4 w-4 text-white" />
                        </motion.div>
                        <div>
                          <CardTitle className="text-base">
                            {selectedSession.guestIpAddress ? `${selectedSession.guestIpAddress}` : selectedSession.guestName || "مهمان"}
                          </CardTitle>
                          {selectedSession.guestPhone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {selectedSession.guestPhone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {selectedSession.isActive ? (
                          <motion.div
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                          >
                            <div className="h-1.5 w-1.5 bg-green-600 rounded-full animate-pulse"></div>
                            فعال
                          </motion.div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                            <div className="h-1.5 w-1.5 bg-slate-400 rounded-full"></div>
                            بسته
                          </div>
                        )}
                        {selectedSession.isActive && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => closeSessionMutation.mutate(selectedSession.id)}
                            disabled={closeSessionMutation.isPending}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedSession(null)}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages Area */}
                  <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 p-3">
                      {messagesLoading ? (
                        <motion.div 
                          className="flex items-center justify-center py-6"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-200 border-t-blue-600"></div>
                        </motion.div>
                      ) : messages.length === 0 ? (
                        <motion.div 
                          className="text-center py-8 text-muted-foreground"
                          variants={itemVariants}
                        >
                          <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                          <p className="text-xs">هنوز پیامی ارسال نشده</p>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="space-y-2"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <AnimatePresence>
                            {messages.map((message, idx) => (
                              <motion.div
                                key={message.id}
                                variants={messageVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex ${message.sender === "admin" ? "justify-start" : "justify-end"}`}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  className={`max-w-[75%] rounded-lg px-3 py-2 shadow-md ${
                                    message.sender === "admin"
                                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-bl-none"
                                      : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 rounded-br-none"
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
                                  <div className={`flex items-center justify-between gap-1 mt-1 text-xs ${
                                    message.sender === "admin" ? "text-white/70" : "text-slate-600"
                                  }`}>
                                    <span>{formatTime(message.createdAt)}</span>
                                    {message.sender === "admin" && (
                                      <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                      >
                                        {message.isRead ? (
                                          <CheckCircle className="h-3 w-3" />
                                        ) : (
                                          <Clock className="h-3 w-3" />
                                        )}
                                      </motion.span>
                                    )}
                                  </div>
                                </motion.div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          <div ref={messagesEndRef} />
                        </motion.div>
                      )}
                    </ScrollArea>

                    {/* Message Input */}
                    {selectedSession.isActive && (
                      <>
                        <Separator />
                        <motion.form 
                          onSubmit={handleSendMessage} 
                          className="p-3 flex items-end gap-2 bg-gradient-to-r from-blue-50/50 to-purple-50/50"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <motion.div className="flex-1 relative">
                            <Input
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              placeholder="پیام..."
                              className="rounded-full border border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 px-4 text-sm h-8"
                              disabled={sendMessageMutation.isPending}
                            />
                          </motion.div>
                          <motion.button
                            type="submit"
                            disabled={!messageInput.trim() || sendMessageMutation.isPending}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </motion.button>
                        </motion.form>
                      </>
                    )}
                  </CardContent>
                </>
              ) : (
                <motion.div 
                  className="flex items-center justify-center h-full text-muted-foreground"
                  variants={itemVariants}
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    </motion.div>
                    <p className="text-sm font-medium">یک چت انتخاب کنید</p>
                    <p className="text-xs opacity-60 mt-1">برای شروع یک مهمان را انتخاب کنید</p>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
