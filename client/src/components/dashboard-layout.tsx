import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Bell, User, LogOut, Menu, Home, ShoppingBag, Wallet, MessageSquare, Smartphone, Zap, AlertCircle, Settings, Megaphone, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();

  // Get notifications count for level 1 users
  const { data: notificationsData } = useQuery<{ newOrdersCount: number }>({
    queryKey: ["/api/notifications/orders"],
    enabled: !!user && user.role === "user_level_1",
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const isLevel1 = user?.role === "user_level_1";

  const isTabActive = (paths: string[]) => {
    return paths.some(path => {
      if (path === "/") {
        return location === "/" || location === "/dashboard";
      }
      return location === path || location.startsWith(path + "/");
    });
  };

  interface NavItem {
    label: string;
    icon: any;
    paths: string[];
    onClick: () => void;
    badge?: number;
  }

  const { data: unreadAnnouncementsData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/announcements/unread-count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/announcements/unread-count');
      return response.json();
    },
    enabled: !!user && user.role === "user_level_1",
    refetchInterval: 15000,
  });
  const unreadAnnouncements = unreadAnnouncementsData?.unreadCount ?? 0;

  // Subscription remaining days query
  const { data: userSubscription } = useQuery<{
    status: string;
    remainingDays: number;
    subscriptionName?: string;
  } | null>({
    queryKey: ['/api/user-subscriptions/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-subscriptions/me');
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user && user.role === "user_level_1",
    refetchInterval: 15000,
  });

  const navItems: NavItem[] = [
    {
      label: "اطلاعیه‌ها",
      icon: Megaphone,
      paths: ["/announcements", "/financial"],
      onClick: () => setLocation("/announcements"),
      badge: unreadAnnouncements,
    },
    {
      label: "تنظیمات",
      icon: Settings,
      paths: ["/level1/settings", "/settings"],
      onClick: () => setLocation("/level1/settings"),
    },
    {
      label: "پیشخوان",
      icon: Home,
      paths: ["/"],
      onClick: () => setLocation("/"),
    },
    {
      label: "تیکت‌ها",
      icon: MessageSquare,
      paths: ["/my-tickets", "/send-ticket"],
      onClick: () => setLocation("/my-tickets"),
    },
    {
      label: "پروفایل",
      icon: User,
      paths: ["/profile", "/bank-card", "/sub-users", "/manage-faqs", "/add-faq"],
      onClick: () => setLocation("/profile"),
    },
  ];

  const mobileScreenMarkup = (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground overflow-hidden font-sans relative" dir="rtl">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/profile")}>
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.profilePicture || undefined} />
            <AvatarFallback><User className="h-3.5 w-3.5" /></AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[120px]">
            {user?.firstName} {user?.lastName}
          </span>
        </div>

        {isLevel1 && userSubscription && (
          <button
            type="button"
            onClick={() => setLocation("/buy-subscription")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all shadow-xs cursor-pointer",
              userSubscription.status === "active" && userSubscription.remainingDays > 7
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800"
                : userSubscription.status === "active" && userSubscription.remainingDays > 0
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800 animate-pulse"
                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800"
            )}
            title="مشاهده و تمدید روزهای باقیمانده اعتبار اشتراک"
            data-testid="badge-mobile-subscription-remaining-days"
          >
            <Crown className="w-3 h-3 text-amber-500" />
            <span>اعتبار: <b>{userSubscription.remainingDays ?? 0} روز</b></span>
          </button>
        )}
      </header>

      {/* Scrollable Mobile Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-28 custom-scrollbar bg-slate-50/50 dark:bg-zinc-950/50">
        <div className="fade-in">
          {children}
        </div>
      </main>

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-4 left-4 right-4 z-40">
        <nav className="flex items-center justify-around py-2.5 px-3 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border border-slate-100/50 dark:border-zinc-800/50 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.4)]">
          {navItems.map((item, index) => {
            const active = isTabActive(item.paths);
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300"
              >
                {/* Active highlight pill */}
                {active && (
                  <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl -z-10 animate-fade-in" />
                )}
                
                <div className="relative">
                  <item.icon className={`h-5 w-5 transition-all duration-300 ${active ? "text-indigo-600 dark:text-indigo-400 scale-110" : "text-slate-400 dark:text-zinc-500"}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-zinc-900">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium transition-all duration-300 ${active ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-400 dark:text-zinc-500"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* For level 1 users on mobile: Render the exact dedicated mobile app UI with floating bottom navigation */}
      {isLevel1 && (
        <div className="block md:hidden min-h-screen bg-slate-50 dark:bg-zinc-950">
          {mobileScreenMarkup}
        </div>
      )}

      {/* Desktop view (for all users including level 1) & Mobile view (for non-level 1 users) */}
      <div className={cn("w-full h-screen", isLevel1 ? "hidden md:block" : "block")}>
        <SidebarProvider>
          <div className="flex h-screen bg-background w-full" data-testid="dashboard-layout">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
              <AppSidebar />
            </div>

            {/* Mobile Sidebar (Sheet/Drawer for non-level 1 users) */}
            {!isLevel1 && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="right" className="p-0 w-64">
                  <AppSidebar />
                </SheetContent>
              </Sheet>
            )}
            
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Bar */}
              <header className="bg-card border-b border-border p-4 flex items-center justify-between" data-testid="header-topbar">
                {/* Mobile: Menu button on right (only for non-level 1 users) */}
                {!isLevel1 && (
                  <div className="md:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(true)}
                      data-testid="button-mobile-menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                
                {/* Desktop: Page Title */}
                <div className="hidden md:block flex-1">
                  <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">{title}</h1>
                </div>
                
                <div className="flex items-center space-x-4 space-x-reverse flex-1 justify-end">
                  {/* Desktop Subscription Remaining Days Badge */}
                  {isLevel1 && userSubscription && (
                    <button
                      type="button"
                      onClick={() => setLocation("/buy-subscription")}
                      className={cn(
                        "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs hover:scale-105 cursor-pointer ml-2",
                        userSubscription.status === "active" && userSubscription.remainingDays > 7
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800"
                          : userSubscription.status === "active" && userSubscription.remainingDays > 0
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800 animate-pulse"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800"
                      )}
                      title="مشاهده و تمدید روزهای باقیمانده اعتبار اشتراک"
                      data-testid="badge-header-subscription-remaining-days"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>اعتبار اشتراک: <b>{userSubscription.remainingDays ?? 0} روز</b></span>
                    </button>
                  )}

                  {/* User Info - Next to logout */}
                  <div 
                    className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:opacity-80 transition-opacity" 
                    onClick={() => setLocation("/profile")}
                    title="مشاهده پروفایل کاربری"
                    data-testid="section-user-info"
                  >
                    <Avatar data-testid="img-user-avatar">
                      <AvatarImage src={user?.profilePicture || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground whitespace-nowrap" data-testid="text-user-name">
                        {user?.firstName} {user?.lastName}
                      </p>
                    </div>
                  </div>
                  
                  {/* Logout Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={logout}
                          className="text-muted-foreground hover:text-foreground"
                          data-testid="button-logout"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>خروج</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </header>
              
              {/* Main Content */}
              <main className="flex-1 p-6 overflow-y-auto custom-scrollbar" data-testid="main-content">
                <div className="fade-in">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </>
  );
}
