import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  ArrowRight,
  Search,
  AlertTriangle,
  FileQuestion,
} from "lucide-react";
import { GuestChatWidget } from "@/components/guest-chat-widget";

export interface NotFoundConfigResponse {
  mode: "default" | "custom";
  title?: string;
  showHomeButton: boolean;
  homeButtonText: string;
  showSearchBox: boolean;
  showChatWidget: boolean;
  customTitle: string;
  customMessage: string;
  autoRedirectSeconds: number;
  entryUrl?: string;
  customHtml?: string;
}

export default function NotFound() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [iframeError, setIframeError] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const previewParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("preview_template")
      : null;

  const { data: config, isLoading } = useQuery<NotFoundConfigResponse>({
    queryKey: ["/api/public/not-found/config", previewParam],
    queryFn: async () => {
      const url = previewParam
        ? `/api/public/not-found/config?preview_template=${encodeURIComponent(previewParam)}`
        : "/api/public/not-found/config";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load 404 config");
      return res.json();
    },
    staleTime: previewParam ? 0 : 30000,
  });

  // Auto redirect logic if configured
  useEffect(() => {
    if (config?.autoRedirectSeconds && config.autoRedirectSeconds > 0) {
      setCountdown(config.autoRedirectSeconds);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            setLocation("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [config?.autoRedirectSeconds, setLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    if (q.includes("محصول") || q.includes("فروشگاه") || q.includes("خرید")) {
      setLocation("/products");
    } else if (q.includes("ورود") || q.includes("لاگین")) {
      setLocation("/login");
    } else if (q.includes("پشتیبانی") || q.includes("تیکت")) {
      setLocation("/tickets");
    } else if (q.includes("بلاگ") || q.includes("مقاله") || q.includes("اخبار")) {
      setLocation("/blog");
    } else {
      setLocation(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isCustomActive =
    config?.mode === "custom" && (config?.entryUrl || config?.customHtml) && !iframeError;

  // Custom 404 Template Render
  if (isCustomActive && config) {
    return (
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-background flex flex-col" dir="rtl">
        {/* Optional Floating Top Nav / Return Home Button */}
        {config.showHomeButton !== false && (
          <div className="shrink-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 py-2 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-muted-foreground">خطای ۴۰۴ - صفحه یافت نشد</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/")}
              className="h-7 text-xs gap-1.5 font-bold"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{config.homeButtonText || "بازگشت به صفحه اصلی"}</span>
            </Button>
          </div>
        )}

        {/* Custom Template Content */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          {config.entryUrl ? (
            <iframe
              src={config.entryUrl}
              title={config.title || "404 Page"}
              className="w-full h-full border-0 block"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              onError={() => setIframeError(true)}
            />
          ) : (
            <div
              className="w-full h-full p-4 overflow-auto"
              dangerouslySetInnerHTML={{ __html: config.customHtml || "" }}
            />
          )}
        </div>

        {/* Optional 24/7 Chat Widget */}
        {config.showChatWidget !== false && <GuestChatWidget />}
      </div>
    );
  }

  // Default Modern 404 Screen
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between bg-radial-[at_50%_0%] from-primary/5 via-background to-background px-4 py-8 text-foreground select-none"
      dir="rtl"
    >
      {/* Main 404 Centerpiece */}
      <main className="w-full max-w-2xl flex flex-col items-center text-center space-y-6 my-auto py-6">
        {/* Animated Visual Number */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-6 bg-gradient-to-r from-primary/20 via-sky-500/20 to-purple-500/20 rounded-full blur-3xl opacity-60 pointer-events-none" />
          
          <div className="relative text-[96px] sm:text-[130px] font-black leading-none tracking-tighter bg-gradient-to-br from-primary via-indigo-600 to-sky-500 bg-clip-text text-transparent select-none drop-shadow-xs">
            404
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {config?.customTitle || "صفحه مورد نظر پیدا نشد!"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {config?.customMessage ||
              "متأسفانه آدرسی که وارد کرده‌اید وجود ندارد، حذف شده یا نام آن تغییر یافته است."}
          </p>
        </div>

        {/* Search Box (If Enabled) */}
        {config?.showSearchBox !== false && (
          <form onSubmit={handleSearchSubmit} className="w-full max-w-md relative flex items-center">
            <Input
              type="text"
              placeholder="جستجو در بخش‌های سایت (مثلاً: فروشگاه، تیکت، وبلاگ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 text-xs pl-10 pr-4 rounded-xl border-border/80 bg-card/60 backdrop-blur-xs shadow-xs focus-visible:ring-primary"
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="absolute left-1.5 h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Search className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* Primary Action Button */}
        {config?.showHomeButton !== false && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link href="/">
              <Button
                size="lg"
                className="h-10 px-6 rounded-xl font-bold text-xs gap-2 bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/95 transition-all"
              >
                <Home className="w-4 h-4" />
                <span>{config?.homeButtonText || "بازگشت به صفحه اصلی"}</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Countdown notice if auto redirecting */}
        {countdown !== null && countdown > 0 && (
          <p className="text-[11px] text-muted-foreground/80 animate-pulse">
            انتقال خودکار به صفحه اصلی تا {countdown} ثانیه دیگر...
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center pt-4 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground">
          کد وضعیت خطا: HTTP 404 Not Found • کلیه حقوق محفوظ است
        </p>
      </footer>

      {/* Floating 24/7 Chat & Bot Widget */}
      {config?.showChatWidget !== false && <GuestChatWidget />}
    </div>
  );
}
