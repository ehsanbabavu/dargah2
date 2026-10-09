import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2,
  Clock,
  Power,
  AlertTriangle,
  CreditCard,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Layers,
  ArrowRightLeft,
  Check,
  FileJson
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  type?: string;
}

interface MaintenanceStatus {
  isEnabled: boolean;
}

export default function DatabaseBackupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [directRestoringFile, setDirectRestoringFile] = useState<string | null>(null);

  const { data: backupsData, isLoading } = useQuery<{ backups: Backup[] }>({
    queryKey: ["backups"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/admin/backup/list");
      if (!response.ok) {
        throw new Error("خطا در دریافت لیست بک‌آپ‌ها");
      }
      return response.json();
    },
  });

  const { data: maintenanceData } = useQuery<MaintenanceStatus>({
    queryKey: ["maintenance-status"],
    queryFn: async () => {
      const response = await fetch("/api/maintenance/status");
      if (!response.ok) {
        throw new Error("خطا در دریافت وضعیت");
      }
      return response.json();
    },
  });

  const toggleMaintenanceMutation = useMutation({
    mutationFn: async (isEnabled: boolean) => {
      const response = await createAuthenticatedRequest("/api/admin/maintenance/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطا در تغییر وضعیت");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-status"] });
      toast({
        title: "موفقیت‌آمیز",
        description: "وضعیت به‌روزرسانی با موفقیت تغییر یافت",
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

  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await createAuthenticatedRequest(
        `/api/admin/backup/${filename}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطا در حذف بک‌آپ");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast({
        title: "موفقیت‌آمیز",
        description: "فایل بک‌آپ با موفقیت حذف شد",
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

  const handleCreateBackup = async (type: "system" | "sql" = "system") => {
    try {
      setIsCreatingBackup(true);
      const urlPath = type === "sql" ? "/api/admin/backup/create?type=sql" : "/api/admin/backup/create?type=system";
      const response = await createAuthenticatedRequest(urlPath);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطا در ایجاد بک‌آپ");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : (type === "sql" ? `backup-${Date.now()}.sql` : `system-backup-${Date.now()}.json`);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ پشتیبان‌گیری کامل انجام شد",
        description: "بک‌آپ جامع (شامل تمام تراکنش‌ها، درگاه‌ها، دکمه‌ها و کل دیتابیس) ذخیره و دانلود گردید.",
      });

      queryClient.invalidateQueries({ queryKey: ["backups"] });
    } catch (error: any) {
      toast({
        title: "خطا در ایجاد بک‌آپ",
        description: error.message || "خطا در برقراری ارتباط با سرور",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.sql') && !file.name.endsWith('.json')) {
        toast({
          title: "فرمت نامعتبر",
          description: "فقط فایل‌های بک‌آپ با پسوند JSON یا SQL مجاز هستند",
          variant: "destructive",
        });
        return;
      }
      setUploadingFile(file);
    }
  };

  const handleRestoreBackup = async () => {
    if (!uploadingFile) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا فایل بک‌آپ را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    const confirmRestore = window.confirm(
      "⚠️ هشدار بسیار مهم:\n\nبازیابی فایل بک‌آپ تمام اطلاعات پرداخت، درگاه‌ها، وضعیت دکمه‌ها و داده‌های فعلی را با نسخه پشتیبان جایگزین خواهد کرد.\n\nآیا از انجام عملیات بازیابی اطمینان دارید؟"
    );

    if (!confirmRestore) {
      return;
    }

    try {
      setIsRestoringBackup(true);
      const formData = new FormData();
      formData.append('backupFile', uploadingFile);

      const response = await createAuthenticatedRequest("/api/admin/backup/restore", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطا در بازیابی بک‌آپ");
      }

      const result = await response.json();
      
      toast({
        title: "🎉 بازیابی با موفقیت کامل انجام شد",
        description: result.message || "تمامی اطلاعات پرداخت، وضعیت دکمه‌ها و داده‌های برنامه بازنشانی شدند.",
      });

      setUploadingFile(null);
      queryClient.invalidateQueries({ queryKey: ["backups"] });

      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (error: any) {
      toast({
        title: "خطا در بازیابی",
        description: error.message || "خطا در خواندن یا بازیابی فایل بک‌آپ",
        variant: "destructive",
      });
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleDirectRestore = async (filename: string) => {
    const confirmDirect = window.confirm(
      `⚠️ آیا مطمئن هستید که می‌خواهید نسخه پشتیبان زیر را مستقیماً بازیابی کنید؟\n\n«${filename}»\n\nاین کار تمامی اطلاعات پرداخت، وضعیت دکمه‌ها و کل پایگاه داده را به زمان این بک‌آپ بازمی‌گرداند.`
    );

    if (!confirmDirect) return;

    try {
      setDirectRestoringFile(filename);
      const response = await createAuthenticatedRequest(`/api/admin/backup/${filename}/restore`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطا در بازیابی مستقیم بک‌آپ");
      }

      const result = await response.json();

      toast({
        title: "🎉 بازیابی مستقیم انجام شد",
        description: result.message || `نسخه ${filename} با موفقیت در سیستم اعمال گردید.`,
      });

      queryClient.invalidateQueries({ queryKey: ["backups"] });

      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (error: any) {
      toast({
        title: "خطا در بازیابی مستقیم",
        description: error.message || "امکان بازیابی فایل وجود نداشت",
        variant: "destructive",
      });
    } finally {
      setDirectRestoringFile(null);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const response = await createAuthenticatedRequest(`/api/admin/backup/${filename}/download`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطا در دانلود بک‌آپ");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "موفقیت‌آمیز",
        description: "فایل بک‌آپ دانلود شد",
      });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در دانلود فایل",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <DashboardLayout title="پشتیبان‌گیری و بازیابی جامع">
      <div className="space-y-6">
        {/* نوار وضعیت بروزرسانی سیستم */}
        <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Power className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode" className="text-sm font-semibold">
                    حالت بروزرسانی و تعمیرات سیستم
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {maintenanceData?.isEnabled 
                      ? "سیستم در وضعیت تعمیرات است؛ کاربران عادی به صفحه بروزرسانی هدایت می‌شوند." 
                      : "سیستم آنلاین است و تمامی کاربران و پذیرندگان به خدمات دسترسی کامل دارند."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {maintenanceData?.isEnabled && (
                  <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-100 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    فعال
                  </Badge>
                )}
                <Switch
                  id="maintenance-mode"
                  checked={maintenanceData?.isEnabled || false}
                  onCheckedChange={(checked) => toggleMaintenanceMutation.mutate(checked)}
                  disabled={toggleMaintenanceMutation.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* کارت‌های شاخص‌های پشتیبان‌گیری */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">اطلاعات کامل پرداخت</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  درگاه‌های کارت به کارت، شماره حساب‌ها و شبا، تمامی تراکنش‌های پرداخت، فیش‌های واریزی، کدهای شتاب، کیف پول و سفارشات ووکامرس.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-lg shrink-0">
                <Sliders className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">وضعیت دکمه‌ها و پوسته‌ها</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  تنظیمات دکمه‌های صفحه اصلی (CTA)، ناوبری سریع، ویجت چت، دکمه‌های صفحات داخلی، ویترین، وبلاگ، دکمه‌های صفحه ورود، تلگرام و پیامک.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-blue-950 dark:text-blue-200">تمامی داده‌های سامانه</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  کاربران، نقش‌ها و رمزها، موجودی‌ها، اشتراک‌های فعال، محصولات فروشگاه، تیکت‌های پشتیبانی، چت‌های آنلاین و کلیه ۳۲ جدول دیتابیس.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* بخش ایجاد و بازیابی بک‌آپ */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* کارت ۱: ایجاد نسخه پشتیبان */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Download className="w-5 h-5 text-emerald-600" />
                پشتیبان‌گیری جامع سیستم و پرداخت‌ها
              </CardTitle>
              <CardDescription>
                تولید بسته کامل شامل تمام اطلاعات پرداخت، درگاه‌ها، وضعیت دکمه‌ها و دیتابیس
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleCreateBackup("system")}
                disabled={isCreatingBackup}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-6"
                size="lg"
              >
                {isCreatingBackup ? (
                  <>
                    <Clock className="w-5 h-5 ml-2 animate-spin" />
                    در حال جمع‌آوری اطلاعات و ساخت فایل بک‌آپ...
                  </>
                ) : (
                  <>
                    <FileJson className="w-5 h-5 ml-2" />
                    ایجاد و دانلود بک‌آپ کامل سیستم (JSON جامع)
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleCreateBackup("sql")}
                disabled={isCreatingBackup}
                variant="outline"
                className="w-full border-slate-300 text-slate-700 dark:text-slate-200"
                size="default"
              >
                <Database className="w-4 h-4 ml-2" />
                دانلود نسخه ساختاری پایگاه داده (SQL Dump)
              </Button>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  پوشش ۱۰۰٪ اطلاعات در بک‌آپ سیستم (JSON):
                </p>
                <div className="grid grid-cols-2 gap-2 pr-1">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    درگاه‌ها و شماره کارت‌های پذیرندگان
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    کل تراکنش‌های کارت به کارت و شتاب
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    سفارشات، سبدهای خرید و پرداخت‌ها
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    وضعیت تمام دکمه‌ها و پوسته‌های سایت
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    تنظیمات تلگرام، پیامک و صفحه ورود
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    اشتراک‌ها، کاربران، تیکت‌ها و محصولات
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* کارت ۲: بازیابی از فایل */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Upload className="w-5 h-5 text-indigo-600" />
                بازیابی اطلاعات از فایل پشتیبان
              </CardTitle>
              <CardDescription>
                آپلود فایل بک‌آپ و بازیابی فوری تمام پرداخت‌ها، دکمه‌ها و کل سامانه
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".json,.sql"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="backup-file-input"
                />
                <label htmlFor="backup-file-input">
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-2 py-8 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    size="lg"
                    asChild
                  >
                    <span className="cursor-pointer flex flex-col items-center gap-1.5 text-center">
                      <Upload className="w-6 h-6 text-indigo-500" />
                      <span className="font-semibold text-sm">انتخاب فایل بک‌آپ (.json یا .sql)</span>
                      <span className="text-xs text-muted-foreground">برای بازیابی ۱۰۰٪ تمام اطلاعات و دکمه‌ها، فایل JSON بک‌آپ را انتخاب فرمایید</span>
                    </span>
                  </Button>
                </label>
              </div>
              
              {uploadingFile && (
                <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 dir-ltr text-right">{uploadingFile.name}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      حجم: {formatFileSize(uploadingFile.size)} | فرمت: {uploadingFile.name.endsWith('.json') ? 'بک‌آپ جامع سیستم (JSON)' : 'دیتابیس (SQL)'}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-indigo-400 text-indigo-700 bg-white dark:bg-slate-900">
                    آماده بازیابی
                  </Badge>
                </div>
              )}

              <Button
                onClick={handleRestoreBackup}
                disabled={!uploadingFile || isRestoringBackup}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-6"
                size="lg"
              >
                {isRestoringBackup ? (
                  <>
                    <Clock className="w-5 h-5 ml-2 animate-spin" />
                    در حال بازنشانی اطلاعات، پرداخت‌ها و دکمه‌ها...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5 ml-2" />
                    تایید و بازگردانی کلیه اطلاعات سیستم
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                پس از بازیابی موفقیت‌آمیز، صفحه جهت اعمال تنظیمات مجدداً بارگذاری خواهد شد.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* جدول بک‌آپ‌های ذخیره شده در سرور */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                فایل‌های بک‌آپ موجود در سرور
              </CardTitle>
              <CardDescription>
                امکان دانلود، حذف و بازیابی مستقیم نسخه‌های ذخیره‌شده با یک کلیک
              </CardDescription>
            </div>
            {backupsData?.backups && backupsData.backups.length > 0 && (
              <Badge variant="secondary" className="font-mono">
                {backupsData.backups.length} نسخه
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 animate-spin" />
                در حال دریافت فهرست بک‌آپ‌ها...
              </div>
            ) : backupsData?.backups && backupsData.backups.length > 0 ? (
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow>
                      <TableHead className="text-right font-bold">نام فایل</TableHead>
                      <TableHead className="text-right font-bold">نوع بک‌آپ</TableHead>
                      <TableHead className="text-right font-bold">تاریخ ایجاد</TableHead>
                      <TableHead className="text-right font-bold">حجم فایل</TableHead>
                      <TableHead className="text-center font-bold">عملیات بازیابی و مدیریت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupsData.backups.map((backup) => (
                      <TableRow key={backup.filename} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50">
                        <TableCell className="font-mono text-xs dir-ltr text-right font-medium">
                          {backup.filename}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${backup.filename.endsWith('.json') ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}
                          >
                            {backup.filename.endsWith('.json') ? 'جامع سیستم (JSON)' : 'دیتابیس (SQL)'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(backup.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {formatFileSize(backup.size)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* دکمه بازیابی مستقیم این نسخه */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 h-8 gap-1 text-xs"
                              title="بازیابی مستقیم این نسخه در سیستم"
                              disabled={directRestoringFile === backup.filename}
                              onClick={() => handleDirectRestore(backup.filename)}
                            >
                              {directRestoringFile === backup.filename ? (
                                <Clock className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              بازیابی مستقیم
                            </Button>

                            {/* دانلود */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="دانلود فایل بک‌آپ"
                              onClick={() => handleDownloadBackup(backup.filename)}
                            >
                              <Download className="w-4 h-4 text-slate-600" />
                            </Button>

                            {/* حذف */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-rose-50 hover:border-rose-200"
                              title="حذف فایل بک‌آپ"
                              onClick={() => {
                                if (window.confirm(`آیا از حذف فایل «${backup.filename}» اطمینان دارید؟`)) {
                                  deleteMutation.mutate(backup.filename);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <Database className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium">تاکنون فایلی در سرور ذخیره نشده است</p>
                <p className="text-xs">می‌توانید با دکمه «ایجاد و دانلود بک‌آپ کامل سیستم» اولین نسخه پشتیبان را تهیه نمایید.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
