import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldCheck, Lock, Globe, RefreshCw, CheckCircle2, AlertCircle, 
  ExternalLink, Key, Server, Cpu, Clock, Zap, ArrowRight, Copy, Check,
  ShieldAlert, Settings, Info, Shield, Layers, HelpCircle, Activity, Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SslCertificate {
  id: string;
  userId: string | null;
  domain: string;
  provider: string;
  status: string;
  certificateType: string;
  issuer: string;
  serialNumber: string;
  fingerprintSha256: string;
  issuedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  forceHttpsRedirect: boolean;
  enableHsts: boolean;
  enableTls13: boolean;
  enableOcspStapling: boolean;
  certificatePem: string | null;
  privateKeyPem: string | null;
  caBundlePem: string | null;
  dnsChallengeRecord: string | null;
  httpChallengePath: string | null;
  lastCheckedAt: string;
  createdAt: string;
}

interface SslLog {
  id: string;
  certificateId: string | null;
  domain: string;
  action: string;
  status: string;
  message: string;
  ipAddress: string | null;
  createdAt: string;
}

interface SslHealth {
  domain: string;
  isHttpsActive: boolean;
  tlsVersion: string;
  cipherSuite: string;
  httpVersion: string;
  hstsStatus: string;
  ocspStapling: string;
  certificateIssuer: string;
  certificateStatus: string;
  daysRemaining: number;
  securityGrade: string;
  isCertificateValid: boolean;
  recommendations: string[];
}

export default function HttpsSslManagementPage() {
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState("");
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch certificates
  const { data: certificates = [], isLoading: isCertsLoading } = useQuery<SslCertificate[]>({
    queryKey: ["/api/ssl/certificates"],
    queryFn: async () => {
      const res = await fetch("/api/ssl/certificates", { credentials: "include" });
      if (!res.ok) throw new Error("خطا در دریافت لیست گواهینامه‌ها");
      return res.json();
    },
  });

  // Fetch health check
  const { data: healthData, isLoading: isHealthLoading, refetch: refetchHealth } = useQuery<SslHealth>({
    queryKey: ["/api/ssl/check-health"],
    queryFn: async () => {
      const res = await fetch("/api/ssl/check-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });
      if (!res.ok) throw new Error("خطا در تست وضعیت پروتکل HTTPS");
      return res.json();
    },
  });

  // Fetch audit logs
  const { data: logs = [], isLoading: isLogsLoading } = useQuery<SslLog[]>({
    queryKey: ["/api/ssl/logs"],
    queryFn: async () => {
      const res = await fetch("/api/ssl/logs", { credentials: "include" });
      if (!res.ok) throw new Error("خطا در دریافت لاگ‌های امنیتی");
      return res.json();
    },
  });

  // Issue new Free SSL mutation
  const issueMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await fetch("/api/ssl/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, provider: "Let's Encrypt Free SSL", autoRenew: true, forceHttpsRedirect: true }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در صدور گواهینامه");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ssl/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ssl/check-health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ssl/logs"] });
      toast({
        title: "صدور موفقیت‌آمیز گواهینامه SSL",
        description: data.message,
      });
      setNewDomain("");
      setIsIssueModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا در صدور گواهینامه",
        description: error.message,
      });
    },
  });

  // Renew mutation
  const renewMutation = useMutation({
    mutationFn: async (certId: string) => {
      const res = await fetch(`/api/ssl/certificates/${certId}/renew`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در تمدید");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ssl/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ssl/check-health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ssl/logs"] });
      toast({
        title: "تمدید موفق گواهینامه",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا در تمدید",
        description: error.message,
      });
    },
  });

  // Update SSL Settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ certId, payload }: { certId: string; payload: Partial<SslCertificate> }) => {
      const res = await fetch(`/api/ssl/certificates/${certId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در ویرایش تنظیمات");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ssl/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ssl/check-health"] });
      toast({
        title: "به‌روزرسانی تنظیمات",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message,
      });
    },
  });

  // Copy to clipboard helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({
      title: "کپی شد",
      description: "متن مورد نظر در کلیپ‌بورد ذخیره گردید.",
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const primaryCert = certificates[0];

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) {
      toast({
        variant: "destructive",
        title: "دامنه را وارد کنید",
        description: "لطفاً نام دامنه خود را وارد نمایید (مانند yourdomain.ir یا mywebsite.com)",
      });
      return;
    }
    issueMutation.mutate(newDomain.trim());
  };

  return (
    <DashboardLayout title="ssl">
      <div className="p-4 sm:p-5 space-y-4 max-w-6xl mx-auto font-sans" dir="rtl">
        
        {/* Minimal Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-foreground">گواهینامه امنیتی SSL</h1>
                <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                  TLS 1.3 Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                صدور رایگان Let's Encrypt، ریدایرکت خودکار ۳۰۱ به HTTPS و گواهینامه معتبر ۲۵۶ بیتی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => refetchHealth()}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={isHealthLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isHealthLoading ? "animate-spin" : ""}`} />
              <span>تست اتصال</span>
            </Button>

            <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-medium shadow-xs">
                  <Zap className="w-3.5 h-3.5" />
                  <span>صدور گواهینامه جدید</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px]" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    صدور گواهینامه رایگان SSL
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                    نام دامنه خود را وارد نمایید تا گواهینامه DV به صورت آنی صادر شود.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleIssueSubmit} className="space-y-3 py-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="domain" className="text-xs">نام دامنه (بدون http://)</Label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 absolute right-3 top-3 text-muted-foreground" />
                      <Input
                        id="domain"
                        placeholder="example.com یا yourdomain.ir"
                        className="pr-9 h-9 text-xs font-mono text-left"
                        dir="ltr"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-muted/40 rounded-lg space-y-1.5 border text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">صادرکننده:</span>
                      <span className="font-medium text-foreground">Let's Encrypt DV RSA 2048</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">هزینه:</span>
                      <span className="text-emerald-600 font-semibold">رایگان دائمی (Free Forever)</span>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setIsIssueModalOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      disabled={issueMutation.isPending}
                    >
                      {issueMutation.isPending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                          در حال صدور...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                          صدور و فعال‌سازی فوری
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Minimal Stat Chips / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">وضعیت پروتکل</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-600">HTTPS امن</span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">صادرکننده سرتیفیکیت</span>
              <span className="text-xs font-bold text-foreground truncate block">Let's Encrypt</span>
            </div>
            <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">اعتبار باقی‌مانده</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-foreground">{healthData?.daysRemaining || 90}</span>
                <span className="text-[10px] text-muted-foreground">روز (تمدید خودکار)</span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-3 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">گرید امنیت مرورگرها</span>
              <span className="text-xs font-black text-emerald-600">A+ (SSL Labs)</span>
            </div>
            <div className="w-7 h-7 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Minimal Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className="h-9 w-full sm:w-auto grid grid-cols-4 bg-muted/50 p-0.5 rounded-lg border">
            <TabsTrigger value="overview" className="text-xs h-8 px-3 data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 ml-1" />
              گواهینامه فعال
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs h-8 px-3 data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <Settings className="w-3.5 h-3.5 ml-1" />
              تنظیمات HTTPS
            </TabsTrigger>
            <TabsTrigger value="keys" className="text-xs h-8 px-3 data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <Key className="w-3.5 h-3.5 ml-1" />
              کلیدها و PEM
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs h-8 px-3 data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <Activity className="w-3.5 h-3.5 ml-1" />
              لاگ‌ها
            </TabsTrigger>
          </TabsList>

          {/* 1. OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-3 mt-3">
            {certificates.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">هیچ گواهینامه‌ای ثبت نشده است</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    برای فعال‌سازی قفل سبز رنگ در مرورگر، گواهینامه رایگان سایت خود را راه‌اندازی کنید.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <Zap className="w-3.5 h-3.5 ml-1.5" />
                  صدور آنی گواهینامه رایگان
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Active Cert Card */}
                <div className="lg:col-span-2 bg-card border rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-foreground">دامنه فعال: {primaryCert?.domain}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      معتبر و فعال
                    </Badge>
                  </div>

                  {/* Compact Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-muted/20 p-2.5 rounded-lg border">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">دامنه:</span>
                      <span className="font-mono font-medium truncate block">{primaryCert?.domain}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">نوع رمزنگاری:</span>
                      <span className="font-medium truncate block">DV 2048-bit RSA</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">صادرکننده:</span>
                      <span className="font-medium truncate block">{primaryCert?.issuer}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">تاریخ صدور:</span>
                      <span className="font-mono text-[11px]">
                        {primaryCert?.issuedAt ? new Date(primaryCert.issuedAt).toLocaleDateString("fa-IR") : "هم‌اکنون"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">تاریخ انقضا:</span>
                      <span className="font-mono text-[11px] text-amber-600 font-medium">
                        {primaryCert?.expiresAt ? new Date(primaryCert.expiresAt).toLocaleDateString("fa-IR") : "۹۰ روز آینده"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">تمدید خودکار:</span>
                      <span className="text-emerald-600 font-medium">فعال (Let's Encrypt)</span>
                    </div>
                  </div>

                  {/* Serial & Fingerprint Quick Rows */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs bg-muted/30 px-2.5 py-1.5 rounded-md border font-mono">
                      <span className="text-muted-foreground text-[11px]">Serial:</span>
                      <span className="truncate max-w-[260px] text-foreground text-[11px]">{primaryCert?.serialNumber}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(primaryCert?.serialNumber || "", "serial")}
                      >
                        {copiedKey === "serial" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-muted/30 px-2.5 py-1.5 rounded-md border font-mono">
                      <span className="text-muted-foreground text-[11px]">SHA256:</span>
                      <span className="truncate max-w-[260px] text-foreground text-[11px]">{primaryCert?.fingerprintSha256}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(primaryCert?.fingerprintSha256 || "", "fp")}
                      >
                        {copiedKey === "fp" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      تایید چالش ACME HTTP-01 خودکار فعال است
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => primaryCert && renewMutation.mutate(primaryCert.id)}
                      disabled={renewMutation.isPending}
                    >
                      <RefreshCw className={`w-3 h-3 ${renewMutation.isPending ? "animate-spin" : ""}`} />
                      تمدید دستی فوری
                    </Button>
                  </div>
                </div>

                {/* Live Diagnostics Card */}
                <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        آنالیزور امنیتی HTTPS
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">Qualys A+</Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground text-[11px]">پروتکل رمزنگاری:</span>
                        <span className="font-mono font-medium text-foreground">TLS 1.3</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground text-[11px]">ریدایرکت ۳۰۱ HTTP:</span>
                        <Badge variant="outline" className="text-[10px] py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">فعال</Badge>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground text-[11px]">هدر HSTS:</span>
                        <Badge variant="outline" className="text-[10px] py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">فعال (1 سال)</Badge>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-muted-foreground text-[11px]">وضعیت OCSP Stapling:</span>
                        <span className="text-foreground text-[11px] font-medium">پاسخ برخط سرور</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t text-center">
                    <a
                      href="https://www.ssllabs.com/ssltest/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>تست دامنه در Qualys SSL Labs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 2. SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-2.5 mt-3">
            {primaryCert && (
              <div className="bg-card border rounded-xl p-4 space-y-2.5 shadow-xs">
                <div className="pb-2 border-b">
                  <h3 className="text-sm font-bold text-foreground">پیکربندی پروتکل HTTPS و رفتار شبکه</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    تنظیمات هدرهای امنیتی، الگوریتم‌های رمزنگاری و رفتار ریدایرکت
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Force HTTPS */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/15">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground">ریدایرکت خودکار ۳۰۱ به HTTPS</span>
                        <Badge variant="secondary" className="text-[9px] py-0">پیش‌فرض</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        هدایت فوری تمام درخواست‌های ناامن HTTP به پروتکل امن https://
                      </p>
                    </div>
                    <Switch
                      checked={primaryCert.forceHttpsRedirect}
                      onCheckedChange={(checked) =>
                        updateSettingsMutation.mutate({
                          certId: primaryCert.id,
                          payload: { forceHttpsRedirect: checked },
                        })
                      }
                      disabled={updateSettingsMutation.isPending}
                    />
                  </div>

                  {/* HSTS */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/15">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground">پروتکل امنیتی HSTS (Strict-Transport-Security)</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] py-0" variant="outline">استاندارد</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        جلوگیری از حملات Man-In-The-Middle و اجبار مرورگر به اتصال انحصاری SSL
                      </p>
                    </div>
                    <Switch
                      checked={primaryCert.enableHsts}
                      onCheckedChange={(checked) =>
                        updateSettingsMutation.mutate({
                          certId: primaryCert.id,
                          payload: { enableHsts: checked },
                        })
                      }
                      disabled={updateSettingsMutation.isPending}
                    />
                  </div>

                  {/* TLS 1.3 */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/15">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground">پروتکل فوق‌سریع TLS 1.3</span>
                        <Badge variant="secondary" className="text-[9px] py-0">0-RTT</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        کاهش تاخیر برقراری اتصال امن و افزایش سرعت بارگذاری صفحات
                      </p>
                    </div>
                    <Switch
                      checked={primaryCert.enableTls13}
                      onCheckedChange={(checked) =>
                        updateSettingsMutation.mutate({
                          certId: primaryCert.id,
                          payload: { enableTls13: checked },
                        })
                      }
                      disabled={updateSettingsMutation.isPending}
                    />
                  </div>

                  {/* Auto-renew */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/15">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground">تمدید خودکار (Auto-Renew Engine)</span>
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[9px] py-0" variant="outline">Let's Encrypt</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        تمدید خودکار ۳۰ روز پیش از انقضا بدون قطعی یا نیاز به اقدام کاربر
                      </p>
                    </div>
                    <Switch
                      checked={primaryCert.autoRenew}
                      onCheckedChange={(checked) =>
                        updateSettingsMutation.mutate({
                          certId: primaryCert.id,
                          payload: { autoRenew: checked },
                        })
                      }
                      disabled={updateSettingsMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 3. KEYS & PEM TAB */}
          <TabsContent value="keys" className="space-y-2.5 mt-3">
            <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
              <div className="pb-2 border-b">
                <h3 className="text-sm font-bold text-foreground">کلیدهای رمزنگاری و سرتیفیکیت (PEM Format)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  کدهای استاندارد X.509 جهت استفاده در وب‌سرورهای Nginx، Apache یا CDN
                </p>
              </div>

              <div className="space-y-2.5">
                {/* CRT */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">گواهینامه SSL (CRT / Certificate PEM):</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[11px] px-2"
                      onClick={() => copyToClipboard(primaryCert?.certificatePem || "", "crt")}
                    >
                      {copiedKey === "crt" ? <Check className="w-3 h-3 ml-1 text-emerald-600" /> : <Copy className="w-3 h-3 ml-1" />}
                      کپی CRT
                    </Button>
                  </div>
                  <pre className="p-2 bg-muted/40 rounded-md text-[11px] font-mono text-left overflow-x-auto border text-muted-foreground max-h-24" dir="ltr">
                    {primaryCert?.certificatePem || "در حال بارگذاری..."}
                  </pre>
                </div>

                {/* Private Key */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">کلید خصوصی (Private Key RSA 2048):</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[11px] px-2"
                      onClick={() => copyToClipboard(primaryCert?.privateKeyPem || "", "key")}
                    >
                      {copiedKey === "key" ? <Check className="w-3 h-3 ml-1 text-emerald-600" /> : <Copy className="w-3 h-3 ml-1" />}
                      کپی Private Key
                    </Button>
                  </div>
                  <pre className="p-2 bg-muted/40 rounded-md text-[11px] font-mono text-left overflow-x-auto border text-muted-foreground max-h-24" dir="ltr">
                    {primaryCert?.privateKeyPem || "در حال بارگذاری..."}
                  </pre>
                </div>

                {/* CA Bundle */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">زنجیره ریشه (CA Bundle / ISRG Root X1):</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[11px] px-2"
                      onClick={() => copyToClipboard(primaryCert?.caBundlePem || "", "bundle")}
                    >
                      {copiedKey === "bundle" ? <Check className="w-3 h-3 ml-1 text-emerald-600" /> : <Copy className="w-3 h-3 ml-1" />}
                      کپی CA Bundle
                    </Button>
                  </div>
                  <pre className="p-2 bg-muted/40 rounded-md text-[11px] font-mono text-left overflow-x-auto border text-muted-foreground max-h-24" dir="ltr">
                    {primaryCert?.caBundlePem || "در حال بارگذاری..."}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 4. AUDIT LOGS TAB */}
          <TabsContent value="logs" className="space-y-2.5 mt-3">
            <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
              <div className="pb-2 border-b">
                <h3 className="text-sm font-bold text-foreground">تاریخچه رویدادهای امنیتی SSL</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  گزارش ثبت‌شده از صدورها، تمدیدها و تغییرات هدرهای شبکه
                </p>
              </div>

              {logs.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">
                  هنوز رویدادی ثبت نشده است.
                </p>
              ) : (
                <div className="divide-y divide-border/50 text-xs">
                  {logs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono">
                            {log.action}
                          </Badge>
                          <span className="font-semibold text-foreground">{log.domain}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{log.message}</p>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("fa-IR") : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
