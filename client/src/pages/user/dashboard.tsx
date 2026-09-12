import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Clock, CheckCircle, AlertCircle, MessageSquare, Package, TrendingUp, Grid3X3, Plus, ShoppingBag, ShoppingCart, Check, Mail, ChevronLeft, Inbox, Percent, CreditCard, Users, HelpCircle, Wallet, Settings, User, CheckCircle2, ExternalLink, Copy, Share2, ArrowUpRight, FileText, RefreshCw, SlidersHorizontal, ShieldCheck, Phone, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { createAuthenticatedRequest } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserSubscription, Ticket, Product, Order } from "@shared/schema";

// Extended Order type with customer and address info (same as in received-orders)
type OrderWithDetails = Order & {
  addressTitle?: string;
  fullAddress?: string;
  postalCode?: string;
  buyerFirstName?: string;
  buyerLastName?: string;
  buyerPhone?: string;
};


export default function UserDashboard() {
  const { user } = useAuth();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  // Blupal Gateway for level 1 users
  const { data: blupalGateway, isLoading: gatewayLoading } = useQuery<any>({
    queryKey: ["/api/blupal/gateway"],
    enabled: !!user && user.role === "user_level_1",
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/blupal/gateway");
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Blupal Stats for level 1 users
  const { data: blupalStats, isLoading: statsLoading } = useQuery<{
    totalAmount: number;
    todayAmount: number;
    successCount: number;
    pendingCount: number;
    failedCount: number;
  }>({
    queryKey: ["/api/blupal/stats"],
    enabled: !!user && user.role === "user_level_1",
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/blupal/stats");
      if (!res.ok) return { totalAmount: 0, todayAmount: 0, successCount: 0, pendingCount: 0, failedCount: 0 };
      return res.json();
    },
    refetchInterval: 10000,
  });

  // Latest 10 Blupal Transactions for level 1 users
  const { data: latestTransactions = [], isLoading: txLoading, refetch: refetchTx } = useQuery<any[]>({
    queryKey: ["/api/blupal/transactions", { limit: 10 }],
    enabled: !!user && user.role === "user_level_1",
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/blupal/transactions?limit=10");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 8000,
  });

  // Get user's tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
    enabled: !!user,
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/tickets");
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("خطا در دریافت تیکت‌ها");
      }
      return response.json();
    },
  });

  // Get admin products catalog for level 1 users
  const { data: adminProducts = [], isLoading: adminProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin-products"],
    enabled: !!user && user.role === "user_level_1",
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/admin-products");
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Get cart items for user
  const { data: cartItems = [] } = useQuery<any[]>({
    queryKey: ["/api/cart"],
    enabled: !!user && user.role !== "user_level_1",
    queryFn: async () => {
      try {
        const response = await createAuthenticatedRequest("/api/cart");
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
  });

  const cartProductIds = useMemo(() => {
    return new Set(cartItems.map((item: any) => item.productId));
  }, [cartItems]);

  // Get pending orders (پرداخت شده و در انتظار تایید) list for dashboard (for level 1 users)
  const { data: unpaidPendingOrders = [] } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders/seller"],
    enabled: !!user && user.role === "user_level_1",
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/orders/seller");
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error("خطا در دریافت سفارشات");
      }
      return response.json();
    },
    select: (data) => data.filter(order => order.status === 'pending'), // فقط سفارشات پرداخت شده و در انتظار تایید
  });

  // Get available products
  const { data: availableProducts = [], isLoading: shoppingProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/shop"],
    enabled: false,
    queryFn: async () => {
      try {
        const response = await createAuthenticatedRequest("/api/products/shop");
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
  });

  const { toast } = useToast();

  // Manual verify mutation for Level 1 merchant (re-check Blupal API)
  const verifyTxMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await createAuthenticatedRequest(`/api/blupal/transactions/${invoiceId}/verify`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "خطا در استعلام وضعیت از بلوپال");
      }
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blupal/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blupal/stats"] });
      if (data.verified) {
        toast({
          title: "تایید واریزی توسط بلوپال",
          description: data.message,
        });
        if (data.transaction) {
          setSelectedTx(data.transaction);
        }
      } else {
        toast({
          title: "وضعیت درگاه بلوپال",
          description: data.message,
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "خطا در استعلام",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const response = await createAuthenticatedRequest("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || "خطا در افزودن به سبد خرید");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "موفقیت",
        description: "محصول به سبد خرید اضافه شد",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate stats
  const openTickets = tickets.filter(ticket => ticket.status !== "closed").length;

  // Categorize products for shopping view
  const bestSellingProducts = useMemo(() => 
    availableProducts
      .filter(product => product.quantity && product.quantity > 0) // Use quantity as proxy for sales
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 8),
    [availableProducts]
  );
  const allProducts = availableProducts.slice(0, 16); // Show 16 total products

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  // Auto-scroll effect for best selling products
  useEffect(() => {
    if (user?.role === "user_level_2" && bestSellingProducts.length > 1) {
      const slider = sliderRef.current;
      if (!slider) return;

      // Guard: Only start autoplay when the slider actually overflows
      const hasOverflow = slider.scrollWidth > slider.clientWidth;
      if (!hasOverflow) return;

      // Calculate step dynamically from real card spacing
      const getStep = () => {
        const children = slider.children;
        if (children.length < 2) return 300; // Fallback
        
        const firstCard = (children[0] as HTMLElement).getBoundingClientRect();
        const secondCard = (children[1] as HTMLElement).getBoundingClientRect();
        return Math.round(secondCard.left - firstCard.left);
      };

      let step = getStep();

      // ResizeObserver to recompute step on viewport changes
      const resizeObserver = new ResizeObserver(() => {
        step = getStep();
      });
      resizeObserver.observe(slider);

      const interval = setInterval(() => {
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        const nextPosition = slider.scrollLeft + step;

        if (nextPosition >= maxScroll - 2) {
          // Reset to beginning
          slider.scrollTo({ left: 0, behavior: 'smooth' });
          setCurrentSlide(0);
        } else {
          // Move to next slide
          slider.scrollTo({ left: nextPosition, behavior: 'smooth' });
          setCurrentSlide(prev => (prev + 1) % bestSellingProducts.length);
        }
      }, 3000); // Auto slide every 3 seconds

      return () => {
        clearInterval(interval);
        resizeObserver.disconnect();
      };
    }
  }, [user?.role, bestSellingProducts]);

  // Shopping view for user_level_2
  if (user?.role === "user_level_2") {
    return (
      <DashboardLayout title="فروشگاه">
        <div className="space-y-6" data-testid="shopping-dashboard-content">
          {/* Best Selling Products - Horizontal Slider */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-bold">پرفروش‌ترین محصولات</h2>
            </div>
            <div className="relative">
              <div 
                ref={sliderRef}
                className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide" 
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  direction: 'ltr' // Force LTR for proper horizontal scrolling
                }}
              >
                {bestSellingProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all min-w-[280px] flex-shrink-0">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-xs">
                              {parseFloat(product.priceAfterDiscount || product.priceBeforeDiscount).toLocaleString()} تومان
                            </Badge>
                            <Badge variant="outline" className="text-xs block">
                              موجودی: {product.quantity || 0}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product.id)}
                            disabled={addToCartMutation.isPending}
                            data-testid={`button-add-to-cart-bestseller-${product.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* All Products */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold">تمامی محصولات</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {parseFloat(product.priceAfterDiscount || product.priceBeforeDiscount).toLocaleString()} تومان
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={addToCartMutation.isPending}
                          data-testid={`button-add-to-cart-all-${product.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Admin/Level1 dashboard view
  return (
    <DashboardLayout title="پیشخوان">
      <div className="space-y-6 max-w-6xl mx-auto pb-16" data-testid="dashboard-content" dir="rtl">

        {/* Level 1 Specific: Blupal Gateway Status, Statistics & 10 Latest Transactions */}
        {user?.role === "user_level_1" && (() => {
          const isConfigured = Boolean(blupalGateway?.apiKey?.trim());
          const slug = blupalGateway?.slug || user.username;
          const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/pay/${slug}` : `/pay/${slug}`;

          const handleCopyLink = () => {
            navigator.clipboard.writeText(publicUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
            toast({
              title: "لینک کپی شد",
              description: "لینک درگاه پرداخت شما در حافظه موقت ذخیره شد.",
            });
          };

          const formatFa = (num: number | string) => {
            const n = typeof num === "string" ? parseFloat(num) : num;
            if (isNaN(n)) return "۰";
            return n.toLocaleString("fa-IR");
          };

          const formatPersianDate = (dateStr?: string | Date | null) => {
            if (!dateStr) return "-";
            try {
              const d = new Date(dateStr);
              return new Intl.DateTimeFormat("fa-IR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(d);
            } catch {
              return String(dateStr);
            }
          };

          return (
            <div className="space-y-4">
              {/* Gateway Status & Share Card (shown when configured) */}
              {isConfigured && (
                <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-900/10 via-slate-900/5 to-transparent dark:bg-zinc-900/60 p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">درگاه پرداخت کارت به کارت</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400">بلوپال (کارت به کارت شتاب)</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5">
                      فعال
                    </Badge>
                  </div>

                  {/* Public Link Share Box */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/60">
                    <div className="flex-1 text-left px-2 truncate font-mono text-[11px] text-indigo-600 dark:text-indigo-300" dir="ltr">
                      {publicUrl}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCopyLink}
                      className="h-8 px-2.5 text-[11px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 flex items-center gap-1 shadow-sm"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? "کپی شد" : "کپی لینک"}</span>
                    </Button>
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-[11px] rounded-lg shrink-0"
                        title="مشاهده صفحه پرداخت"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>

                  {/* Quick button to settings */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 px-1">
                    <span>پذیرنده: <b className="text-slate-700 dark:text-zinc-300">{blupalGateway?.sellerName || user.username}</b></span>
                    <Link href="/level1/settings" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-bold">
                      <Settings className="w-3 h-3" />
                      تنظیمات و شماره کارت
                    </Link>
                  </div>
                </div>
              )}

              {/* Financial Metrics Grid: Amounts */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                    <span>مجموع واریزی‌ها</span>
                    <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-base font-bold text-slate-800 dark:text-zinc-100 font-mono">
                    {formatFa(blupalStats?.totalAmount || 0)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">تومان</div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                    <span>واریزی‌های امروز</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatFa(blupalStats?.todayAmount || 0)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">تومان</div>
                </div>
              </div>

              {/* Status Counters Grid: Successful, Pending Verification, Failed */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {/* تراکنش‌های موفق */}
                <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                    <span className="truncate">تراکنش‌های موفق</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatFa(blupalStats?.successCount || 0)}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">واریز مستقیم</div>
                </div>

                {/* تراکنش های در انتظار تایید */}
                <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                    <span className="truncate" title="تراکنش های در انتظار تایید">در انتظار تایید</span>
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {formatFa(blupalStats?.pendingCount || 0)}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">در انتظار بلوپال</div>
                </div>

                {/* تراکنش ناموفق */}
                <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                    <span className="truncate" title="تراکنش ناموفق">تراکنش ناموفق</span>
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
                    {formatFa(blupalStats?.failedCount || 0)}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">بسته شده (&gt; ۲۰ د)</div>
                </div>
              </div>

              {/* 10 LATEST TRANSACTIONS SECTION */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">۱۰ تراکنش اخیر درگاه</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchTx()}
                    disabled={txLoading}
                    className="h-7 px-2 text-[11px] text-slate-500 hover:text-indigo-600 gap-1 rounded-lg"
                  >
                    <RefreshCw className={`w-3 h-3 ${txLoading ? "animate-spin" : ""}`} />
                    <span>بروزرسانی</span>
                  </Button>
                </div>

                {/* Transactions List */}
                {txLoading ? (
                  <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500 mb-2" />
                    <span className="text-xs text-slate-500">در حال دریافت تراکنش‌ها...</span>
                  </div>
                ) : latestTransactions.length === 0 ? (
                  <div className="p-6 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-2">
                    <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">هنوز تراکنشی ثبت نشده است</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      لینک اختصاصی درگاه خود را با مشتریان به اشتراک بگذارید تا پس از انجام هر واریز، جزئیات آن فوراً در اینجا ثبت شود.
                    </p>
                    {isConfigured && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyLink}
                        className="text-xs h-8 rounded-xl mt-1 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        کپی لینک پرداخت
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {latestTransactions.map((tx: any) => {
                      const isPaid = tx.status === "paid";
                      const isVerifying = tx.status === "verifying";
                      const isPending = tx.status === "pending";

                      return (
                        <div
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:border-indigo-400/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                        >
                          {/* Right: Status Icon + Payer Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isPaid 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                : isVerifying
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : isPending
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}>
                              {isPaid ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isVerifying ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                              ) : isPending ? (
                                <Clock className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                                {tx.payerName || "کاربر ناشناس"}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span>{formatPersianDate(tx.createdAt)}</span>
                                {tx.payerPhone && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{tx.payerPhone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Left: Amount + Status Badge */}
                          <div className="text-left shrink-0">
                            <div className="text-xs font-bold font-mono text-slate-800 dark:text-zinc-100">
                              {formatFa(tx.amount)} <span className="text-[10px] font-sans font-normal text-slate-400">تومان</span>
                            </div>
                            <div className="mt-1">
                              {isPaid ? (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold">
                                  پرداخت موفق
                                </Badge>
                              ) : isVerifying ? (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold animate-pulse">
                                  در حال تایید وب‌هوک
                                </Badge>
                              ) : isPending ? (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold">
                                  در انتظار پرداخت
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold">
                                  تراکنش ناموفق
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Transaction Details Modal */}
              <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                <DialogContent className="max-w-sm rounded-3xl p-5" dir="rtl">
                  <DialogHeader className="text-right">
                    <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-right">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      جزئیات تراکنش کارت به کارت
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 text-right">
                      رسید کامل تراکنش ثبت شده در درگاه
                    </DialogDescription>
                  </DialogHeader>

                  {selectedTx && (
                    <div className="space-y-3 pt-2 text-xs">
                      {/* Status banner */}
                      <div className={`p-3 rounded-xl flex items-center justify-between ${
                        selectedTx.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                          : selectedTx.status === "verifying"
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                          : selectedTx.status === "pending"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        <span className="font-bold">وضعیت تراکنش:</span>
                        <span className="font-bold">
                          {selectedTx.status === "paid" 
                            ? "موفق و تایید شده (تطبیق وب‌هوک)" 
                            : selectedTx.status === "verifying" 
                            ? "در حال بررسی و تطبیق وب‌هوک" 
                            : selectedTx.status === "pending" 
                            ? "در انتظار واریز" 
                            : "منقضی / ناموفق"}
                        </span>
                      </div>

                      <div className="space-y-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 p-3.5 border border-slate-200/80 dark:border-zinc-700/60">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">مبلغ تراکنش:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-zinc-100 text-sm">
                            {formatFa(selectedTx.amount)} تومان
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">پرداخت‌کننده:</span>
                          <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedTx.payerName || "-"}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">موبایل:</span>
                          <span className="font-mono text-slate-700 dark:text-zinc-300">{selectedTx.payerPhone || "-"}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">شناسه فاکتور:</span>
                          <span className="font-mono text-slate-700 dark:text-zinc-300">{selectedTx.invoiceId || "-"}</span>
                        </div>

                        {selectedTx.trackingCode && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">کد پیگیری:</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedTx.trackingCode}</span>
                          </div>
                        )}

                        {selectedTx.cardLastFour && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">۴ رقم آخر کارت:</span>
                            <span className="font-mono text-slate-700 dark:text-zinc-300">**** - {selectedTx.cardLastFour}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">تاریخ ایجاد:</span>
                          <span>{formatPersianDate(selectedTx.createdAt)}</span>
                        </div>

                        {selectedTx.paidAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">زمان پرداخت:</span>
                            <span>{formatPersianDate(selectedTx.paidAt)}</span>
                          </div>
                        )}

                        {selectedTx.description && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60">
                            <span className="text-slate-500 block mb-1">بابت / توضیحات:</span>
                            <p className="text-slate-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                              {selectedTx.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Manual Verify Action if not paid */}
                      {selectedTx.status !== "paid" && (
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => verifyTxMutation.mutate(selectedTx.invoiceId)}
                          disabled={verifyTxMutation.isPending}
                          className="w-full h-10 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${verifyTxMutation.isPending ? "animate-spin" : ""}`} />
                          {verifyTxMutation.isPending ? "در حال استعلام واقعی از بلوپال..." : "استعلام مجدد وضعیت از بلوپال"}
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        onClick={() => setSelectedTx(null)}
                        className="w-full h-10 rounded-xl text-xs"
                      >
                        بستن
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          );
        })()}


      </div>
    </DashboardLayout>
  );
}