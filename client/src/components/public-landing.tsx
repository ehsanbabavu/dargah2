import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Home from "@/pages/home";
import { LogIn, UserPlus, Store } from "lucide-react";
import { GuestChatWidget } from "@/components/guest-chat-widget";

interface PublicLandingConfig {
  mode: "default" | "custom";
  title?: string;
  hasUploadedZip: boolean;
  showQuickNav: boolean;
  showChatWidget?: boolean;
  entryUrl: string;
  uploadedAt: string | null;
}

const STORAGE_KEY = "landing_public_config_cache";

function getCachedConfig(): PublicLandingConfig | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.mode === "default" || parsed.mode === "custom")) {
        if (parsed.mode === "custom" && (!parsed.entryUrl || parsed.entryUrl.includes("preview_template=default") || (!parsed.entryUrl.startsWith("/landing-templates/") && !parsed.entryUrl.startsWith("/custom-landing/")))) {
          localStorage.removeItem(STORAGE_KEY);
          return undefined;
        }
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}

export function PublicLanding() {
  const [iframeError, setIframeError] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && typeof e.data === "object") {
        if (e.data.type === "NAVIGATE" && typeof e.data.url === "string") {
          setLocation(e.data.url);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setLocation]);

  const previewParam = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("preview_template")
    : null;

  const { data: config, isLoading } = useQuery<PublicLandingConfig>({
    queryKey: ["/api/landing/public-config", previewParam],
    queryFn: async () => {
      const url = previewParam
        ? `/api/landing/public-config?preview_template=${encodeURIComponent(previewParam)}`
        : "/api/landing/public-config";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load landing config");
      const data: PublicLandingConfig = await res.json();
      if (!previewParam) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
      }
      return data;
    },
    initialData: previewParam ? undefined : getCachedConfig,
    staleTime: previewParam ? 0 : 30000,
    retry: 1,
  });

  // If initial load without cached config yet, show a seamless minimal placeholder to avoid flashing the default template
  if (!config && isLoading) {
    return (
      <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center gap-3" dir="rtl">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">در حال بارگذاری صفحه...</span>
      </div>
    );
  }

  const isExplicitDefault = previewParam === "default";
  const isExplicitCustom = Boolean(previewParam && previewParam !== "default");

  // Determine if a custom landing template is active
  const isCustomActive =
    !isExplicitDefault &&
    !iframeError &&
    (isExplicitCustom ||
      (config?.mode === "custom" &&
        Boolean(config?.entryUrl) &&
        !config?.entryUrl?.includes("preview_template=default") &&
        (config?.entryUrl?.startsWith("/landing-templates/") || config?.entryUrl?.startsWith("/custom-landing/"))));

  if (isCustomActive && config && config.entryUrl) {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const iframeSrc = config.entryUrl + (hash || "");

    return (
      <div className="relative w-full min-h-screen bg-background flex flex-col" dir="rtl">
        {/* Optional Top Floating Navigation Bar */}
        {config.showQuickNav && (
          <header className="fixed top-0 right-0 left-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-foreground">
                {config.title || "سامانه خدمات آنلاین"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-xs h-8">
                  فروشگاه
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>ورود</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ثبت‌نام</span>
                </Button>
              </Link>
            </div>
          </header>
        )}

        {/* Sandbox Iframe for 100% style and script isolation */}
        <div className={config.showQuickNav ? "flex-1 w-full h-[calc(100vh-53px)] min-h-[calc(100vh-53px)] relative overflow-hidden" : "w-full h-screen min-h-screen relative overflow-hidden"}>
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title={config.title || "Landing Page"}
            className="w-full h-full border-0 block"
            style={{ width: "100%", height: "100%" }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation allow-top-navigation-by-user-activation"
            onError={() => setIframeError(true)}
          />
        </div>

        {/* Floating 24/7 Chat & Bot Widget */}
        {config.showChatWidget !== false && <GuestChatWidget />}
      </div>
    );
  }

  // Otherwise render default template
  return <Home />;
}

export default PublicLanding;


