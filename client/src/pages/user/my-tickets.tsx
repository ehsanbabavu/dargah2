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
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            در انتظار بررسی
          </Badge>
        );
      case "read":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            پاسخ داده شده
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            بسته شده
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-[10px] font-black px-2 py-0.5 rounded-md">
            {status}
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
            خیلی فوری
          </span>
        );
      case "high":
        return (
          <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
            اولویت بالا
          </span>
        );
      case "medium":
        return (
          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
            اولویت متوسط
          </span>
        );
      case "low":
        return (
          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded">
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
        <div className="space-y-4 max-w-2xl mx-auto" data-testid="my-tickets-loading">
          <div className="flex justify-between items-center px-1 animate-pulse">
            <div className="h-8 bg-slate-100 dark:bg-zinc-800 rounded-xl w-24"></div>
            <div className="h-5 bg-slate-100 dark:bg-zinc-800 rounded-full w-16"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="h-32 bg-slate-50/60 dark:bg-zinc-900/50 rounded-[20px] animate-pulse border border-slate-100 dark:border-zinc-800/80" 
              />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="تیکت‌های من">
      <div className="space-y-4 max-w-2xl mx-auto pb-8" data-testid="page-my-tickets">
        
        {/* Header - Mobile Friendly */}
        <div className="flex items-center justify-between px-1">
          <Button 
            asChild 
            size="sm" 
            data-testid="button-create-ticket"
            className="h-8.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Link href="/send-ticket">
              <Plus className="w-3.5 h-3.5 ml-1" />
              ثبت تیکت جدید
            </Link>
          </Button>
          <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-extrabold px-2.5 py-1 rounded-full">
            {tickets.length} تیکت ثبت شده
          </span>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <Card className="rounded-[20px] border-slate-100 dark:border-zinc-800/80 shadow-xs">
            <CardContent className="py-12 text-center flex flex-col items-center justify-center px-4">
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                هنوز تیکتی ارسال نکرده‌اید
              </h3>
              <p className="text-[10px] text-muted-foreground text-center mb-4 max-w-xs leading-relaxed">
                در صورت بروز هرگونه مشکل یا سوال در سامانه، می‌توانید تیکت ارسال کنید.
              </p>
              <Button 
                asChild 
                size="sm" 
                data-testid="button-create-first-ticket"
                className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 rounded-xl shadow-xs active:scale-95 transition-all"
              >
                <Link href="/send-ticket">
                  <Plus className="w-3.5 h-3.5 ml-1.5" />
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
                className="rounded-[20px] border border-slate-200/70 dark:border-zinc-800/80 shadow-xs hover:border-indigo-400/40 dark:hover:border-indigo-500/30 transition-all duration-200 overflow-hidden"
                data-testid={`card-ticket-${ticket.id}`}
              >
                <CardContent className="p-3.5 sm:p-4 space-y-2.5">
                  {/* Top Bar: Subject & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {ticket.subject}
                      </h3>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                  
                  {/* Message Preview */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50/50 dark:bg-zinc-900/40 p-2 rounded-xl border border-slate-100/80 dark:border-zinc-850">
                    {ticket.message}
                  </p>
                  
                  {/* Bottom Bar: Meta & Action Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                      </span>
                      {getPriorityBadge(ticket.priority)}
                      {ticket.responses && ticket.responses.length > 0 && (
                        <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded">
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
                      className="h-7.5 text-[10px] font-extrabold px-3 rounded-lg border-slate-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <span>مشاهده و گفتگو</span>
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Ticket Details & Conversation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedTicket(null);
        }}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] rounded-[24px] p-4 sm:p-5 flex flex-col gap-0 overflow-hidden" dir="rtl">
            <DialogHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 text-right truncate">
                  <Headphones className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">{selectedTicket?.subject}</span>
                </DialogTitle>
                <div className="shrink-0">
                  {selectedTicket && getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 font-mono">
                <span>تاریخ: {selectedTicket?.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
                {selectedTicket && getPriorityBadge(selectedTicket.priority)}
              </div>
            </DialogHeader>
            
            {/* Scrollable Chat / Timeline Area */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 pl-1">
              
              {/* User Original Ticket Bubble */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>پیام شما (شروع تیکت)</span>
                  </div>
                  <span className="text-[9px] text-indigo-400 font-mono">
                    {selectedTicket?.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString('fa-IR') : ''}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-950 dark:text-indigo-100 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket?.message}
                </p>
              </div>
              
              {/* Conversation Responses */}
              {selectedTicket?.responses && selectedTicket.responses.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-muted-foreground">
                    <Reply className="w-3 h-3" />
                    <span>پاسخ‌ها و گفتگو</span>
                  </div>

                  {selectedTicket.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-3 rounded-2xl border text-xs space-y-1 ${
                        response.isAdmin
                          ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/50 mr-2"
                          : "bg-slate-50 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 ml-2"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold">
                          {response.isAdmin ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-800 dark:text-emerald-300 text-[11px]">کارشناس پشتیبانی</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-slate-800 dark:text-slate-200 text-[11px]">{response.userName || "شما"}</span>
                            </>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {new Date(response.createdAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pt-0.5">
                        {response.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Sticky Reply Footer */}
            {selectedTicket?.status !== "closed" ? (
              <form onSubmit={handleReplySubmit} className="pt-2 border-t border-slate-100 dark:border-zinc-800 shrink-0 space-y-2">
                <Textarea
                  id="reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="پاسخ خود را بنویسید..."
                  rows={2}
                  className="text-xs rounded-xl border-slate-200 dark:border-zinc-800 resize-none min-h-[60px] focus-visible:ring-indigo-500/20"
                  data-testid="textarea-reply"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                    data-testid="button-send-reply"
                    size="sm"
                    className="h-8 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Send className="w-3 h-3 ml-1" />
                    {sendReplyMutation.isPending ? "در حال ارسال..." : "ارسال پاسخ"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-center py-2 text-[10px] text-muted-foreground">
                این تیکت بسته شده است و امکان ارسال پاسخ جدید وجود ندارد.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
