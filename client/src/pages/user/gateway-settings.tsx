import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { createAuthenticatedRequest } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { 
  CreditCard, Key, Check, Copy, ExternalLink, 
  ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, RefreshCw, 
  Eye, EyeOff, Save, Sliders, Globe, Share2, Building2, Phone,
  Lock, Unlock, Sparkles, ShoppingBag, Download, Globe2,
  HelpCircle, CheckCircle, Info, Smartphone, Monitor, ArrowRight,
  Clock, Crown, Ticket, Send
} from "lucide-react";
import { Link } from "wouter";
import { ExpiredSubscriptionCard } from "@/components/expired-subscription-card";

interface BlupalGatewayData {
  id?: string;
  userId?: string;
  apiKey?: string | null;
  isActive?: boolean;
  title?: string;
  description?: string;
  defaultAmount?: string | null;
  minAmount?: string;
  maxAmount?: string;
  cardNumber?: string | null;
  cardHolderName?: string | null;
  bankName?: string | null;
  supportPhone?: string | null;
  slug?: string | null;
  successMessage?: string;
  wpApiKey?: string | null;
  wpAuthorizedDomain?: string | null;
  wpCallbackUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const getBankNameFromCard = (cardNum: string): string => {
  const prefix = cardNum.replace(/\D/g, "").slice(0, 6);
  const banks: Record<string, string> = {
    "603799": "بانک ملی",
    "589210": "بانک سپه",
    "627648": "بانک توسعه صادرات",
    "627961": "بانک صنعت و معدن",
    "603770": "بانک کشاورزی",
    "628023": "بانک مسکن",
    "627760": "پست بانک",
    "502908": "بانک توسعه تعاون",
    "627412": "بانک اقتصاد نوین",
    "622106": "بانک پارسیان",
    "502229": "بانک پاسارگاد",
    "627488": "بانک کارآفرین",
    "621986": "بانک سامان",
    "639346": "بانک سینا",
    "639607": "بانک سرمایه",
    "636214": "بانک آینده",
    "502806": "بانک شهر",
    "502938": "بانک دی",
    "603769": "بانک صادرات",
    "610433": "بانک ملت",
    "627353": "بانک تجارت",
    "589463": "بانک رفاه",
    "627381": "بانک انصار",
    "505416": "بانک گردشگری",
    "606373": "بانک قرض‌الحسنه مهر ایران",
    "504172": "بانک قرض‌الحسنه رسالت",
    "505785": "بانک ایران زمین",
  };
  return banks[prefix] || "";
};

const formatNumberWithCommas = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") return "";
  const normalized = String(value)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  const clean = normalized.replace(/\D/g, "");
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parseCommaNumber = (formattedValue: string) => {
  const normalized = String(formattedValue)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  return normalized.replace(/\D/g, "");
};

export default function GatewaySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("api");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedWpKey, setCopiedWpKey] = useState(false);
  const [copiedServerUrl, setCopiedServerUrl] = useState(false);
  const [isDownloadingPlugin, setIsDownloadingPlugin] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    apiKey: "",
    isActive: false,
    title: "",
    description: "",
    defaultAmount: "",
    minAmount: "10000",
    maxAmount: "50000000",
    cardNumber: "",
    cardHolderName: "",
    bankName: "",
    supportPhone: "",
    slug: "",
    successMessage: "",
    wpApiKey: "",
    wpAuthorizedDomain: "",
    wpCallbackUrl: "",
  });

  const { data: userSubscription, isLoading: subLoading } = useQuery<{
    status: string;
    remainingDays: number;
  } | null>({
    queryKey: ["/api/user-subscriptions/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user-subscriptions/me");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user && user.role === "user_level_1",
    staleTime: 5000,
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const { data: gateway, isLoading } = useQuery<BlupalGatewayData>({
    queryKey: ["/api/blupal/gateway"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/blupal/gateway");
      if (!res.ok) throw new Error("Failed to load gateway settings");
      return res.json();
    },
    enabled: !!user && (user.role === "user_level_1" || user.role === "admin"),
  });

  useEffect(() => {
    if (gateway) {
      setFormData({
        apiKey: gateway.apiKey || "",
        isActive: gateway.isActive ?? false,
        title: gateway.title || `درگاه پرداخت ${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        description: gateway.description || "جهت پرداخت، اطلاعات خود را وارد کرده و پس از واریز کارت به کارت، وضعیت به صورت آنی تایید می‌گردد.",
        defaultAmount: gateway.defaultAmount ? String(gateway.defaultAmount) : "",
        minAmount: gateway.minAmount || "10000",
        maxAmount: gateway.maxAmount || "50000000",
        cardNumber: gateway.cardNumber || "",
        cardHolderName: gateway.cardHolderName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        bankName: gateway.bankName || "",
        supportPhone: gateway.supportPhone || user?.phone || "",
        slug: gateway.slug || user?.username || "",
        successMessage: gateway.successMessage || "پرداخت شما با موفقیت تایید شد. از حسن انتخاب و اعتماد شما متشکریم.",
        wpApiKey: gateway.wpApiKey || "",
        wpAuthorizedDomain: gateway.wpAuthorizedDomain || "",
        wpCallbackUrl: gateway.wpCallbackUrl || "",
      });
    }
  }, [gateway, user]);

  const generateWpKeyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/blupal/woocommerce/generate-key");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در صدور کلید وردپرس");
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.wpApiKey) {
        setFormData((prev) => ({ ...prev, wpApiKey: data.wpApiKey }));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/blupal/gateway"] });
      toast({
        title: "کلید افزونه ووکامرس صادر شد",
        description: "کلید وب‌سرویس اختصاصی شما با موفقیت ایجاد گردید.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در صدور کلید",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const downloadPluginZip = async () => {
    try {
      setIsDownloadingPlugin(true);
      toast({
        title: "در حال آماده‌سازی فایل افزونه...",
        description: "لطفاً چند لحظه شکیبا باشید.",
      });

      const token = localStorage.getItem("token") || "";
      const url = token 
        ? `/api/blupal/woocommerce/download-plugin?token=${encodeURIComponent(token)}`
        : `/api/blupal/woocommerce/download-plugin`;

      const res = await createAuthenticatedRequest(url);
      
      let blob: Blob;
      if (!res.ok) {
        // Fallback to public generic plugin
        const fallbackRes = await fetch("/api/v1/woocommerce/download-plugin");
        if (!fallbackRes.ok) {
          throw new Error("خطا در دانلود افزونه از سرور");
        }
        blob = await fallbackRes.blob();
      } else {
        blob = await res.blob();
      }

      if (blob.size < 200) {
        throw new Error("پاسخ سرور معتبر نیست. لطفاً مجدداً تلاش فرمایید.");
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "blupal-woocommerce-card-to-card.zip";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }, 1000);

      toast({
        title: "دانلود با موفقیت انجام شد",
        description: "فایل ZIP افزونه وردپرس با تنظیمات اختصاصی شما دانلود شد.",
      });
    } catch (err: any) {
      console.error("Plugin download error:", err);
      toast({
        title: "خطا در دانلود افزونه",
        description: err.message || "امکان دانلود فایل افزونه وجود ندارد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPlugin(false);
    }
  };

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/blupal/test-connection", {
        apiKey: formData.apiKey,
        cardNumber: formData.cardNumber,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "خطا در تست اتصال به بلو بانک");
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.cardNumber) {
        setFormData((prev) => ({
          ...prev,
          cardNumber: data.cardNumber,
          cardHolderName: data.cardHolderName || prev.cardHolderName,
          bankName: data.bankName || prev.bankName,
        }));
      }
      toast({
        title: "اتصال موفق به بلو بانک",
        description: data.message || "کلید API معتبر است و ارتباط با وب‌سرویس بلو بانک برقرار شد.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطای اتصال به بلو بانک",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const syncCardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/blupal/sync-card", {
        apiKey: formData.apiKey,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "خطا در دریافت اطلاعات کارت از بلو بانک");
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.cardNumber) {
        setFormData((prev) => ({
          ...prev,
          cardNumber: data.cardNumber,
          cardHolderName: prev.cardHolderName || data.cardHolderName || "",
          bankName: data.bankName || prev.bankName,
        }));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/blupal/gateway"] });
      toast({
        title: "شماره کارت از بلو بانک دریافت شد",
        description: data.message || "شماره کارت با موفقیت از سرور بلو بانک استعلام و ثبت گردید.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در استعلام شماره کارت",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await apiRequest("PUT", "/api/blupal/gateway", payload);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "خطا در ذخیره تنظیمات");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blupal/gateway"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blupal/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blupal/transactions"] });
      toast({
        title: "تنظیمات ذخیره شد",
        description: data.isActive 
          ? "درگاه پرداخت اختصاصی شما فعال و به‌روزرسانی شد." 
          : "تنظیمات ذخیره شد.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ذخیره",
        description: err.message || "امکان ثبت تنظیمات وجود ندارد.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert Persian and Arabic digits to Latin numbers
    const normalized = e.target.value
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
    const raw = normalized.replace(/\D/g, "").slice(0, 16);
    const detectedBank = getBankNameFromCard(raw);
    setFormData((prev) => ({
      ...prev,
      cardNumber: raw,
      bankName: prev.bankName && prev.bankName !== getBankNameFromCard(prev.cardNumber) 
        ? prev.bankName 
        : (detectedBank || prev.bankName)
    }));
  };

  const formatCardDisplay = (cardNum: string) => {
    if (!cardNum) return "";
    const cleaned = cardNum.replace(/\s+/g, "");
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    return parts.join(" - ");
  };

  const activeSlug = formData.slug || user?.username || "user";
  const publicPaymentUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/pay/${activeSlug}`
    : `/pay/${activeSlug}`;

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/blupal/webhook`
    : `/api/blupal/webhook`;

  const copyPaymentLink = () => {
    navigator.clipboard.writeText(publicPaymentUrl);
    setCopiedLink(true);
    toast({
      title: "کپی شد",
      description: "لینک اختصاصی درگاه پرداخت در حافظه کپی شد.",
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast({
      title: "کپی شد",
      description: "آدرس وب‌هوک بلو بانک کپی شد.",
    });
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const isSubscriptionActive = user?.role !== "user_level_1" || 
    (userSubscription?.status === "active" && (userSubscription?.remainingDays ?? 0) > 0);

  if (user?.role === "user_level_1" && !subLoading && !isSubscriptionActive) {
    return (
      <DashboardLayout title="اشتراک منقضی شده">
        <div className="min-h-[60vh] md:min-h-0 flex items-center justify-center p-2 sm:p-4 md:py-8 text-right" dir="rtl">
          <ExpiredSubscriptionCard />
        </div>
      </DashboardLayout>
    );
  }

  const isGatewayActive = Boolean(formData.apiKey?.trim()) && formData.isActive;

  return (
    <DashboardLayout title="تنظیمات درگاه پرداخت">
      <div className="w-full max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-4 lg:space-y-6 pb-10 sm:pb-12 text-right" dir="rtl">
        
        {/* Clean Segmented Tabs (2 rows on mobile, 4 columns on desktop) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full text-right" dir="rtl">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 h-auto p-1.5 lg:p-2 bg-slate-100 dark:bg-zinc-800/80 rounded-xl lg:rounded-2xl w-full border border-slate-200/60 dark:border-zinc-700/50 gap-1.5 lg:gap-2">
            <TabsTrigger 
              value="api" 
              className="text-xs lg:text-sm font-semibold py-2.5 lg:py-3 px-3 rounded-lg lg:rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>اتصال و توکن</span>
            </TabsTrigger>
            <TabsTrigger 
              value="card" 
              className="text-xs lg:text-sm font-semibold py-2.5 lg:py-3 px-3 rounded-lg lg:rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>کارت مقصد</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="text-xs lg:text-sm font-semibold py-2.5 lg:py-3 px-3 rounded-lg lg:rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>صفحه پرداخت</span>
            </TabsTrigger>
            <TabsTrigger 
              value="woocommerce" 
              className="text-xs lg:text-sm font-semibold py-2.5 lg:py-3 px-3 rounded-lg lg:rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>افزونه وردپرس</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: API & CONNECTION */}
          <TabsContent value="api" className="mt-3 lg:mt-5 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
              {/* Main settings form */}
              <div className="lg:col-span-7 xl:col-span-8">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden text-right">
                  <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-5 text-right">
                    {/* API Key Input */}
                    <div className="space-y-1.5 text-right">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="apiKey" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 text-right">
                          کلید دسترسی (API Key بلو بانک) <span className="text-red-500">*</span>
                        </Label>
                      </div>
                      
                      <div className="relative flex items-center">
                        <Input
                          id="apiKey"
                          type={showApiKey ? "text" : "password"}
                          placeholder="blu_live_..."
                          value={formData.apiKey}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleInputChange("apiKey", val);
                            if (val.trim().length > 0 && !formData.isActive) {
                              handleInputChange("isActive", true);
                            }
                          }}
                          className="text-xs lg:text-sm h-10 lg:h-11 pr-3 pl-10 font-mono text-left rounded-xl border-slate-200 dark:border-zinc-800"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute left-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Test Connection Button */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] lg:text-xs text-slate-500 dark:text-zinc-400 text-right">
                          از پنل کاربری بلو بانک دریافت کنید
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!formData.apiKey.trim() || testConnectionMutation.isPending}
                          onClick={() => testConnectionMutation.mutate()}
                          className="h-8 px-3 text-[11px] lg:text-xs font-semibold rounded-lg border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 gap-1.5 cursor-pointer"
                        >
                          {testConnectionMutation.isPending ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>بررسی اتصال...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                              <span>تست اتصال به بلو بانک</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Gateway Active Switch */}
                    <div className="flex items-center justify-between p-3.5 lg:p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 text-right">
                      <div className="space-y-0.5 text-right">
                        <div className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 text-right">فعال‌سازی درگاه</div>
                        <div className="text-[11px] lg:text-xs text-slate-500 dark:text-zinc-400 text-right">
                          {formData.isActive ? "درگاه برای پرداخت مشتریان فعال است" : "درگاه در حالت غیرفعال قرار دارد"}
                        </div>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => {
                          if (checked && !formData.apiKey.trim()) {
                            toast({
                              title: "کلید API لازم است",
                              description: "لطفاً ابتدا کلید API بلو بانک را وارد کنید.",
                              variant: "destructive",
                            });
                            return;
                          }
                          handleInputChange("isActive", checked);
                        }}
                      />
                    </div>

                    {/* Webhook URL with 1-click copy */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800 text-right">
                      <Label className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right">
                        آدرس وب‌هوک بلو بانک (Webhook URL)
                      </Label>
                      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60">
                        <input
                          type="text"
                          readOnly
                          value={webhookUrl}
                          className="bg-transparent text-[11px] lg:text-xs text-slate-700 dark:text-zinc-300 flex-1 font-mono outline-none px-2 text-left"
                          dir="ltr"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={copyWebhookUrl}
                          className="h-8 px-2.5 text-xs rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-300 gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[11px] lg:text-xs">{copiedWebhook ? "کپی شد" : "کپی"}</span>
                        </Button>
                      </div>
                      <p className="text-[10px] lg:text-[11px] text-slate-400 text-right">
                        این آدرس را در پنل بلو بانک بخش وب‌هوک وارد کنید تا تراکنش‌ها آنی تایید شوند.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desktop Helper Card */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-slate-50/70 dark:bg-zinc-900/60 text-right">
                  <CardContent className="p-4 sm:p-5 space-y-3.5 text-right">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                      <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-bold text-xs lg:text-sm text-slate-800 dark:text-zinc-200">
                        راهنمای راه‌اندازی وب‌سرویس
                      </h3>
                    </div>

                    <div className="space-y-3 text-right text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          ۱
                        </span>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800 dark:text-zinc-200 text-right">دریافت API Key</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 text-right leading-relaxed">
                            در پنل بلو بانک وارد بخش وب‌سرویس شوید و کلید دسترسی اختصاصی خود را تولید کنید.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          ۲
                        </span>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800 dark:text-zinc-200 text-right">تنظیم وب‌هوک (Webhook)</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 text-right leading-relaxed">
                            آدرس وب‌هوک بالا را کپی کرده و در پنل بلو بانک ثبت کنید تا واریزها خودکار تایید شوند.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          ۳
                        </span>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800 dark:text-zinc-200 text-right">تست و فعال‌سازی</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 text-right leading-relaxed">
                            با کلیک روی «تست اتصال» ارتباط را سنجیده و سوئیچ فعال‌سازی را روشن کنید.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status overview */}
                    <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-zinc-400">وضعیت کلید API:</span>
                        <span className={formData.apiKey.trim() ? "text-emerald-600 font-semibold" : "text-amber-600"}>
                          {formData.apiKey.trim() ? "تنظیم شده" : "وارد نشده"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-zinc-400">وضعیت درگاه:</span>
                        <span className={isGatewayActive ? "text-emerald-600 font-semibold" : "text-amber-600"}>
                          {isGatewayActive ? "آماده دریافت واریزی" : "غیرفعال"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: DESTINATION CARD */}
          <TabsContent value="card" className="mt-3 lg:mt-5 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
              {/* Main inputs */}
              <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden text-right">
                  <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-5 text-right">
                    {/* Direct Blupal Sync Box */}
                    <div className="p-3.5 lg:p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-100 dark:border-blue-900/40 space-y-2.5 text-right">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200">
                            دریافت شماره کارت از بلو بانک
                          </span>
                        </div>
                        {formData.cardNumber ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1 font-medium">
                            <Lock className="w-3 h-3" /> متصل به بلو بانک
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] gap-1 font-medium">
                            <AlertTriangle className="w-3 h-3" /> شماره کارت نامشخص
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] lg:text-xs text-slate-600 dark:text-zinc-400 leading-relaxed text-right">
                        شماره کارت مقصد منحصراً از حساب بلو بانک شما دریافت می‌شود و جهت حفظ امنیت و تطابق وب‌هوک واریزی‌ها، امکان ویرایش دستی آن وجود ندارد.
                      </p>

                      <Button
                        type="button"
                        onClick={() => syncCardMutation.mutate()}
                        disabled={!formData.apiKey.trim() || syncCardMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs lg:text-sm font-bold h-9 lg:h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        {syncCardMutation.isPending ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>در حال دریافت شماره کارت از سرور بلو بانک...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>دریافت / به‌روزرسانی شماره کارت از بلو بانک</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Clean Card Number input */}
                    <div className="space-y-1.5 text-right">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cardNumber" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span>شماره کارت مقصد</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                            {formData.cardNumber ? "ثبت شده" : "نیازمند ثبت"}
                          </Badge>
                        </Label>
                        {formData.bankName && (
                          <span className="text-[11px] lg:text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {formData.bankName}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="cardNumber"
                          type="text"
                          maxLength={19}
                          placeholder="۶۰۳۷-۹۹۱۸-۱۲۳۴-۵۶۷۸ یا روی دکمه دریافت از بلو بانک کلیک کنید"
                          value={formData.cardNumber ? formatCardDisplay(formData.cardNumber) : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                            const autoBank = raw.length >= 6 ? getBankNameFromCard(raw) : "";
                            setFormData((prev) => ({
                              ...prev,
                              cardNumber: raw,
                              bankName: autoBank || prev.bankName,
                            }));
                          }}
                          className="text-sm lg:text-base h-11 lg:h-12 text-center font-mono rounded-xl tracking-wider font-bold bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 focus:border-indigo-500 pr-10 pl-3"
                          dir="ltr"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[10px] lg:text-[11px] text-slate-500 dark:text-zinc-500 text-right">
                        می‌توانید شماره کارت ۱۶ رقمی خود را دستی وارد کنید یا با دکمه بالا مستقیماً از بلو بانک دریافت و ذخیره فرمایید.
                      </p>
                    </div>

                    {/* Cardholder & Bank Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                      <div className="space-y-1.5 text-right">
                        <Label htmlFor="cardHolderName" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right flex items-center justify-between">
                          <span>نام صاحب کارت</span>
                          <span className="text-[9px] font-normal text-emerald-600 dark:text-emerald-400">قابل ویرایش</span>
                        </Label>
                        <Input
                          id="cardHolderName"
                          placeholder="نام و نام خانوادگی دارنده کارت"
                          value={formData.cardHolderName}
                          onChange={(e) => handleInputChange("cardHolderName", e.target.value)}
                          className="text-xs lg:text-sm h-10 lg:h-11 rounded-xl text-right font-medium border-slate-200 dark:border-zinc-800 focus:border-indigo-500"
                          dir="rtl"
                        />
                        <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-zinc-500 text-right">
                          نام نمایشی صاحب کارت در صفحه پرداخت
                        </p>
                      </div>

                      <div className="space-y-1.5 text-right">
                        <Label htmlFor="bankName" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right flex items-center justify-between">
                          <span>نام بانک</span>
                          <span className="text-[9px] font-normal text-slate-400">تشخیص خودکار</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="bankName"
                            placeholder="نام بانک صادرکننده کارت"
                            value={formData.bankName || (formData.cardNumber ? getBankNameFromCard(formData.cardNumber) : "")}
                            onChange={(e) => handleInputChange("bankName", e.target.value)}
                            className="text-xs lg:text-sm h-10 lg:h-11 rounded-xl text-right font-medium border-slate-200 dark:border-zinc-800"
                            dir="rtl"
                          />
                        </div>
                        <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-zinc-500 text-right">
                          بر اساس پیش‌شماره کارت به طور خودکار تعیین می‌شود
                        </p>
                      </div>
                    </div>

                    {/* Support Phone */}
                    <div className="space-y-1.5 text-right">
                      <Label htmlFor="supportPhone" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right">
                        شماره تماس پشتیبانی
                      </Label>
                      <div className="relative">
                        <Input
                          id="supportPhone"
                          type="tel"
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          value={formData.supportPhone}
                          onChange={(e) => handleInputChange("supportPhone", e.target.value)}
                          className="text-xs lg:text-sm h-10 lg:h-11 rounded-xl text-left font-mono pl-3 pr-9"
                          dir="ltr"
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[10px] lg:text-[11px] text-slate-500 dark:text-zinc-500 text-right">
                        در صفحه پرداخت به پرداخت‌کننده نمایش داده می‌شود تا در صورت بروز مشکل با شما تماس بگیرد.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desktop Bank Card Mockup & Security Preview */}
              <div className="lg:col-span-5 xl:col-span-5 space-y-4">
                {/* Visual Debit Card Mockup */}
                <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl border border-white/10 relative overflow-hidden transition-all">
                  {/* Decorative background glow */}
                  <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Card top row */}
                  <div className="flex items-center justify-between relative z-10 mb-6">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-300" />
                      <span className="font-bold text-sm tracking-wide text-indigo-100">
                        {formData.bankName || (formData.cardNumber ? getBankNameFromCard(formData.cardNumber) : "بانک صادرکننده")}
                      </span>
                    </div>
                    <Badge variant="outline" className="border-white/20 text-white/90 text-[10px] font-mono px-2 py-0.5">
                      عضوشتاب
                    </Badge>
                  </div>

                  {/* Blu Bank Logo */}
                  <div className="relative z-10 mb-4 flex items-center">
                    <img 
                      src="/images/blubank.webp" 
                      alt="بلو بانک" 
                      className="w-10 h-10 rounded-xl object-contain shadow-md border border-white/20" 
                    />
                  </div>

                  {/* 16 Digit Card Number */}
                  <div className="relative z-10 mb-5">
                    <span className="text-base sm:text-lg lg:text-xl font-mono font-bold tracking-widest block text-center select-all drop-shadow-sm" dir="ltr">
                      {formData.cardNumber ? formatCardDisplay(formData.cardNumber) : "••••  ••••  ••••  ••••"}
                    </span>
                  </div>

                  {/* Cardholder name & verified status */}
                  <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10 text-right">
                    <div>
                      <span className="text-[10px] text-indigo-200/70 block text-right">دارنده کارت</span>
                      <span className="text-xs sm:text-sm font-semibold text-white truncate block max-w-[180px]">
                        {formData.cardHolderName || "نام صاحب کارت"}
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-indigo-200/70 block text-left">تایید وب‌سرویس</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {formData.cardNumber ? "بلو بانک" : "نیازمند استعلام"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Security Note */}
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-slate-50/70 dark:bg-zinc-900/60 text-right">
                  <CardContent className="p-4 space-y-2 text-right">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <ShieldCheck className="w-4 h-4" />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        امنیت تطابق واریزی‌ها
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed text-right">
                      هنگام پرداخت, خریدار موظف به انتقال به همین شماره کارت است. به محض انتقال، سیستم به صورت وب‌هوک و هوشمند اطلاعات تراکنش را از بلو بانک دریافت کرده و سفارش را تکمیل می‌کند.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: PAYMENT PAGE CUSTOMIZATION */}
          <TabsContent value="appearance" className="mt-3 lg:mt-5 space-y-4">
            <div className="w-full space-y-4">
              {/* Form fields */}
              <div className="w-full space-y-4">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden text-right">
                  <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-5 text-right">
                    {/* Title & Slug (2 columns on desktop) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 lg:gap-4">
                      {/* Title */}
                      <div className="space-y-1.5 text-right">
                        <Label htmlFor="title" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right">
                          عنوان صفحه پرداخت
                        </Label>
                        <Input
                          id="title"
                          placeholder="مثال: درگاه پرداخت علی رضایی"
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          className="text-xs lg:text-sm h-10 lg:h-11 rounded-xl text-right"
                          dir="rtl"
                        />
                      </div>

                      {/* Slug */}
                      <div className="space-y-1.5 text-right">
                        <Label htmlFor="slug" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right">
                          شناسه اختصاصی آدرس (Slug)
                        </Label>
                        <div className="relative flex items-center" dir="ltr">
                          <span className="absolute left-3 text-xs text-slate-400 font-mono">/pay/</span>
                          <Input
                            id="slug"
                            placeholder="my-shop"
                            value={formData.slug}
                            onChange={(e) => handleInputChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                            className="text-xs lg:text-sm h-10 lg:h-11 pl-14 pr-3 rounded-xl font-mono text-left"
                            dir="ltr"
                          />
                        </div>

                        {/* Direct Payment Link Box */}
                        <div className="mt-2.5 p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1.5 text-right" dir="rtl">
                          <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold block text-right">
                            لینک مستقیم صفحه پرداخت شما:
                          </span>
                          <div className="flex items-center gap-1.5" dir="ltr">
                            <a
                              href={publicPaymentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 text-left block"
                              title="مشاهده مستقیم صفحه پرداخت"
                            >
                              {publicPaymentUrl}
                            </a>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={copyPaymentLink}
                              className="h-8 px-2.5 text-[11px] rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shrink-0 gap-1 cursor-pointer"
                            >
                              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedLink ? "کپی شد" : "کپی"}</span>
                            </Button>
                            <a href={publicPaymentUrl} target="_blank" rel="noreferrer">
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                className="h-8 px-2.5 text-[11px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 gap-1 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>مشاهده صفحه</span>
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Min / Max Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 lg:gap-4">
                      <div className="space-y-1.5 text-right">
                        <Label htmlFor="minAmount" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right">
                          حداقل مبلغ (تومان)
                        </Label>
                        <Input
                          id="minAmount"
                          type="text"
                          inputMode="numeric"
                          placeholder="۱۰,۰۰۰"
                          value={formatNumberWithCommas(formData.minAmount)}
                          onChange={(e) => handleInputChange("minAmount", parseCommaNumber(e.target.value))}
                          className="text-xs lg:text-sm h-10 lg:h-11 rounded-xl font-mono text-center"
                          dir="ltr"
                        />
                        {formData.minAmount && !isNaN(Number(formData.minAmount)) && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block text-right pr-1">
                            {Number(formData.minAmount).toLocaleString("fa-IR")} تومان
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 text-right">
                        <Label htmlFor="maxAmount" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right">
                          حداکثر مبلغ (تومان)
                        </Label>
                        <Input
                          id="maxAmount"
                          type="text"
                          inputMode="numeric"
                          placeholder="۵۰,۰۰۰,۰۰۰"
                          value={formatNumberWithCommas(formData.maxAmount)}
                          onChange={(e) => handleInputChange("maxAmount", parseCommaNumber(e.target.value))}
                          className="text-xs lg:text-sm h-10 lg:h-11 rounded-xl font-mono text-center"
                          dir="ltr"
                        />
                        {formData.maxAmount && !isNaN(Number(formData.maxAmount)) && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block text-right pr-1">
                            {Number(formData.maxAmount).toLocaleString("fa-IR")} تومان
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 text-right">
                      <Label htmlFor="description" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right">
                        متن راهنما برای پرداخت‌کننده
                      </Label>
                      <Textarea
                        id="description"
                        rows={2}
                        placeholder="توضیحات کوتاه در بالای صفحه درگاه..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className="text-xs lg:text-sm rounded-xl resize-none text-right"
                        dir="rtl"
                      />
                    </div>

                    {/* Success Message */}
                    <div className="space-y-1.5 text-right">
                      <Label htmlFor="successMessage" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 block text-right">
                        پیام پس از پرداخت موفق
                      </Label>
                      <Textarea
                        id="successMessage"
                        rows={2}
                        placeholder="پیام تشکر و پیگیری پس از پرداخت موفق..."
                        value={formData.successMessage}
                        onChange={(e) => handleInputChange("successMessage", e.target.value)}
                        className="text-xs lg:text-sm rounded-xl resize-none text-right"
                        dir="rtl"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: WORDPRESS & WOOCOMMERCE INTEGRATION */}
          <TabsContent value="woocommerce" className="mt-3 lg:mt-5 space-y-4">
            <div className="space-y-4 lg:space-y-6">
              {/* Plugin Download Hero Banner */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50/40 to-slate-50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-zinc-900 rounded-2xl p-4 sm:p-5 lg:p-6 border border-indigo-100/80 dark:border-indigo-900/40 text-right flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm shadow-indigo-600/30">
                    <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm lg:text-base text-slate-900 dark:text-zinc-100">
                      افزونه رسمی ووکامرس کارت به کارت خودکار
                    </h3>
                    <p className="text-[11px] lg:text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      اتصال فروشگاه وردپرسی به وب‌سرویس کارت به کارت با تسویه و تغییر خودکار وضعیت سفارش
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={downloadPluginZip}
                  disabled={isDownloadingPlugin}
                  className="w-full sm:w-auto h-10 lg:h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs lg:text-sm gap-2 shrink-0 shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${isDownloadingPlugin ? "animate-bounce" : ""}`} />
                  {isDownloadingPlugin ? "در حال آماده‌سازی و دانلود..." : "دانلود خودکار افزونه ووکامرس (ZIP)"}
                </Button>
              </div>

              {/* 2-Column Desktop Grid for Settings & Setup Guide */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
                {/* Server Base URL and API Endpoints Card */}
                <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                  <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden text-right">
                    <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-5 text-right">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                        <Globe2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div className="text-right">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">
                            تنظیمات اتصال افزونه ووکامرس به وب‌سرویس
                          </h3>
                          <p className="text-[10px] lg:text-[11px] text-slate-500 dark:text-zinc-400">
                            این مقادیر را در بخش پیکربندی تسویه حساب افزونه وردپرس وارد نمایید
                          </p>
                        </div>
                      </div>

                      {/* 1. API Base URL (Server URL) */}
                      <div className="space-y-1.5 text-right">
                        <Label className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          ۱. آدرس سرور جهت ست کردن در افزونه (Server URL)
                        </Label>

                        <div className="flex items-center gap-1.5">
                          <Input
                            readOnly
                            value={typeof window !== "undefined" ? window.location.origin : ""}
                            className="text-xs lg:text-sm h-10 lg:h-11 px-3 rounded-xl font-mono text-left bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 font-semibold text-blue-700 dark:text-blue-400 flex-1"
                            dir="ltr"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const url = typeof window !== "undefined" ? window.location.origin : "";
                              navigator.clipboard.writeText(url);
                              setCopiedServerUrl(true);
                              toast({ title: "کپی شد", description: "آدرس سرور API در حافظه کپی شد." });
                              setTimeout(() => setCopiedServerUrl(false), 2000);
                            }}
                            className="h-10 lg:h-11 px-3 rounded-xl text-xs gap-1.5 shrink-0 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 cursor-pointer"
                          >
                            {copiedServerUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="text-[11px] lg:text-xs">{copiedServerUrl ? "کپی شد" : "کپی آدرس سرور"}</span>
                          </Button>
                        </div>
                      </div>

                      {/* 2. API Key Box */}
                      <div className="space-y-1.5 text-right">
                        <Label htmlFor="wpApiKey" className="text-xs lg:text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          ۲. کلید اختصاصی اتصال افزونه (API Key)
                        </Label>

                        <div className="flex items-center gap-1.5">
                          <Input
                            id="wpApiKey"
                            readOnly
                            placeholder="هنوز کلیدی ایجاد نشده است..."
                            value={formData.wpApiKey || "کلیدی صادر نشده — روی دکمه «تولید کلید» کلیک کنید"}
                            className="text-xs lg:text-sm h-10 lg:h-11 px-3 rounded-xl font-mono text-left bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 font-semibold text-indigo-700 dark:text-indigo-400 flex-1"
                            dir="ltr"
                          />

                          {formData.wpApiKey && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                navigator.clipboard.writeText(formData.wpApiKey);
                                setCopiedWpKey(true);
                                toast({ title: "کپی شد", description: "کلید وب‌سرویس افزونه در حافظه کپی شد." });
                                setTimeout(() => setCopiedWpKey(false), 2000);
                              }}
                              className="h-10 lg:h-11 px-3 rounded-xl text-xs gap-1.5 shrink-0 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 cursor-pointer"
                            >
                              {copiedWpKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span className="text-[11px] lg:text-xs">{copiedWpKey ? "کپی شد" : "کپی کلید"}</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            disabled={generateWpKeyMutation.isPending}
                            onClick={() => generateWpKeyMutation.mutate()}
                            className="h-10 lg:h-11 px-3 rounded-xl text-xs gap-1.5 shrink-0 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${generateWpKeyMutation.isPending ? "animate-spin" : ""}`} />
                            <span className="text-[11px] lg:text-xs">{formData.wpApiKey ? "تغییر کلید" : "تولید کلید"}</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Installation steps guide */}
                <div className="lg:col-span-5 xl:col-span-5 space-y-4">
                  <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-slate-50/70 dark:bg-zinc-900/60 text-right">
                    <CardContent className="p-4 sm:p-5 space-y-3 text-right">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                        <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="font-bold text-xs lg:text-sm text-slate-800 dark:text-zinc-200">
                          مراحل نصب و فعال‌سازی در وردپرس
                        </h4>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                            ۱
                          </span>
                          <span className="text-slate-600 dark:text-zinc-300 text-right">
                            فایل افزونه (ZIP) را از دکمه بالا دانلود نمایید.
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                            ۲
                          </span>
                          <span className="text-slate-600 dark:text-zinc-300 text-right">
                            در وردپرس به بخش <strong>افزونه‌ها &gt; افزودن &gt; بارگذاری افزونه</strong> بروید و فایل را نصب کنید.
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                            ۳
                          </span>
                          <span className="text-slate-600 dark:text-zinc-300 text-right">
                            در منوی <strong>ووکامرس &gt; پیکربندی &gt; تسویه حساب &gt; کارت به کارت</strong> وارد شوید.
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                            ۴
                          </span>
                          <span className="text-slate-600 dark:text-zinc-300 text-right">
                            آدرس سرور و کلید API بالا را در فیلدهای مربوطه جای‌گذاری و ذخیره نمایید.
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Responsive Save Button directly under the settings tabs */}
        <div className="pt-2 lg:pt-4">
          <Button
            type="button"
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="w-full h-11 sm:h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm lg:text-base shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {saveMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                در حال ذخیره تغییرات...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                ذخیره تغییرات
              </>
            )}
          </Button>
        </div>

      </div>
    </DashboardLayout>
  );
}
