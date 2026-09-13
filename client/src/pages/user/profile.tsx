import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Save, LogOut, Crown, Ticket as TicketIcon, Check, RefreshCw, Sparkles, AlertCircle, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createAuthenticatedRequest } from "@/lib/auth";
import { type UserSubscription } from "@shared/schema";
import { Link } from "wouter";

interface UserSubscriptionWithDetails extends UserSubscription {
  subscriptionName?: string | null;
  subscriptionDescription?: string | null;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const [buySubscriptionOpen, setBuySubscriptionOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // User subscription info
  const { data: userSubscription, isLoading: subscriptionLoading, refetch: refetchSubscription, isRefetching } = useQuery<UserSubscriptionWithDetails | null>({
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
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });

  // Real subscriptions list directly from management section
  const { data: availableSubscriptions = [], isLoading: subsLoading } = useQuery<any[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/subscriptions");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (subscriptionId: string | number) => {
      const res = await createAuthenticatedRequest("/api/user-subscriptions/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscriptionId }),
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
        description: "اشتراک با موفقیت فعال / تمدید گردید.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-subscriptions/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setBuySubscriptionOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در خرید اشتراک",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await createAuthenticatedRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("خطا در بروزرسانی پروفایل");
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/me"], updatedUser);
      toast({
        title: "موفقیت",
        description: "پروفایل با موفقیت بروزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی پروفایل",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدها را پر کنید",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "مدیر سیستم";
      case "user_level_1":
        return "کاربر سطح ۱";
      default:
        return "کاربر";
    }
  };

  return (
    <DashboardLayout title="اطلاعات کاربری">
      <div className="space-y-4" data-testid="profile-content">
        {/* Subscription Information Card */}
        {(() => {
          const isActive = userSubscription && userSubscription.status === 'active' && userSubscription.remainingDays > 0;
          const days = userSubscription?.remainingDays || 0;

          return (
            <div className={`relative overflow-hidden rounded-[20px] border ${
              subscriptionLoading
                ? "bg-slate-50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800"
                : isActive
                  ? "bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 border-indigo-500/30 text-white shadow-lg"
                  : "bg-gradient-to-br from-red-950 via-rose-950 to-zinc-950 border-red-500/30 text-white shadow-lg"
            }`}>
              {/* Background abstract glowing shapes */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -z-10" />

              <div className="p-3.5 sm:p-4">
                {subscriptionLoading ? (
                  <div className="flex items-center justify-center py-2 gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="text-xs text-muted-foreground font-medium">در حال بارگذاری وضعیت اشتراک...</span>
                  </div>
                ) : userSubscription ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Right content: icon + subscription name & status text */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto">
                      <div className="p-2 sm:p-2.5 bg-white/10 text-amber-400 rounded-xl shrink-0">
                        <Crown className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-white truncate" data-testid="text-subscription-name">
                            {userSubscription.subscriptionName || 'پلن درگاه پرداخت'}
                          </h4>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                          <button
                            type="button"
                            onClick={() => {
                              refetchSubscription();
                              toast({
                                title: "بروزرسانی",
                                description: "وضعیت اشتراک مجدداً بررسی شد",
                              });
                            }}
                            disabled={isRefetching}
                            className="p-1 text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors mr-1"
                            title="بروزرسانی وضعیت اشتراک"
                            data-testid="button-refresh-subscription"
                          >
                            <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin text-white' : ''}`} />
                          </button>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-indigo-200 mt-0.5 font-bold truncate">
                          {isActive ? 'دسترسی فعال به امکانات پلتفرم و درگاه' : 'اشتراک شما منقضی شده است'}
                        </p>
                      </div>
                    </div>

                    {/* Left content: remaining days badge and buy/renew subscription button */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-white/10 sm:border-t-0">
                      <div className="shrink-0 flex items-center gap-1.5 bg-white/10 border border-white/5 rounded-xl px-2.5 sm:px-3 py-1.5 text-left justify-center">
                        <span className="text-sm sm:text-base font-black text-white leading-none" data-testid="text-remaining-days">
                          {days}
                        </span>
                        <span className="text-[10px] text-indigo-100 font-bold whitespace-nowrap">روز باقی</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setBuySubscriptionOpen(true)}
                        className="h-8 sm:h-8 px-3.5 sm:px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] flex-1 sm:flex-none"
                        data-testid="button-buy-subscription-profile"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-100 shrink-0" />
                        <span className="whitespace-nowrap">خرید اشتراک</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white/10 rounded-xl text-slate-400 shrink-0">
                        <Crown className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">اشتراک یافت نشد</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">برای خرید یا تمدید اشتراک درگاه کلیک کنید</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0">
                      <Button
                        size="sm"
                        onClick={() => setBuySubscriptionOpen(true)}
                        className="flex-1 sm:flex-none h-8 px-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        data-testid="button-buy-subscription-profile-new"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-100 shrink-0" />
                        <span className="whitespace-nowrap">خرید اشتراک</span>
                      </Button>
                      <Link href="/send-ticket">
                        <Button size="sm" variant="ghost" className="text-[11px] text-indigo-200 hover:text-white hover:bg-white/10 h-8 px-2.5 rounded-lg shrink-0">
                          ارسال تیکت
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Profile Information & Picture Card */}
        <Card className="border-slate-100 dark:border-zinc-800/80 rounded-2xl sm:rounded-3xl shadow-xs">
          <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-zinc-800/80">
            <CardTitle className="text-xs sm:text-sm font-black flex items-center gap-2 text-slate-900 dark:text-zinc-100">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>اطلاعات شخصی</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
            {/* Form Fields - Arranged 2 by 2 across all screen sizes */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {/* 1: First Name */}
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-[10px] sm:text-xs font-extrabold text-muted-foreground/80">نام</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="h-8.5 sm:h-9 text-xs rounded-xl px-2.5 sm:px-3"
                    data-testid="input-firstName"
                  />
                </div>

                {/* 2: Last Name */}
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-[10px] sm:text-xs font-extrabold text-muted-foreground/80">نام خانوادگی</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="h-8.5 sm:h-9 text-xs rounded-xl px-2.5 sm:px-3"
                    data-testid="input-lastName"
                  />
                </div>

                {/* 3: Phone */}
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-[10px] sm:text-xs font-extrabold text-muted-foreground/80">شماره تلفن</Label>
                  {user?.role === "admin" ? (
                    <>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-8.5 sm:h-9 text-xs rounded-xl font-mono px-2.5 sm:px-3"
                        data-testid="input-phone"
                      />
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-0.5 truncate">شماره تماس قابل تغییر است</p>
                    </>
                  ) : (
                    <>
                      <Input
                        id="phone"
                        value={user?.phone || ""}
                        disabled
                        className="bg-slate-50 dark:bg-zinc-950/50 text-muted-foreground h-8.5 sm:h-9 text-xs rounded-xl font-mono px-2.5 sm:px-3"
                        data-testid="input-phone-disabled"
                      />
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-0.5 truncate">غیرقابل تغییر</p>
                    </>
                  )}
                </div>

                {/* 4: Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[10px] sm:text-xs font-extrabold text-muted-foreground/80">ایمیل</Label>
                  <Input
                    id="email"
                    value={user?.email || "ثبت نشده"}
                    disabled
                    className="bg-slate-50 dark:bg-zinc-950/50 text-muted-foreground h-8.5 sm:h-9 text-xs rounded-xl px-2.5 sm:px-3"
                    data-testid="input-email-disabled"
                  />
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-0.5 truncate">غیرقابل تغییر</p>
                </div>

                {/* 5: Username */}
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-[10px] sm:text-xs font-extrabold text-muted-foreground/80">نام کاربری</Label>
                  <Input
                    id="username"
                    value={user?.username || ""}
                    disabled
                    className="bg-slate-50 dark:bg-zinc-950/50 text-muted-foreground h-8.5 sm:h-9 text-xs rounded-xl font-mono px-2.5 sm:px-3"
                    data-testid="input-username-disabled"
                  />
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-0.5 truncate">شناسه کاربری یکتا</p>
                </div>

                {/* 6: Role */}
                <div className="space-y-1">
                  <Label htmlFor="role" className="text-[10px] sm:text-xs font-extrabold text-muted-foreground/80">نقش کاربری</Label>
                  <Input
                    id="role"
                    value={getRoleName(user?.role || "")}
                    disabled
                    className="bg-slate-50 dark:bg-zinc-950/50 text-muted-foreground h-8.5 sm:h-9 text-xs rounded-xl px-2.5 sm:px-3"
                    data-testid="input-role-disabled"
                  />
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-0.5 truncate">سطح دسترسی شما</p>
                </div>
              </div>

              <div className="pt-2 flex justify-start">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                  size="sm"
                  className="w-full sm:w-auto min-w-[140px] h-9 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 ml-1.5" />
                  {updateProfileMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Logout Button at the end of the page */}
        <div className="flex justify-start sm:justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={logout}
            className="w-full sm:w-auto h-9 text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/30 rounded-xl px-4 flex items-center justify-center gap-2 active:scale-97 transition-all cursor-pointer"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 rotate-180" />
            <span>خروج از حساب کاربری</span>
          </Button>
        </div>

        {/* Buy / Upgrade Subscription Dialog */}
        <Dialog open={buySubscriptionOpen} onOpenChange={setBuySubscriptionOpen}>
          <DialogContent className="w-[calc(100%-24px)] sm:w-full sm:max-w-lg p-3.5 sm:p-5 font-sans rounded-2xl sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto mx-auto border border-slate-200 dark:border-zinc-800 shadow-2xl" dir="rtl" data-testid="dialog-buy-subscription-profile">
            <DialogHeader className="text-right pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-zinc-800 pl-6">
              <DialogTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span>خرید و تمدید اشتراک درگاه</span>
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                پلن‌های فعال سیستم از بخش مدیریت اشتراک‌ها. برای فعال‌سازی یا تمدید اشتراک، پلن مورد نظر خود را انتخاب نمایید.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 sm:py-2">
              {/* Current Status Overview */}
              {userSubscription && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">اشتراک فعلی شما:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm truncate block">{userSubscription.subscriptionName || "پلن فعال"}</span>
                  </div>
                  <div className="text-left font-mono shrink-0 bg-white/40 dark:bg-zinc-800/40 px-2 py-1 rounded-lg border border-indigo-500/10">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">{userSubscription.remainingDays ?? 0}</span>
                    <span className="text-[10px] text-slate-500 mr-1">روز باقی</span>
                  </div>
                </div>
              )}

              {/* Subscription Plans List from Admin Management */}
              {subsLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                  در حال دریافت پلن‌های اشتراک از سیستم مدیریت...
                </div>
              ) : availableSubscriptions.length === 0 ? (
                <div className="p-5 sm:p-6 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800 text-center space-y-3">
                  <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mx-auto" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">پلن فعالی یافت نشد</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    هنوز پلن اشتراک فعالی در بخش مدیریت ثبت نشده است. لطفاً جهت فعال‌سازی اشتراک با پشتیبانی ارتباط برقرار نمایید.
                  </p>
                  <Link href="/tickets">
                    <Button size="sm" className="h-8.5 px-4 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                      <TicketIcon className="w-3.5 h-3.5" />
                      ارسال تیکت به پشتیبانی
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {availableSubscriptions.map((sub: any) => {
                    const priceRaw = sub.priceAfterDiscount || sub.priceBeforeDiscount || sub.price || "0";
                    const priceNum = parseFloat(priceRaw);
                    const originalPriceNum = sub.priceBeforeDiscount ? parseFloat(sub.priceBeforeDiscount) : 0;
                    const hasDiscount = originalPriceNum > 0 && originalPriceNum > priceNum;
                    const isMonthly = sub.duration === "monthly";
                    const features = Array.isArray(sub.features) ? sub.features : [];

                    return (
                      <div
                        key={sub.id}
                        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-amber-500/40 transition-all space-y-2.5 sm:space-y-3 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
                              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                              <span className="truncate">{sub.name}</span>
                            </h4>
                            {sub.description && (
                              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                                {sub.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 whitespace-nowrap">
                            {isMonthly ? "۳۰ روزه" : "۳۶۵ روزه"}
                          </Badge>
                        </div>

                        {features.length > 0 && (
                          <ul className="space-y-1 text-[10px] sm:text-[11px] text-slate-600 dark:text-zinc-400 py-0.5">
                            {features.map((feat: string, fIdx: number) => (
                              <li key={fIdx} className="flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="truncate sm:whitespace-normal">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
                          <div className="text-left shrink-0">
                            {hasDiscount && (
                              <div className="text-[9px] sm:text-[10px] text-slate-400 line-through font-mono">
                                {originalPriceNum.toLocaleString("fa-IR")} تومان
                              </div>
                            )}
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 font-mono">
                                {priceNum === 0 ? "رایگان" : priceNum.toLocaleString("fa-IR")}
                              </span>
                              {priceNum > 0 && <span className="text-[9px] sm:text-[10px] text-slate-400">تومان</span>}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => subscribeMutation.mutate(sub.id)}
                            disabled={subscribeMutation.isPending}
                            className="h-8 sm:h-8.5 px-3 sm:px-4 text-[11px] sm:text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 transition-all"
                            data-testid={`button-subscribe-plan-${sub.id}`}
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>{subscribeMutation.isPending ? "در حال صدور فاکتور..." : "خرید و فعال‌سازی"}</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-zinc-800 gap-2">
              <Link href="/tickets" onClick={() => setBuySubscriptionOpen(false)} className="flex-1 sm:flex-none">
                <Button variant="ghost" size="sm" className="w-full sm:w-auto h-8 sm:h-8.5 px-2.5 text-[11px] sm:text-xs text-slate-500 hover:text-indigo-600 gap-1 rounded-xl">
                  <TicketIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>پشتیبانی و تیکت</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setBuySubscriptionOpen(false)} className="h-8 sm:h-8.5 px-3.5 sm:px-4 text-[11px] sm:text-xs rounded-xl flex-1 sm:flex-none">
                انصراف
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}