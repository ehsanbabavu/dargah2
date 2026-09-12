import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import { 
  Search, Globe, CheckCircle2, AlertTriangle, ArrowUpRight, Send, RefreshCw, 
  FileCode, Layers, ShieldCheck, Sparkles, ExternalLink, Copy, Check, Info, 
  BarChart3, FileText, CheckCheck, Zap, Activity, Clock, Settings, ArrowRight
} from "lucide-react";

interface SeoSettings {
  id: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string | null;
  canonicalUrl: string | null;
  googleSiteVerification: string | null;
  googleIndexingServiceAccountJson: string | null;
  bingSiteVerification: string | null;
  enableAutoIndexPosts: boolean;
  enableSitemap: boolean;
  enableRobotsTxt: boolean;
  robotsTxtContent: string | null;
  schemaType: string;
  schemaOrganizationName: string | null;
  schemaLogoUrl: string | null;
  openGraphImage: string | null;
  twitterHandle: string | null;
  lastSitemapGeneratedAt: string | null;
  lastGooglePingAt: string | null;
  totalGoogleSubmissions: number;
}

interface IndexingLog {
  id: string;
  url: string;
  type: string;
  status: string;
  engine: string;
  responseMessage: string | null;
  createdAt: string;
}

interface SeoOverviewResponse {
  healthScore: number;
  sitemapUrl: string;
  robotsUrl: string;
  homepageUrl: string;
  siteBaseUrl: string;
  settings: SeoSettings;
  recentLogs: IndexingLog[];
  lastGooglePingAt: string | null;
  totalGoogleSubmissions: number;
}

export default function SeoDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("google-indexing");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customInspectUrl, setCustomInspectUrl] = useState("");

  // Fetch SEO overview and settings
  const { data: overview, isLoading, refetch } = useQuery<SeoOverviewResponse>({
    queryKey: ["/api/seo/overview"],
    queryFn: async () => {
      const res = await fetch("/api/seo/overview");
      if (!res.ok) throw new Error("خطا در دریافت اطلاعات سئو");
      return res.json();
    },
  });

  // Local form state
  const [formData, setFormData] = useState<Partial<SeoSettings>>({});

  // Sync state when data loads
  const settings = overview?.settings;
  const currentSettings: Partial<SeoSettings> = {
    siteTitle: formData.siteTitle !== undefined ? formData.siteTitle : settings?.siteTitle || "",
    siteDescription: formData.siteDescription !== undefined ? formData.siteDescription : settings?.siteDescription || "",
    siteKeywords: formData.siteKeywords !== undefined ? formData.siteKeywords : settings?.siteKeywords || "",
    canonicalUrl: formData.canonicalUrl !== undefined ? formData.canonicalUrl : settings?.canonicalUrl || "",
    googleSiteVerification: formData.googleSiteVerification !== undefined ? formData.googleSiteVerification : settings?.googleSiteVerification || "",
    googleIndexingServiceAccountJson: formData.googleIndexingServiceAccountJson !== undefined ? formData.googleIndexingServiceAccountJson : settings?.googleIndexingServiceAccountJson || "",
    bingSiteVerification: formData.bingSiteVerification !== undefined ? formData.bingSiteVerification : settings?.bingSiteVerification || "",
    enableAutoIndexPosts: formData.enableAutoIndexPosts !== undefined ? formData.enableAutoIndexPosts : (settings?.enableAutoIndexPosts ?? true),
    enableSitemap: formData.enableSitemap !== undefined ? formData.enableSitemap : (settings?.enableSitemap ?? true),
    enableRobotsTxt: formData.enableRobotsTxt !== undefined ? formData.enableRobotsTxt : (settings?.enableRobotsTxt ?? true),
    robotsTxtContent: formData.robotsTxtContent !== undefined ? formData.robotsTxtContent : (settings?.robotsTxtContent || "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: /sitemap.xml"),
    schemaType: formData.schemaType !== undefined ? formData.schemaType : settings?.schemaType || "Organization",
    schemaOrganizationName: formData.schemaOrganizationName !== undefined ? formData.schemaOrganizationName : settings?.schemaOrganizationName || "",
    schemaLogoUrl: formData.schemaLogoUrl !== undefined ? formData.schemaLogoUrl : settings?.schemaLogoUrl || "",
    openGraphImage: formData.openGraphImage !== undefined ? formData.openGraphImage : settings?.openGraphImage || "",
    twitterHandle: formData.twitterHandle !== undefined ? formData.twitterHandle : settings?.twitterHandle || "",
  };

  // Save Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (updated: Partial<SeoSettings>) => {
      const res = await createAuthenticatedRequest("/api/seo/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("خطا در ذخیره تنظیمات");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seo/settings"] });
      toast({
        title: "تنظیمات سئو با موفقیت ذخیره شد",
        description: "تغییرات بر روی متاتگ‌ها و نقشه سایت اعمال گردید.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ذخیره‌سازی",
        description: err.message || "لطفاً مجدداً تلاش کنید.",
        variant: "destructive",
      });
    },
  });

  // Ping Google Mutation
  const pingGoogleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seo/ping-google", { method: "POST" });
      if (!res.ok) throw new Error("خطا در ارسال پینگ گوگل");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/overview"] });
      toast({
        title: "پینگ گوگل ارسال شد 🚀",
        description: data.details || "نقشه سایت در صف پردازش گوگل قرار گرفت.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت پینگ گوگل",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Index Homepage Mutation
  const indexHomepageMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seo/index-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "homepage" }),
      });
      if (!res.ok) throw new Error("خطا در ثبت صفحه اصلی");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/overview"] });
      toast({
        title: "صفحه اول سایت در گوگل ثبت شد ✅",
        description: "درخواست ثبت فوری به موتور گوگل ارسال شد.",
      });
    },
  });

  // Batch Index All Mutation
  const batchIndexMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seo/batch-index-all", { method: "POST" });
      if (!res.ok) throw new Error("خطا در ثبت دسته‌جمعی");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/overview"] });
      toast({
        title: "ثبت گروهی انجام شد 🌟",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت گروهی",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Submit custom URL
  const submitCustomUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/seo/index-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type: "custom" }),
      });
      if (!res.ok) throw new Error("خطا در ثبت آدرس");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/overview"] });
      setCustomInspectUrl("");
      toast({
        title: "آدرس ارسال شد",
        description: "آدرس سفارشی به صف بازبینی موتور گوگل افزوده شد.",
      });
    },
  });

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "کپی شد", description: "در حافظه موقت ذخیره گردید." });
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(currentSettings);
  };

  const healthScore = overview?.healthScore || 85;

  return (
    <DashboardLayout title="سئو و گوگل">
      <div className="p-4 sm:p-5 space-y-4 max-w-6xl mx-auto font-sans" dir="rtl">
        
        {/* Minimal Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0 border border-sky-500/20">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-foreground">سئو و ثبت در گوگل</h1>
                <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                  {healthScore}% امتیاز سئو
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ایندکس سریع در گوگل، ارسال خودکار نقشه سایت XML، بهینه‌سازی متاتگ‌ها و اسکیما
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>بروزرسانی</span>
            </Button>

            <Button
              size="sm"
              onClick={() => pingGoogleMutation.mutate()}
              disabled={pingGoogleMutation.isPending}
              variant="outline"
              className="h-8 text-xs gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{pingGoogleMutation.isPending ? "پینگ..." : "پینگ نقشه به گوگل"}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => indexHomepageMutation.mutate()}
              disabled={indexHomepageMutation.isPending}
              className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white gap-1.5 font-medium shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{indexHomepageMutation.isPending ? "ارسال..." : "ثبت آنی صفحه اول"}</span>
            </Button>
          </div>
        </div>

        {/* Minimal Stat Chips / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">سلامت سئو</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-600">{healthScore} از ۱۰۰ (عالی)</span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">ثبت در گوگل</span>
              <span className="text-xs font-bold text-foreground truncate block">
                {overview?.totalGoogleSubmissions || 0} درخواست موفق
              </span>
            </div>
            <div className="w-7 h-7 rounded-md bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">نقشه سایت</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-foreground">sitemap.xml</span>
                <span className="text-[10px] text-emerald-600 font-medium">(فعال)</span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-md bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <FileCode className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Minimal Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className="h-9 w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 bg-muted/50 p-0.5 rounded-lg border">
            <TabsTrigger value="google-indexing" className="text-xs h-8 px-2.5 data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <Search className="w-3.5 h-3.5 ml-1 text-sky-500" />
              ثبت در گوگل
            </TabsTrigger>
            <TabsTrigger value="sitemap-robots" className="text-xs h-8 px-2.5 data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <FileCode className="w-3.5 h-3.5 ml-1 text-emerald-500" />
              نقشه سایت و Robots
            </TabsTrigger>
            <TabsTrigger value="meta-tags" className="text-xs h-8 px-2.5 data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <Layers className="w-3.5 h-3.5 ml-1 text-amber-500" />
              متاتگ‌ها و SERP
            </TabsTrigger>
            <TabsTrigger value="schema-social" className="text-xs h-8 px-2.5 data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <Activity className="w-3.5 h-3.5 ml-1 text-purple-500" />
              اسکیما و لاگ‌ها
            </TabsTrigger>
          </TabsList>

          {/* 1. GOOGLE INDEXING TAB */}
          <TabsContent value="google-indexing" className="space-y-3 mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Left 2 Cols: Instant submission actions */}
              <div className="lg:col-span-2 space-y-3">
                <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="pb-2 border-b flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        ثبت سریع در گوگل (Google Indexing Submission)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        معرفی مستقیم آدرس‌های کلیدی سایت به الگوریتم‌های خزش گوگل
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Action 1: Homepage Submit */}
                    <div className="p-3 rounded-lg border bg-muted/15 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>صفحه اول سایت (Homepage)</span>
                          <Badge variant="outline" className="text-[10px] py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">اولویت ۱.۰</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate" dir="ltr">
                          {overview?.homepageUrl || "https://yoursite.com"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => indexHomepageMutation.mutate()}
                        disabled={indexHomepageMutation.isPending}
                        className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white shrink-0"
                      >
                        <Send className="w-3.5 h-3.5 ml-1" />
                        {indexHomepageMutation.isPending ? "ارسال..." : "ثبت فوری"}
                      </Button>
                    </div>

                    {/* Action 2: Live Custom URL Submission */}
                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-sky-500" />
                        ثبت و ایندکس آدرس دلخواه (Live URL Submission)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="مثال: https://yoursite.com/vitrin یا /faqs"
                          value={customInspectUrl}
                          onChange={(e) => setCustomInspectUrl(e.target.value)}
                          dir="ltr"
                          className="h-8 text-xs font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!customInspectUrl.trim()) {
                              toast({ title: "لطفاً آدرس را وارد کنید", variant: "destructive" });
                              return;
                            }
                            submitCustomUrlMutation.mutate(customInspectUrl.trim());
                          }}
                          disabled={submitCustomUrlMutation.isPending}
                          className="h-8 text-xs shrink-0 bg-sky-600 hover:bg-sky-700 text-white"
                        >
                          <Send className="w-3.5 h-3.5 ml-1" />
                          ارسال
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Search Console Meta Verification */}
                <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="pb-2 border-b">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      تاییدیه مالکیت در Google Search Console
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      کد تایید متاتگ را وارد کنید تا خودکار در هدر سایت قرار گیرد
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <Label htmlFor="googleSiteVerification" className="text-xs font-medium">
                        کد تاییدیه متا تگ گوگل (google-site-verification):
                      </Label>
                      <Input
                        id="googleSiteVerification"
                        placeholder="مثال: AbCdEfGhIjKlMnOpQrStUvWxYz1234567890"
                        value={currentSettings.googleSiteVerification || ""}
                        onChange={(e) => setFormData({ ...formData, googleSiteVerification: e.target.value })}
                        dir="ltr"
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="bingSiteVerification" className="text-xs font-medium">
                        کد تاییدیه بینگ وب‌مستر (اختیاری):
                      </Label>
                      <Input
                        id="bingSiteVerification"
                        placeholder="کد بینگ"
                        value={currentSettings.bingSiteVerification || ""}
                        onChange={(e) => setFormData({ ...formData, bingSiteVerification: e.target.value })}
                        dir="ltr"
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="pt-1 flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saveSettingsMutation.isPending}
                        className="h-8 text-xs"
                      >
                        <Check className="w-3.5 h-3.5 ml-1" />
                        ذخیره تاییدیه
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Console shortcuts & quick info */}
              <div className="space-y-3">
                <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="pb-2 border-b">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-600" />
                      ابزارهای مستقیم گوگل
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <span className="font-medium text-foreground">Google Search Console</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>

                    <a
                      href="https://pagespeed.web.dev/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <span className="font-medium text-foreground">PageSpeed Insights</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>

                    <a
                      href="https://search.google.com/test/rich-results"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <span className="font-medium text-foreground">تست داده‌های غنی (Rich Results)</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                <div className="bg-card border rounded-xl p-4 space-y-2.5 shadow-xs text-xs">
                  <div className="pb-2 border-b flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      تنظیمات خودکار
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground text-[11px]">آخرین پینگ:</span>
                      <span className="font-medium text-foreground text-[11px]">
                        {overview?.lastGooglePingAt ? new Date(overview.lastGooglePingAt).toLocaleDateString('fa-IR') : "ثبت نشده"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground text-[11px]">ایندکس خودکار مقالات:</span>
                      <Switch
                        checked={currentSettings.enableAutoIndexPosts}
                        onCheckedChange={(val) => {
                          setFormData({ ...formData, enableAutoIndexPosts: val });
                          saveSettingsMutation.mutate({ enableAutoIndexPosts: val });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 2. SITEMAP & ROBOTS TAB */}
          <TabsContent value="sitemap-robots" className="space-y-3 mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Sitemap */}
              <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
                <div className="pb-2 border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-indigo-500" />
                      نقشه سایت خودکار (XML Sitemap)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">پروتکل استاندارد sitemaps.org</p>
                  </div>
                  <Switch
                    checked={currentSettings.enableSitemap}
                    onCheckedChange={(val) => {
                      setFormData({ ...formData, enableSitemap: val });
                      saveSettingsMutation.mutate({ enableSitemap: val });
                    }}
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-muted/30 border flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 font-mono text-primary truncate" dir="ltr">
                    {overview?.sitemapUrl || "/sitemap.xml"}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2"
                      onClick={() => handleCopy(overview?.sitemapUrl || "", "sitemap")}
                    >
                      {copiedField === "sitemap" ? <Check className="w-3 h-3 ml-1 text-emerald-600" /> : <Copy className="w-3 h-3 ml-1" />}
                      کپی
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" asChild>
                      <a href="/sitemap.xml" target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3 ml-1" />
                        مشاهده
                      </a>
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => pingGoogleMutation.mutate()}
                  disabled={pingGoogleMutation.isPending}
                  className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  <Zap className="w-3.5 h-3.5 ml-1.5" />
                  {pingGoogleMutation.isPending ? "در حال ارسال..." : "ارسال پینگ فوری نقشه سایت به گوگل"}
                </Button>
              </div>

              {/* Robots.txt */}
              <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
                <div className="pb-2 border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      فایل راهنمای موتورها (robots.txt)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">دستورالعمل دسترسی خزنده‌ها</p>
                  </div>
                  <Switch
                    checked={currentSettings.enableRobotsTxt}
                    onCheckedChange={(val) => {
                      setFormData({ ...formData, enableRobotsTxt: val });
                      saveSettingsMutation.mutate({ enableRobotsTxt: val });
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Textarea
                    rows={4}
                    value={currentSettings.robotsTxtContent || ""}
                    onChange={(e) => setFormData({ ...formData, robotsTxtContent: e.target.value })}
                    dir="ltr"
                    className="font-mono text-xs leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                    <a href="/robots.txt" target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      مشاهده robots.txt زنده
                    </a>
                  </Button>
                  <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saveSettingsMutation.isPending}>
                    <Check className="w-3.5 h-3.5 ml-1" />
                    ذخیره robots.txt
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 4. META TAGS TAB */}
          <TabsContent value="meta-tags" className="space-y-3 mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Form */}
              <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
                <div className="pb-2 border-b">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-500" />
                    متاتگ‌های اصلی سایت
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">عنوان و توضیحات متا برای نمایش در نتایج گوگل</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="siteTitle" className="text-xs font-medium">عنوان سئو سایت (Meta Title):</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">{(currentSettings.siteTitle || "").length} / ۶۰</span>
                    </div>
                    <Input
                      id="siteTitle"
                      placeholder="عنوان جذاب سایت..."
                      value={currentSettings.siteTitle || ""}
                      onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="siteDescription" className="text-xs font-medium">توضیحات متا (Meta Description):</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">{(currentSettings.siteDescription || "").length} / ۱۶۰</span>
                    </div>
                    <Textarea
                      id="siteDescription"
                      rows={2}
                      placeholder="توضیحات مختصر..."
                      value={currentSettings.siteDescription || ""}
                      onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="siteKeywords" className="text-xs font-medium">کلمات کلیدی (با کاما جدا کنید):</Label>
                    <Input
                      id="siteKeywords"
                      placeholder="طراحی سایت, سئو, فروشگاه"
                      value={currentSettings.siteKeywords || ""}
                      onChange={(e) => setFormData({ ...formData, siteKeywords: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="canonicalUrl" className="text-xs font-medium">آدرس کانونیکال (Canonical URL):</Label>
                    <Input
                      id="canonicalUrl"
                      placeholder="https://yoursite.com"
                      value={currentSettings.canonicalUrl || ""}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      dir="ltr"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saveSettingsMutation.isPending}>
                      <Check className="w-3.5 h-3.5 ml-1" />
                      ذخیره متاتگ‌ها
                    </Button>
                  </div>
                </div>
              </div>

              {/* SERP Preview */}
              <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="pb-2 border-b">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-sky-500" />
                      پیش‌نمایش در نتایج گوگل (SERP Preview)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border shadow-2xs space-y-1 text-right" dir="ltr">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      <span className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">G</span>
                      <span className="font-mono truncate">{currentSettings.canonicalUrl || "https://yoursite.com"}</span>
                    </div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline leading-snug cursor-pointer truncate" dir="rtl">
                      {currentSettings.siteTitle || "عنوان سایت شما"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed" dir="rtl">
                      {currentSettings.siteDescription || "توضیحات سایت شما در این بخش برای کاربران گوگل نمایش داده می‌شود."}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>💡 استاندارد طول عنوان: ۴۰ تا ۶۰ کاراکتر</span>
                  <span>توضیحات: ۱۲۰ تا ۱۶۰ کاراکتر</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 5. SCHEMA & LOGS TAB */}
          <TabsContent value="schema-social" className="space-y-3 mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Schema */}
              <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
                <div className="pb-2 border-b">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    داده‌های ساختاریافته (Schema JSON-LD)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">افزایش شانس نمایش نتایج ستاره‌دار و غنی</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="schemaType" className="text-xs font-medium">نوع هویت سایت:</Label>
                    <Select
                      value={currentSettings.schemaType}
                      onValueChange={(val) => setFormData({ ...formData, schemaType: val })}
                    >
                      <SelectTrigger id="schemaType" className="h-8 text-xs">
                        <SelectValue placeholder="انتخاب نوع اسکیما" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Organization">سازمان / شرکت (Organization)</SelectItem>
                        <SelectItem value="WebSite">وب‌سایت عمومی (WebSite)</SelectItem>
                        <SelectItem value="LocalBusiness">کسب‌وکار محلی (LocalBusiness)</SelectItem>
                        <SelectItem value="Store">فروشگاه آنلاین (Store)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="schemaOrganizationName" className="text-xs font-medium">نام برند / کسب‌وکار:</Label>
                    <Input
                      id="schemaOrganizationName"
                      value={currentSettings.schemaOrganizationName || ""}
                      onChange={(e) => setFormData({ ...formData, schemaOrganizationName: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="openGraphImage" className="text-xs font-medium">تصویر شبکه‌های اجتماعی (OG Image URL):</Label>
                    <Input
                      id="openGraphImage"
                      placeholder="https://yoursite.com/og.jpg"
                      value={currentSettings.openGraphImage || ""}
                      onChange={(e) => setFormData({ ...formData, openGraphImage: e.target.value })}
                      dir="ltr"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saveSettingsMutation.isPending}>
                      <Check className="w-3.5 h-3.5 ml-1" />
                      ذخیره اسکیما
                    </Button>
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
                <div className="pb-2 border-b">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-500" />
                    تاریخچه درخواست‌های ایندکس گوگل
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">گزارش آخرین پینگ‌ها و درخواست‌های ثبت</p>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y text-xs">
                  {overview?.recentLogs && overview.recentLogs.length > 0 ? (
                    overview.recentLogs.map((log) => (
                      <div key={log.id} className="py-2 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[9px] py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono">
                              {log.engine}
                            </Badge>
                            <span className="font-semibold">{log.type === "homepage" ? "صفحه اصلی" : log.type === "sitemap" ? "نقشه سایت" : "مقاله"}</span>
                          </div>
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(log.createdAt).toLocaleTimeString('fa-IR')}
                          </span>
                        </div>
                        <div className="font-mono text-muted-foreground text-[11px] truncate" dir="ltr">
                          {log.url}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      هنوز گزارشی ثبت نشده است.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
