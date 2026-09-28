import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import { 
  ShieldCheck, ShieldAlert, Lock, Unlock, Search, Globe, 
  CreditCard, Key, Copy, Check, Edit, RefreshCw, AlertCircle, 
  CheckCircle2, User, Phone, Sparkles, ExternalLink, Shield
} from "lucide-react";

interface GatewayAdminItem {
  gateway: {
    id: string;
    userId: string;
    apiKey: string | null;
    isActive: boolean;
    title: string | null;
    description: string | null;
    cardNumber: string | null;
    cardHolderName: string | null;
    bankName: string | null;
    supportPhone: string | null;
    slug: string | null;
    wpApiKey: string | null;
    wpAuthorizedDomain: string | null;
    wpCallbackUrl: string | null;
    minAmount: string | null;
    maxAmount: string | null;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    email: string | null;
    role: string;
  };
}

export default function AdminGatewayManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterLockStatus, setFilterLockStatus] = useState<"all" | "locked" | "unlocked">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Domain edit modal
  const [editingDomainItem, setEditingDomainItem] = useState<GatewayAdminItem | null>(null);
  const [domainInput, setDomainInput] = useState("");

  // Full gateway edit modal
  const [editingGatewayItem, setEditingGatewayItem] = useState<GatewayAdminItem | null>(null);
  const [gatewayFormData, setGatewayFormData] = useState({
    title: "",
    cardNumber: "",
    cardHolderName: "",
    bankName: "",
    wpAuthorizedDomain: "",
    minAmount: "10000",
    maxAmount: "50000000",
    isActive: true,
  });

  const { data: gateways = [], isLoading, isRefetching, refetch } = useQuery<GatewayAdminItem[]>({
    queryKey: ["/api/admin/gateways"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/gateways");
      if (!res.ok) throw new Error("خطا در دریافت لیست درگاه‌ها");
      return res.json();
    },
  });

  // Mutation to update domain specifically
  const updateDomainMutation = useMutation({
    mutationFn: async ({ userId, domain }: { userId: string; domain: string | null }) => {
      const res = await createAuthenticatedRequest(`/api/admin/gateways/${userId}/domain`, {
        method: "PUT",
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در بروزرسانی دامنه");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gateways"] });
      setEditingDomainItem(null);
      toast({
        title: "موفقیت‌آمیز",
        description: data.message || "دامنه مجاز درگاه با موفقیت بروزرسانی شد.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در تغییر دامنه",
        variant: "destructive",
      });
    },
  });

  // Mutation for full gateway settings update
  const updateGatewayMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const res = await createAuthenticatedRequest(`/api/admin/gateways/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "خطا در ذخیره تنظیمات");
      return resData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gateways"] });
      setEditingGatewayItem(null);
      toast({
        title: "موفقیت",
        description: data.message || "تنظیمات درگاه با موفقیت ذخیره شد.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ذخیره درگاه",
        variant: "destructive",
      });
    },
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({
      title: "کپی شد",
      description: "کلید وب‌سرویس در حافظه کپی گردید.",
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openDomainDialog = (item: GatewayAdminItem) => {
    setEditingDomainItem(item);
    setDomainInput(item.gateway.wpAuthorizedDomain || "");
  };

  const openGatewayDialog = (item: GatewayAdminItem) => {
    setEditingGatewayItem(item);
    setGatewayFormData({
      title: item.gateway.title || "",
      cardNumber: item.gateway.cardNumber || "",
      cardHolderName: item.gateway.cardHolderName || "",
      bankName: item.gateway.bankName || "",
      wpAuthorizedDomain: item.gateway.wpAuthorizedDomain || "",
      minAmount: item.gateway.minAmount || "10000",
      maxAmount: item.gateway.maxAmount || "50000000",
      isActive: item.gateway.isActive !== false,
    });
  };

  const filteredGateways = gateways.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      item.user.username?.toLowerCase().includes(term) ||
      item.user.firstName?.toLowerCase().includes(term) ||
      item.user.lastName?.toLowerCase().includes(term) ||
      item.user.phone?.includes(term) ||
      item.gateway.title?.toLowerCase().includes(term) ||
      item.gateway.wpAuthorizedDomain?.toLowerCase().includes(term);

    const isLocked = Boolean(item.gateway.wpAuthorizedDomain);
    const matchesLock =
      filterLockStatus === "all" ||
      (filterLockStatus === "locked" && isLocked) ||
      (filterLockStatus === "unlocked" && !isLocked);

    return matchesSearch && matchesLock;
  });

  const totalCount = gateways.length;
  const lockedCount = gateways.filter((g) => Boolean(g.gateway.wpAuthorizedDomain)).length;
  const unlockedCount = totalCount - lockedCount;

  return (
    <DashboardLayout title="مدیریت درگاه‌های کاربران و قفل دامنه‌ها">
      <div className="space-y-6 pb-12" dir="rtl">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
          <div className="space-y-1">
            <h1 className="text-xl font-black flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              مدیریت درگاه‌های پرداخت و قفل دامنه‌های مجاز
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              مشاهده وضعیت درگاه‌های ووکامرس کاربران، قفل امنیتی دامنه‌ها و تغییر دامنه مجاز هر کاربر توسط مدیریت.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-1.5 text-xs rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              بروزرسانی
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1 text-right">
                <p className="text-xs text-muted-foreground">کل درگاه‌های کاربران</p>
                <p className="text-2xl font-black text-foreground">{totalCount}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1 text-right">
                <p className="text-xs text-muted-foreground">دامنه‌های قفل شده (امن)</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{lockedCount}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1 text-right">
                <p className="text-xs text-muted-foreground">دامنه‌های آزاد / ثبت‌نشده</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{unlockedCount}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Unlock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <Card className="rounded-2xl border-border shadow-xs">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="جستجو بر اساس نام، نام کاربری، موبایل یا دامنه..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9 h-10 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">وضعیت قفل دامنه:</Label>
                <Select
                  value={filterLockStatus}
                  onValueChange={(val: any) => setFilterLockStatus(val)}
                >
                  <SelectTrigger className="h-10 text-xs w-full sm:w-44 rounded-xl">
                    <SelectValue placeholder="همه موارد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه درگاه‌ها</SelectItem>
                    <SelectItem value="locked">فقط دامنه‌های قفل‌شده</SelectItem>
                    <SelectItem value="unlocked">فقط دامنه‌های آزاد/ثبت‌نشده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gateways Table */}
        <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
          <CardHeader className="p-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">لیست درگاه‌های کاربران سطح ۱</CardTitle>
              <CardDescription className="text-xs">
                جهت تغییر دامنه قفل‌شده هر کاربر روی دکمه «مدیریت دامنه» کلیک نمایید.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {filteredGateways.length} درگاه
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span>در حال بارگذاری لیست درگاه‌ها...</span>
              </div>
            ) : filteredGateways.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                هیچ درگاهی با مشخصات جستجو شده یافت نشد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right text-xs">کاربر پذیرنده</TableHead>
                      <TableHead className="text-right text-xs">عنوان درگاه و اسلاگ</TableHead>
                      <TableHead className="text-right text-xs">وضعیت درگاه</TableHead>
                      <TableHead className="text-right text-xs">شماره کارت مقصد</TableHead>
                      <TableHead className="text-right text-xs">دامنه مجاز (قفل امنیتی)</TableHead>
                      <TableHead className="text-right text-xs">کلید API ووکامرس</TableHead>
                      <TableHead className="text-center text-xs">عملیات مدیریت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGateways.map((item) => {
                      const isLocked = Boolean(item.gateway.wpAuthorizedDomain);
                      const userFullName = `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() || item.user.username;

                      return (
                        <TableRow key={item.gateway.id || item.user.id} className="hover:bg-muted/20">
                          {/* User info */}
                          <TableCell className="text-right">
                            <div className="space-y-0.5">
                              <div className="font-bold text-xs flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                {userFullName}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                                @{item.user.username}
                              </div>
                              {item.user.phone && (
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span dir="ltr">{item.user.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Gateway title & slug */}
                          <TableCell className="text-right">
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-foreground">
                                {item.gateway.title || "درگاه پرداخت"}
                              </div>
                              {item.gateway.slug && (
                                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono" dir="ltr">
                                  /pay/{item.gateway.slug}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Active status */}
                          <TableCell className="text-right">
                            {item.gateway.isActive !== false ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                                فعال
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px]">
                                غیرفعال
                              </Badge>
                            )}
                          </TableCell>

                          {/* Card Number */}
                          <TableCell className="text-right">
                            {item.gateway.cardNumber ? (
                              <div className="space-y-0.5">
                                <div className="font-mono text-xs text-foreground tracking-wider" dir="ltr">
                                  {item.gateway.cardNumber.replace(/(\d{4})/g, "$1 ").trim()}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {item.gateway.cardHolderName || item.gateway.bankName || "دارنده کارت"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">ثبت نشده</span>
                            )}
                          </TableCell>

                          {/* Authorized Domain Status */}
                          <TableCell className="text-right">
                            {isLocked ? (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold" dir="ltr">
                                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{item.gateway.wpAuthorizedDomain}</span>
                                </div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  ✓ قفل امنیتی فعال است
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
                                  <Unlock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>ست نشده (آزاد)</span>
                                </div>
                                <div className="text-[10px] text-amber-600 dark:text-amber-400">
                                  در انتظار اولین ثبت پذیرنده
                                </div>
                              </div>
                            )}
                          </TableCell>

                          {/* WP Api Key */}
                          <TableCell className="text-right">
                            {item.gateway.wpApiKey ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg"
                                  onClick={() => handleCopyKey(item.gateway.wpApiKey!)}
                                  title="کپی کلید API"
                                >
                                  {copiedKey === item.gateway.wpApiKey ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                                <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]" dir="ltr">
                                  {item.gateway.wpApiKey.slice(0, 14)}...
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">صادر نشده</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Dedicated Domain Button */}
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 px-2.5 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                                onClick={() => openDomainDialog(item)}
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>تغییر دامنه</span>
                              </Button>

                              {/* Edit full gateway */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs rounded-xl gap-1"
                                onClick={() => openGatewayDialog(item)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>ویرایش درگاه</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal 1: Dedicated Domain Changer for Admin */}
        <Dialog open={!!editingDomainItem} onOpenChange={(open) => !open && setEditingDomainItem(null)}>
          <DialogContent className="max-w-md rounded-2xl" dir="rtl">
            <DialogHeader className="text-right space-y-1.5">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                تغییر و مدیریت دامنه مجاز درگاه
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                این صفحه مخصوص ادمین است. دامنه تنظیم‌شده در اینجا برای کاربر قفل شده و درگاه ووکامرس پذیرنده فقط از این دامنه اجازه ارسال فاکتور خواهد داشت.
              </DialogDescription>
            </DialogHeader>

            {editingDomainItem && (
              <div className="space-y-4 py-2">
                {/* User info card */}
                <div className="bg-muted/40 p-3 rounded-xl border border-border/80 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">پذیرنده:</span>
                    <span className="font-bold">
                      {editingDomainItem.user.firstName || ""} {editingDomainItem.user.lastName || ""} ({editingDomainItem.user.username})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عنوان درگاه:</span>
                    <span className="font-semibold">{editingDomainItem.gateway.title || "درگاه پرداخت"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">دامنه فعلی:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                      {editingDomainItem.gateway.wpAuthorizedDomain || "تنظیم نشده (آزاد)"}
                    </span>
                  </div>
                </div>

                {/* Input field */}
                <div className="space-y-1.5 text-right">
                  <Label htmlFor="adminDomainInput" className="text-xs font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    دامنه مجاز جدید (بدون https://)
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute right-3 text-xs text-muted-foreground font-mono" dir="ltr">https://</span>
                    <Input
                      id="adminDomainInput"
                      placeholder="myshop.ir"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))}
                      className="pr-16 pl-3 h-10 text-xs font-mono text-left rounded-xl"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    مثال: <code>myshop.ir</code> یا <code>store.example.com</code>
                  </p>
                </div>

                {/* Quick actions: Reset / Unlock */}
                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10 gap-1 rounded-xl h-8"
                    onClick={() => setDomainInput("")}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    پاکسازی و آزاد کردن قفل
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    {domainInput ? "دامنه جدید قفل خواهد شد" : "دامنه آزاد خواهد شد"}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter className="flex-row items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingDomainItem(null)}
                className="rounded-xl text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                disabled={updateDomainMutation.isPending}
                onClick={() => {
                  if (editingDomainItem) {
                    updateDomainMutation.mutate({
                      userId: editingDomainItem.user.id,
                      domain: domainInput.trim() || null,
                    });
                  }
                }}
              >
                {updateDomainMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                ذخیره تغییرات دامنه
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal 2: Full Gateway Settings Editor for Admin */}
        <Dialog open={!!editingGatewayItem} onOpenChange={(open) => !open && setEditingGatewayItem(null)}>
          <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader className="text-right space-y-1.5">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                ویرایش مشخصات درگاه کاربر
              </DialogTitle>
              <DialogDescription className="text-xs">
                {editingGatewayItem && (
                  <span>
                    ویرایش تنظیمات درگاه متعلق به پذیرنده: <strong>{editingGatewayItem.user.firstName || ""} {editingGatewayItem.user.lastName || ""} ({editingGatewayItem.user.username})</strong>
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-right">
              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">عنوان درگاه</Label>
                <Input
                  value={gatewayFormData.title}
                  onChange={(e) => setGatewayFormData({ ...gatewayFormData, title: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                  placeholder="درگاه پرداخت..."
                />
              </div>

              {/* Card Number & Holder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">شماره کارت مقصد (۱۶ رقم)</Label>
                  <Input
                    value={gatewayFormData.cardNumber}
                    onChange={(e) => setGatewayFormData({ ...gatewayFormData, cardNumber: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                    className="text-xs h-9 rounded-xl font-mono text-left"
                    placeholder="6037..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">نام دارنده کارت</Label>
                  <Input
                    value={gatewayFormData.cardHolderName}
                    onChange={(e) => setGatewayFormData({ ...gatewayFormData, cardHolderName: e.target.value })}
                    className="text-xs h-9 rounded-xl"
                    placeholder="نام دارنده حساب"
                  />
                </div>
              </div>

              {/* Authorized Domain */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  دامنه مجاز درگاه (قفل دامنه)
                </Label>
                <Input
                  value={gatewayFormData.wpAuthorizedDomain}
                  onChange={(e) => setGatewayFormData({ ...gatewayFormData, wpAuthorizedDomain: e.target.value.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") })}
                  className="text-xs h-9 rounded-xl font-mono text-left"
                  placeholder="myshop.ir"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground">
                  این مقدار در پنل پذیرنده به صورت قفل شده نمایش داده خواهد شد.
                </p>
              </div>

              {/* Min and Max Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">حداقل مبلغ فاکتور (تومان)</Label>
                  <Input
                    value={gatewayFormData.minAmount}
                    onChange={(e) => setGatewayFormData({ ...gatewayFormData, minAmount: e.target.value.replace(/\D/g, "") })}
                    className="text-xs h-9 rounded-xl font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">حداکثر مبلغ فاکتور (تومان)</Label>
                  <Input
                    value={gatewayFormData.maxAmount}
                    onChange={(e) => setGatewayFormData({ ...gatewayFormData, maxAmount: e.target.value.replace(/\D/g, "") })}
                    className="text-xs h-9 rounded-xl font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingGatewayItem(null)}
                className="rounded-xl text-xs"
              >
                انصراف
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl text-xs bg-primary text-primary-foreground gap-1.5"
                disabled={updateGatewayMutation.isPending}
                onClick={() => {
                  if (editingGatewayItem) {
                    updateGatewayMutation.mutate({
                      userId: editingGatewayItem.user.id,
                      data: gatewayFormData,
                    });
                  }
                }}
              >
                {updateGatewayMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                ذخیره تنظیمات درگاه
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
