import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Copy, 
  Check, 
  ExternalLink, 
  Upload, 
  Loader2,
  Sparkles,
  Save
} from "lucide-react";

interface VitrinSettings {
  username: string;
  storeName: string;
  storeDescription: string;
  storeLogo: string | null;
  vitrinUrl: string;
}

export default function VitrinSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  const { data: settings, isLoading } = useQuery<VitrinSettings>({
    queryKey: ["/api/seller/vitrin"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/seller/vitrin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("خطا در دریافت تنظیمات");
      const data = await res.json();
      setStoreName(data.storeName);
      setStoreDescription(data.storeDescription);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { storeName: string; storeDescription: string }) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/seller/vitrin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("خطا در ذخیره تنظیمات");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/vitrin"] });
      toast({
        title: "ذخیره شد",
        description: "تنظیمات ویترین با موفقیت ذخیره شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره تنظیمات",
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("logo", file);
      
      const res = await fetch("/api/seller/vitrin/logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("خطا در آپلود لوگو");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/vitrin"] });
      toast({
        title: "آپلود شد",
        description: "لوگوی فروشگاه با موفقیت آپلود شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در آپلود لوگو",
        variant: "destructive",
      });
    },
  });

  const handleCopyLink = async () => {
    if (settings?.vitrinUrl) {
      const fullUrl = `${window.location.origin}${settings.vitrinUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: "کپی شد",
        description: "آدرس ویترین کپی شد",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطا",
          description: "حجم فایل نباید بیشتر از 5 مگابایت باشد",
          variant: "destructive",
        });
        return;
      }
      uploadLogoMutation.mutate(file);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ storeName, storeDescription });
  };

  const fullVitrinUrl = settings?.vitrinUrl ? `${window.location.origin}${settings.vitrinUrl}` : "";

  if (isLoading) {
    return (
      <DashboardLayout title="تنظیمات ویترین">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="تنظیمات ویترین">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-background shadow-xl ring-2 ring-primary/20">
                  {settings?.storeLogo ? (
                    <AvatarImage src={settings.storeLogo} className="object-cover" />
                  ) : (
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-white">
                      {storeName?.charAt(0) || <Store className="w-10 h-10" />}
                    </AvatarFallback>
                  )}
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -left-1 h-8 w-8 rounded-full shadow-md md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLogoMutation.isPending}
                >
                  {uploadLogoMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold">{storeName || "فروشگاه شما"}</h2>
                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>ویترین فعال</span>
                </div>
              </div>

              <div className="w-full max-w-md">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-background/80 backdrop-blur border">
                  <Input
                    value={fullVitrinUrl}
                    readOnly
                    className="border-0 bg-transparent font-mono text-sm text-center focus-visible:ring-0"
                    dir="ltr"
                  />
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => window.open(settings?.vitrinUrl, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-sm font-medium">
                نام فروشگاه
              </Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="نام فروشگاه خود را وارد کنید"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeDescription" className="text-sm font-medium">
                توضیحات
              </Label>
              <Textarea
                id="storeDescription"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="توضیحات کوتاه درباره فروشگاه..."
                rows={4}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending}
              className="w-full h-11 gap-2"
              size="lg"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              ذخیره تغییرات
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
