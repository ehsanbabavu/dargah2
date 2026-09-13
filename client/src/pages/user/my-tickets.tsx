import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Calendar,
  Reply,
  Eye,
  Plus,
  Headphones,
  ArrowRight,
  ShieldCheck,
  ChevronLeft
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { Ticket } from "@shared/schema";

interface TicketWithResponses extends Ticket {
  responses?: {
    id: string;
    message: string;
    createdAt: string;
    isAdmin: boolean;
    userName?: string;
  }[];
}

export default function MyTickets() {
  const [selectedTicket, setSelectedTicket] = useState<TicketWithResponses | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery<TicketWithResponses[]>({
    queryKey: ["/api/my-tickets"],
    queryFn: async () => {
      const authHeaders = getAuthHeaders();
      const headers: Record<string, string> = {};
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      
      const response = await fetch("/api/my-tickets", {
        headers,
      });
      if (!response.ok) throw new Error("خطا در دریافت تیکت‌ها");
      return response.json();
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const authHeaders = getAuthHeaders();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      
      const response = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("خطا در ارسال پاسخ");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-tickets"] });
      setReplyMessage("");
      toast({
        title: "ارسال شد",
        description: "پاسخ شما با موفقیت ثبت شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ارسال پاسخ. لطفاً دوباره امتحان کنید",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 shrink-0" />
            در انتظار بررسی
          </Badge>
        );
      case "read":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            پاسخ داده شده
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            بسته شده
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg shrink-0">
            {status}
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md shrink-0">
            خیلی فوری
          </span>
        );
      case "high":
        return (
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0">
            اولویت بالا
          </span>
        );
      case "medium":
        return (
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md shrink-0">
            اولویت متوسط
          </span>
        );
      case "low":
        return (
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-md shrink-0">
            عادی
          </span>
        );
      default:
        return null;
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;
    
    sendReplyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage.trim(),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="تیکت‌های من">
        <div className="w-full p-3 sm:p-5 lg:p-6 space-y-4 max-w-3xl mx-auto" data-testid="my-tickets-loading" dir="rtl">
          <div className="flex justify-between items-center px-1 animate-pulse">
            <div className="h-9 bg-muted/70 rounded-xl w-32"></div>
            <div className="h-6 bg-muted/70 rounded-full w-24"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="h-32 bg-muted/50 rounded-2xl animate-pulse border border-border/50" 
              />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="تیکت‌های من">
      <div className="w-full p-3 sm:p-5 lg:p-6 space-y-4 max-w-3xl mx-auto pb-10" data-testid="page-my-tickets" dir="rtl">
        
        {/* Mobile-First Header Bar */}
        <div className="flex flex-row items-center justify-between gap-2 px-0.5 pb-1 border-b border-border/40">
          <Button 
            asChild 
            size="sm" 
            data-testid="button-create-ticket"
            className="h-9 sm:h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Link href="/send-ticket">
              <Plus className="w-4 h-4 shrink-0 ml-0.5" />
              <span>ثبت تیکت جدید</span>
            </Link>
          </Button>

          <span className="text-xs bg-muted/80 text-muted-foreground font-bold px-3 py-1.5 rounded-xl border border-border/50 shrink-0">
            {tickets.length} تیکت ثبت شده
          </span>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <Card className="rounded-2xl border-border/70 shadow-xs">
            <CardContent className="py-10 sm:py-14 text-center flex flex-col items-center justify-center px-4">
              <div className="p-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-3 border border-indigo-500/20">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">
                هنوز تیکتی ارسال نکرده‌اید
              </h3>
              <p className="text-xs text-muted-foreground text-center mb-5 max-w-xs leading-relaxed">
                در صورت بروز هرگونه سوال یا مشکل، می‌توانید تیکت جدید ثبت کنید تا پشتیبانی به آن پاسخ دهد.
              </p>
              <Button 
                asChild 
                size="sm" 
                data-testid="button-create-first-ticket"
                className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-5 rounded-xl shadow-xs active:scale-95 transition-all"
              >
                <Link href="/send-ticket">
                  <Plus className="w-4 h-4 ml-1.5" />
                  ارسال اولین تیکت
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="rounded-2xl border border-border/70 shadow-xs hover:border-indigo-500/40 transition-all duration-200 overflow-hidden bg-card text-card-foreground"
                data-testid={`card-ticket-${ticket.id}`}
              >
                <CardContent className="p-3.5 sm:p-4 space-y-3">
                  {/* Top Bar: Subject & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">
                        {ticket.subject}
                      </h3>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                  
                  {/* Message Preview */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border/40 break-words">
                    {ticket.message}
                  </p>
                  
                  {/* Bottom Bar: Meta Info & Responsive Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-border/50">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                      </span>
                      {getPriorityBadge(ticket.priority)}
                      {ticket.responses && ticket.responses.length > 0 && (
                        <span className="text-[11px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-md border border-indigo-500/20">
                          {ticket.responses.length} پاسخ
                        </span>
                      )}
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setIsDialogOpen(true);
                      }}
                      data-testid={`button-view-ticket-${ticket.id}`}
                      className="w-full sm:w-auto h-8.5 sm:h-8 text-xs font-bold px-3.5 rounded-xl border-border/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                      <span>مشاهده و گفتگو</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Ticket Details & Conversation Dialog - Mobile Optimized Modal */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedTicket(null);
        }}>
          <DialogContent className="w-[94vw] max-w-lg rounded-2xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col gap-0 max-h-[90vh] overflow-hidden dir-rtl" dir="rtl">
            <DialogHeader className="pb-3 border-b border-border/60 shrink-0 text-right space-y-1">
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-xs sm:text-base font-bold text-foreground flex items-center gap-2 truncate">
                  <Headphones className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">{selectedTicket?.subject}</span>
                </DialogTitle>
                <div className="shrink-0">
                  {selectedTicket && getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>تاریخ: {selectedTicket?.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
                {selectedTicket && getPriorityBadge(selectedTicket.priority)}
              </div>
            </DialogHeader>
            
            {/* Scrollable Chat / Timeline Area */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 px-1">
              
              {/* User Original Ticket Bubble */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>پیام شما (شروع تیکت)</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {selectedTicket?.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString('fa-IR') : ''}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">
                  {selectedTicket?.message}
                </p>
              </div>
              
              {/* Conversation Responses */}
              {selectedTicket?.responses && selectedTicket.responses.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Reply className="w-3.5 h-3.5" />
                    <span>پاسخ‌ها و گفتگو</span>
                  </div>

                  {selectedTicket.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                        response.isAdmin
                          ? "bg-emerald-500/10 border-emerald-500/20 ms-2"
                          : "bg-muted/50 border-border/60 me-2"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold">
                          {response.isAdmin ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="text-emerald-700 dark:text-emerald-300 text-xs">کارشناس پشتیبانی</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-foreground text-xs">{response.userName || "شما"}</span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(response.createdAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">
                        {response.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Sticky Reply Footer */}
            {selectedTicket?.status !== "closed" ? (
              <form onSubmit={handleReplySubmit} className="pt-2.5 border-t border-border/60 shrink-0 space-y-2">
                <Textarea
                  id="reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="پاسخ خود را بنویسید..."
                  rows={2}
                  className="text-xs rounded-xl border-border/70 resize-none min-h-[65px] focus-visible:ring-indigo-500/20"
                  data-testid="textarea-reply"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                    data-testid="button-send-reply"
                    size="sm"
                    className="w-full sm:w-auto h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Send className="w-3.5 h-3.5 ml-1" />
                    {sendReplyMutation.isPending ? "در حال ارسال..." : "ارسال پاسخ"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="pt-2 border-t border-border/60 text-center py-2 text-xs text-muted-foreground">
                این تیکت بسته شده است و امکان ارسال پاسخ جدید وجود ندارد.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
