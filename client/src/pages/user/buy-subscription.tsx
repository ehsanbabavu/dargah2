import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Crown, Check, Clock, Ticket as TicketIcon, Sparkles, RefreshCw, AlertCircle, ShieldCheck, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createAuthenticatedRequest } from "@/lib/auth";
import { Link } from "wouter";
import type { UserSubscription } from "@shared/schema";

interface UserSubscriptionWithDetails extends UserSubscription {
  subscriptionName?: string | null;
  subscriptionDescription?: string | null;
}

export default function BuySubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPlanForDomain, setSelectedPlanForDomain] = useState<any | null>(null);
  const [websiteDomainInput, setWebsiteDomainInput] = useState("");
  const [domainModalOpen, setDomainModalOpen] = useState(false);

  // User's gateway info (to prefill domain)
  const { data: gateway } = useQuery<any>({
    queryKey: ["/api/blupal/gateway"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/blupal/gateway");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  // Current user subscription
  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscriptionWithDetails | null>({
    queryKey: ["/api/user-subscriptions/me"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const res = await createAuthenticatedRequest("/api/user-subscriptions/me");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  // Active plans from admin management
  const { data: subscriptions = [], isLoading: subsLoading } = useQuery<any[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/subscriptions");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5000,
    refetchOnMount: "always",
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ subscriptionId, domain }: { subscriptionId: string | number; domain?: string }) => {
      const res = await createAuthenticatedRequest("/api/user-subscriptions/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscriptionId, domain }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "خطا در خرید و فعال‌سازی اشتراک");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.requiresPayment && data?.paymentUrl) {
        toast({
          title: "صدور فاکتور پرداخت",
          description: "فاکتور صادر شد. در حال انتقال به درگاه پرداخت کارت به کارت...",
        });
        window.location.href = data.paymentUrl;
        return;
      }
      toast({
        title: "موفقیت‌آمیز",
        description: "اشتراک با موفقیت فعال و تمدید گردید.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-subscriptions/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blupal/gateway"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در فرآیند فعال‌سازی اشتراک",
        variant: "destructive",
      });
    },
  });

  const handleOpenDomainModal = (sub: any) => {
    setSelectedPlanForDomain(sub);
    setWebsiteDomainInput(gateway?.wpAuthorizedDomain || "");
    setDomainModalOpen(true);
  };

  const handleConfirmDomainAndSubscribe = () => {
    if (!selectedPlanForDomain) return;
    const domainToSubmit = websiteDomainInput.trim();
    if (!domainToSubmit) {
      toast({
        title: "ورود نام یا آدرس وب‌سایت الزامی است",
        description: "لطفاً آدرس یا نام سایت مورد نظر جهت فعال‌سازی درگاه را وارد نمایید.",
        variant: "destructive",
      });
      return;
    }
    setDomainModalOpen(false);
    subscribeMutation.mutate({
      subscriptionId: selectedPlanForDomain.id,
      domain: domainToSubmit,
    });
  };

  const isActive = userSubscription && userSubscription.status === "active" && userSubscription.remainingDays > 0;
  const days = userSubscription?.remainingDays || 0;

  return (
    <DashboardLayout title="خرید و تمدید اشتراک">
      <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-10" data-testid="page-buy-subscription">
        {/* Header Hero Banner - Mobile Responsive */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 border border-indigo-500/20 text-white p-4 sm:p-6 shadow-xl">
          <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -z-10" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 sm:space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>پلن‌های دسترسی و درگاه پرداخت</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white">
                خرید و تمدید اشتراک سامانه
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200 max-w-xl leading-relaxed">
                با تهیه یا تمدید اشتراک، دسترسی کامل به قابلیت‌های درگاه، مدیریت محصولات و تسویه‌حساب‌ها را فعال کنید.
              </p>
            </div>

            {/* Current Subscription Status Badge */}
            <div className="shrink-0 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between sm:justify-start gap-4">
              <div>
                <span className="text-[10px] text-indigo-200 block font-bold">وضعیت فعلی:</span>
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {subscriptionLoading ? "در حال بررسی..." : userSubscription?.subscriptionName || (isActive ? "پلن فعال" : "بدون اشتراک فعال")}
                </span>
              </div>
              <div className="text-left bg-white/15 px-3 py-1.5 rounded-xl border border-white/10">
                <span className="text-base sm:text-xl font-black text-amber-300 leading-none">
                  {days}
                </span>
                <span className="text-[10px] text-indigo-100 font-bold block">روز باقی</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plans List */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>پلن‌های فعال سیستم</span>
            </h2>
            <Link href="/send-ticket">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5">
                <TicketIcon className="w-3.5 h-3.5" />
                <span>پشتیبانی و تیکت</span>
              </Button>
            </Link>
          </div>

          {subsLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
              در حال دریافت پلن‌های اشتراک...
            </div>
          ) : subscriptions.length === 0 ? (
            <Card className="border-border text-center py-10 px-4">
              <CardContent className="space-y-4 max-w-md mx-auto">
                <Crown className="w-12 h-12 text-amber-400 mx-auto" />
                <CardTitle className="text-base">پلن فعالی یافت نشد</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  در حال حاضر پلن اشتراک فعالی توسط مدیریت تنظیم نشده است. جهت فعال‌سازی می‌توانید با پشتیبانی تماس حاصل فرمایید.
                </CardDescription>
                <Link href="/send-ticket">
                  <Button size="sm" className="h-9 px-4 text-xs font-bold gap-2">
                    <TicketIcon className="w-4 h-4" />
                    ارسال تیکت به پشتیبانی
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
              {subscriptions.map((sub: any) => {
                const priceRaw = sub.priceAfterDiscount || sub.priceBeforeDiscount || sub.price || "0";
                const priceNum = parseFloat(priceRaw);
                const originalPriceNum = sub.priceBeforeDiscount ? parseFloat(sub.priceBeforeDiscount) : 0;
                const hasDiscount = originalPriceNum > 0 && originalPriceNum > priceNum;
                const isMonthly = sub.duration === "monthly";
                const features: string[] = Array.isArray(sub.features) 
                  ? sub.features 
                  : typeof sub.features === "string" 
                    ? (() => { try { return JSON.parse(sub.features); } catch { return [sub.features]; } })() 
                    : [];

                return (
                  <div
                    key={sub.id}
                    className="relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border bg-card hover:border-amber-500/50 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="space-y-3 sm:space-y-4">
                      {/* Top Row: Title + Duration */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-extrabold text-foreground group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="truncate">{sub.name}</span>
                          </h3>
                          {sub.description && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                              {sub.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 whitespace-nowrap"
                        >
                          {isMonthly ? "۳۰ روزه" : "۳۶۵ روزه"}
                        </Badge>
                      </div>

                      {/* Features List */}
                      {features.length > 0 && (
                        <div className="pt-2 border-t border-border/60">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">امکانات پلن:</span>
                          <ul className="space-y-1.5 text-xs text-foreground/90">
                            {features.map((feat: string, fIdx: number) => (
                              <li key={fIdx} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                                <span className="text-xs">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Price & Buy Button */}
                    <div className="pt-4 mt-4 border-t border-border/80 flex flex-col gap-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">هزینه اشتراک:</span>
                        <div className="text-left">
                          {hasDiscount && (
                            <div className="text-[11px] text-muted-foreground line-through font-mono">
                              {originalPriceNum.toLocaleString("fa-IR")} تومان
                            </div>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg sm:text-xl font-black text-foreground font-mono">
                              {priceNum === 0 ? "رایگان" : priceNum.toLocaleString("fa-IR")}
                            </span>
                            {priceNum > 0 && <span className="text-xs text-muted-foreground">تومان</span>}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleOpenDomainModal(sub)}
                        disabled={subscribeMutation.isPending}
                        className="w-full h-10 sm:h-11 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                        data-testid={`button-subscribe-page-${sub.id}`}
                      >
                        <Crown className="w-4 h-4" />
                        <span>{subscribeMutation.isPending ? "در حال صدور فاکتور و انتقال به درگاه..." : "خرید و فعال‌سازی اشتراک"}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info & Guarantee Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">فعال‌سازی آنی و تضمین بازگشت وجه</p>
              <p className="text-[11px] mt-0.5">پس از خرید، اشتراک بلافاصله فعال شده و روزهای اشتراک به حساب شما منظور می‌گردد.</p>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm" className="h-8.5 text-xs font-bold shrink-0 w-full sm:w-auto">
              بازگشت به پروفایل
            </Button>
          </Link>
        </div>
      </div>

      {/* Popup Dialog for Website / Domain Entry */}
      <Dialog open={domainModalOpen} onOpenChange={setDomainModalOpen}>
        <DialogContent className="w-[calc(100%-24px)] sm:w-full sm:max-w-md p-4 sm:p-6 font-sans rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl" dir="rtl" data-testid="dialog-subscription-domain-activation">
          <DialogHeader className="text-right pb-3 border-b border-slate-100 dark:border-zinc-800">
            <DialogTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <span>نام و دامنه وب‌سایت جهت فعال‌سازی</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              لطفاً نام یا دامنه اصلی وب‌سایت خود را که قصد استفاده از درگاه روی آن را دارید وارد نمایید. پس از پرداخت موفق، این نام در تنظیمات درگاه به عنوان دامنه مجاز ثبت خواهد شد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-right">
            <div className="space-y-1.5">
              <Label htmlFor="domain-input" className="text-xs font-bold text-slate-800 dark:text-zinc-200 block text-right">
                نام یا آدرس وب‌سایت (دامنه مجاز):
              </Label>
              <div className="relative flex items-center" dir="ltr">
                <Globe className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  id="domain-input"
                  type="text"
                  placeholder="مثال: mydomain.com"
                  value={websiteDomainInput}
                  onChange={(e) => setWebsiteDomainInput(e.target.value)}
                  className="text-xs sm:text-sm h-11 pl-9 pr-3 rounded-xl font-mono text-left border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500"
                  dir="ltr"
                  autoFocus
                  data-testid="input-subscription-domain"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 pt-0.5">
                می‌توانید دامنه را همراه با پسوند (مانند myshop.ir) یا آدرس کامل سایت وارد کنید.
              </p>
            </div>

            {selectedPlanForDomain && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-bold">
                  <span>پلن انتخابی:</span>
                  <span>{selectedPlanForDomain.name}</span>
                </div>
                <div className="flex items-center justify-between text-amber-800/80 dark:text-amber-300/80 text-[11px]">
                  <span>مبلغ پرداختی:</span>
                  <span className="font-mono font-bold">
                    {Number(selectedPlanForDomain.priceAfterDiscount || selectedPlanForDomain.priceBeforeDiscount || selectedPlanForDomain.price || 0).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDomainModalOpen(false)}
              className="h-10 px-4 text-xs font-bold rounded-xl border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDomainAndSubscribe}
              disabled={subscribeMutation.isPending}
              className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md gap-1.5 cursor-pointer"
              data-testid="button-confirm-subscription-domain"
            >
              {subscribeMutation.isPending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال صدور فاکتور...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تایید و صدور فاکتور</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
