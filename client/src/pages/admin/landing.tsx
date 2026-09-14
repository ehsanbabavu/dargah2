import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  Code,
  Sparkles,
  ExternalLink,
  Trash2,
  RefreshCw,
  Layers,
  Zap,
  Check,
  Loader2,
  AlertCircle,
  Pencil,
  Sliders,
  MessageSquare,
  Globe,
  FileText,
  FileQuestion,
  Search,
  RotateCcw,
  Settings,
  Home,
  Save,
  Eye,
  Monitor,
  Smartphone,
  LogIn,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import { LoginPageTab } from "./login-page-tab";

export interface TemplateItem {
  id: string;
  name: string;
  type: "default" | "zip" | "html";
  entryFile: string;
  folderName: string;
  entryUrl: string;
  previewImage?: string | null;
  uploadedAt: string | null;
  fileSize: number;
  filesCount: number;
  filesList: string[];
  customHtml?: string;
  isDefault?: boolean;
  showQuickNav?: boolean;
  showChatWidget?: boolean;
}

export interface InternalPageTemplateItem {
  id: string;
  name: string;
  type: "default" | "zip" | "html";
  entryFile: string;
  folderName: string;
  entryUrl: string;
  previewImage?: string | null;
  uploadedAt: string | null;
  fileSize: number;
  filesCount: number;
  filesList: string[];
  customHtml?: string;
  isDefault?: boolean;
  targetPath?: string;
  category?: "posts" | "store" | "general";
  showQuickNav?: boolean;
  showChatWidget?: boolean;
  customTitle?: string;
  description?: string;
  features?: string[];
}

export interface InternalPagesConfig {
  activeTemplateId: string;
  mode: "default" | "custom";
  templates: InternalPageTemplateItem[];
  showQuickNav: boolean;
  showChatWidget: boolean;
  defaultPreviewImage?: string | null;
}

export interface LandingConfig {
  mode: "default" | "custom";
  activeTemplateId: string;
  templates: TemplateItem[];
  title?: string;
  hasUploadedZip: boolean;
  uploadedAt: string | null;
  fileSize: number;
  filesCount: number;
  entryFile: string;
  filesList: string[];
  customHtml?: string;
  showQuickNav: boolean;
  showChatWidget?: boolean;
  previewImage?: string | null;
  defaultPreviewImage?: string | null;
}

export interface NotFoundTemplateItem {
  id: string;
  name: string;
  type: "default" | "zip" | "html";
  entryFile: string;
  folderName: string;
  entryUrl: string;
  previewImage?: string | null;
  uploadedAt: string | null;
  fileSize: number;
  filesCount: number;
  filesList: string[];
  customHtml?: string;
  isDefault?: boolean;
  showHomeButton?: boolean;
  showSearchBox?: boolean;
  showChatWidget?: boolean;
  customTitle?: string;
  customMessage?: string;
}

export interface NotFoundConfig {
  activeTemplateId: string;
  mode: "default" | "custom";
  templates: NotFoundTemplateItem[];
  showHomeButton: boolean;
  homeButtonText: string;
  showSearchBox: boolean;
  showChatWidget: boolean;
  customTitle: string;
  customMessage: string;
  autoRedirectSeconds: number;
  defaultPreviewImage?: string | null;
}

type InstallPhase = "idle" | "validating" | "uploading" | "extracting" | "extracting_header_footer" | "activating" | "completed" | "error";

const STORAGE_KEY = "landing_public_config_cache";

export default function AdminLandingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const notFoundFileInputRef = useRef<HTMLInputElement>(null);

  // Main Page Section Tabs: "landing" vs "internal_pages" vs "not_found" vs "login_page"
  const [activeSectionTab, setActiveSectionTab] = useState<"landing" | "internal_pages" | "not_found" | "login_page">("landing");

  // Main landing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [htmlCode, setHtmlCode] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateToDelete, setTemplateToDelete] = useState<TemplateItem | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<{ id: string; name: string } | null>(null);

  // Internal pages templates state
  const [internalSelectedFile, setInternalSelectedFile] = useState<File | null>(null);
  const [internalIsDragging, setInternalIsDragging] = useState(false);
  const [internalHtmlCode, setInternalHtmlCode] = useState("");
  const [internalTemplateTitle, setInternalTemplateTitle] = useState("");
  const [internalTemplateToDelete, setInternalTemplateToDelete] = useState<InternalPageTemplateItem | null>(null);
  const [internalEditingTemplate, setInternalEditingTemplate] = useState<{ id: string; name: string } | null>(null);
  const [previewingInternalTemplate, setPreviewingInternalTemplate] = useState<InternalPageTemplateItem | null>(null);
  const [previewDeviceView, setPreviewDeviceView] = useState<"desktop" | "mobile">("desktop");

  // Fetch Internal Pages Config & Templates
  const { data: internalPagesConfig } = useQuery<InternalPagesConfig>({
    queryKey: ["/api/admin/internal-pages/settings"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/internal-pages/settings");
      if (!res.ok) throw new Error("خطا در دریافت قالب‌های صفحات داخلی");
      return res.json();
    },
  });

  const internalTemplatesList = internalPagesConfig?.templates && internalPagesConfig.templates.length > 0
    ? internalPagesConfig.templates
    : [
        {
          id: "internal-posts-editorial",
          name: "قالب اختصاصی مقالات و تحریریه (/admin/posts)",
          type: "default" as const,
          entryFile: "posts.html",
          folderName: "internal-posts-editorial",
          entryUrl: "/admin/posts",
          previewImage: "/landing-previews/posts-template-preview.svg",
          uploadedAt: null,
          fileSize: 49152,
          filesCount: 6,
          filesList: [],
          isDefault: true,
          targetPath: "/admin/posts",
          category: "posts",
          showQuickNav: true,
          showChatWidget: true,
          customTitle: "سیستم مدیریت و نمایش مقالات، وبلاگ و تحریریه",
          description: "قالب طراحی اختصاصی ویژه صفحات /admin/posts با پشتیبانی از گرید مجلات خبری، مدیریت دسته‌بندی‌ها، برچسب‌ها، دیدگاه‌ها، نویسندگان و مشاهده آنلاین مقالات.",
          features: [
            "طراحی مجله‌ای و شبکه‌ای مدرن مقالات",
            "پنل اختصاصی مدیریت دسته‌ها و برچسب‌ها",
            "سیستم دیدگاه‌ها و لایک متقابل",
            "پشتیبانی از حالت شب و روز خودکار",
            "سئوی پیشرفته و بهینه‌سازی سرعت بارگذاری"
          ]
        },
        {
          id: "internal-store-catalog",
          name: "قالب ویترین و فروشگاه محصولات",
          type: "default" as const,
          entryFile: "catalog.html",
          folderName: "internal-store-catalog",
          entryUrl: "/vitrin",
          previewImage: "/landing-previews/posts-template-preview.svg",
          uploadedAt: null,
          fileSize: 32768,
          filesCount: 4,
          filesList: [],
          isDefault: false,
          targetPath: "/vitrin",
          category: "store",
          showQuickNav: true,
          showChatWidget: true,
          customTitle: "قالب ویترین محصولات و فروشگاه اینترنتی",
          description: "لایه‌بندی شیک برای گرید محصولات، فیلترها و جزئیات خرید با سبد خرید یکپارچه.",
          features: [
            "گرید مدرن کارت محصول",
            "فیلتر پیشرفته بر اساس قیمت و دسته",
            "سبد خرید یکپارچه"
          ]
        },
        {
          id: "internal-general-page",
          name: "قالب عمومی صفحات محتوایی و تماس",
          type: "default" as const,
          entryFile: "page.html",
          folderName: "internal-general-page",
          entryUrl: "/faqs",
          previewImage: "/landing-previews/default.svg",
          uploadedAt: null,
          fileSize: 18432,
          filesCount: 2,
          filesList: [],
          isDefault: false,
          targetPath: "/faqs",
          category: "general",
          showQuickNav: true,
          showChatWidget: true,
          customTitle: "قالب استاندارد صفحات متنی و سوالات متداول",
          description: "قالب ساده و شیک مناسب برای صفحات درباره ما، تماس، قوانین و شرایط و پرسش‌های متداول.",
          features: [
            "آکاردئون هوشمند پرسش و پاسخ",
            "فرمت‌بندی زیبای متون طولانی"
          ]
        }
      ];
  const activeInternalId = internalPagesConfig?.activeTemplateId || "internal-posts-editorial";

  // Activate Internal Template Mutation
  const activateInternalTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await createAuthenticatedRequest(`/api/admin/internal-pages/templates/${id}/activate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("خطا در فعال‌سازی قالب صفحات داخلی");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/internal-pages/settings"] });
      toast({ title: "قالب صفحات داخلی با موفقیت فعال گردید" });
    },
    onError: (err: any) => {
      toast({ title: "خطا در فعال‌سازی قالب", description: err.message, variant: "destructive" });
    },
  });

  // Set Default Internal Template Mutation
  const setDefaultInternalTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await createAuthenticatedRequest(`/api/admin/internal-pages/templates/${id}/set-default`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("خطا در تنظیم قالب پیش‌فرض");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/internal-pages/settings"] });
      toast({ title: "قالب به عنوان پیش‌فرض اصلی صفحات داخلی تنظیم گردید" });
    },
    onError: (err: any) => {
      toast({ title: "خطا در تنظیم قالب پیش‌فرض", description: err.message, variant: "destructive" });
    },
  });

  // Delete Internal Template Mutation
  const deleteInternalTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await createAuthenticatedRequest(`/api/admin/internal-pages/templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "خطا در حذف قالب صفحات داخلی");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/internal-pages/settings"] });
      setInternalTemplateToDelete(null);
      toast({ title: "قالب صفحات داخلی با موفقیت حذف شد" });
    },
    onError: (err: any) => {
      toast({ title: "خطا در حذف قالب", description: err.message, variant: "destructive" });
    },
  });

  // Update Internal Template Settings Mutation
  const updateInternalTemplateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; showQuickNav?: boolean; showChatWidget?: boolean; targetPath?: string }) => {
      const res = await createAuthenticatedRequest(`/api/admin/internal-pages/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("خطا در به‌روزرسانی تنظیمات قالب");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/internal-pages/settings"] });
      setInternalEditingTemplate(null);
      toast({ title: "تنظیمات قالب به‌روزرسانی شد" });
    },
    onError: (err: any) => {
      toast({ title: "خطا در بروزرسانی", description: err.message, variant: "destructive" });
    },
  });

  // Internal installation progress state
  const [internalTargetPath, setInternalTargetPath] = useState("/admin/posts");
  const [internalCategoryFilter, setInternalCategoryFilter] = useState("all");
  const [internalInstallProgress, setInternalInstallProgress] = useState(0);
  const [internalInstallPhase, setInternalInstallPhase] = useState<InstallPhase>("idle");
  const [internalInstallError, setInternalInstallError] = useState<string | null>(null);

  // Save Internal HTML Mutation
  const saveInternalHtmlMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/internal-pages/save-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlContent: internalHtmlCode,
          title: internalTemplateTitle || "قالب اختصاصی صفحات داخلی",
          targetPath: internalTargetPath || "/admin/posts",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "خطا در ذخیره کد HTML قالب صفحات داخلی");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/internal-pages/settings"] });
      setInternalTemplateTitle("");
      setInternalHtmlCode("");
      toast({
        title: "قالب HTML صفحات داخلی با موفقیت ایجاد و فعال شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت قالب HTML",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Handle Start Internal Zip Install
  const handleStartInternalZipInstall = async (file: File) => {
    if (!file) return;
    setInternalInstallPhase("validating");
    setInternalInstallProgress(15);
    setInternalInstallError(null);

    const timer = setInterval(() => {
      setInternalInstallProgress((prev) => {
        if (prev < 30) {
          setInternalInstallPhase("validating");
          return prev + 5;
        } else if (prev < 65) {
          setInternalInstallPhase("uploading");
          return prev + 6;
        } else if (prev < 88) {
          setInternalInstallPhase("extracting");
          return prev + 3;
        } else if (prev < 96) {
          setInternalInstallPhase("activating");
          return prev + 1;
        }
        return prev;
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/internal-pages/upload-zip", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(timer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "خطا در پردازش فایل" }));
        throw new Error(err.message || "خطا در استخراج قالب صفحات داخلی");
      }

      setInternalInstallProgress(100);
      setInternalInstallPhase("completed");
      setInternalSelectedFile(null);

      queryClient.invalidateQueries({ queryKey: ["/api/admin/internal-pages/settings"] });

      toast({
        title: "قالب صفحات داخلی با موفقیت نصب و فعال گردید",
      });
    } catch (err: any) {
      clearInterval(timer);
      setInternalInstallPhase("error");
      setInternalInstallError(err.message || "خطا در بارگذاری پکیج قالب");
      toast({
        title: "خطا در نصب قالب صفحات داخلی",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // 404 error pages templates state
  const [notFoundSelectedFile, setNotFoundSelectedFile] = useState<File | null>(null);
  const [notFoundIsDragging, setNotFoundIsDragging] = useState(false);
  const [notFoundHtmlCode, setNotFoundHtmlCode] = useState("");
  const [notFoundTemplateTitle, setNotFoundTemplateTitle] = useState("");
  const [notFoundTemplateToDelete, setNotFoundTemplateToDelete] = useState<NotFoundTemplateItem | null>(null);
  const [notFoundEditingTemplate, setNotFoundEditingTemplate] = useState<{ id: string; name: string } | null>(null);

  // 404 installation progress state (0 to 100)
  const [notFoundInstallProgress, setNotFoundInstallProgress] = useState(0);
  const [notFoundInstallPhase, setNotFoundInstallPhase] = useState<InstallPhase>("idle");
  const [notFoundInstallError, setNotFoundInstallError] = useState<string | null>(null);

  // 404 General Settings form local state
  const [notFoundCustomTitle, setNotFoundCustomTitle] = useState("");
  const [notFoundCustomMessage, setNotFoundCustomMessage] = useState("");
  const [notFoundHomeButtonText, setNotFoundHomeButtonText] = useState("");
  const [notFoundShowHomeButton, setNotFoundShowHomeButton] = useState(true);
  const [notFoundShowSearchBox, setNotFoundShowSearchBox] = useState(true);
  const [notFoundShowChatWidget, setNotFoundShowChatWidget] = useState(true);
  const [notFoundAutoRedirectSeconds, setNotFoundAutoRedirectSeconds] = useState(0);
  const [notFoundSettingsInitialized, setNotFoundSettingsInitialized] = useState(false);

  // Fetch 404 admin settings
  const { data: notFoundConfig } = useQuery<NotFoundConfig>({
    queryKey: ["/api/admin/not-found/settings"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/not-found/settings");
      if (!res.ok) throw new Error("خطا در دریافت تنظیمات صفحه 404");
      return res.json();
    },
  });

  // Sync notFoundConfig to local form state once loaded
  useEffect(() => {
    if (notFoundConfig && !notFoundSettingsInitialized) {
      setNotFoundCustomTitle(notFoundConfig.customTitle || "صفحه مورد نظر پیدا نشد");
      setNotFoundCustomMessage(
        notFoundConfig.customMessage ||
          "متأسفانه صفحه‌ای که به دنبال آن بودید یافت نشد یا به آدرس دیگری منتقل شده است."
      );
      setNotFoundHomeButtonText(notFoundConfig.homeButtonText || "بازگشت به صفحه اصلی");
      setNotFoundShowHomeButton(notFoundConfig.showHomeButton ?? true);
      setNotFoundShowSearchBox(notFoundConfig.showSearchBox ?? true);
      setNotFoundShowChatWidget(notFoundConfig.showChatWidget ?? true);
      setNotFoundAutoRedirectSeconds(notFoundConfig.autoRedirectSeconds ?? 0);
      setNotFoundSettingsInitialized(true);
    }
  }, [notFoundConfig, notFoundSettingsInitialized]);

  // Installation progress state (0 to 100)
  const [installProgress, setInstallProgress] = useState(0);
  const [installPhase, setInstallPhase] = useState<InstallPhase>("idle");
  const [installError, setInstallError] = useState<string | null>(null);

  // Fetch admin landing settings
  const { data: config } = useQuery<LandingConfig>({
    queryKey: ["/api/admin/landing/settings"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/landing/settings");
      if (!res.ok) throw new Error("خطا در دریافت اطلاعات لندینگ");
      const data = await res.json();
      if (data.customHtml && !htmlCode) {
        setHtmlCode(data.customHtml);
      }
      return data;
    },
  });

  const isInstalling = installPhase !== "idle" && installPhase !== "completed" && installPhase !== "error";

  const handleStartZipInstall = async (file: File) => {
    if (!file) return;
    setInstallPhase("validating");
    setInstallProgress(10);
    setInstallError(null);

    const timer = setInterval(() => {
      setInstallProgress((prev) => {
        if (prev < 25) {
          setInstallPhase("validating");
          return prev + 4;
        } else if (prev < 50) {
          setInstallPhase("uploading");
          return prev + 5;
        } else if (prev < 75) {
          setInstallPhase("extracting");
          return prev + 4;
        } else if (prev < 90) {
          setInstallPhase("extracting_header_footer");
          return prev + 3;
        } else if (prev < 97) {
          setInstallPhase("activating");
          return prev + 1;
        }
        return prev;
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/landing/upload-zip", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(timer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "خطا در پردازش سرور" }));
        throw new Error(err.message || "خطا در استخراج و فعال‌سازی قالب");
      }

      setInstallProgress(100);
      setInstallPhase("completed");

      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing/public-config"] });

      toast({
        title: "قالب جدید، هدر و فوتر با موفقیت نصب و جایگزین شدند",
        description: "هدر و فوتر اختصاصی قالب استخراج شده و به طور خودکار اعمال گردیدند.",
      });
    } catch (err: any) {
      clearInterval(timer);
      setInstallPhase("error");
      setInstallError(err.message || "خطا در بارگذاری پکیج قالب");
      toast({
        title: "خطا در نصب قالب",
        description: err.message || "فایل زیپ قابل پردازش نبود",
        variant: "destructive",
      });
    }
  };

  // Activate specific template mutation
  const activateTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await createAuthenticatedRequest(`/api/admin/landing/templates/${templateId}/activate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در فعال‌سازی قالب");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing/public-config"] });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      toast({
        title: "قالب فعال تغییر یافت",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Delete specific template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await createAuthenticatedRequest(`/api/admin/landing/templates/${templateId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در حذف قالب");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing/public-config"] });
      setTemplateToDelete(null);
      toast({
        title: "قالب حذف شد",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Update Template Settings & Title Mutation
  const updateTemplateSettingsMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      showQuickNav,
      showChatWidget,
    }: {
      id: string;
      title?: string;
      showQuickNav?: boolean;
      showChatWidget?: boolean;
    }) => {
      const res = await createAuthenticatedRequest(`/api/admin/landing/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, showQuickNav, showChatWidget }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در ویرایش تنظیمات قالب");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing/public-config"] });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      setEditingTemplate(null);
      toast({
        title: "تنظیمات قالب به‌روزرسانی شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Save HTML Mutation
  const saveHtmlMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/landing/save-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: htmlCode, title: templateTitle || "لندینگ HTML اختصاصی" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در ذخیره کد HTML");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing/public-config"] });
      setTemplateTitle("");
      toast({
        title: "قالب HTML ذخیره، به گالری اضافه و فعال شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // 404 Activate Specific Template Mutation
  const activateNotFoundTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await createAuthenticatedRequest(`/api/admin/not-found/templates/${templateId}/activate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در فعال‌سازی قالب 404");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/not-found/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/not-found/config"] });
      toast({
        title: "قالب صفحه 404 فعال شد",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // 404 Delete Specific Template Mutation
  const deleteNotFoundTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await createAuthenticatedRequest(`/api/admin/not-found/templates/${templateId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در حذف قالب 404");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/not-found/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/not-found/config"] });
      setNotFoundTemplateToDelete(null);
      toast({
        title: "قالب 404 با موفقیت حذف شد",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // 404 Update Template Settings
  const updateNotFoundTemplateSettingsMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      showHomeButton,
      showSearchBox,
      showChatWidget,
    }: {
      id: string;
      title?: string;
      showHomeButton?: boolean;
      showSearchBox?: boolean;
      showChatWidget?: boolean;
    }) => {
      const res = await createAuthenticatedRequest(`/api/admin/not-found/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, showHomeButton, showSearchBox, showChatWidget }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در ویرایش تنظیمات قالب 404");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/not-found/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/not-found/config"] });
      setNotFoundEditingTemplate(null);
      toast({
        title: "تنظیمات قالب 404 با موفقیت به‌روزرسانی شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // 404 Save HTML Mutation
  const saveNotFoundHtmlMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/not-found/save-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlContent: notFoundHtmlCode,
          title: notFoundTemplateTitle || "قالب کد اختصاصی ۴۰۴",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در ذخیره کد HTML صفحه 404");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/not-found/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/not-found/config"] });
      setNotFoundTemplateTitle("");
      setNotFoundHtmlCode("");
      toast({
        title: "قالب HTML صفحه 404 ذخیره و فعال شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // 404 Toggle Mode Mutation
  const toggleNotFoundModeMutation = useMutation({
    mutationFn: async (mode: "default" | "custom") => {
      const res = await createAuthenticatedRequest("/api/admin/not-found/toggle-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در تغییر حالت صفحه 404");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/not-found/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/not-found/config"] });
      toast({
        title: "تغییر وضعیت صفحه 404",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // 404 General Settings Save Mutation
  const saveNotFoundGeneralSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/not-found/update-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customTitle: notFoundCustomTitle,
          customMessage: notFoundCustomMessage,
          homeButtonText: notFoundHomeButtonText,
          showHomeButton: notFoundShowHomeButton,
          showSearchBox: notFoundShowSearchBox,
          showChatWidget: notFoundShowChatWidget,
          autoRedirectSeconds: Number(notFoundAutoRedirectSeconds) || 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در ذخیره تنظیمات صفحه 404");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/not-found/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/not-found/config"] });
      toast({
        title: "تنظیمات صفحه 404 ذخیره شد",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // 404 Reset to Default Mutation
  const resetNotFoundMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/not-found/reset", {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در بازنشانی صفحه 404");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/not-found/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/not-found/config"] });
      setNotFoundSettingsInitialized(false);
      toast({
        title: "بازنشانی انجام شد",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // 404 Zip Install Handler
  const handleStartNotFoundZipInstall = async (file: File) => {
    if (!file) return;
    setNotFoundInstallPhase("validating");
    setNotFoundInstallProgress(15);
    setNotFoundInstallError(null);

    const timer = setInterval(() => {
      setNotFoundInstallProgress((prev) => {
        if (prev < 30) {
          setNotFoundInstallPhase("validating");
          return prev + 5;
        } else if (prev < 65) {
          setNotFoundInstallPhase("uploading");
          return prev + 6;
        } else if (prev < 88) {
          setNotFoundInstallPhase("extracting");
          return prev + 3;
        } else if (prev < 96) {
          setNotFoundInstallPhase("activating");
          return prev + 1;
        }
        return prev;
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/not-found/upload-zip", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(timer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "خطا در پردازش سرور" }));
        throw new Error(err.message || "خطا در استخراج و فعال‌سازی قالب 404");
      }

      setNotFoundInstallProgress(100);
      setNotFoundInstallPhase("completed");

      queryClient.invalidateQueries({ queryKey: ["/api/admin/not-found/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/not-found/config"] });

      setNotFoundSelectedFile(null);
      setNotFoundTemplateTitle("");

      toast({
        title: "قالب 404 با موفقیت به گالری اضافه و فعال شد",
        description: "صفحه خطای 404 سامانه اکنون با این قالب نمایش داده می‌شود.",
      });
    } catch (err: any) {
      clearInterval(timer);
      setNotFoundInstallPhase("error");
      setNotFoundInstallError(err.message || "خطا در بارگذاری پکیج قالب 404");
      toast({
        title: "خطا در نصب قالب 404",
        description: err.message || "فایل زیپ قابل پردازش نبود",
        variant: "destructive",
      });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".zip")) {
        setSelectedFile(file);
        setInstallPhase("idle");
        setInstallProgress(0);
        setInstallError(null);
      } else {
        toast({
          title: "فرمت نامعتبر",
          description: "لطفاً یک فایل زیپ (.zip) انتخاب کنید",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith(".zip")) {
        setSelectedFile(file);
        setInstallPhase("idle");
        setInstallProgress(0);
        setInstallError(null);
      } else {
        toast({
          title: "فرمت نامعتبر",
          description: "لطفاً یک فایل زیپ (.zip) انتخاب کنید",
          variant: "destructive",
        });
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 بایت";
    const k = 1024;
    const sizes = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Compile list of all landing templates (default + any uploaded ones)
  const templatesList = config?.templates && config.templates.length > 0
    ? config.templates
    : [
        {
          id: "default",
          name: "تم پیش‌فرض ۱ (اصلی سامانه)",
          type: "default" as const,
          entryFile: "index.html",
          folderName: "default",
          entryUrl: "/",
          previewImage: config?.defaultPreviewImage || "/landing-previews/default.png",
          uploadedAt: null,
          fileSize: 0,
          filesCount: 1,
          filesList: [],
          isDefault: true,
          showQuickNav: false,
          showChatWidget: true,
        },
      ];

  // Compile list of all 404 templates (default + any uploaded ones)
  const notFoundTemplatesList = notFoundConfig?.templates && notFoundConfig.templates.length > 0
    ? notFoundConfig.templates
    : [
        {
          id: "default",
          name: "پیش‌فرض ۱ سامانه (طراحی مدرن)",
          type: "default" as const,
          entryFile: "404",
          folderName: "default",
          entryUrl: "/404?preview_template=default",
          previewImage: "/not-found-previews/default.svg",
          uploadedAt: null,
          fileSize: 0,
          filesCount: 0,
          filesList: [],
          isDefault: true,
          showHomeButton: true,
          showChatWidget: true,
        },
      ];

  return (
    <DashboardLayout title="قالب سایت">
      <div className="space-y-4 max-w-6xl mx-auto pb-10" dir="rtl">
        {/* Main Section Navigation Tabs (Modern Segmented Pill Design) */}
        <div className="flex items-center justify-start pb-1">
          <div className="inline-flex items-center p-1 bg-muted/70 dark:bg-muted/40 border border-border/80 rounded-xl shadow-2xs gap-1">
            <button
              type="button"
              onClick={() => setActiveSectionTab("landing")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeSectionTab === "landing"
                  ? "bg-card text-primary shadow-xs ring-1 ring-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  activeSectionTab === "landing"
                    ? "bg-primary/10 text-primary"
                    : "bg-transparent text-muted-foreground"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
              </div>
              <span>قالب صفحه اصلی (لندینگ)</span>
              {config?.mode === "custom" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSectionTab("internal_pages")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeSectionTab === "internal_pages"
                  ? "bg-card text-primary shadow-xs ring-1 ring-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  activeSectionTab === "internal_pages"
                    ? "bg-primary/10 text-primary"
                    : "bg-transparent text-muted-foreground"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span>قالب صفحات داخلی</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSectionTab("not_found")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeSectionTab === "not_found"
                  ? "bg-card text-primary shadow-xs ring-1 ring-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  activeSectionTab === "not_found"
                    ? "bg-primary/10 text-primary"
                    : "bg-transparent text-muted-foreground"
                }`}
              >
                <FileQuestion className="w-3.5 h-3.5" />
              </div>
              <span>قالب صفحات 404</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSectionTab("login_page")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeSectionTab === "login_page"
                  ? "bg-card text-primary shadow-xs ring-1 ring-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  activeSectionTab === "login_page"
                    ? "bg-primary/10 text-primary"
                    : "bg-transparent text-muted-foreground"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
              </div>
              <span>صفحه لاگین</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: MAIN LANDING TEMPLATE */}
        {activeSectionTab === "landing" && (
          <div className="space-y-4">
            {/* Top Control: Upload & Add Template Box */}
            <Card className="border-border shadow-xs">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>افزودن و نصب قالب صفحه اصلی</span>
                  </CardTitle>
                  <span className="text-[10px] text-muted-foreground">پشتیبانی از فایل فشرده ZIP و کدهای اختصاصی HTML</span>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2.5">
                <Tabs defaultValue="zip" className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <TabsList className="grid grid-cols-2 max-w-[210px] h-7 p-0.5">
                      <TabsTrigger value="zip" className="text-[11px] h-6 px-2 gap-1">
                        <FileArchive className="w-3 h-3" />
                        <span>فایل ZIP</span>
                      </TabsTrigger>
                      <TabsTrigger value="html" className="text-[11px] h-6 px-2 gap-1">
                        <Code className="w-3 h-3" />
                        <span>کد HTML</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* TAB 1: ZIP Upload */}
                  <TabsContent value="zip" className="space-y-2 mt-0">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex items-center justify-center gap-3 min-h-[64px] ${
                        isDragging
                          ? "border-primary bg-primary/10"
                          : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileArchive className="w-4 h-4" />
                      </div>

                      <div className="text-right flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {selectedFile ? selectedFile.name : "انتخاب یا کشیدن فایل ZIP قالب"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {selectedFile
                            ? `حجم: ${formatBytes(selectedFile.size)}`
                            : "شامل index.html و پوشه‌های css / js (پس از آپلود به گالری اضافه می‌شود)"}
                        </p>
                      </div>

                      {selectedFile && (
                        <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 text-[10px] py-0 h-5 shrink-0">
                          آماده نصب
                        </Badge>
                      )}
                    </div>

                    {selectedFile && (
                      <div className="flex items-center justify-end gap-1.5 pt-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setInstallPhase("idle");
                            setInstallProgress(0);
                            setInstallError(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          disabled={isInstalling}
                          className="h-7 text-[11px] px-2.5"
                        >
                          انصراف
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStartZipInstall(selectedFile)}
                          disabled={isInstalling}
                          className="h-7 text-[11px] gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                          {isInstalling ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>نصب ({installProgress}%)...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              <span>نصب و افزودن به گالری</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Installation Progress Tracker */}
                    {installPhase !== "idle" && (
                      <div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {installPhase === "completed" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : installPhase === "error" ? (
                              <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                            ) : (
                              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                            )}
                            <span className="text-[11px] font-bold text-foreground truncate">
                              {installPhase === "validating" && "مرحله ۱ از ۵: اعتبارسنجی پکیج..."}
                              {installPhase === "uploading" && "مرحله ۲ از ۵: ارسال فایل‌ها..."}
                              {installPhase === "extracting" && "مرحله ۳ از ۵: استخراج ساختار و فایل‌های قالب..."}
                              {installPhase === "extracting_header_footer" && "مرحله ۴ از ۵: استخراج هدر و فوتر قالب جدید و جایگزینی..."}
                              {installPhase === "activating" && "مرحله ۵ از ۵: فعال‌سازی نهایی..."}
                              {installPhase === "completed" && "قالب جدید، هدر و فوتر با موفقیت استخراج، نصب و جایگزین شدند!"}
                              {installPhase === "error" && "خطا در فرآیند نصب"}
                            </span>
                          </div>
                          <Badge
                            variant={installPhase === "completed" ? "default" : installPhase === "error" ? "destructive" : "secondary"}
                            className={`font-mono text-[10px] px-1.5 py-0 h-4 ${
                              installPhase === "completed"
                                ? "bg-emerald-600 text-white"
                                : installPhase === "error"
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-primary/15 text-primary font-bold"
                            }`}
                          >
                            {installProgress}%
                          </Badge>
                        </div>

                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              installPhase === "completed"
                                ? "bg-emerald-500"
                                : installPhase === "error"
                                ? "bg-destructive"
                                : "bg-gradient-to-l from-primary to-emerald-500"
                            }`}
                            style={{ width: `${installProgress}%` }}
                          />
                        </div>

                        {installPhase === "error" && installError && (
                          <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-[11px] flex items-center justify-between">
                            <span className="truncate">{installError}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setInstallPhase("idle");
                                setInstallProgress(0);
                                setInstallError(null);
                              }}
                              className="h-5 text-[9px] px-1.5"
                            >
                              بستن
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: Direct HTML */}
                  <TabsContent value="html" className="space-y-2 mt-0">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={templateTitle}
                        onChange={(e) => setTemplateTitle(e.target.value)}
                        placeholder="عنوان قالب جدید (اختیاری)"
                        className="h-7 text-xs max-w-xs"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const sample = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>صفحه اول اختصاصی</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <style>body { font-family: Vazirmatn, system-ui, sans-serif; }</style>
</head>
<body class="bg-slate-900 text-white min-h-screen flex flex-col justify-between">
  <header class="p-4 border-b border-slate-800 flex justify-between items-center max-w-5xl mx-auto w-full">
    <div class="text-lg font-bold text-sky-400">فروشگاه آنلاین</div>
    <div class="flex gap-2">
      <a href="/login" class="px-3 py-1.5 text-xs text-slate-300 hover:text-white">ورود</a>
      <a href="/register" class="px-3 py-1.5 text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium">ثبت‌نام</a>
    </div>
  </header>
  <main class="max-w-3xl mx-auto px-4 py-16 text-center">
    <h1 class="text-3xl sm:text-5xl font-black text-white mb-4">خرید آنلاین و هوشمند با بهترین قیمت‌ها</h1>
    <p class="text-slate-400 text-sm max-w-xl mx-auto mb-6">سامانه جامع با پشتیبانی ۲۴ ساعته و ارسال فوری</p>
    <a href="/products" class="inline-block px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-md">مشاهده محصولات</a>
  </main>
  <footer class="p-4 text-center text-slate-500 text-[11px] border-t border-slate-800">
    تمامی حقوق محفوظ است ©
  </footer>
</body>
</html>`;
                          setHtmlCode(sample);
                          toast({ title: "قالب نمونه قرار گرفت" });
                        }}
                        className="h-7 text-[10px] text-primary gap-1 px-2"
                      >
                        <Zap className="w-3 h-3" />
                        <span>کد آماده نمونه</span>
                      </Button>
                    </div>

                    <Textarea
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      placeholder="کدهای کامل HTML را اینجا قرار دهید..."
                      rows={4}
                      className="font-mono text-[10px] text-left min-h-[90px]"
                      dir="ltr"
                    />

                    <div className="flex justify-end pt-0.5">
                      <Button
                        size="sm"
                        onClick={() => saveHtmlMutation.mutate()}
                        disabled={!htmlCode.trim() || saveHtmlMutation.isPending}
                        className="h-7 text-[11px] gap-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        {saveHtmlMutation.isPending ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>افزودن به قالب‌ها و فعال‌سازی</span>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Installed & Available Templates Gallery Section */}
            <Card className="border-border shadow-xs">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>قالب‌های صفحه اصلی نصب شده ({templatesList.length} قالب)</span>
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground block">
                      برای تغییر صفحه اول، روی دکمه «فعال‌سازی این قالب» کلیک کنید.
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {templatesList.map((tpl) => {
                    const isActive = tpl.isDefault
                      ? (config?.mode === "default" || config?.activeTemplateId === "default")
                      : (config?.mode === "custom" && (config?.activeTemplateId === tpl.id || (!config?.activeTemplateId && tpl === templatesList.find(t => !t.isDefault))));

                    const previewSrc = tpl.previewImage || config?.defaultPreviewImage || "/landing-previews/default.png";
                    const isQuickNavActive = tpl.showQuickNav ?? (tpl.isDefault ? false : config?.showQuickNav ?? false);
                    const isChatWidgetActive = tpl.showChatWidget ?? (config?.showChatWidget !== false);

                    return (
                      <div
                        key={tpl.id}
                        className={`relative rounded-xl border transition-all flex flex-col overflow-hidden bg-card ${
                          isActive
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                            : "border-border/80 hover:border-primary/40 hover:shadow-xs"
                        }`}
                      >
                        {/* Visual Thumbnail Header */}
                        <div className="relative h-32 sm:h-36 w-full overflow-hidden border-b border-border/60 bg-slate-950 flex flex-col justify-between group">
                          <img
                            src={previewSrc}
                            alt={`پیش‌نمایش ${tpl.name}`}
                            className="absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.92] transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/landing-previews/default.svg";
                            }}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

                          {/* Top Bar with Status Badge */}
                          <div className="relative z-10 p-2 flex items-center justify-between">
                            <Badge variant="secondary" className="bg-black/60 backdrop-blur-xs text-white/90 text-[9px] py-0 px-1.5 h-4 border-0 font-normal">
                              {tpl.id === "default" || tpl.isDefault ? "پیش‌فرض ۱" : tpl.type === "html" ? "HTML" : "ZIP"}
                            </Badge>

                            {isActive && (
                              <div className="bg-emerald-600 text-white text-[9px] py-0.5 px-2 rounded-full gap-1 shadow-xs font-bold flex items-center h-4">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>فعال</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Details & Per-Card Settings */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1.5">
                              {editingTemplate?.id === tpl.id ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={editingTemplate.name}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                    className="h-6 text-[11px] px-1.5"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => updateTemplateSettingsMutation.mutate({ id: tpl.id, title: editingTemplate.name })}
                                    disabled={updateTemplateSettingsMutation.isPending}
                                    className="h-6 px-2 text-[9px] bg-primary"
                                  >
                                    ذخیره
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingTemplate(null)}
                                    className="h-6 px-1.5 text-[9px]"
                                  >
                                    لغو
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="text-[11px] font-bold text-foreground flex items-center gap-1 truncate">
                                    {tpl.isDefault ? (
                                      <Sparkles className="w-3 h-3 text-primary shrink-0" />
                                    ) : (
                                      <FileArchive className="w-3 h-3 text-emerald-600 shrink-0" />
                                    )}
                                    <span className="truncate">{tpl.name}</span>
                                  </h3>
                                  {!tpl.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingTemplate({ id: tpl.id, name: tpl.name })}
                                      className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                                      title="ویرایش نام قالب"
                                    >
                                      <Pencil className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            <p className="text-[10px] text-muted-foreground line-clamp-1 leading-snug">
                              {tpl.isDefault
                                ? "صفحه اصلی استاندارد با اسلایدرها و دسته‌بندی‌ها"
                                : tpl.uploadedAt
                                ? `ثبت شده در: ${new Date(tpl.uploadedAt).toLocaleDateString("fa-IR")}`
                                : "قالب سفارشی نصب شده"}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t border-border/40">
                              <span className="flex items-center gap-1 font-medium">
                                <Globe className="w-3 h-3 text-primary/70" />
                                <span>آدرس ورودی:</span>
                              </span>
                              <code className="font-mono text-[9.5px] bg-muted px-1.5 py-0.5 rounded text-primary font-bold dir-ltr">
                                {tpl.isDefault ? "/ (صفحه اول سایت)" : (tpl.entryUrl || `/${tpl.folderName}`)}
                              </code>
                            </div>

                            {/* Complementary Settings: Only shown when this template is active */}
                            {isActive && (
                              <div className="pt-1.5 pb-0.5 space-y-1.5 border-t border-border/60 bg-muted/20 rounded-md px-2 py-1.5 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-foreground font-medium flex items-center gap-1">
                                    <Sliders className="w-2.5 h-2.5 text-primary" />
                                    <span>نوار دسترسی بالا</span>
                                  </span>
                                  <Switch
                                    checked={isQuickNavActive}
                                    onCheckedChange={(checked) =>
                                      updateTemplateSettingsMutation.mutate({ id: tpl.id, showQuickNav: checked })
                                    }
                                    className="scale-[0.75] origin-left"
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-foreground font-medium flex items-center gap-1">
                                    <MessageSquare className="w-2.5 h-2.5 text-sky-500" />
                                    <span>ویجت ربات گفتگو</span>
                                  </span>
                                  <Switch
                                    checked={isChatWidgetActive}
                                    onCheckedChange={(checked) =>
                                      updateTemplateSettingsMutation.mutate({ id: tpl.id, showChatWidget: checked })
                                    }
                                    className="scale-[0.75] origin-left"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions Footer */}
                          <div className="pt-1.5 border-t border-border/60 flex items-center justify-between gap-1.5">
                            {isActive ? (
                              <Button
                                size="sm"
                                disabled
                                className="h-7 text-[10px] gap-1 bg-emerald-600/15 text-emerald-600 border border-emerald-500/30 flex-1 cursor-default font-bold px-2"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>قالب فعال است</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => activateTemplateMutation.mutate(tpl.id)}
                                disabled={activateTemplateMutation.isPending}
                                className="h-7 text-[10px] gap-1 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2"
                              >
                                {activateTemplateMutation.isPending ? (
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Check className="w-2.5 h-2.5" />
                                )}
                                <span>فعال‌سازی</span>
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLocation(`/admin/landing/builder?template=${tpl.id}`);
                              }}
                              className="h-7 text-[10px] gap-1 px-2.5 shrink-0 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold transition-colors"
                              title="ویرایش بصری، متن‌ها، تصاویر و بخش‌های قالب"
                            >
                              <Pencil className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>ویرایش قالب</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-7 w-7 p-0 shrink-0"
                              title="مشاهده صفحه اصلی در تب جدید"
                            >
                              <a
                                href={
                                  tpl.isDefault
                                    ? "/?preview_template=default"
                                    : `/public-landing?preview_template=${tpl.id}`
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>

                            {!tpl.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTemplateToDelete(tpl)}
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                                title="حذف این قالب"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECTION 2: INTERNAL PAGES TEMPLATE (قالب صفحات داخلی) */}
        {activeSectionTab === "internal_pages" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Control: Upload & Add Internal Pages Template */}
            <Card className="border-border shadow-xs">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>افزودن و نصب قالب صفحات داخلی</span>
                  </CardTitle>
                  <span className="text-[10px] text-muted-foreground">مدیریت لایه‌بندی و تم صفحات درونی سایت</span>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2.5">
                <Tabs defaultValue="zip" className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <TabsList className="grid grid-cols-2 max-w-[210px] h-7 p-0.5">
                      <TabsTrigger value="zip" className="text-[11px] h-6 px-2 gap-1">
                        <FileArchive className="w-3 h-3" />
                        <span>فایل ZIP</span>
                      </TabsTrigger>
                      <TabsTrigger value="html" className="text-[11px] h-6 px-2 gap-1">
                        <Code className="w-3 h-3" />
                        <span>کد HTML / JSX</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* TAB 1: ZIP Upload for Internal */}
                  <TabsContent value="zip" className="space-y-2 mt-0">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setInternalIsDragging(true);
                      }}
                      onDragLeave={() => setInternalIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setInternalIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          if (file.name.toLowerCase().endsWith(".zip")) {
                            setInternalSelectedFile(file);
                          } else {
                            toast({
                              title: "فرمت نامعتبر",
                              description: "لطفاً یک فایل زیپ (.zip) انتخاب کنید",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                      onClick={() => internalFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex items-center justify-center gap-3 min-h-[64px] ${
                        internalIsDragging
                          ? "border-primary bg-primary/10"
                          : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <input
                        ref={internalFileInputRef}
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            if (file.name.toLowerCase().endsWith(".zip")) {
                              setInternalSelectedFile(file);
                            }
                          }
                        }}
                        className="hidden"
                      />

                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileArchive className="w-4 h-4" />
                      </div>

                      <div className="text-right flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {internalSelectedFile ? internalSelectedFile.name : "انتخاب یا کشیدن فایل ZIP قالب صفحات داخلی"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {internalSelectedFile
                            ? `حجم: ${formatBytes(internalSelectedFile.size)}`
                            : "شامل فایل‌های قالب‌بندی هدر، فوتر و محتوای صفحات داخلی"}
                        </p>
                      </div>

                      {internalSelectedFile && (
                        <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 text-[10px] py-0 h-5 shrink-0">
                          آماده نصب
                        </Badge>
                      )}
                    </div>

                    {internalSelectedFile && (
                      <div className="flex items-center justify-end gap-1.5 pt-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInternalSelectedFile(null);
                            if (internalFileInputRef.current) internalFileInputRef.current.value = "";
                          }}
                          className="h-7 text-[11px] px-2.5"
                        >
                          انصراف
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStartInternalZipInstall(internalSelectedFile)}
                          className="h-7 text-[11px] gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                          <Upload className="w-3 h-3" />
                          <span>نصب و افزودن به گالری</span>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: Direct HTML for Internal */}
                  <TabsContent value="html" className="space-y-2 mt-0">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={internalTemplateTitle}
                        onChange={(e) => setInternalTemplateTitle(e.target.value)}
                        placeholder="عنوان قالب جدید صفحات داخلی / مقالات (/admin/posts)"
                        className="h-7 text-xs max-w-xs"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const sample = `<div class="min-h-screen bg-slate-900 text-slate-100 font-sans">
  <header class="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
    <div class="flex items-center gap-3">
      <span class="w-3 h-3 rounded-full bg-indigo-500"></span>
      <h1 class="text-xl font-bold tracking-tight">سامانه مقالات و تحریریه (/admin/posts)</h1>
    </div>
    <span class="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">پیش‌فرض اختصاصی</span>
  </header>
  <main class="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="md:col-span-2 bg-slate-800/60 rounded-xl p-6 border border-slate-700/60">
      <h2 class="text-lg font-bold text-white mb-2">آخرین نوشته‌ها و تحلیلی‌های تخصصی</h2>
      <p class="text-xs text-slate-400 mb-4">قالب بهینه‌سازی شده برای مطالعه سریع و سئوی بالا</p>
      <!-- محتوای مقالات -->
    </div>
    <div class="bg-slate-800/40 rounded-xl p-6 border border-slate-700/40 space-y-4">
      <h3 class="text-sm font-bold text-indigo-400">دسته‌بندی‌های داغ</h3>
      <!-- لیست دسته‌ها -->
    </div>
  </main>
</div>`;
                          setInternalHtmlCode(sample);
                          toast({ title: "کد نمونه اختصاصی مقالات قرار گرفت" });
                        }}
                        className="h-7 text-[10px] text-primary gap-1 px-2"
                      >
                        <Zap className="w-3 h-3" />
                        <span>کد نمونه مقالات</span>
                      </Button>
                    </div>

                    <Textarea
                      value={internalHtmlCode}
                      onChange={(e) => setInternalHtmlCode(e.target.value)}
                      placeholder="کدهای قالب صفحات داخلی و مقالات را اینجا قرار دهید..."
                      rows={4}
                      className="font-mono text-[10px] text-left min-h-[90px]"
                      dir="ltr"
                    />

                    <div className="flex justify-end pt-0.5">
                      <Button
                        size="sm"
                        onClick={() => saveInternalHtmlMutation.mutate()}
                        disabled={!internalHtmlCode.trim() || saveInternalHtmlMutation.isPending}
                        className="h-7 text-[11px] gap-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        {saveInternalHtmlMutation.isPending ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>افزودن به قالب‌ها و فعال‌سازی</span>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Installed Internal Templates Gallery */}
            <Card className="border-border shadow-xs">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>قالب‌های صفحات داخلی و مقالات ({internalTemplatesList.length} قالب)</span>
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground block">
                      مدیریت قالب‌های ظاهری بخش‌های درونی سایت نظیر مدیریت مقالات (/admin/posts)، ویترین محصولات و صفحات عمومی
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {internalTemplatesList.map((tpl) => {
                    const isActive = activeInternalId === tpl.id;
                    const previewSrc = tpl.previewImage || "/landing-previews/posts-template-preview.svg";

                    return (
                      <div
                        key={tpl.id}
                        className={`relative rounded-xl border transition-all flex flex-col overflow-hidden bg-card ${
                          isActive
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                            : "border-border/80 hover:border-primary/40 hover:shadow-xs"
                        }`}
                      >
                        {/* Visual Thumbnail Header */}
                        <div className="relative h-36 sm:h-40 w-full overflow-hidden border-b border-border/60 bg-slate-950 flex flex-col justify-between group">
                          <img
                            src={previewSrc}
                            alt={`پیش‌نمایش ${tpl.name}`}
                            className="absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.92] transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/landing-previews/posts-template-preview.svg";
                            }}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30 pointer-events-none" />

                          {/* Top Bar with Badges */}
                          <div className="relative z-10 p-2 flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="bg-black/70 backdrop-blur-xs text-amber-300 text-[9px] py-0 px-1.5 h-4 border border-amber-500/30 font-bold">
                                {tpl.isDefault ? "پیش‌فرض اصلی" : tpl.type === "html" ? "HTML" : "ZIP"}
                              </Badge>
                              {tpl.targetPath && (
                                <Badge className="bg-indigo-600/80 text-white text-[9px] py-0 px-1.5 h-4 border-0">
                                  {tpl.targetPath}
                                </Badge>
                              )}
                            </div>

                            {isActive && (
                              <div className="bg-emerald-600 text-white text-[9px] py-0.5 px-2 rounded-full gap-1 shadow-xs font-bold flex items-center h-4">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>فعال</span>
                              </div>
                            )}
                          </div>

                          {/* Category Label at bottom of thumbnail */}
                          {tpl.customTitle && (
                            <div className="relative z-10 px-2.5 pb-2">
                              <p className="text-[10px] text-slate-200 font-bold line-clamp-1 drop-shadow-xs">
                                {tpl.customTitle}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Card Details & Actions */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1.5">
                              {internalEditingTemplate?.id === tpl.id ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={internalEditingTemplate.name}
                                    onChange={(e) =>
                                      setInternalEditingTemplate({ ...internalEditingTemplate, name: e.target.value })
                                    }
                                    className="h-6 text-[11px] px-1.5"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      updateInternalTemplateMutation.mutate({
                                        id: tpl.id,
                                        name: internalEditingTemplate.name,
                                      });
                                    }}
                                    disabled={updateInternalTemplateMutation.isPending}
                                    className="h-6 px-2 text-[9px] bg-primary"
                                  >
                                    ذخیره
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setInternalEditingTemplate(null)}
                                    className="h-6 px-1.5 text-[9px]"
                                  >
                                    لغو
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="text-[11px] font-bold text-foreground flex items-center gap-1 truncate">
                                    {tpl.isDefault ? (
                                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    ) : (
                                      <FileArchive className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    )}
                                    <span className="truncate">{tpl.name}</span>
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() => setInternalEditingTemplate({ id: tpl.id, name: tpl.name })}
                                    className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                                    title="ویرایش عنوان قالب"
                                  >
                                    <Pencil className="w-2.5 h-2.5" />
                                  </button>
                                </>
                              )}
                            </div>

                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">
                              {tpl.description || (tpl.isDefault
                                ? "قالب اختصاصی بهینه‌سازی شده برای مدیریت مقالات، وبلاگ و تحریریه"
                                : `قالب سفارشی ثبت شده در آدرس ${tpl.targetPath || "/admin/posts"}`)}
                            </p>

                            {/* Features list if present */}
                            {tpl.features && tpl.features.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {tpl.features.map((ft, idx) => (
                                  <span key={idx} className="text-[9px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/40">
                                    • {ft}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Quick Controls */}
                            <div className="pt-1.5 pb-0.5 space-y-1.5 border-t border-border/60 bg-muted/20 rounded-md px-2 py-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-foreground font-medium flex items-center gap-1">
                                  <Sliders className="w-2.5 h-2.5 text-primary" />
                                  <span>نوار دسترسی بالا</span>
                                </span>
                                <Switch
                                  checked={tpl.showQuickNav ?? true}
                                  onCheckedChange={(checked) =>
                                    updateInternalTemplateMutation.mutate({ id: tpl.id, showQuickNav: checked })
                                  }
                                  className="scale-[0.75] origin-left"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-foreground font-medium flex items-center gap-1">
                                  <MessageSquare className="w-2.5 h-2.5 text-sky-500" />
                                  <span>ویجت ربات گفتگو</span>
                                </span>
                                <Switch
                                  checked={tpl.showChatWidget ?? true}
                                  onCheckedChange={(checked) =>
                                    updateInternalTemplateMutation.mutate({ id: tpl.id, showChatWidget: checked })
                                  }
                                  className="scale-[0.75] origin-left"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Actions Footer */}
                          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1.5">
                            {isActive ? (
                              <Button
                                size="sm"
                                disabled
                                className="h-7 text-[10px] gap-1 bg-emerald-600/15 text-emerald-600 border border-emerald-500/30 flex-1 cursor-default font-bold px-2"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>قالب فعال است</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => activateInternalTemplateMutation.mutate(tpl.id)}
                                disabled={activateInternalTemplateMutation.isPending}
                                className="h-7 text-[10px] gap-1 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2"
                              >
                                {activateInternalTemplateMutation.isPending ? (
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Check className="w-2.5 h-2.5" />
                                )}
                                <span>فعال‌سازی</span>
                              </Button>
                            )}

                            {!tpl.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultInternalTemplateMutation.mutate(tpl.id)}
                                disabled={setDefaultInternalTemplateMutation.isPending}
                                className="h-7 text-[10px] gap-1 px-2 border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                                title="تنظیم به عنوان پیش‌فرض اصلی"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>پیش‌فرض</span>
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewingInternalTemplate(tpl as any)}
                              className="h-7 text-[10px] gap-1 px-2 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
                              title="پیش‌نمایش زنده قالب نوشته"
                            >
                              <Eye className="w-3 h-3 text-indigo-400" />
                              <span>پیش‌نمایش</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-7 w-7 p-0 shrink-0"
                              title="مشاهده آنلاین آدرس قالب"
                            >
                              <a href={tpl.targetPath || "/admin/posts"} target="_blank" rel="noreferrer">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>

                            {!tpl.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setInternalTemplateToDelete(tpl as any)}
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                                title="حذف این قالب"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECTION 3: 404 ERROR PAGES TEMPLATE (قالب صفحات 404) */}
        {activeSectionTab === "not_found" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Upload & Add 404 Template Card */}
            <Card className="border-border shadow-xs">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>افزودن و بارگذاری قالب اختصاصی صفحه 404</span>
                  </CardTitle>
                  <span className="text-[10px] text-muted-foreground">پشتیبانی از ZIP کامل یا کد HTML اختصاصی</span>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2.5">
                <Tabs defaultValue="zip" className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <TabsList className="grid grid-cols-2 max-w-[210px] h-7 p-0.5">
                      <TabsTrigger value="zip" className="text-[11px] h-6 px-2 gap-1">
                        <FileArchive className="w-3 h-3" />
                        <span>فایل ZIP</span>
                      </TabsTrigger>
                      <TabsTrigger value="html" className="text-[11px] h-6 px-2 gap-1">
                        <Code className="w-3 h-3" />
                        <span>کد HTML / JSX</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* TAB 1: ZIP Upload for 404 */}
                  <TabsContent value="zip" className="space-y-2 mt-0">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setNotFoundIsDragging(true);
                      }}
                      onDragLeave={() => setNotFoundIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setNotFoundIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          if (file.name.toLowerCase().endsWith(".zip")) {
                            setNotFoundSelectedFile(file);
                          } else {
                            toast({
                              title: "فرمت نامعتبر",
                              description: "لطفاً یک فایل زیپ (.zip) انتخاب کنید",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                      onClick={() => notFoundFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex items-center justify-center gap-3 min-h-[64px] ${
                        notFoundIsDragging
                          ? "border-primary bg-primary/10"
                          : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <input
                        ref={notFoundFileInputRef}
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            if (file.name.toLowerCase().endsWith(".zip")) {
                              setNotFoundSelectedFile(file);
                            }
                          }
                        }}
                        className="hidden"
                      />

                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileQuestion className="w-4 h-4" />
                      </div>

                      <div className="text-right flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {notFoundSelectedFile ? notFoundSelectedFile.name : "انتخاب یا کشیدن فایل ZIP قالب صفحه 404"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {notFoundSelectedFile
                            ? `حجم: ${formatBytes(notFoundSelectedFile.size)}`
                            : "شامل فایل‌های 404.html یا index.html همراه با فایل‌های CSS و تصاویر قالب"}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs px-2.5 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          notFoundFileInputRef.current?.click();
                        }}
                      >
                        {notFoundSelectedFile ? "تغییر فایل" : "انتخاب فایل"}
                      </Button>
                    </div>

                    {notFoundSelectedFile && (
                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          placeholder="عنوان نمایشی قالب 404 (اختیاری)"
                          value={notFoundTemplateTitle}
                          onChange={(e) => setNotFoundTemplateTitle(e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleStartNotFoundZipInstall(notFoundSelectedFile)}
                          disabled={notFoundInstallPhase !== "idle" && notFoundInstallPhase !== "completed" && notFoundInstallPhase !== "error"}
                          className="h-7 text-xs gap-1 px-3 bg-primary text-primary-foreground"
                        >
                          <Check className="w-3 h-3" />
                          <span>نصب و فعال‌سازی قالب 404</span>
                        </Button>
                      </div>
                    )}

                    {notFoundInstallPhase !== "idle" && (
                      <div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 space-y-1.5 mt-2">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            {notFoundInstallPhase === "error" ? (
                              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                            ) : notFoundInstallPhase === "completed" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            )}
                            <span>
                              {notFoundInstallPhase === "validating" && "اعتبارسنجی فایل زیپ 404..."}
                              {notFoundInstallPhase === "uploading" && "بارگذاری به سرور..."}
                              {notFoundInstallPhase === "extracting" && "استخراج و ساختاردهی فایل‌ها..."}
                              {notFoundInstallPhase === "activating" && "اعمال و فعال‌سازی صفحه 404..."}
                              {notFoundInstallPhase === "completed" && "قالب صفحه 404 با موفقیت نصب و فعال شد!"}
                              {notFoundInstallPhase === "error" && `خطا: ${notFoundInstallError || "عملیات ناموفق بود"}`}
                            </span>
                          </span>
                          <span className="text-[11px] font-bold">{notFoundInstallProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-200 ${
                              notFoundInstallPhase === "error"
                                ? "bg-destructive"
                                : notFoundInstallPhase === "completed"
                                ? "bg-emerald-500"
                                : "bg-primary"
                            }`}
                            style={{ width: `${notFoundInstallProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: Direct HTML Code for 404 */}
                  <TabsContent value="html" className="space-y-2 mt-0">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="عنوان قالب کدی (مثال: قالب تیره مینیمال 404)"
                        value={notFoundTemplateTitle}
                        onChange={(e) => setNotFoundTemplateTitle(e.target.value)}
                        className="h-7 text-xs flex-1"
                      />
                    </div>
                    <Textarea
                      value={notFoundHtmlCode}
                      onChange={(e) => setNotFoundHtmlCode(e.target.value)}
                      placeholder="<!-- کد HTML و CSS اختصاصی صفحه 404 را اینجا وارد کنید -->&#10;<div style='text-align: center; padding: 50px;'>&#10;  <h1>404 - صفحه پیدا نشد</h1>&#10;  <a href='/'>بازگشت به خانه</a>&#10;</div>"
                      className="font-mono text-[11px] min-h-[110px] text-left leading-relaxed resize-y"
                      dir="ltr"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground">کد به‌صورت خودکار در گالری قالب‌های 404 ثبت و فعال می‌شود.</span>
                      <Button
                        size="sm"
                        disabled={!notFoundHtmlCode.trim() || saveNotFoundHtmlMutation.isPending}
                        onClick={() => saveNotFoundHtmlMutation.mutate()}
                        className="h-7 text-xs gap-1"
                      >
                        {saveNotFoundHtmlMutation.isPending ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>ذخیره و فعال‌سازی کد 404</span>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Installed & Available 404 Templates Gallery Section */}
            <Card className="border-border shadow-xs">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>قالب‌های صفحه 404 نصب شده ({notFoundTemplatesList.length} قالب)</span>
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground block">
                      برای تغییر صفحه 404، روی دکمه «فعال‌سازی این قالب» کلیک کنید.
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {notFoundTemplatesList.map((tpl) => {
                    const isActive =
                      notFoundConfig?.activeTemplateId === tpl.id ||
                      (!notFoundConfig?.activeTemplateId && tpl.id === "default") ||
                      (notFoundConfig?.mode === "default" && tpl.id === "default");

                    const previewSrc = tpl.previewImage || notFoundConfig?.defaultPreviewImage || "/landing-previews/default.png";
                    const isHomeButtonActive = tpl.showHomeButton ?? true;
                    const isChatWidgetActive = tpl.showChatWidget ?? true;

                    const badgeLabel =
                      tpl.id === "default"
                        ? "پیش‌فرض ۱"
                        : tpl.isDefault
                        ? "پیش‌فرض"
                        : tpl.type === "html"
                        ? "HTML"
                        : "ZIP";

                    return (
                      <div
                        key={tpl.id}
                        className={`relative rounded-xl border transition-all flex flex-col overflow-hidden bg-card ${
                          isActive
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                            : "border-border/80 hover:border-primary/40 hover:shadow-xs"
                        }`}
                      >
                        {/* Visual Thumbnail Header */}
                        <div className="relative h-32 sm:h-36 w-full overflow-hidden border-b border-border/60 bg-muted/40 flex flex-col justify-between group">
                          <img
                            src={
                              tpl.id === "default"
                                ? "/not-found-previews/default.svg"
                                : previewSrc
                            }
                            alt={`پیش‌نمایش ${tpl.name}`}
                            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.endsWith("/not-found-previews/default.svg")) {
                                target.src = "/not-found-previews/default.svg";
                              }
                            }}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                          {/* Top Bar with Status Badge */}
                          <div className="relative z-10 p-2 flex items-center justify-between">
                            <Badge variant="secondary" className="bg-black/60 backdrop-blur-xs text-white/90 text-[9px] py-0 px-1.5 h-4 border-0 font-normal">
                              {badgeLabel}
                            </Badge>

                            {isActive && (
                              <div className="bg-emerald-600 text-white text-[9px] py-0.5 px-2 rounded-full gap-1 shadow-xs font-bold flex items-center h-4">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>فعال</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Details & Per-Card Settings */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1.5">
                              {notFoundEditingTemplate?.id === tpl.id ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <Input
                                    value={notFoundEditingTemplate.name}
                                    onChange={(e) => setNotFoundEditingTemplate({ ...notFoundEditingTemplate, name: e.target.value })}
                                    className="h-6 text-[11px] px-1.5"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => updateNotFoundTemplateSettingsMutation.mutate({ id: tpl.id, title: notFoundEditingTemplate.name })}
                                    disabled={updateNotFoundTemplateSettingsMutation.isPending}
                                    className="h-6 px-2 text-[9px] bg-primary"
                                  >
                                    ذخیره
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setNotFoundEditingTemplate(null)}
                                    className="h-6 px-1.5 text-[9px]"
                                  >
                                    لغو
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="text-[11px] font-bold text-foreground flex items-center gap-1 truncate">
                                    {tpl.isDefault ? (
                                      <Sparkles className="w-3 h-3 text-primary shrink-0" />
                                    ) : (
                                      <FileArchive className="w-3 h-3 text-emerald-600 shrink-0" />
                                    )}
                                    <span className="truncate">{tpl.name}</span>
                                  </h3>
                                  {!tpl.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => setNotFoundEditingTemplate({ id: tpl.id, name: tpl.name })}
                                      className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                                      title="ویرایش نام قالب"
                                    >
                                      <Pencil className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            <p className="text-[10px] text-muted-foreground line-clamp-1 leading-snug">
                              {tpl.id === "default"
                                ? "صفحه 404 استاندارد سامانه با طراحی مدرن و واکنش‌گرا"
                                : tpl.isDefault
                                ? "قالب پیش‌فرض سیستم"
                                : tpl.uploadedAt
                                ? `ثبت شده در: ${new Date(tpl.uploadedAt).toLocaleDateString("fa-IR")}`
                                : "قالب سفارشی 404 نصب شده"}
                            </p>

                            {/* Complementary Settings: Only shown when this template is active */}
                            {isActive && (
                              <div className="pt-1.5 pb-0.5 space-y-1.5 border-t border-border/60 bg-muted/20 rounded-md px-2 py-1.5 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-foreground font-medium flex items-center gap-1">
                                    <Home className="w-2.5 h-2.5 text-primary" />
                                    <span>دکمه بازگشت به صفحه اصلی</span>
                                  </span>
                                  <Switch
                                    checked={isHomeButtonActive}
                                    onCheckedChange={(checked) =>
                                      updateNotFoundTemplateSettingsMutation.mutate({
                                        id: tpl.id,
                                        showHomeButton: checked,
                                      })
                                    }
                                    className="scale-[0.75] origin-left"
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-foreground font-medium flex items-center gap-1">
                                    <MessageSquare className="w-2.5 h-2.5 text-sky-500" />
                                    <span>ویجت ربات گفتگو</span>
                                  </span>
                                  <Switch
                                    checked={isChatWidgetActive}
                                    onCheckedChange={(checked) =>
                                      updateNotFoundTemplateSettingsMutation.mutate({
                                        id: tpl.id,
                                        showChatWidget: checked,
                                      })
                                    }
                                    className="scale-[0.75] origin-left"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions Footer */}
                          <div className="pt-1.5 border-t border-border/60 flex items-center justify-between gap-1.5">
                            {isActive ? (
                              <Button
                                size="sm"
                                disabled
                                className="h-7 text-[10px] gap-1 bg-emerald-600/15 text-emerald-600 border border-emerald-500/30 flex-1 cursor-default font-bold px-2"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>قالب فعال است</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => activateNotFoundTemplateMutation.mutate(tpl.id)}
                                disabled={activateNotFoundTemplateMutation.isPending}
                                className="h-7 text-[10px] gap-1 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2"
                              >
                                {activateNotFoundTemplateMutation.isPending ? (
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Check className="w-2.5 h-2.5" />
                                )}
                                <span>فعال‌سازی</span>
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-7 w-7 p-0 shrink-0"
                              title="مشاهده صفحه 404 در تب جدید"
                            >
                              <a
                                href={
                                  tpl.id === "default"
                                    ? "/404?preview_template=default"
                                    : `/404?preview_template=${tpl.id}`
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>

                            {!tpl.isDefault && tpl.id !== "default" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setNotFoundTemplateToDelete(tpl)}
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                                title="حذف این قالب"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECTION 4: LOGIN PAGE SETTINGS (/login) */}
        {activeSectionTab === "login_page" && (
          <LoginPageTab />
        )}

        {/* Edit 404 Template Title Dialog */}
        <Dialog
          open={Boolean(notFoundEditingTemplate)}
          onOpenChange={(open) => !open && setNotFoundEditingTemplate(null)}
        >
          <DialogContent className="max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xs font-bold">ویرایش عنوان قالب 404</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Input
                value={notFoundEditingTemplate?.name || ""}
                onChange={(e) =>
                  setNotFoundEditingTemplate((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder="عنوان جدید قالب..."
                className="h-8 text-xs"
              />
            </div>
            <DialogFooter className="gap-1.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotFoundEditingTemplate(null)}
                className="h-7 text-xs"
              >
                انصراف
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (notFoundEditingTemplate) {
                    updateNotFoundTemplateSettingsMutation.mutate({
                      id: notFoundEditingTemplate.id,
                      title: notFoundEditingTemplate.name,
                    });
                  }
                }}
                disabled={updateNotFoundTemplateSettingsMutation.isPending}
                className="h-7 text-xs"
              >
                ذخیره تغییرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog for Landing */}
        <Dialog open={Boolean(templateToDelete)} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>حذف قالب «{templateToDelete?.name}»</span>
              </DialogTitle>
              <DialogDescription className="text-[11px] pt-1 leading-relaxed">
                آیا از حذف این قالب اطمینان دارید؟ در صورت فعال بودن، سیستم به صورت خودکار به قالب پیش‌فرض بازمی‌گردد.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-1.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplateToDelete(null)}
                className="h-7 text-xs"
              >
                انصراف
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => templateToDelete && deleteTemplateMutation.mutate(templateToDelete.id)}
                disabled={deleteTemplateMutation.isPending}
                className="h-7 text-xs gap-1"
              >
                {deleteTemplateMutation.isPending && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>بله، حذف شود</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog for Internal Templates */}
        <Dialog
          open={Boolean(internalTemplateToDelete)}
          onOpenChange={(open) => !open && setInternalTemplateToDelete(null)}
        >
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>حذف قالب «{internalTemplateToDelete?.name}»</span>
              </DialogTitle>
              <DialogDescription className="text-[11px] pt-1 leading-relaxed">
                آیا از حذف این قالب صفحات داخلی اطمینان دارید؟
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-1.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInternalTemplateToDelete(null)}
                className="h-7 text-xs"
              >
                انصراف
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (internalTemplateToDelete) {
                    deleteInternalTemplateMutation.mutate(internalTemplateToDelete.id);
                  }
                }}
                disabled={deleteInternalTemplateMutation.isPending}
                className="h-7 text-xs gap-1"
              >
                {deleteInternalTemplateMutation.isPending && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>بله، حذف شود</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Live Preview Modal for Internal & Post Templates */}
        <Dialog
          open={Boolean(previewingInternalTemplate)}
          onOpenChange={(open) => !open && setPreviewingInternalTemplate(null)}
        >
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-950 text-slate-100 border-slate-800" dir="rtl">
            {/* Modal Header Toolbar */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[10px] px-2 py-0.5 font-bold">
                  پیش‌نمایش زنده نوشته‌ها
                </Badge>
                <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {previewingInternalTemplate?.name}
                </h3>
              </div>

              {/* View Mode Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDeviceView("desktop")}
                    className={`px-2 py-1 rounded-md text-[10px] flex items-center gap-1 transition-colors ${
                      previewDeviceView === "desktop" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span className="hidden sm:inline">دسکتاپ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewDeviceView("mobile")}
                    className={`px-2 py-1 rounded-md text-[10px] flex items-center gap-1 transition-colors ${
                      previewDeviceView === "mobile" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span className="hidden sm:inline">موبایل</span>
                  </button>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    if (previewingInternalTemplate) {
                      activateInternalTemplateMutation.mutate(previewingInternalTemplate.id);
                      setPreviewingInternalTemplate(null);
                    }
                  }}
                  disabled={activateInternalTemplateMutation.isPending}
                  className="h-8 text-[11px] gap-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <Check className="w-3 h-3" />
                  <span>فعال‌سازی این قالب</span>
                </Button>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="p-4 sm:p-6 bg-slate-900/50 flex justify-center items-center min-h-[420px] max-h-[75vh] overflow-y-auto">
              <div
                className={`transition-all duration-300 w-full ${
                  previewDeviceView === "mobile"
                    ? "max-w-[340px] border-[8px] border-slate-800 rounded-[32px] overflow-hidden shadow-2xl bg-slate-900 my-4"
                    : "max-w-3xl rounded-xl border border-slate-800 shadow-xl bg-slate-900"
                }`}
              >
                {/* Browser/Device Header */}
                <div className="bg-slate-800/90 px-3 py-2 border-b border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <span className="font-mono text-[10px] dir-ltr text-slate-300 bg-slate-950/60 px-3 py-0.5 rounded-md border border-slate-700/40">
                    https://site.ir{previewingInternalTemplate?.targetPath || "/admin/posts"}
                  </span>
                  <div className="w-8"></div>
                </div>

                {/* Article Mock Content */}
                <div className="p-4 sm:p-6 space-y-6 text-slate-200 text-right dir-rtl">
                  {/* Category Pill & Date */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full border border-indigo-500/30 font-medium">
                      مقاله اختصاصی • مقالات و تحریریه
                    </span>
                    <span className="text-[11px] text-slate-400">زمان مطالعه: ۴ دقیقه</span>
                  </div>

                  {/* Article Title & Lead */}
                  <div className="space-y-2">
                    <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
                      {previewingInternalTemplate?.customTitle || previewingInternalTemplate?.name || "عنوان نمونه مقاله تحلیلی در قالب اختصاصی نوشته‌ها"}
                    </h1>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {previewingInternalTemplate?.description || "این پیش‌نمایش نحوه چیدمان گرافیکی مقالات، تیترها، متون و نوار ابزارهای جانبی را در قالب فعال شده نشان می‌دهد."}
                    </p>
                  </div>

                  {/* Main Banner Graphic */}
                  <div className="rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 aspect-video relative group">
                    <img
                      src={previewingInternalTemplate?.previewImage || "/landing-previews/posts-template-preview.svg"}
                      alt="پیش‌نمایش نوشته"
                      className="w-full h-full object-cover filter brightness-[0.95]"
                      onError={(e) => {
                        e.currentTarget.src = "/landing-previews/posts-template-preview.svg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 right-3 left-3 flex justify-between items-center text-[10px] text-slate-300">
                      <span className="bg-slate-900/80 px-2 py-1 rounded border border-slate-700">کاور باکیفیت بالا</span>
                      <span className="bg-indigo-600 text-white px-2 py-1 rounded font-bold">قالب بهینه سئو</span>
                    </div>
                  </div>

                  {/* Sample Body Content */}
                  <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                    <p>
                      لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است.
                    </p>
                    <div className="p-3 rounded-lg bg-indigo-950/40 border-r-4 border-indigo-500 text-indigo-200 text-[11px]">
                      💡 <strong>نکته اختصاصی:</strong> تمامی بخش‌های این قالب در مسیر اختصاصی نوشته‌ها قابل شخصی‌سازی و کنترل مستقیم می‌باشند.
                    </div>
                  </div>

                  {/* Features List */}
                  {previewingInternalTemplate?.features && previewingInternalTemplate.features.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <h4 className="text-[11px] font-bold text-indigo-400 mb-2">ویژگی‌های برجسته این قالب:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {previewingInternalTemplate.features.map((feat, i) => (
                          <div key={i} className="text-[10px] bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 flex items-center gap-1.5 text-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-400">
                مسیر اعمال: <code className="text-indigo-300 font-mono">{previewingInternalTemplate?.targetPath || "/admin/posts"}</code>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewingInternalTemplate(null)}
                className="h-7 text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                بستن پیش‌نمایش
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog for 404 Templates */}
        <Dialog
          open={Boolean(notFoundTemplateToDelete)}
          onOpenChange={(open) => !open && setNotFoundTemplateToDelete(null)}
        >
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>حذف قالب «{notFoundTemplateToDelete?.name}»</span>
              </DialogTitle>
              <DialogDescription className="text-[11px] pt-1 leading-relaxed">
                آیا از حذف این قالب صفحه 404 اطمینان دارید؟ در صورت فعال بودن، سیستم به قالب پیش‌فرض بازمی‌گردد.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-1.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotFoundTemplateToDelete(null)}
                className="h-7 text-xs"
              >
                انصراف
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (notFoundTemplateToDelete) {
                    deleteNotFoundTemplateMutation.mutate(notFoundTemplateToDelete.id);
                  }
                }}
                disabled={deleteNotFoundTemplateMutation.isPending}
                className="h-7 text-xs gap-1"
              >
                {deleteNotFoundTemplateMutation.isPending && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>بله، حذف شود</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
