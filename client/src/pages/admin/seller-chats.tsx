import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { createAuthenticatedRequest } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Send, MessageCircle, User, Clock, ArrowRight, Users } from "lucide-react";
import { type InternalChat, type User as UserType } from "@shared/schema";
import { DashboardLayout } from "@/components/dashboard-layout";

interface ChatWithUser extends InternalChat {
  senderName?: string;
  receiverName?: string;
}

export default function SellerChats() {
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: level1Users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/users");
      if (!response.ok) return [];
      const users = await response.json();
      return users.filter((u: UserType) => u.role === "user_level_1");
    },
  });

  const { data: allChats = [], isLoading: chatsLoading } = useQuery<ChatWithUser[]>({
    queryKey: ["/api/internal-chats"],
    refetchInterval: 5000,
  });

  const sellers = level1Users.map(seller => {
    const sellerChats = allChats.filter(chat => 
      chat.senderId === seller.id || chat.receiverId === seller.id
    );
    
    const latestChat = sellerChats.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })[0];

    const unreadCount = sellerChats.filter(c => 
      String(c.senderId) === String(seller.id) && 
      !c.isRead
    ).length;

    // Use a unique key for the badge to force re-render when unreadCount changes
    const badgeKey = `unread-${seller.id}-${unreadCount}`;

    return {
      sellerId: seller.id,
      sellerName: `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.username || "نام نامشخص",
      latestMessage: latestChat,
      unreadCount,
      badgeKey
    };
  }).sort((a, b) => {
    const aTime = a.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt).getTime() : 0;
    const bTime = b.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const selectedSellerChats = allChats && selectedSellerId
    ? allChats.filter(chat => 
        (chat.senderId === selectedSellerId && chat.receiverId === user?.id) ||
        (chat.senderId === user?.id && chat.receiverId === selectedSellerId)
      ).sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      })
    : [];

  const markAllAsReadMutation = useMutation({
    mutationFn: async (senderId: string) => {
      const response = await createAuthenticatedRequest("/api/internal-chats/mark-all-read", {
        method: "PATCH",
        body: JSON.stringify({ senderId })
      });
      if (!response.ok) {
        throw new Error("خطا در علامت‌گذاری پیام‌ها");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internal-chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/internal-chats/unread-count"] });
    },
  });

  useEffect(() => {
    if (user && user.role === "admin" && selectedSellerId && allChats && allChats.length > 0) {
      const hasUnreadFromSelected = allChats.some(chat => 
        String(chat.senderId) === String(selectedSellerId) && 
        String(chat.receiverId) === String(user.id) && 
        !chat.isRead
      );
      
      if (hasUnreadFromSelected) {
        markAllAsReadMutation.mutate(selectedSellerId);
      }
    }
  }, [user, allChats, selectedSellerId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; message: string }) => {
      const response = await createAuthenticatedRequest("/api/internal-chats", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("خطا در ارسال پیام");
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/internal-chats"] });
      toast({
        title: "موفقیت",
        description: "پیام شما ارسال شد",
      });
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ارسال پیام",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedSellerId || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      receiverId: selectedSellerId,
      message: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (selectedSellerChats.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedSellerChats]);

  if (user?.role !== "admin") {
    return (
      <DashboardLayout title="چت کاربران">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">دسترسی غیر مجاز</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (chatsLoading) {
    return (
      <DashboardLayout title="چت کاربران">
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">در حال بارگذاری چت‌ها...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="چت کاربران">
      <div className="flex h-[calc(100vh-10rem)] bg-background border rounded-lg overflow-hidden shadow-sm" data-testid="seller-chats-content">
        {/* Left Column: Sellers List */}
        <div className={`flex flex-col border-l w-full md:w-80 lg:w-96 bg-muted/5 ${selectedSellerId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              کاربران
              <Badge variant="secondary" className="mr-auto">
                {sellers.length}
              </Badge>
            </h2>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/50">
              {sellers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>هیچ فروشنده‌ای یافت نشد</p>
                </div>
              ) : (
                sellers.map((seller) => (
                  <div
                    key={seller.sellerId}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-muted/50 relative ${
                      selectedSellerId === seller.sellerId
                        ? "bg-primary/5 border-r-4 border-r-primary shadow-inner"
                        : ""
                    }`}
                    onClick={() => setSelectedSellerId(seller.sellerId)}
                    data-testid={`seller-chat-${seller.sellerId}`}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-sm truncate text-foreground/90">
                            {seller.sellerName}
                          </h3>
                          {seller.unreadCount > 0 && (
                            <Badge key={seller.badgeKey} variant="destructive" className="animate-in zoom-in-50 duration-300 h-5 min-w-5 flex items-center justify-center p-0 rounded-full">
                              {seller.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate leading-relaxed">
                          {seller.latestMessage?.message || "هنوز پیامی ارسال نشده است"}
                        </p>
                        {seller.latestMessage?.createdAt && (
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/70">
                            <Clock className="h-3 w-3" />
                            {new Date(seller.latestMessage.createdAt).toLocaleDateString("fa-IR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: Chat Window */}
        <div className={`flex-1 flex flex-col bg-background ${selectedSellerId ? 'flex' : 'hidden md:flex'}`}>
          {selectedSellerId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3 bg-background/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedSellerId(null)}
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 border shadow-sm">
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {sellers.find(s => s.sellerId === selectedSellerId)?.sellerName?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    {sellers.find(s => s.sellerId === selectedSellerId)?.sellerName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">در حال گفتگو</span>
                  </div>
                </div>
              </div>

              {/* Messages Content */}
              <ScrollArea className="flex-1 bg-[url('/chat-bg.png')] bg-repeat bg-center opacity-95">
                <div className="p-6 space-y-6">
                  {selectedSellerChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <div className="bg-muted/30 p-6 rounded-full mb-4">
                        <MessageCircle className="h-12 w-12 opacity-20" />
                      </div>
                      <p className="text-sm font-medium">گفتگو را آغاز کنید</p>
                      <p className="text-xs mt-1">هنوز پیامی با این فروشنده رد و بدل نشده است</p>
                    </div>
                  ) : (
                    selectedSellerChats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`flex ${chat.senderId === user?.id ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      >
                        <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] group`}>
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                              chat.senderId === user?.id
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted text-foreground rounded-bl-none"
                            }`}
                            data-testid={`message-${chat.id}`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{chat.message}</p>
                          </div>
                          <div className={`flex items-center gap-2 mt-1 px-1 ${chat.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {chat.createdAt ? new Date(chat.createdAt).toLocaleTimeString("fa-IR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) : ""}
                            </span>
                            {chat.senderId === user?.id && (
                              <span className={`text-[10px] ${chat.isRead ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                {chat.isRead ? "✓✓ خوانده شد" : "✓ ارسال شد"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input Footer */}
              <div className="p-4 border-t bg-muted/5">
                <div className="flex gap-2 items-end max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="پیام خود را اینجا بنویسید..."
                      className="min-h-[50px] max-h-[150px] pr-4 py-3 rounded-xl border-2 focus-visible:ring-primary/20 transition-all bg-background resize-none shadow-sm"
                      data-testid="input-message"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="h-[50px] w-[50px] rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all"
                    data-testid="button-send"
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  برای ارسال پیام از دکمه اینتر یا آیکون ارسال استفاده کنید
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 bg-muted/5">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <MessageCircle className="h-12 w-12 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground/80 mb-2">انتخاب گفتگو</h3>
              <p className="max-w-xs text-center text-sm leading-relaxed">
                لطفاً برای مشاهده پیام‌ها و شروع گفتگو، یکی از فروشندگان را از لیست سمت راست انتخاب کنید.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
