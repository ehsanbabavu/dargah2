import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Ticket, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Reply, 
  Send, 
  Star, 
  RefreshCw, 
  ChevronLeft,
  Lock,
  Unlock,
  Inbox,
  Sparkles,
  CreditCard,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  Settings,
  ArrowLeft,
  ArrowUpRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createAuthenticatedRequest } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Ticket as TicketType, User as UserType } from "@shared/schema";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTicketForReply, setSelectedTicketForReply] = useState<TicketType | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Fetch Users
  const { 
    data: users = [], 
    isLoading: isUsersLoading, 
    isRefetching: isUsersRefetching 
  } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/users");
      if (!response.ok) throw new Error("خطا در دریافت لیست کاربران");
      return response.json();
    },
    staleTime: 15000,
  });

  // 2. Fetch Tickets
  const { 
    data: tickets = [], 
    isLoading: isTicketsLoading, 
    isRefetching: isTicketsRefetching 
  } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/tickets");
      if (!response.ok) throw new Error("خطا در دریافت تیکت‌ها");
      return response.json();
    },
    staleTime: 15000,
  });

  // 3. Fetch Admin's Card-to-Card Gateway Settings
  const { data: blupalGateway } = useQuery<{
    id?: string;
    isActive?: boolean;
    apiKey?: string | null;
    slug?: string | null;
    title?: string;
    cardNumber?: string | null;
    cardHolderName?: string | null;
    bankName?: string | null;
  }>({
    queryKey: ["/api/blupal/gateway"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/blupal/gateway");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 15000,
  });

  // 4. Fetch Admin's Card-to-Card Gateway Stats
  const { data: blupalStats } = useQuery<{
    totalAmount: number;
    paidCount: number;
    pendingCount: number;
  }>({
    queryKey: ["/api/blupal/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/blupal/stats");
      if (!res.ok) return { totalAmount: 0, paidCount: 0, pendingCount: 0 };
      return res.json();
    },
    staleTime: 15000,
  });

  const slug = blupalGateway?.slug || user?.username || "";
  const publicPaymentUrl = typeof window !== "undefined" && slug
    ? `${window.location.origin}/pay/${slug}`
    : `/pay/${slug}`;

  const isGatewayConfigured = Boolean(blupalGateway?.apiKey?.trim()) && Boolean(blupalGateway?.isActive);

  const handleCopyPaymentLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicPaymentUrl);
      setCopiedLink(true);
      toast({
        title: "✅ کپی شد",
        description: "لینک پرداخت کارت به کارت مدیر با موفقیت در کلیپ‌بورد کپی شد",
      });
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Reply to ticket mutation
  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, reply }: { ticketId: string; reply: string }) => {
      const response = await createAuthenticatedRequest(`/api/tickets/${ticketId}/reply`, {
        method: "PUT",
        body: JSON.stringify({ adminReply: reply }),
      });
      if (!response.ok) throw new Error("خطا در ارسال پاسخ به تیکت");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setIsReplyModalOpen(false);
      setSelectedTicketForReply(null);
      setReplyMessage("");
      toast({
        title: "✅ ارسال شد",
        description: "پاسخ شما با موفقیت برای کاربر ارسال و وضعیت تیکت بروزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "❌ خطا",
        description: "خطا در ارسال پاسخ تیکت، لطفاً مجدداً تلاش کنید",
        variant: "destructive",
      });
    },
  });

  // Toggle user block mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => {
      const response = await createAuthenticatedRequest(`/api/users/${userId}/toggle-block`, {
        method: "PUT",
        body: JSON.stringify({ isBlocked }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "خطا در تغییر وضعیت مسدودی کاربر");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "✅ وضعیت بروز شد",
        description: data.message || "وضعیت حساب کاربر تغییر یافت",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا",
        description: error.message || "خطا در تغییر وضعیت کاربر",
        variant: "destructive",
      });
    },
  });

  // 1. Last 5 registered users
  const last5RegisteredUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [users]);

  // 2. Last 5 unanswered tickets
  const last5UnansweredTickets = useMemo(() => {
    return [...tickets]
      .filter(ticket => {
        const hasAdminReply = !!ticket.adminReply && ticket.adminReply.trim() !== "" && ticket.adminReply.trim() !== "[]";
        return ticket.status === "unread" || (!hasAdminReply && ticket.status !== "closed");
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [tickets]);

  // User Map for quick lookup
  const userMap = useMemo(() => {
    const map = new Map<string, UserType>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  const unansweredTicketsCount = useMemo(() => {
    return tickets.filter(ticket => {
      const hasAdminReply = !!ticket.adminReply && ticket.adminReply.trim() !== "" && ticket.adminReply.trim() !== "[]";
      return ticket.status === "unread" || (!hasAdminReply && ticket.status !== "closed");
    }).length;
  }, [tickets]);

  const handleOpenReplyModal = (ticket: TicketType) => {
    setSelectedTicketForReply(ticket);
    setReplyMessage("");
    setIsReplyModalOpen(true);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForReply || !replyMessage.trim()) return;
    replyMutation.mutate({
      ticketId: selectedTicketForReply.id,
      reply: replyMessage.trim()
    });
  };

  const formatPersianDate = (dateString?: string | Date | null) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-[11px] font-medium">
            مدیر کل
          </Badge>
        );
      case "user_level_1":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[11px] font-medium">
            سطح ۱
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[11px]">{role}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 text-[11px]">
            <Star className="h-3 w-3 fill-current" />
            فوری
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[11px]">
            بالا
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="secondary" className="text-[11px]">
            متوسط
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="text-[11px]">
            کم
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[11px]">{priority}</Badge>;
    }
  };

  const getUserInitials = (firstName?: string | null, lastName?: string | null, username?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)} ${lastName.charAt(0)}`;
    }
    if (firstName) return firstName.slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return "کاربر";
  };

  const isLoading = isUsersLoading || isTicketsLoading;

  return (
    <DashboardLayout title="پیشخوان مدیریت">
      <div className="space-y-6 pb-16 text-right" dir="rtl">
        
        {/* Card-to-Card Payment Gateway & Direct Deposit Management for Admin */}
        <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 via-card to-card dark:from-indigo-950/20 dark:via-card dark:to-card shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white dark:bg-indigo-500 flex items-center justify-center shadow-sm shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      درگاه پرداخت کارت به کارت مستقل مدیر
                    </h2>
                    <Badge 
                      variant="outline"
                      className={isGatewayConfigured 
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 text-xs px-2.5 py-0.5 flex items-center gap-1.5" 
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 text-xs px-2.5 py-0.5 flex items-center gap-1.5"}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isGatewayConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                      <span>{isGatewayConfigured ? "درگاه فعال و آماده دریافت واریزی" : "در انتظار تکمیل تنظیمات"}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    دریافت مستقیم واریزی‌های کاربران، اتصال به وب‌سرویس بلو بانک و صدور فاکتور اختصاصی
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-medium border-border"
                  data-testid="button-admin-transactions"
                >
                  <Link href="/transactions">
                    <Wallet className="w-4 h-4 text-indigo-500" />
                    <span>تراکنش‌ها ({blupalStats?.paidCount || 0})</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  data-testid="button-admin-gateway-settings"
                >
                  <Link href="/level1/settings">
                    <Settings className="w-4 h-4" />
                    <span>تنظیمات و شماره کارت</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Public Link Share & Quick Financial Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
              {/* Share Box */}
              <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-2 bg-background/80 dark:bg-muted/40 p-2 sm:p-2.5 rounded-xl border border-border/80">
                <span className="text-xs font-medium text-muted-foreground shrink-0 px-1">
                  لینک پرداخت مستقیم کاربران:
                </span>
                <div className="flex-1 text-left px-2 truncate font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-muted/40 py-1.5 rounded-md" dir="ltr">
                  {publicPaymentUrl}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyPaymentLink}
                    className="h-8 px-2.5 text-xs gap-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-200 font-medium"
                    data-testid="button-copy-admin-pay-link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "کپی شد" : "کپی لینک"}</span>
                  </Button>
                  <a href={publicPaymentUrl} target="_blank" rel="noreferrer">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs gap-1"
                      title="مشاهده صفحه پرداخت کاربران"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">باز کردن</span>
                    </Button>
                  </a>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="flex items-center justify-between sm:justify-around p-2.5 rounded-xl bg-background/80 dark:bg-muted/40 border border-border/80 text-xs">
                <div className="text-right space-y-0.5">
                  <span className="text-muted-foreground text-[11px] block">مجموع واریزی‌ها</span>
                  <span className="font-bold font-mono text-foreground text-sm">
                    {(blupalStats?.totalAmount || 0).toLocaleString('fa-IR')}
                  </span>
                  <span className="text-[10px] text-muted-foreground mr-1">تومان</span>
                </div>
                <div className="h-8 w-px bg-border/60" />
                <div className="text-right space-y-0.5">
                  <span className="text-muted-foreground text-[11px] block">پرداخت‌های موفق</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    {(blupalStats?.paidCount || 0).toLocaleString('fa-IR')}
                  </span>
                  <span className="text-[10px] text-muted-foreground mr-1">فاکتور</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. LAST 5 REGISTERED USERS */}
          <Card className="border-border shadow-xs flex flex-col">
            <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>۵ کاربر اخیر عضو شده</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono font-normal">
                      ۵ نفر
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    جدیدترین کاربران پیوسته به سامانه
                  </CardDescription>
                </div>
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-primary hover:text-primary/90 hover:bg-primary/10 h-8 px-2.5"
                data-testid="link-view-all-users"
              >
                <Link href="/users">
                  <span>همه کاربران</span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="p-0 flex-1 divide-y divide-border/60">
              {isLoading ? (
                <div className="p-8 text-center space-y-3">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-xs text-muted-foreground">در حال دریافت لیست کاربران...</p>
                </div>
              ) : last5RegisteredUsers.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-medium text-foreground">کاربری ثبت نشده است</p>
                </div>
              ) : (
                last5RegisteredUsers.map((user) => {
                  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'کاربر بدون نام';
                  const initials = getUserInitials(user.firstName, user.lastName, user.username);
                  return (
                    <div 
                      key={user.id} 
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      data-testid={`row-recent-user-${user.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0 border border-border/80">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground truncate">
                              {fullName}
                            </span>
                            {getRoleBadge(user.role)}
                            {user.isBlocked && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                                مسدود
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {user.phone ? (
                              <span className="flex items-center gap-1 font-mono text-[11px]" dir="ltr">
                                <Phone className="h-3 w-3 text-muted-foreground/70" />
                                {user.phone}
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono" dir="ltr">@{user.username}</span>
                            )}

                            {user.email && (
                              <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[140px]">
                                <Mail className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {user.role !== "admin" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title={user.isBlocked ? "رفع مسدودیت" : "مسدود کردن کاربر"}
                            onClick={() => toggleBlockMutation.mutate({ userId: user.id, isBlocked: !user.isBlocked })}
                            disabled={toggleBlockMutation.isPending}
                          >
                            {user.isBlocked ? (
                              <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-rose-500" />
                            )}
                          </Button>
                        )}

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-foreground bg-background"
                        >
                          <Link href="/users">
                            <span>مدیریت</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* 2. LAST 5 UNANSWERED TICKETS */}
          <Card className="border-border shadow-xs flex flex-col">
            <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>۵ تیکت اخیر بی‌پاسخ</span>
                    {unansweredTicketsCount > 0 ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0 h-4 font-mono">
                        {unansweredTicketsCount} مورد
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-emerald-600 border-emerald-300">
                        صفر
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    تیکت‌های منتظر پاسخ و پشتیبانی
                  </CardDescription>
                </div>
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-primary hover:text-primary/90 hover:bg-primary/10 h-8 px-2.5"
                data-testid="link-view-all-tickets"
              >
                <Link href="/tickets">
                  <span>همه تیکت‌ها</span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="p-0 flex-1 divide-y divide-border/60">
              {isLoading ? (
                <div className="p-8 text-center space-y-3">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-xs text-muted-foreground">در حال دریافت تیکت‌ها...</p>
                </div>
              ) : last5UnansweredTickets.length === 0 ? (
                <div className="p-8 text-center space-y-3 my-auto">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">همه تیکت‌ها پاسخ داده شده‌اند! 🎉</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      هیچ تیکت بی‌پاسخی در حال حاضر وجود ندارد.
                    </p>
                  </div>
                </div>
              ) : (
                last5UnansweredTickets.map((ticket) => {
                  const sender = userMap.get(ticket.userId);
                  const senderName = sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.username : "کاربر";

                  return (
                    <div 
                      key={ticket.id} 
                      className="p-3.5 sm:p-4 space-y-2 hover:bg-muted/30 transition-colors"
                      data-testid={`row-unanswered-ticket-${ticket.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground truncate">
                              {ticket.subject}
                            </span>
                            {getPriorityBadge(ticket.priority)}
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {ticket.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {ticket.message}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleOpenReplyModal(ticket)}
                          className="h-8 px-2.5 text-xs gap-1.5 shrink-0 bg-primary/90 hover:bg-primary text-primary-foreground shadow-2xs"
                          data-testid={`button-quick-reply-${ticket.id}`}
                        >
                          <Reply className="h-3.5 w-3.5" />
                          <span>پاسخ</span>
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{senderName}</span>
                          {sender?.phone && (
                            <span className="font-mono text-muted-foreground" dir="ltr">
                              ({sender.phone})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-500/10">
                            در انتظار پاسخ
                          </Badge>
                          <span>•</span>
                          <span>{formatPersianDate(ticket.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

        </div>

        {/* Quick Reply Modal */}
        <Dialog open={isReplyModalOpen} onOpenChange={setIsReplyModalOpen}>
          <DialogContent className="max-w-md sm:max-w-lg" dir="rtl">
            <DialogHeader className="text-right space-y-1">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Reply className="h-4 w-4 text-primary" />
                <span>پاسخ به تیکت: {selectedTicketForReply?.subject}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                ارسال پاسخ رسمی مدیریت به کاربر
              </DialogDescription>
            </DialogHeader>

            {selectedTicketForReply && (
              <form onSubmit={handleSendReply} className="space-y-4 pt-2">
                <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-xs border border-border">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>دسته‌بندی: <b>{selectedTicketForReply.category}</b></span>
                    <span>اولویت: {getPriorityBadge(selectedTicketForReply.priority)}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium">متن پیام کاربر:</span>
                    <p className="text-foreground bg-background p-2.5 rounded border border-border/60 max-h-28 overflow-y-auto leading-relaxed">
                      {selectedTicketForReply.message}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-reply-text" className="text-xs font-semibold">
                    متن پاسخ شما به عنوان مدیر:
                  </Label>
                  <Textarea
                    id="admin-reply-text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="پاسخ خود را اینجا بنویسید..."
                    rows={4}
                    className="text-sm resize-none"
                    required
                    data-testid="textarea-quick-reply"
                  />
                </div>

                <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReplyModalOpen(false)}
                    disabled={replyMutation.isPending}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!replyMessage.trim() || replyMutation.isPending}
                    className="gap-1.5 bg-primary text-primary-foreground"
                    data-testid="button-submit-quick-reply"
                  >
                    {replyMutation.isPending ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>در حال ارسال...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>ارسال پاسخ</span>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
