import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import UserDashboard from "@/pages/user/dashboard";
import UserManagement from "@/pages/admin/user-management";
import TicketManagement from "@/pages/admin/ticket-management";
import Subscriptions from "@/pages/admin/subscriptions";
import DatabaseBackup from "@/pages/admin/database-backup";
import LoginLogs from "@/pages/admin/login-logs";
import Categories from "@/pages/admin/categories";
import GuestChats from "@/pages/admin/guest-chats";
import PluginsManagement from "@/pages/admin/plugins";
import Profile from "@/pages/user/profile";
import SendTicket from "@/pages/user/send-ticket";
import MyTickets from "@/pages/user/my-tickets";
import AddProduct from "@/pages/user/add-product";
import ProductList from "@/pages/user/product-list";
import Reports from "@/pages/user/reports";
import SubUsers from "@/pages/user/sub-users";
import Cart from "@/pages/cart";
import Addresses from "@/pages/user/addresses";
import Orders from "@/pages/user/orders";
import ReceivedOrders from "@/pages/user/received-orders";
import Announcements from "@/pages/user/announcements";
import SuccessfulTransactions from "@/pages/user/successful-transactions";
import ChatWithSeller from "@/pages/user/chat-with-seller";
import SellerChats from "@/pages/admin/seller-chats";
import VatSettings from "@/pages/level1/vat-settings";
import VitrinPage from "@/pages/vitrin";
import BankCard from "@/pages/user/bank-card";
import FaqsPage from "@/pages/faqs";
import AddFaqPage from "@/pages/user/add-faq";
import ManageFaqsPage from "@/pages/user/manage-faqs";
import GatewaySettingsPage from "@/pages/user/gateway-settings";
import BlupalPaymentPage from "@/pages/public/blupal-payment-page";
import MaintenancePage from "@/pages/maintenance";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminLandingPage from "@/pages/admin/landing";
import VisualLandingBuilderPage from "@/pages/admin/landing-builder";
import SeoDashboard from "@/pages/admin/seo";
import HttpsSslManagementPage from "@/pages/admin/ssl";
import SmsSettingsPage from "@/pages/admin/sms-settings";
import TelegramBotPage from "@/pages/admin/telegram-bot";
import AdminGatewayManagementPage from "@/pages/admin/gateway-management";
import PublicLanding from "@/components/public-landing";
import BuySubscriptionPage from "@/pages/user/buy-subscription";
import { ExpiredSubscriptionCard } from "@/components/expired-subscription-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Send, Clock, Crown, User } from "lucide-react";
import { Link, useLocation } from "wouter";

interface MaintenanceStatus {
  isEnabled: boolean;
}

function MaintenanceCheck({ children, userRole }: { children: React.ReactNode; userRole: string }) {
  const { data: maintenanceData } = useQuery<MaintenanceStatus>({
    queryKey: ["maintenance-status"],
    queryFn: async () => {
      const response = await fetch("/api/maintenance/status");
      if (!response.ok) {
        throw new Error("خطا در دریافت وضعیت");
      }
      return response.json();
    },
    refetchInterval: 5000,
  });

  if (maintenanceData?.isEnabled && userRole !== "admin") {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}

function ExpiredSubscriptionPage() {
  return (
    <DashboardLayout title="اشتراک منقضی شده">
      <div className="min-h-[60vh] md:min-h-0 flex items-center justify-center p-2 sm:p-4 md:py-8">
        <ExpiredSubscriptionCard />
      </div>
    </DashboardLayout>
  );
}

function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const canUseTickets = location === "/my-tickets"
    || location === "/send-ticket"
    || location.startsWith("/my-tickets/")
    || location.startsWith("/send-ticket/")
    || location === "/profile"
    || location.startsWith("/profile/")
    || location.startsWith("/profile?")
    || location.startsWith("/profile")
    || location === "/buy-subscription"
    || location.startsWith("/buy-subscription")
    || location === "/subscriptions"
    || location.startsWith("/subscriptions");

  const { data: subscription, isLoading } = useQuery<{
    status: string;
    remainingDays: number;
  } | null>({
    queryKey: ["/api/user-subscriptions/me"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user-subscriptions/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user && user.role === "user_level_1",
    staleTime: 5000,
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  if (user?.role !== "user_level_1" || canUseTickets) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">در حال بررسی اشتراک...</div>;
  }

  if (!subscription || subscription.status !== "active" || subscription.remainingDays <= 0) {
    return <ExpiredSubscriptionPage />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">در حال بارگذاری...</div>
    </div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  return (
    <MaintenanceCheck userRole={user.role}>
      <SubscriptionGate>
        <Component />
      </SubscriptionGate>
    </MaintenanceCheck>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">در حال بارگذاری...</div>
    </div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  if (user.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg text-destructive">دسترسی محدود - این صفحه مخصوص مدیران است</div>
    </div>;
  }
  
  return (
    <SubscriptionGate>
      <Component />
    </SubscriptionGate>
  );
}

function SubscriptionsPageSwitcher() {
  const { user } = useAuth();
  if (user?.role === "admin") {
    return <Subscriptions />;
  }
  return <BuySubscriptionPage />;
}

function PluginAwareAdminRoute({ component: Component, pluginName }: { component: React.ComponentType; pluginName: string }) {
  const { user, isLoading } = useAuth();
  const { data: pluginStatus, isLoading: pluginLoading } = useQuery<{ isEnabled: boolean }>({
    queryKey: [`/api/plugins/${pluginName}/status`],
    queryFn: async () => {
      const response = await fetch(`/api/plugins/${pluginName}/status`, {
        credentials: 'include'
      });
      if (!response.ok) return { isEnabled: false };
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  
  if (isLoading || pluginLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">در حال بارگذاری...</div>
    </div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  if (user.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg text-destructive">دسترسی محدود - این صفحه مخصوص مدیران است</div>
    </div>;
  }
  
  if (!pluginStatus?.isEnabled) {
    return (
      <DashboardLayout title="پلاگین غیرفعال است">
        <div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <span className="text-amber-500 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">این سرویس غیرفعال است (بزودی)</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            پلاگین مربوطه غیرفعال بوده و در حال حاضر در دست توسعه قرار دارد. می‌توانید وضعیت آن را از بخش مدیریت پلاگین‌ها بررسی کنید.
          </p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <SubscriptionGate>
      <Component />
    </SubscriptionGate>
  );
}

function PluginGatedRoute({ children, pluginName }: { children: React.ReactNode; pluginName: string }) {
  const { user, isLoading } = useAuth();
  const { data: pluginStatus, isLoading: pluginLoading } = useQuery<{ isEnabled: boolean }>({
    queryKey: [`/api/plugins/${pluginName}/status`],
    queryFn: async () => {
      const response = await fetch(`/api/plugins/${pluginName}/status`, {
        credentials: 'include'
      });
      if (!response.ok) return { isEnabled: false };
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });
  
  if (isLoading || pluginLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">در حال بارگذاری...</div>
    </div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  if (!pluginStatus?.isEnabled) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg text-muted-foreground">این پلاگین غیرفعال است</div>
    </div>;
  }
  
  return <>{children}</>;
}

function AdminOrLevel1Route({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">در حال بارگذاری...</div>
    </div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  if (user.role !== "admin" && user.role !== "user_level_1") {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg text-destructive">دسترسی محدود - این صفحه مخصوص مدیران و کاربران سطح ۱ است</div>
    </div>;
  }
  
  return (
    <SubscriptionGate>
      <Component />
    </SubscriptionGate>
  );
}

function Level1Route({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">در حال بارگذاری...</div>
    </div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  if (user.role !== "user_level_1") {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg text-destructive">دسترسی محدود - این صفحه مخصوص کاربران سطح ۱ است</div>
    </div>;
  }
  
  return (
    <SubscriptionGate>
      <Component />
    </SubscriptionGate>
  );
}

function WithLayout(Component: React.ComponentType, title: string) {
  return () => (
    <DashboardLayout title={title}>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  const { user } = useAuth();
  
  const renderHomeOrLanding = () => {
    const isPreview = typeof window !== "undefined" && (
      window.location.search.includes("preview_template") || 
      window.location.search.includes("preview=") ||
      window.location.search.includes("preview_mode")
    );
    if (isPreview) {
      return <PublicLanding />;
    }
    return user ? (
      user.role === "admin" 
        ? <ProtectedRoute component={Dashboard} /> 
        : <ProtectedRoute component={UserDashboard} />
    ) : <PublicLanding />;
  };

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/public-landing" component={PublicLanding} />
      <Route path="/preview-landing" component={PublicLanding} />
      <Route path="/" component={renderHomeOrLanding} />
      <Route path="/home" component={renderHomeOrLanding} />
      <Route path="/index.html" component={renderHomeOrLanding} />
      <Route path="/blog" component={() => <PublicLanding />} />
      <Route path="/dashboard" component={() => user ? (
        user.role === "admin" 
          ? <ProtectedRoute component={Dashboard} /> 
          : <ProtectedRoute component={UserDashboard} />
      ) : <Login />} />
      <Route path="/admin/dashboard" component={() => <AdminRoute component={AdminDashboard} />} />
      <Route path="/admin/landing" component={() => <AdminRoute component={AdminLandingPage} />} />
      <Route path="/admin/landing/builder" component={() => <AdminRoute component={VisualLandingBuilderPage} />} />
      <Route path="/admin/seo" component={() => <PluginAwareAdminRoute component={SeoDashboard} pluginName="seo" />} />
      <Route path="/seo" component={() => <AdminOrLevel1Route component={() => (
        <PluginGatedRoute pluginName="seo">
          <SeoDashboard />
        </PluginGatedRoute>
      )} />} />
      <Route path="/admin/ssl" component={() => <PluginAwareAdminRoute component={HttpsSslManagementPage} pluginName="ssl" />} />
      <Route path="/admin/sms-settings" component={() => <AdminRoute component={SmsSettingsPage} />} />
      <Route path="/sms-settings" component={() => <AdminRoute component={SmsSettingsPage} />} />
      <Route path="/admin/telegram" component={() => <AdminRoute component={TelegramBotPage} />} />
      <Route path="/telegram" component={() => <AdminRoute component={TelegramBotPage} />} />
      <Route path="/ssl" component={() => <AdminOrLevel1Route component={() => (
        <PluginGatedRoute pluginName="ssl">
          <HttpsSslManagementPage />
        </PluginGatedRoute>
      )} />} />
      <Route path="/https" component={() => <AdminOrLevel1Route component={() => (
        <PluginGatedRoute pluginName="ssl">
          <HttpsSslManagementPage />
        </PluginGatedRoute>
      )} />} />
      <Route path="/users" component={() => <AdminRoute component={UserManagement} />} />
      <Route path="/admin/gateways" component={() => <AdminRoute component={AdminGatewayManagementPage} />} />
      <Route path="/tickets" component={() => <AdminRoute component={TicketManagement} />} />
      <Route path="/guest-chats" component={() => <PluginAwareAdminRoute component={GuestChats} pluginName="guest-chats" />} />
      <Route path="/seller-chats" component={() => <PluginAwareAdminRoute component={SellerChats} pluginName="internal-chats" />} />
      <Route path="/plugins" component={() => <AdminRoute component={PluginsManagement} />} />
      <Route path="/subscriptions" component={() => <ProtectedRoute component={SubscriptionsPageSwitcher} />} />
      <Route path="/buy-subscription" component={() => <ProtectedRoute component={BuySubscriptionPage} />} />
      <Route path="/categories" component={() => <AdminOrLevel1Route component={Categories} />} />
      <Route path="/login-logs" component={() => <AdminRoute component={LoginLogs} />} />
      <Route path="/database-backup" component={() => <AdminRoute component={DatabaseBackup} />} />
      <Route path="/reports" component={() => <AdminOrLevel1Route component={Reports} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/send-ticket" component={() => <ProtectedRoute component={SendTicket} />} />
      <Route path="/my-tickets" component={() => <ProtectedRoute component={MyTickets} />} />
      <Route path="/add-product" component={() => <ProtectedRoute component={AddProduct} />} />
      <Route path="/products" component={() => <ProtectedRoute component={ProductList} />} />
      <Route path="/sub-users" component={() => <Level1Route component={SubUsers} />} />
      <Route path="/cart" component={() => <AdminOrLevel1Route component={Cart} />} />
      <Route path="/addresses" component={() => <AdminOrLevel1Route component={Addresses} />} />
      <Route path="/received-orders" component={() => <Level1Route component={GatewaySettingsPage} />} />
      <Route path="/level1/settings" component={() => <Level1Route component={GatewaySettingsPage} />} />
      <Route path="/settings" component={() => <Level1Route component={GatewaySettingsPage} />} />
      <Route path="/pay/:slugOrUsername" component={BlupalPaymentPage} />
      <Route path="/p/:slugOrUsername" component={BlupalPaymentPage} />
      <Route path="/announcements" component={() => <AdminOrLevel1Route component={WithLayout(Announcements, "اطلاعیه‌ها")} />} />
      <Route path="/financial" component={() => <AdminOrLevel1Route component={WithLayout(Announcements, "اطلاعیه‌ها")} />} />
      <Route path="/transactions" component={() => <AdminOrLevel1Route component={WithLayout(SuccessfulTransactions, "مدیریت تراکنش‌ها")} />} />
      <Route path="/vat-settings" component={() => <AdminOrLevel1Route component={VatSettings} />} />
      <Route path="/bank-card" component={() => <AdminOrLevel1Route component={BankCard} />} />
      <Route path="/chat-with-seller" component={() => <AdminOrLevel1Route component={() => (
        <PluginGatedRoute pluginName="internal-chats">
          <ChatWithSeller />
        </PluginGatedRoute>
      )} />} />
      <Route path="/faqs" component={() => <ProtectedRoute component={FaqsPage} />} />
      <Route path="/manage-faqs" component={() => <AdminOrLevel1Route component={ManageFaqsPage} />} />
      <Route path="/add-faq" component={() => <AdminOrLevel1Route component={AddFaqPage} />} />
      <Route path="/vitrin/:username" component={VitrinPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
    "width": "100%",
    "overflowX": "hidden"
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="w-full min-h-screen bg-background text-foreground">
            <Toaster />
            <Router />
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
