import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import { 
  MessageSquare, Key, CheckCircle2, AlertTriangle, 
  Eye, EyeOff, Check, RefreshCw 
} from "lucide-react";

interface SmsConfig {
  token: string;
  isEnabled: boolean;
  updatedAt?: string;
}

export default function SmsSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [token, setToken] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [showToken, setShowToken] = useState(false);

  const { data: config, isLoading } = useQuery<SmsConfig>({
    queryKey: ["/api/admin/sms-settings"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/sms-settings");
      if (!res.ok) throw new Error("خطا در دریافت تنظیمات پیامک");
      return res.json();
    },
  });

  useEffect(() => {
    if (config) {
      setToken(config.token || "");
      setIsEnabled(config.isEnabled ?? true);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<SmsConfig>) => {
      const res = await createAuthenticatedRequest("/api/admin/sms-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "خطا در ذخیره تنظیمات");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/sms-settings/status"] });
      toast({
        title: "ذخیره شد",
        description: data.message || "تنظیمات پیامک با موفقیت ذخیره شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message || "خطا در ذخیره تنظیمات پیامک",
        variant: "destructive",
      });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      token,
      isEnabled,
    });
  };

  return (
    <DashboardLayout title="تنظیمات پیامک">
      <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2.5 text-gray-900">
              <MessageSquare className="w-7 h-7 text-primary" />
              تنظیمات پیامک
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              تنظیم توکن وب‌سرویس پیامک و وضعیت فعال بودن ارسال پیامک
            </p>
          </div>

          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              token ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}>
              {token ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  توکن تنظیم شده است
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  توکن تنظیم نشده است
                </>
              )}
            </span>
          </div>
        </div>

        {/* Settings Card */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <Key className="w-5 h-5 text-primary" />
              توکن و وضعیت سرویس
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              توکن وب‌سرویس پیامک را وارد کنید و وضعیت ارسال پیامک را مشخص نمایید.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              {/* Token Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-token" className="text-sm font-medium text-gray-700">
                    توکن پیامک (Bearer Token)
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showToken ? "مخفی‌سازی" : "نمایش توکن"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="sms-token"
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="توکن وب‌سرویس پیامک را اینجا وارد کنید..."
                    className="font-mono text-xs pl-10 h-11"
                    dir="ltr"
                  />
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Enable / Disable Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-enabled" className="text-sm font-semibold text-gray-800 cursor-pointer">
                    وضعیت سرویس پیامک
                  </Label>
                  <p className="text-xs text-gray-500">
                    {isEnabled ? "سرویس پیامک فعال است" : "سرویس پیامک غیرفعال است"}
                  </p>
                </div>
                <Switch
                  id="sms-enabled"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending || isLoading}
                  className="px-6 h-10 font-semibold"
                >
                  {saveMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 ml-2" />
                      ذخیره تغییرات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
