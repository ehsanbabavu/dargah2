import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Bell, User, LogOut, ShoppingCart, X, Package, Menu, Home, ShoppingBag, Wallet, MessageSquare, Smartphone, Zap, AlertCircle, Settings, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [cartOpen, setCartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();

  // Get notifications count for level 1 users
  const { data: notificationsData } = useQuery<{ newOrdersCount: number }>({
    queryKey: ["/api/notifications/orders"],
    enabled: !!user && user.role === "user_level_1",
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Get user's cart
  const { data: cartItems = [], isLoading: cartLoading } = useQuery<any[]>({
    queryKey: ["/api/cart"],
    enabled: !!user && user.role !== "admin",
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return [];
        
        const response = await fetch("/api/cart", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
  });

  // Remove item from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/cart/items/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "موفقیت",
        description: "محصول از سبد خرید حذف شد",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: "خطا در حذف محصول از سبد خرید",
        variant: "destructive",
      });
    },
  });

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveFromCart = (itemId: string) => {
    removeFromCartMutation.mutate(itemId);
  };

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
      paths: ["/profile", "/vat-settings", "/bank-card", "/sub-users", "/manage-faqs", "/add-faq"],
      onClick: () => setLocation("/profile"),
    },
  ];

  const mobileScreenMarkup = (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground overflow-hidden font-sans relative" dir="rtl">
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
                  {/* User Info - Next to logout */}
                  <div className="flex items-center space-x-3 space-x-reverse" data-testid="section-user-info">
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
                  
                  {/* Shopping Cart - For level 1 and level 2 users */}
                  {user && user.role !== "admin" && (
                    <DropdownMenu open={cartOpen} onOpenChange={setCartOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="relative" data-testid="button-cart">
                          <ShoppingCart className="h-5 w-5" />
                          {cartItemsCount > 0 && (
                            <span className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center" data-testid="text-cart-count">
                              {cartItemsCount}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80" align="end" data-testid="dropdown-cart">
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          سبد خرید شما ({cartItemsCount} محصول)
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {cartLoading ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">در حال بارگذاری...</p>
                          </div>
                        ) : cartItems.length === 0 ? (
                          <div className="p-4 text-center">
                            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">سبد خرید شما خالی است</p>
                          </div>
                        ) : (
                          <>
                            <div className="max-h-64 overflow-y-auto">
                              {cartItems.map((item) => (
                                <DropdownMenuItem key={item.id} className="p-3 cursor-default" data-testid={`cart-item-${item.id}`}>
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3 flex-1">
                                      {item.productImage && (
                                        <img 
                                          src={item.productImage} 
                                          alt={item.productName}
                                          className="w-10 h-10 object-cover rounded"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" data-testid={`cart-item-name-${item.id}`}>
                                          {item.productName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          تعداد: {item.quantity} × {parseFloat(item.unitPrice).toLocaleString()} تومان
                                        </p>
                                        <p className="text-xs font-medium text-green-600">
                                          مجموع: {parseFloat(item.totalPrice).toLocaleString()} تومان
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFromCart(item.id);
                                      }}
                                      disabled={removeFromCartMutation.isPending}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                                      data-testid={`button-remove-cart-${item.id}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </div>
                            <DropdownMenuSeparator />
                            <div className="p-3">
                              <Button
                                className="w-full"
                                onClick={() => {
                                  setCartOpen(false);
                                  setLocation('/cart');
                                }}
                                data-testid="button-view-full-cart"
                              >
                                مشاهده سبد خرید کامل
                              </Button>
                            </div>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
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
