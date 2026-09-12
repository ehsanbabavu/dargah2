import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import { Puzzle, Plus, Trash2, MessageCircle, Settings, Loader2, MessageSquare, Ticket, Wallet, Package, Crown, History, Database, Receipt, Truck, CreditCard, Mail, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string;
  isEnabled: boolean;
  isBuiltIn: boolean;
  createdAt: string;
}

export default function PluginsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPlugin, setNewPlugin] = useState({
    name: "",
    displayName: "",
    description: "",
    icon: "Puzzle",
  });

  const { data: plugins = [], isLoading } = useQuery<Plugin[]>({
    queryKey: ["/api/admin/plugins"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/admin/plugins");
      if (!response.ok) throw new Error("Failed to fetch plugins");
      return response.json();
    },
  });

  const sortedPlugins = useMemo(() => {
    return [...plugins];
  }, [plugins]);

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await createAuthenticatedRequest(`/api/admin/plugins/${id}/toggle`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to toggle plugin");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugins"] });
      // آپدیت فوری وضعیت پلاگین در sidebar
      if (data?.name) {
        queryClient.invalidateQueries({ queryKey: [`/api/plugins/${data.name}/status`] });
      }
      toast({ title: "وضعیت پلاگین تغییر کرد" });
    },
    onError: () => {
      toast({ title: "خطا در تغییر وضعیت پلاگین", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (plugin: typeof newPlugin) => {
      const response = await createAuthenticatedRequest("/api/admin/plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plugin),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create plugin");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugins"] });
      toast({ title: "پلاگین با موفقیت ایجاد شد" });
      setIsAddDialogOpen(false);
      setNewPlugin({ name: "", displayName: "", description: "", icon: "Puzzle" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "خطا در ایجاد پلاگین", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await createAuthenticatedRequest(`/api/admin/plugins/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete plugin");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugins"] });
      toast({ title: "پلاگین با موفقیت حذف شد" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "خطا در حذف پلاگین", variant: "destructive" });
    },
  });

  const getPluginDetails = (pluginName: string) => {
    switch (pluginName) {
      case 'internal-chats':
        return { label: "چت کاربران", icon: MessageCircle, description: "سیستم چت داخلی بین مدیر و کاربران سایت" };
      case 'tickets':
        return { label: "تیکت‌ها", icon: Ticket, description: "سیستم تیکتینگ و پشتیبانی کاربران" };
      case 'guest-chats':
        return { label: "چت مهمانان", icon: MessageSquare, description: "چت آنلاین با مهمانان سایت، پشتیبانی آنلاین و پاسخ‌دهی به سوالات کاربران" };
      case 'subscriptions':
        return { label: "اشتراک‌ها", icon: Crown, description: "سیستم مدیریت اشتراک و سطوح دسترسی" };
      case 'login-logs':
        return { label: "لاگ ورود", icon: History, description: "مشاهده تاریخچه ورود کاربران به سیستم" };
      case 'backup':
        return { label: "پشتیبان‌گیری", icon: Database, description: "مدیریت بک‌آپ و بازیابی پایگاه داده" };
      case 'vat':
        return { label: "مالیات", icon: Receipt, description: "تنظیمات مالیات بر ارزش افزوده" };
      case 'bank-card':
        return { label: "کارت بانکی", icon: CreditCard, description: "مدیریت اطلاعات حساب و کارت‌های بانکی" };
      case 'seo':
        return { 
          label: "سئو و ثبت در گوگل", 
          icon: LucideIcons.Search, 
          description: "ثبت صفحات و مقالات در موتور گوگل، نقشه سایت XML، متاتگ‌ها، اسکیما و بهینه‌سازی" 
        };
      default:
        return { label: pluginName, icon: Puzzle, description: "", isComingSoon: false };
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="مدیریت پلاگین‌ها">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="مدیریت پلاگین‌ها">
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          {sortedPlugins.map((plugin) => {
            const details = getPluginDetails(plugin.name);
            const isComingSoon = details.isComingSoon;
            const IconComp = details.icon;

            return (
              <Card 
                key={plugin.id} 
                className={`relative transition-all ${
                  isComingSoon 
                    ? "opacity-50 grayscale-[40%] bg-muted/20 border-dashed" 
                    : !plugin.isEnabled 
                    ? "opacity-60" 
                    : ""
                }`}
                data-testid={`plugin-card-${plugin.name}`}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className={`p-2 rounded-lg ${
                    isComingSoon
                      ? "bg-muted text-muted-foreground"
                      : plugin.isEnabled 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <IconComp className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-foreground">{details.label}</h3>
                      {isComingSoon && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5 font-bold">
                          بزودی
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {details.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComingSoon ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-medium">
                        بزودی
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${plugin.isEnabled ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                        {plugin.isEnabled ? "فعال" : "غیرفعال"}
                      </span>
                    )}

                    {!plugin.isBuiltIn && !isComingSoon && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(plugin.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}

                    <Switch
                      checked={isComingSoon ? false : plugin.isEnabled}
                      onCheckedChange={() => {
                        if (isComingSoon) {
                          toast({ title: "این پلاگین بزودی فعال خواهد شد", variant: "default" });
                          return;
                        }
                        toggleMutation.mutate(plugin.id);
                      }}
                      disabled={isComingSoon || toggleMutation.isPending}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {plugins.length === 0 && (
          <div className="text-center py-12">
            <Puzzle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">هیچ پلاگینی وجود ندارد</h3>
            <p className="text-muted-foreground">برای شروع یک پلاگین جدید اضافه کنید</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
