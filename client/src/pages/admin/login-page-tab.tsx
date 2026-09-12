import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Save,
  RotateCcw,
  ExternalLink,
  Check,
  Video,
  Eye,
  Link as LinkIcon,
  Trash2,
  SlidersHorizontal,
  ArrowDownLeft,
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import loginVideo from "@assets/YouCut_20250930_005437820_1759181322984.mp4";

export interface LoginPageConfig {
  gradientType: "preset" | "custom";
  gradientPreset: string;
  fromColor: string;
  viaColor: string;
  toColor: string;
  gradientDirection: string;
  customCssGradient?: string;
  imageType: "default" | "custom_image" | "url";
  imageUrl: string;
  imageFit: "contain" | "cover";
  imageOverlayOpacity: number;
  welcomeTitle: string;
  welcomeSubtitle: string;
  updatedAt?: string;
}

const GRADIENT_PRESETS = [
  {
    id: "blue-purple",
    name: "آبی و بنفش",
    from: "#2563eb",
    via: "#9333ea",
    to: "#4338ca",
    direction: "to-br",
  },
  {
    id: "landy-sunset",
    name: "قالب لندی (سرخ و نارنجی)",
    from: "#ee0979",
    via: "#ff6a00",
    to: "#ff8c00",
    direction: "to-r",
  },
  {
    id: "emerald-cyan",
    name: "زمردی و فیروزه‌ای",
    from: "#059669",
    via: "#0d9488",
    to: "#0891b2",
    direction: "to-br",
  },
  {
    id: "dark-gold",
    name: "تیره و طلایی",
    from: "#0f172a",
    via: "#1e293b",
    to: "#d97706",
    direction: "to-br",
  },
  {
    id: "ruby-magenta",
    name: "یاقوتی و سرخ",
    from: "#e11d48",
    via: "#c026d3",
    to: "#7c3aed",
    direction: "to-br",
  },
  {
    id: "ocean-cyan",
    name: "اقیانوسی و نیلی",
    from: "#0284c7",
    via: "#3b82f6",
    to: "#1d4ed8",
    direction: "to-br",
  },
];

export function LoginPageTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fromColor, setFromColor] = useState("#2563eb");
  const [viaColor, setViaColor] = useState("#9333ea");
  const [toColor, setToColor] = useState("#4338ca");
  const [gradientDirection, setGradientDirection] = useState("to-br");
  const [activePresetId, setActivePresetId] = useState<string>("blue-purple");

  const [imageType, setImageType] = useState<"default" | "custom_image" | "url">("default");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFit, setImageFit] = useState<"contain" | "cover">("contain");
  const [isUploading, setIsUploading] = useState(false);

  // Query settings from server
  const { data: config } = useQuery<LoginPageConfig>({
    queryKey: ["/api/admin/login-page/settings"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/login-page/settings");
      if (!res.ok) throw new Error("خطا در دریافت تنظیمات صفحه لاگین");
      return res.json();
    },
  });

  // Sync loaded config to form
  useEffect(() => {
    if (config) {
      setFromColor(config.fromColor || "#2563eb");
      setViaColor(config.viaColor || "#9333ea");
      setToColor(config.toColor || "#4338ca");
      setGradientDirection(config.gradientDirection || "to-br");
      setActivePresetId(config.gradientPreset || "custom");
      setImageType(config.imageType || "default");
      setImageUrl(config.imageUrl || "");
      setImageFit(config.imageFit || "contain");
    }
  }, [config]);

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<LoginPageConfig>) => {
      const res = await createAuthenticatedRequest("/api/admin/login-page/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در ذخیره تنظیمات");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/login-page/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/login-page/config"] });
      toast({
        title: "ذخیره شد",
        description: "تنظیمات صفحه لاگین (/login) با موفقیت به‌روزرسانی شد.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ذخیره",
        description: err.message || "امکان ذخیره تنظیمات وجود ندارد",
        variant: "destructive",
      });
    },
  });

  // Mutation to reset settings
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/login-page/reset", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("خطا در بازنشانی");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/login-page/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/login-page/config"] });
      toast({
        title: "بازنشانی شد",
        description: "صفحه لاگین به وضعیت پیش‌فرض بازگشت.",
      });
    },
  });

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/login-page/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در آپلود");
      }
      const data = await res.json();
      setImageUrl(data.imageUrl);
      setImageType("custom_image");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/login-page/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/login-page/config"] });
      toast({
        title: "تصویر آپلود شد",
        description: "تصویر سمت چپ صفحه ورود ذخیره شد.",
      });
    } catch (err: any) {
      toast({
        title: "خطا در آپلود",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const computeGradientCss = () => {
    const directionMap: Record<string, string> = {
      "to-br": "135deg",
      "to-r": "90deg",
      "to-b": "180deg",
      "to-tr": "45deg",
    };
    const angle = directionMap[gradientDirection] || "135deg";
    if (viaColor) {
      return `linear-gradient(${angle}, ${fromColor} 0%, ${viaColor} 50%, ${toColor} 100%)`;
    }
    return `linear-gradient(${angle}, ${fromColor} 0%, ${toColor} 100%)`;
  };

  const handleSave = () => {
    saveMutation.mutate({
      gradientType: activePresetId === "custom" ? "custom" : "preset",
      gradientPreset: activePresetId,
      fromColor,
      viaColor,
      toColor,
      gradientDirection,
      customCssGradient: computeGradientCss(),
      imageType,
      imageUrl,
      imageFit,
    });
  };

  return (
    <div className="space-y-3" dir="rtl">
      {/* Sleek Top Bar */}
      <div className="flex items-center justify-between bg-card border border-border/80 rounded-xl px-4 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">مدیریت صفحه لاگین (/login)</h3>
            <p className="text-[11px] text-muted-foreground">کنترل رنگ گرادیانت سمت راست و تصویر سمت چپ</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 text-xs gap-1.5 border-border/80"
          >
            <a href="/login" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>مشاهده /login</span>
            </a>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-bold px-4 shadow-xs"
          >
            {saveMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>ذخیره تنظیمات</span>
          </Button>
        </div>
      </div>

      {/* Main Content Grid: Clean 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Left Form Controls: 7 cols */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* ITEM 1: کنترل گرادیانت سمت راست */}
          <Card className="border-border/80 shadow-2xs">
            <CardContent className="p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">۱. رنگ گرادیانت سمت راست (فرم ورود)</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono h-5 px-2">
                  {fromColor} ➔ {toColor}
                </Badge>
              </div>

              {/* Preset Palette Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-muted-foreground font-medium block">پالت‌های آماده:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {GRADIENT_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    const css = `linear-gradient(135deg, ${preset.from} 0%, ${preset.via} 50%, ${preset.to} 100%)`;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setActivePresetId(preset.id);
                          setFromColor(preset.from);
                          setViaColor(preset.via);
                          setToColor(preset.to);
                          setGradientDirection(preset.direction);
                        }}
                        className={`h-7 rounded-lg relative overflow-hidden transition-all flex items-center justify-center border ${
                          isSelected
                            ? "ring-2 ring-primary ring-offset-1 border-white/40 shadow-xs scale-[1.02]"
                            : "border-border/60 hover:opacity-90"
                        }`}
                        style={{ background: css }}
                        title={preset.name}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Pickers & Direction in 1 Compact Row */}
              <div className="bg-muted/30 border border-border/60 rounded-xl p-2.5 space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  {/* Start Color */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block">رنگ شروع</span>
                    <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg p-1">
                      <input
                        type="color"
                        value={fromColor}
                        onChange={(e) => {
                          setFromColor(e.target.value);
                          setActivePresetId("custom");
                        }}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={fromColor}
                        onChange={(e) => {
                          setFromColor(e.target.value);
                          setActivePresetId("custom");
                        }}
                        className="w-full text-[10px] font-mono bg-transparent border-0 p-0 focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Middle Color */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block">رنگ میانی</span>
                    <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg p-1">
                      <input
                        type="color"
                        value={viaColor}
                        onChange={(e) => {
                          setViaColor(e.target.value);
                          setActivePresetId("custom");
                        }}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={viaColor}
                        onChange={(e) => {
                          setViaColor(e.target.value);
                          setActivePresetId("custom");
                        }}
                        className="w-full text-[10px] font-mono bg-transparent border-0 p-0 focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* End Color */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block">رنگ پایان</span>
                    <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg p-1">
                      <input
                        type="color"
                        value={toColor}
                        onChange={(e) => {
                          setToColor(e.target.value);
                          setActivePresetId("custom");
                        }}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={toColor}
                        onChange={(e) => {
                          setToColor(e.target.value);
                          setActivePresetId("custom");
                        }}
                        className="w-full text-[10px] font-mono bg-transparent border-0 p-0 focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Direction Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">جهت تابش:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: "to-br", icon: ArrowDownLeft, title: "مایل راست" },
                      { id: "to-r", icon: ArrowRight, title: "افقی" },
                      { id: "to-b", icon: ArrowDown, title: "عمودی" },
                      { id: "to-tr", icon: ArrowUpRight, title: "مایل بالا" },
                    ].map((dir) => {
                      const IconComponent = dir.icon;
                      const isActive = gradientDirection === dir.id;
                      return (
                        <button
                          key={dir.id}
                          type="button"
                          onClick={() => {
                            setGradientDirection(dir.id);
                            setActivePresetId("custom");
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                              : "bg-background border border-border/80 text-muted-foreground hover:text-foreground"
                          }`}
                          title={dir.title}
                        >
                          <IconComponent className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ITEM 2: انتخاب و تغییر عکس سمت چپ */}
          <Card className="border-border/80 shadow-2xs">
            <CardContent className="p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">۲. عکس / مدیا سمت چپ</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setImageFit("contain")}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                      imageFit === "contain"
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Contain
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageFit("cover")}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                      imageFit === "cover"
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Cover
                  </button>
                </div>
              </div>

              {/* Minimal Type Switcher */}
              <div className="grid grid-cols-3 gap-1 bg-muted/40 p-1 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setImageType("default")}
                  className={`py-1 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                    imageType === "default"
                      ? "bg-card text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>انیمیشن پیش‌فرض</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageType("custom_image")}
                  className={`py-1 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                    imageType === "custom_image"
                      ? "bg-card text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>آپلود تصویر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageType("url")}
                  className={`py-1 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                    imageType === "url"
                      ? "bg-card text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>لینک تصویر (URL)</span>
                </button>
              </div>

              {/* Upload or URL compact controls */}
              {imageType === "custom_image" && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-border/90 rounded-xl p-3 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/30 transition-all flex items-center justify-center gap-2.5 bg-muted/10"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs text-foreground font-medium">
                      {isUploading ? "در حال آپلود..." : "انتخاب فایل تصویر برای سمت چپ"}
                    </span>
                  </div>

                  {imageUrl && (
                    <div className="flex items-center justify-between bg-muted/30 border border-border/70 rounded-lg p-1.5 px-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={imageUrl} alt="preview" className="w-6 h-6 rounded object-cover border shrink-0" />
                        <span className="text-[10px] font-mono text-muted-foreground truncate">{imageUrl}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("");
                          setImageType("default");
                        }}
                        className="text-destructive hover:opacity-80 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {imageType === "url" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="h-8 text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Preview Card: 5 cols */}
        <div className="lg:col-span-5">
          <Card className="border-border/80 shadow-2xs h-full">
            <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">پیش‌نمایش زنده صفحه ورود</span>
                </div>
                <Badge variant="secondary" className="text-[10px] h-4 font-mono">
                  /login
                </Badge>
              </div>

              {/* Compact Split-Screen Mockup */}
              <div className="rounded-xl border border-border/80 shadow-inner overflow-hidden flex-1 min-h-[220px] flex">
                
                {/* Right side gradient */}
                <div
                  className="w-1/2 p-3 flex items-center justify-center relative overflow-hidden transition-all duration-300"
                  style={{ background: computeGradientCss() }}
                >
                  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-2.5 w-full max-w-[130px] space-y-1.5 text-right pointer-events-none">
                    <div className="h-1.5 w-10 bg-slate-300 dark:bg-slate-600 rounded"></div>
                    <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"></div>
                    <div className="h-1.5 w-8 bg-slate-300 dark:bg-slate-600 rounded"></div>
                    <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"></div>
                    <div
                      className="h-4 w-full rounded shadow-2xs flex items-center justify-center text-white text-[7px] font-bold mt-1"
                      style={{ background: computeGradientCss() }}
                    >
                      ورود
                    </div>
                  </div>
                </div>

                {/* Left side visual */}
                <div className="w-1/2 bg-white dark:bg-slate-950 p-2 flex items-center justify-center border-r border-border/40">
                  {imageType === "default" || !imageUrl ? (
                    <video
                      src={loginVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="max-h-32 w-auto object-cover rounded"
                    />
                  ) : (
                    <img
                      src={imageUrl}
                      alt="Login Preview"
                      className={`max-h-32 w-auto max-w-full rounded object-${imageFit}`}
                    />
                  )}
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground text-center">
                تغییرات فوق پس از کلیک روی «ذخیره تنظیمات» در صفحه <span className="font-mono text-primary font-bold">/login</span> اعمال خواهد شد.
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
