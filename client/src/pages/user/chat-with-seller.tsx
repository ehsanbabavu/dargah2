import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Clock, User, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createAuthenticatedRequest } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InternalChat, User as UserType } from "@shared/schema";

// Extended chat type with sender info
type ChatWithSender = InternalChat & {
  senderName?: string;
  senderRole?: string;
};

export default function ChatWithSeller() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get parent (seller or admin) information
  const { data: parentUser } = useQuery<UserType | null>({
    queryKey: ["/api/users/parent"],
    enabled: !!user,
    queryFn: async () => {
      // Get main administrator
      const response = await createAuthenticatedRequest("/api/users/admin-main");
      if (response.ok) return await response.json();
      
      return null;
    },
    staleTime: 60000,
  });

  // Get chat messages between current user and target (seller or admin)
  const { data: chats = [], isLoading, refetch } = useQuery<ChatWithSender[]>({
    queryKey: ["/api/internal-chats", parentUser?.id],
    enabled: !!user?.id && !!parentUser?.id,
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/internal-chats");
      if (!response.ok) {
        throw new Error("خطا در دریافت پیام‌ها");
      }
      const allChats: ChatWithSender[] = await response.json();
      
      // Filter chats to show conversation with the target
      const currentParentId = parentUser?.id;

      const filtered = allChats.filter(chat => {
        const isFromMeToParent = String(chat.senderId) === String(user?.id) && String(chat.receiverId) === String(currentParentId);
        const isFromParentToMe = String(chat.senderId) === String(currentParentId) && String(chat.receiverId) === String(user?.id);
        return isFromMeToParent || isFromParentToMe;
      });
      
      return filtered;
    },
    refetchInterval: 5000,
  });

  // Mark all messages as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Need to tell backend WHOSE messages we are marking as read
      const currentParentId = parentUser?.id;
      if (!currentParentId) return;

      const response = await createAuthenticatedRequest("/api/internal-chats/mark-all-read", {
        method: "PATCH",
        body: JSON.stringify({ senderId: currentParentId })
      });
      if (!response.ok) {
        throw new Error("خطا در علامت‌گذاری پیام‌ها");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both lists and unread counts
      queryClient.invalidateQueries({ queryKey: ["/api/internal-chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/internal-chats/unread-count"] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      // Prevent double submission if already loading
      if (sendMessageMutation.isPending) return;

      let targetId = parentUser?.id;
      
      if (!targetId) {
        const response = await createAuthenticatedRequest("/api/users/admin-main");
        if (response.ok) {
          const admin = await response.json();
          targetId = admin?.id;
        }
      }

      if (!targetId) {
        throw new Error("مخاطب یافت نشد. لطفا صفحه را مجددا بارگذاری کنید.");
      }

      const response = await createAuthenticatedRequest("/api/internal-chats", {
        method: "POST",
        body: JSON.stringify({
          receiverId: targetId,
          message: messageText.trim(),
        }),
      });
      if (!response.ok) {
        throw new Error("خطا در ارسال پیام");
      }
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      // Force invalidate to get the latest messages
      queryClient.invalidateQueries({ queryKey: ["/api/internal-chats", parentUser?.id] });
      toast({
        title: "موفقیت",
        description: "پیام شما ارسال شد",
      });
      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ارسال پیام",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mark all messages as read when user enters the chat
  useEffect(() => {
    const adminId = parentUser?.id;
    if (user && adminId && chats.length > 0) {
      // Check if there are any unread messages from admin
      const hasUnreadFromAdmin = chats.some(chat => 
        chat.senderId === adminId && 
        chat.receiverId === user.id && 
        !chat.isRead
      );
      
      if (hasUnreadFromAdmin) {
        markAllAsReadMutation.mutate();
      }
    }
  }, [user, chats, parentUser]); // Run when user, chats or parentUser change

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  if (!user || user.role !== "user_level_1") {
    return (
      <DashboardLayout title="چت با مدیر">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">دسترسی غیر مجاز</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={user.role === "user_level_1" ? "چت با مدیر" : "چت با فروشنده"}>
      <div className="h-[calc(100vh-8rem)]" data-testid="chat-with-seller-content">

        {/* Chat Messages */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={parentUser?.profilePicture || ""} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  {parentUser && (parentUser.firstName || parentUser.lastName)
                    ? `${parentUser.firstName || ""} ${parentUser.lastName || ""}`.trim()
                    : parentUser?.username || (user.role === "user_level_1" ? "مدیریت سیستم" : "فروشنده")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs h-5">
                    {user.role === "user_level_1" ? "مدیر" : "فروشنده"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    آنلاین
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="messages-container">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <div className="text-sm">در حال بارگذاری پیام‌ها...</div>
                    </div>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm mb-1">هنوز پیامی ارسال نشده</p>
                      <p className="text-xs opacity-75">اولین پیام خود را ارسال کنید</p>
                    </div>
                  </div>
                ) : (
                  // Remove duplicates based on ID and sort messages chronologically (oldest at top)
                  Array.from(new Map(chats.map(chat => [chat.id, chat])).values())
                    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
                    .map((chat) => (
                      <div
                        key={chat.id}
                      className={`flex ${
                        chat.senderId === user.id ? "justify-end" : "justify-start"
                      }`}
                      data-testid={`message-${chat.id}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-lg ${
                          chat.senderId === user.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 opacity-70" />
                          <span className="text-xs opacity-70">
                            {chat.createdAt ? new Date(chat.createdAt).toLocaleString('fa-IR', {
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : 'نامشخص'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    size="sm"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Enter برای ارسال، Shift+Enter برای خط جدید
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}