import { 
  Calendar, Home, Inbox, Search, Settings, MessageSquare, MessageCircle, 
  Ticket, Package, DollarSign, Wallet, Users, Crown, Truck, Receipt, 
  CreditCard, History, Database, List, Plus, FolderTree, ShoppingCart, 
  MapPin, User, Send, Store, ChevronDown, Mail, FileText, Tag, PenSquare,
  LayoutTemplate, Lock, ShieldCheck, Megaphone, Bell, Bot
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { 
  Sidebar, SidebarContent, SidebarProvider, SidebarTrigger, useSidebar, 
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupContent, SidebarGroupLabel 
} from "./ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function AppSidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const sidebar = useSidebar();

  const isActive = (path: string) => location === path;

  const handleNavigate = (path: string) => {
    setLocation(path);
    if (sidebar) sidebar.setOpenMobile(false);
  };

  const { data: vatPluginData } = useQuery<{ isEnabled: boolean }>({
    queryKey: ['/api/plugins/vat/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/plugins/vat/status');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  const isVatPluginEnabled = vatPluginData?.isEnabled ?? true;

  const { data: backupPluginData } = useQuery<{ isEnabled: boolean }>({
    queryKey: ['/api/plugins/backup/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/plugins/backup/status');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  const isBackupPluginEnabled = backupPluginData?.isEnabled ?? true;

  const { data: guestChatsPluginData } = useQuery<{ isEnabled: boolean }>({
    queryKey: ['/api/plugins/guest-chats/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/plugins/guest-chats/status');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  const isGuestChatsPluginEnabled = guestChatsPluginData?.isEnabled ?? true;

  const { data: loginLogsPluginData } = useQuery<{ isEnabled: boolean }>({
    queryKey: ['/api/plugins/login-logs/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/plugins/login-logs/status');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  const isLoginLogsPluginEnabled = loginLogsPluginData?.isEnabled ?? true;

  const { data: subscriptionPluginData } = useQuery<{ isEnabled: boolean }>({
    queryKey: ['/api/plugins/subscriptions/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/plugins/subscriptions/status');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  const isSubscriptionPluginEnabled = subscriptionPluginData?.isEnabled ?? true;

  const { data: userSubscription } = useQuery<{
    status: string;
    remainingDays: number;
  } | null>({
    queryKey: ['/api/user-subscriptions/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-subscriptions/me');
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user && user.role === "user_level_1",
    staleTime: 5000,
    refetchOnMount: true,
    refetchInterval: 15000,
  });
  const hasActiveLevel1Subscription = user?.role !== "user_level_1"
    || (userSubscription?.status === "active" && userSubscription.remainingDays > 0);

  const { data: internalChatsPluginData } = useQuery<{ isEnabled: boolean }>({
    queryKey: ['/api/plugins/internal-chats/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/plugins/internal-chats/status');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  const isInternalChatsPluginEnabled = internalChatsPluginData?.isEnabled ?? true;

  const { data: seoPluginData } = useQuery<{ isEnabled: boolean }>({
    queryKey: ['/api/plugins/seo/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/plugins/seo/status');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  const isSeoPluginEnabled = seoPluginData?.isEnabled ?? true;

  const { data: sslPluginData } = useQuery<{ isEnabled: boolean }>({
    queryKey: ['/api/plugins/ssl/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/plugins/ssl/status');
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  const isSslPluginEnabled = sslPluginData?.isEnabled ?? true;

  const { data: unreadGuestChatsData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/admin/guest-chats/unread-count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/guest-chats/unread-count');
      return response.json();
    },
    enabled: !!user && user.role === "admin" && isGuestChatsPluginEnabled,
    refetchInterval: 30000,
  });
  const unreadGuestChats = unreadGuestChatsData?.unreadCount ?? 0;

  const { data: unreadInternalChatsData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/internal-chats/unread-count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/internal-chats/unread-count');
      return response.json();
    },
    enabled: !!user && user.role === "user_level_1" && isInternalChatsPluginEnabled,
    refetchInterval: 5000,
  });
  const unreadInternalChats = unreadInternalChatsData?.unreadCount ?? 0;

  const { data: unreadAnnouncementsData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/announcements/unread-count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/announcements/unread-count');
      return response.json();
    },
    enabled: !!user && user.role !== "admin",
    refetchInterval: 15000,
  });
  const unreadAnnouncements = unreadAnnouncementsData?.unreadCount ?? 0;

  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTicketsOpen, setIsTicketsOpen] = useState(true);

  const ticketItems = [
    { path: "/my-tickets", label: "تیکت‌های من", icon: Ticket },
    { path: "/send-ticket", label: "ارسال تیکت", icon: Send },
  ];

  const communicationItems = [
    { path: "/announcements", label: "اطلاعیه‌ها", icon: Megaphone },
    ...(isGuestChatsPluginEnabled ? [{ path: "/guest-chats", label: "چت مهمانان", icon: MessageSquare, badge: unreadGuestChats }] : []),
    ...(isInternalChatsPluginEnabled ? [{ path: "/seller-chats", label: "چت کاربران", icon: MessageCircle }] : []),
    { path: "/tickets", label: "تیکت‌ها", icon: Ticket },
  ];

  const usersManagementItems = [
    { path: "/users", label: "کاربران", icon: Users },
    { path: "/admin/gateways", label: "درگاه‌ها و قفل دامنه", icon: ShieldCheck },
    ...(isSubscriptionPluginEnabled ? [{ path: "/subscriptions", label: "اشتراک‌ها", icon: Crown }] : []),
  ];

  const settingsItems = [
    { path: "/admin/sms-settings", label: "تنظیمات پیامک و OTP", icon: MessageSquare },
    ...(isSeoPluginEnabled ? [{ path: "/admin/seo", label: "سئو و گوگل", icon: Search }] : []),
    ...(isSslPluginEnabled ? [{ path: "/admin/ssl", label: "ssl", icon: Lock }] : []),
    ...(isVatPluginEnabled ? [{ path: "/vat-settings", label: "مالیات", icon: Receipt }] : []),
    ...(isLoginLogsPluginEnabled ? [{ path: "/login-logs", label: "لاگ ورود", icon: History }] : []),
    ...(isBackupPluginEnabled ? [{ path: "/database-backup", label: "پشتیبان‌گیری", icon: Database }] : []),
  ];

  const userMenuItems = [
    { path: "/", label: "پیشخوان", icon: Home },
    ...(user?.role === "user_level_1" ? [{ path: "/level1/settings", label: "تنظیمات درگاه", icon: Settings }] : []),
    ...(user?.role === "user_level_1" && isSubscriptionPluginEnabled ? [{ path: "/buy-subscription", label: "خرید اشتراک", icon: Crown }] : []),
  ];

  const level1MenuItems = [
    { 
      path: "/announcements", 
      label: "اطلاعیه‌ها", 
      icon: Megaphone, 
      badge: unreadAnnouncements, 
      blink: unreadAnnouncements > 0 
    },
    ...(isInternalChatsPluginEnabled ? [{ 
      path: "/chat-with-seller", 
      label: "چت با مدیر", 
      icon: MessageCircle,
      badge: unreadInternalChats,
      blink: unreadInternalChats > 0
    }] : []),
    { path: "/profile", label: "پروفایل", icon: User },
  ];

  const renderMenuItem = (item: { path: string; label: string; icon: any; badge?: number; blink?: boolean }) => (
    <li key={item.path}>
      <Button 
        variant={isActive(item.path) ? "default" : "ghost"} 
        className={cn("w-full justify-start relative", isActive(item.path) && "bg-primary text-primary-foreground")}
        onClick={() => handleNavigate(item.path)}
      >
        <item.icon className="w-5 h-5 ml-2" />
        {item.label}
        {item.badge !== undefined && item.badge > 0 && (
          <span className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white shadow-xs",
            item.blink && "animate-pulse ring-2 ring-red-400 ring-offset-1"
          )}>
            {item.badge > 99 ? "+99" : item.badge}
          </span>
        )}
      </Button>
    </li>
  );

  const renderCollapsibleMenu = (label: string, items: { path: string; label: string; icon: any; badge?: number }[], isOpen?: boolean, onOpenChange?: (open: boolean) => void) => {
    const totalBadge = items.reduce((sum, item) => sum + (item.badge || 0), 0);
    
    return (
      <Collapsible 
        open={isOpen} 
        onOpenChange={onOpenChange}
        className="group/collapsible w-full"
      >
        <SidebarMenuItem className="list-none">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors relative">
              <div className="flex items-center">
                <span className="text-sm font-medium">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {totalBadge > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {totalBadge > 99 ? "+99" : totalBadge}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </div>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-1 space-y-1 pr-4 border-r border-border/50 mr-2">
              {items.map((item) => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <Button 
                      variant={isActive(item.path) ? "default" : "ghost"} 
                      size="sm" 
                      className={cn(
                        "w-full justify-start text-xs relative flex items-center justify-between", 
                        isActive(item.path) && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => sidebar?.setOpenMobile(false)}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-4 h-4 ml-2 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                          {item.badge > 99 ? "+99" : item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <aside className="w-64 bg-card border-l border-border flex flex-col sidebar-transition" data-testid="sidebar-navigation">
      <div className="p-6 border-b border-border" data-testid="section-logo">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-primary/20 shrink-0">
            <img 
              src="/images/rakhsh_logo.jpg" 
              alt="رخش پی" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="mr-3 text-lg font-bold text-foreground">سامانه رخش پی</h2>
        </div>
      </div>
      
      <nav className="flex-1 p-4 custom-scrollbar overflow-y-auto" data-testid="nav-main-menu">
        <SidebarMenu className="space-y-1">
          {user?.role === "admin" && (
            <>
              <li key="/dashboard">
                <Button 
                  variant={(isActive("/dashboard") || isActive("/")) ? "default" : "ghost"} 
                  className={cn("w-full justify-start", (isActive("/dashboard") || isActive("/")) && "bg-primary text-primary-foreground")}
                  onClick={() => handleNavigate("/dashboard")}
                  data-testid="link-admin-dashboard"
                >
                  <Home className="w-5 h-5 ml-2" />
                  پیشخوان
                </Button>
              </li>
              <li key="/level1/settings">
                <Button 
                  variant={isActive("/level1/settings") || isActive("/settings") || isActive("/admin/my-gateway") ? "default" : "ghost"} 
                  className={cn("w-full justify-start relative font-medium", (isActive("/level1/settings") || isActive("/settings") || isActive("/admin/my-gateway")) && "bg-primary text-primary-foreground")}
                  onClick={() => handleNavigate("/level1/settings")}
                  data-testid="link-admin-my-gateway"
                >
                  <CreditCard className="w-5 h-5 ml-2 text-indigo-500" />
                  درگاه پرداخت کارت به کارت
                </Button>
              </li>
              <li key="/transactions">
                <Button 
                  variant={isActive("/transactions") ? "default" : "ghost"} 
                  className={cn("w-full justify-start relative", isActive("/transactions") && "bg-primary text-primary-foreground")}
                  onClick={() => handleNavigate("/transactions")}
                  data-testid="link-admin-transactions"
                >
                  <Receipt className="w-5 h-5 ml-2 text-emerald-500" />
                  تراکنش‌ها و واریزی‌ها
                </Button>
              </li>
            </>
          )}

          {/* Non-admin, non-level1 fallback */}
          {user?.role !== "admin" && user?.role !== "user_level_1" && userMenuItems.map(renderMenuItem)}

          {/* Level 1 user with ACTIVE subscription: show all normal menus */}
          {user?.role === "user_level_1" && hasActiveLevel1Subscription && (
            <>
              {userMenuItems.map(renderMenuItem)}
              {level1MenuItems.map(renderMenuItem)}
              {renderCollapsibleMenu("تیکت‌ها", ticketItems, isTicketsOpen, setIsTicketsOpen)}
            </>
          )}

          {/* Level 1 user with EXPIRED/INACTIVE subscription: ONLY show Tickets and Profile, hide all others */}
          {user?.role === "user_level_1" && !hasActiveLevel1Subscription && (
            <>
              {renderCollapsibleMenu("تیکت‌ها", ticketItems, isTicketsOpen, setIsTicketsOpen)}
              {renderMenuItem({ path: "/profile", label: "پروفایل", icon: User })}
            </>
          )}

          {user?.role === "admin" && (
            <>
              {communicationItems.map(renderMenuItem)}
              <li key="/admin/telegram">
                <Link href="/admin/telegram">
                  <Button 
                    variant={isActive("/admin/telegram") ? "default" : "ghost"} 
                    className={cn("w-full justify-start relative", isActive("/admin/telegram") && "bg-primary text-primary-foreground")}
                    onClick={() => handleNavigate("/admin/telegram")}
                  >
                    <Bot className="w-5 h-5 ml-2" />
                    مدیریت ربات تلگرام
                  </Button>
                </Link>
              </li>
              {renderCollapsibleMenu("مدیریت کاربران", usersManagementItems, isUsersOpen, setIsUsersOpen)}
              {renderCollapsibleMenu("تنظیمات", settingsItems, isSettingsOpen, setIsSettingsOpen)}
              <li key="/plugins">
                <Link href="/plugins">
                  <Button 
                    variant={isActive("/plugins") ? "default" : "ghost"} 
                    className={cn("w-full justify-start", isActive("/plugins") && "bg-primary text-primary-foreground")}
                    onClick={() => handleNavigate("/plugins")}
                  >
                    <Plus className="w-5 h-5 ml-2" />
                    پلاگین‌ها
                  </Button>
                </Link>
              </li>
              <li key="/admin/landing">
                <Link href="/admin/landing">
                  <Button 
                    variant={isActive("/admin/landing") ? "default" : "ghost"} 
                    className={cn("w-full justify-start", isActive("/admin/landing") && "bg-primary text-primary-foreground")}
                    onClick={() => handleNavigate("/admin/landing")}
                  >
                    <LayoutTemplate className="w-5 h-5 ml-2 text-sky-500" />
                    قالب سایت
                  </Button>
                </Link>
              </li>
            </>
          )}
        </SidebarMenu>
      </nav>
    </aside>
  );
}

export { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger };
