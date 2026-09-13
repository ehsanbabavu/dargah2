import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Crown, 
  Send, 
  Ticket, 
  User, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle,
  ArrowLeft
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ExpiredSubscriptionCardProps {
  title?: string;
  description?: string;
  currentPlanName?: string;
}

export function ExpiredSubscriptionCard({
  title = "اشتراک شما به پایان رسیده است",
  description,
}: ExpiredSubscriptionCardProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  const handleNavigateToBuy = () => {
    // Direct and reliable navigation to the subscription renewal page
    setLocation("/buy-subscription");
  };

  const handleRefreshStatus = async () => {
    setIsChecking(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/user-subscriptions/me"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
        queryClient.refetchQueries({ queryKey: ["/api/user-subscriptions/me"] }),
      ]);
      toast({
        title: "بررسی وضعیت اشتراک",
        description: "اطلاعات اشتراک شما مجدداً بررسی و به‌روزرسانی شد.",
      });
    } catch {
      toast({
        title: "خطا در بررسی",
        description: "امکان بررسی وضعیت وجود نداشت. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsChecking(false), 600);
    }
  };

  return (
    <div className="w-full max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6 text-right" dir="rtl">
      <Card className="border-amber-200/80 dark:border-amber-900/60 bg-white/95 dark:bg-zinc-900/95 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
        {/* Top Decorative Amber Ribbon */}
        <div className="h-1.5 sm:h-2 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />

        <CardContent className="p-4 sm:p-7 md:p-5 lg:p-6 space-y-4 md:space-y-3.5">
          {/* Header & Info: Stacked on mobile, horizontal two-column on desktop to drastically reduce height */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 md:gap-6 text-center md:text-right">
            <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 flex-1">
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200/70 dark:from-amber-950/70 dark:to-amber-900/40 border border-amber-300/80 dark:border-amber-700/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-inner">
                  <Clock className="w-7 h-7 sm:w-8 sm:h-8 md:w-7 md:h-7 animate-pulse" />
                </div>
                <span className="absolute -bottom-1 -left-1 flex h-4 w-4 sm:h-5 sm:w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-amber-500 border-2 border-white dark:border-zinc-900 items-center justify-center">
                    <AlertTriangle className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                  </span>
                </span>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span>وضعیت: منقضی شده</span>
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                  {title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  {description || "جهت استفاده از خدمات، دسترسی به تنظیمات درگاه و ثبت و پیگیری سفارش‌ها، لطفاً اشتراک خود را تمدید فرمایید."}
                </p>
              </div>
            </div>

            {/* Reassurance Info Box - Compact side banner on desktop */}
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-2.5 sm:p-3 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 md:max-w-xs shrink-0 text-right">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block text-[11px]">اطلاعات شما کاملاً محفوظ است</span>
                <span className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                  تنظیمات درگاه و سفارش‌ها ذخیره شده و بلافاصله پس از تمدید مجدداً فعال می‌شوند.
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: 4 columns in one compact row on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 pt-1">
            <Button
              type="button"
              onClick={handleNavigateToBuy}
              className="h-10 sm:h-11 md:h-10 text-xs sm:text-sm font-black rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-100 group-hover:rotate-12 transition-transform" />
              <span>خرید و تمدید اشتراک</span>
              <ArrowLeft className="w-3.5 h-3.5 mr-0.5 transition-transform group-hover:-translate-x-1" />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/profile")}
              className="h-10 sm:h-11 md:h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>پروفایل کاربری</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/send-ticket")}
              className="h-10 sm:h-11 md:h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>ارسال تیکت پشتیبانی</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/my-tickets")}
              className="h-10 sm:h-11 md:h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>تیکت‌های من</span>
            </Button>
          </div>

          {/* Quick status refresh */}
          <div className="flex items-center justify-center pt-1 border-t border-slate-100 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={isChecking}
              className="text-[11px] text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 inline-flex items-center gap-1.5 py-0.5 px-2 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-amber-500' : ''}`} />
              <span>اشتراک خود را تمدید کرده‌اید؟ بررسی مجدد وضعیت</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
