import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2,
  Clock,
  Power,
  AlertTriangle
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
        description: "بک‌آپ با موفقیت حذف شد",
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
        title: "موفقیت‌آمیز",
        description: "بک‌آپ کامل با موفقیت ایجاد و دانلود شد",
      });

      queryClient.invalidateQueries({ queryKey: ["backups"] });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در ایجاد بک‌آپ",
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
          title: "خطا",
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
      "⚠️ هشدار: بازیابی بک‌آپ تمام داده‌های فعلی دیتابیس را جایگزین می‌کند.\n\nآیا مطمئن هستید که می‌خواهید ادامه دهید؟"
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
        title: "موفقیت‌آمیز",
        description: result.message || "بک‌آپ با موفقیت بازیابی شد",
      });

      setUploadingFile(null);
      queryClient.invalidateQueries({ queryKey: ["backups"] });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در بازیابی بک‌آپ",
        variant: "destructive",
      });
    } finally {
      setIsRestoringBackup(false);
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
        description: "بک‌آپ با موفقیت دانلود شد",
      });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در دانلود بک‌آپ",
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <DashboardLayout title="پشتیبان‌گیری">
      <div className="space-y-6">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Power className="w-5 h-5 text-orange-600" />
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode" className="text-sm font-medium">
                    حالت بروزرسانی سیستم
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {maintenanceData?.isEnabled 
                      ? "کاربران سطح 1 و 2 به صفحه بروزرسانی هدایت می‌شوند" 
                      : "تمام کاربران دسترسی دارند"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {maintenanceData?.isEnabled && (
                  <div className="flex items-center gap-1.5 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">فعال</span>
                  </div>
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                پشتیبان‌گیری کامل سیستم و دیتابیس
              </CardTitle>
              <CardDescription>
                گرفتن نسخه پشتیبان کامل از تمامی داده‌ها، وضعیت دکمه‌ها، تنظیمات مدیر و کاربر، اشتراک‌ها و دیتابیس
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleCreateBackup("system")}
                disabled={isCreatingBackup}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                size="lg"
              >
                {isCreatingBackup ? (
                  <>
                    <Clock className="w-4 h-4 ml-2 animate-spin" />
                    در حال ایجاد بک‌آپ سیستم...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 ml-2" />
                    ایجاد بک‌آپ کامل سیستم (JSON)
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleCreateBackup("sql")}
                disabled={isCreatingBackup}
                variant="outline"
                className="w-full border-slate-300"
                size="default"
              >
                <Database className="w-4 h-4 ml-2" />
                دانلود بک‌آپ ساختاری (SQL Dump)
              </Button>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">محتویات بک‌آپ کامل سیستم (JSON):</p>
                <ul className="list-disc list-inside space-y-0.5 pr-1">
                  <li>کل جداول دیتابیس (کاربران، تراکنش‌ها، سفارش‌ها، محصولات، تیکت‌ها)</li>
                  <li>وضعیت تمام دکمه‌ها، سوئیچ‌ها و فعال‌سازی‌های مدیر و کاربر</li>
                  <li>اشتراک‌ها، پلان‌ها و تاریخ انقضای کاربران</li>
                  <li>تنظیمات ربات تلگرام، سامانه پیامک، صفحه‌ساز و صفحات سفارشی</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                بازیابی کامل از بک‌آپ
              </CardTitle>
              <CardDescription>
                آپلود فایل بک‌آپ (.json یا .sql) و بازیابی کلیه داده‌ها و تنظیمات دکمه‌ها
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
                    className="w-full border-dashed border-2 py-6"
                    size="lg"
                    asChild
                  >
                    <span className="cursor-pointer flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-sm">انتخاب فایل بک‌آپ (.json یا .sql)</span>
                      <span className="text-xs text-muted-foreground">برای بازیابی کامل سیستم، فایل JSON بک‌آپ را انتخاب کنید</span>
                    </span>
                  </Button>
                </label>
              </div>
              
              {uploadingFile && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{uploadingFile.name}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    حجم: {formatFileSize(uploadingFile.size)} | فرمت: {uploadingFile.name.endsWith('.json') ? 'بک‌آپ کامل سیستم (JSON)' : 'دیتابیس (SQL)'}
                  </p>
                </div>
              )}

              <Button
                onClick={handleRestoreBackup}
                disabled={!uploadingFile || isRestoringBackup}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                {isRestoringBackup ? (
                  <>
                    <Clock className="w-4 h-4 ml-2 animate-spin" />
                    در حال بازیابی اطلاعات...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    تایید و بازیابی اطلاعات سیستم
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">لیست فایل‌های بک‌آپ موجود در سرور</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                در حال بارگذاری...
              </div>
            ) : backupsData?.backups && backupsData.backups.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام فایل</TableHead>
                      <TableHead className="text-right">نوع بک‌آپ</TableHead>
                      <TableHead className="text-right">تاریخ ایجاد</TableHead>
                      <TableHead className="text-right">حجم</TableHead>
                      <TableHead className="text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupsData.backups.map((backup) => (
                      <TableRow key={backup.filename}>
                        <TableCell className="font-medium dir-ltr text-right">{backup.filename}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${backup.filename.endsWith('.json') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                            {backup.type || (backup.filename.endsWith('.json') ? 'سیستم (JSON)' : 'دیتابیس (SQL)')}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(backup.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFileSize(backup.size)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              title="دانلود بک‌آپ"
                              onClick={() => handleDownloadBackup(backup.filename)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="حذف بک‌آپ"
                              onClick={() => {
                                if (window.confirm(`آیا مطمئن هستید که می‌خواهید "${backup.filename}" را حذف کنید؟`)) {
                                  deleteMutation.mutate(backup.filename);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                هیچ بک‌آپی ذخیره نشده است
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
