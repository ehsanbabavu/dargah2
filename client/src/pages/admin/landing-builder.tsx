import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Save,
  Eye,
  Edit3,
  Code2,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Laptop,
  Image as ImageIcon,
  Type,
  Layers,
  Palette,
  Upload,
  Trash2,
  Copy,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  MoveUp,
  MoveDown,
  EyeOff,
  Link2,
  Maximize2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Plus,
  RefreshCw,
  Sliders,
  SlidersHorizontal,
  Settings,
  HelpCircle,
  Search,
  CheckCircle2,
  Paintbrush,
  Square,
  Sun,
  X,
  MousePointerClick,
  Maximize,
  Scaling,
  FileText,
  Images,
  Video,
  Play,
  Film,
  Volume2,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FontOption {
  font: string;
  name: string;
  cssName: string;
  cdnUrl: string;
  sampleText: string;
  description: string;
  badge?: string;
}

export const PERSIAN_FONTS: FontOption[] = [
  {
    font: "Vazirmatn",
    name: "وزیرمتن",
    cssName: "'Vazirmatn', sans-serif",
    cdnUrl: "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css",
    sampleText: "سامانه هوشمند و مدرن وب - ۱۲۳۴۵۶۷۸۹",
    description: "فونت استاندارد، فوق‌العاده خوانا و محبوب وب فارسی",
    badge: "پیش‌فرض پیشنهادی",
  },
  {
    font: "Shabnam",
    name: "شبنم",
    cssName: "'Shabnam', sans-serif",
    cdnUrl: "https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@v5.0.0/dist/font-face.css",
    sampleText: "سامانه هوشمند و مدرن وب - ۱۲۳۴۵۶۷۸۹",
    description: "فونت هندسی با لبه‌های دقیق و بسیار شیک",
    badge: "محبوب طراحی",
  },
  {
    font: "Sahel",
    name: "ساحل",
    cssName: "'Sahel', sans-serif",
    cdnUrl: "https://cdn.jsdelivr.net/gh/rastikerdar/sahel-font@v3.4.0/dist/font-face.css",
    sampleText: "سامانه هوشمند و مدرن وب - ۱۲۳۴۵۶۷۸۹",
    description: "فونت مدرن و نرم مناسب صفحات معرفی و فرود",
    badge: "مدرن",
  },
  {
    font: "Samim",
    name: "صمیم",
    cssName: "'Samim', sans-serif",
    cdnUrl: "https://cdn.jsdelivr.net/gh/rastikerdar/samim-font@v4.0.5/dist/font-face.css",
    sampleText: "سامانه هوشمند و مدرن وب - ۱۲۳۴۵۶۷۸۹",
    description: "فونت روان، صمیمی و ساده برای ارتباط صمیمانه",
    badge: "مینیمال",
  },
  {
    font: "Gandom",
    name: "گندم",
    cssName: "'Gandom', sans-serif",
    cdnUrl: "https://cdn.jsdelivr.net/gh/rastikerdar/gandom-font@v0.8.0/dist/font-face.css",
    sampleText: "سامانه هوشمند و مدرن وب - ۱۲۳۴۵۶۷۸۹",
    description: "فونت زیبا و خوانا برای پاراگراف‌ها و متون طولانی",
    badge: "خوانایی بالا",
  },
  {
    font: "Lalezar",
    name: "لاله‌زار (ویژه تیتر)",
    cssName: "'Lalezar', cursive, sans-serif",
    cdnUrl: "https://fonts.googleapis.com/css2?family=Lalezar&display=swap",
    sampleText: "سامانه هوشمند و مدرن وب - ۱۲۳۴",
    description: "فونت ضخیم، برجسته و جذّاب ویژه عناوین اصلی",
    badge: "تیتر و تبلیغات",
  },
  {
    font: "Noto Sans Arabic",
    name: "نوتو سنس عربی (Google)",
    cssName: "'Noto Sans Arabic', sans-serif",
    cdnUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;600;700;800&display=swap",
    sampleText: "سامانه هوشمند و مدرن وب - ۱۲۳۴۵۶۷۸۹",
    description: "فونت بین‌المللی گوگل با پشتیبانی عالی از اعداد",
    badge: "گوگل",
  },
  {
    font: "B Yekan",
    name: "یکان (B Yekan)",
    cssName: "'B Yekan', 'Yekan', sans-serif",
    cdnUrl: "https://cdn.jsdelivr.net/gh/amir-s/byekan-font@master/byekan.css",
    sampleText: "سامانه هوشمند و مدرن وب - ۱۲۳۴۵۶۷۸۹",
    description: "فونت شناخته‌شده و پرکاربرد طراحی وب",
    badge: "کلاسیک",
  },
  {
    font: "IRANSans",
    name: "ایران‌سنس (IRANSans)",
    cssName: "'IRANSans', 'IRANSansWeb', 'Vazirmatn', sans-serif",
    cdnUrl: "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css",
    sampleText: "سامانه هوشمند و مدرن وب - ۱۲۳۴۵۶۷۸۹",
    description: "استفاده از سیستم‌فونت ایران‌سنس به همراه پشیبان وزیر",
    badge: "سیستمی",
  },
  {
    font: "system-ui",
    name: "فونت پیش‌فرض سیستم",
    cssName: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    cdnUrl: "",
    sampleText: "سامانه هوشمند و مدرن وب - 123456789",
    description: "فونت پیش‌فرض دستگاه کاربر بدون بارگذاری شبکه",
    badge: "سریع",
  },
];

interface TemplateItem {
  id: string;
  name: string;
  type: "zip" | "html";
  entryFile?: string;
  folderName: string;
  isDefault?: boolean;
  uploadedAt?: string;
  fileSize?: number;
  previewImage?: string;
  entryUrl?: string;
  customHtml?: string;
}

interface BuilderData {
  template: TemplateItem;
  html: string;
  assets: { url: string; name: string; size?: number }[];
  hasBackup: boolean;
  folderBase: string;
}

interface PageSection {
  id: string;
  tagName: string;
  title: string;
  selector: string;
  index: number;
  isVisible: boolean;
}

interface EditableTextItem {
  selector: string;
  tagName: string;
  text: string;
  preview: string;
}

interface SelectedElementInfo {
  selector: string;
  tagName: string;
  text: string;
  src?: string;
  href?: string;
  target?: string;
  alt?: string;
  bgColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  textAlign?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  lineHeight?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  opacity?: string;
  border?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  boxShadow?: string;
  poster?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsinline?: boolean;
  videoSrc?: string;
  iframeSrc?: string;
  classList: string[];
}

type DeviceMode = "desktop" | "laptop" | "tablet" | "mobile";
type ViewMode = "visual" | "preview" | "code";

// Helper to convert rgb/rgba strings to standard hex format for <input type="color" />
function rgbToHex(rgbStr?: string): string {
  if (!rgbStr || rgbStr === "transparent" || rgbStr === "inherit") return "#ffffff";
  if (rgbStr.startsWith("#")) {
    if (rgbStr.length === 4) {
      return `#${rgbStr[1]}${rgbStr[1]}${rgbStr[2]}${rgbStr[2]}${rgbStr[3]}${rgbStr[3]}`;
    }
    return rgbStr.slice(0, 7);
  }
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return "#000000";
  const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
  const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
  const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

// Helper to extract clean numeric pixel values
function parsePxValue(valStr?: string, defaultVal = 0): number {
  if (!valStr) return defaultVal;
  const match = valStr.match(/([\d.]+)/);
  if (!match) return defaultVal;
  const num = parseFloat(match[1]);
  if (valStr.includes("rem")) return Math.round(num * 16);
  return Math.round(num);
}

// Preset Ready-to-use Section Templates for Landing Builder
export const PRESET_SECTION_TEMPLATES = [
  {
    id: "hero",
    title: "بنر معرفی (Hero Banner)",
    description: "عنوان اصلی، توضیحات، دکمه اقدام به عمل و تصویر جذاب",
    icon: Sparkles,
    category: "معرفی",
    html: `<section class="py-16 px-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-center rounded-2xl my-6 max-w-6xl mx-auto shadow-xl border border-purple-500/20" dir="rtl">
  <div class="max-w-3xl mx-auto space-y-6">
    <span class="inline-block px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold">✨ محصول جدید و قدرتمند</span>
    <h1 class="text-3xl md:text-5xl font-black leading-tight">کسب‌وکار خود را با ابزارهای نوین ارتقا دهید</h1>
    <p class="text-slate-300 text-sm md:text-base leading-relaxed">با استفاده از پلتفرم هوشمند ما، نرخ تبدیل لندینگ‌پیج‌های خود را تا ۳ برابر افزایش دهید.</p>
    <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
      <a href="#register" class="px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg transition-all">شروع رایگان</a>
      <a href="#features" class="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/10">مشاهده امکانات</a>
    </div>
  </div>
</section>`
  },
  {
    id: "features",
    title: "ویژگی‌ها و امکانات (Features)",
    description: "شبکه ۳ ستونه با آیکون، عنوان و توضیحات کامل",
    icon: Layers,
    category: "امکانات",
    html: `<section class="py-16 px-6 bg-white my-6 max-w-6xl mx-auto rounded-2xl border border-slate-200 shadow-sm" dir="rtl">
  <div class="text-center max-w-2xl mx-auto mb-12 space-y-3">
    <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900">چرا پلتفرم ما انتخاب اول است؟</h2>
    <p class="text-slate-600 text-sm">امکاناتی بی‌نظیر برای طراحی و مدیریت هوشمند لندینگ‌پیج‌ها</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="p-6 rounded-xl bg-slate-50 border border-slate-200 text-right space-y-3">
      <div class="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xl font-bold">⚡</div>
      <h3 class="font-bold text-lg text-slate-800">سرعت فوق‌العاده</h3>
      <p class="text-slate-600 text-xs leading-relaxed">بارگذاری آنی صفحات با بالاترین نمره بهینه‌سازی سرعت و SEO.</p>
    </div>
    <div class="p-6 rounded-xl bg-slate-50 border border-slate-200 text-right space-y-3">
      <div class="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">🎨</div>
      <h3 class="font-bold text-lg text-slate-800">طراحی انعطاف‌پذیر</h3>
      <p class="text-slate-600 text-xs leading-relaxed">ویرایشگر بصری زنده بدون نیاز به کدنویسی با کنترل کامل المان‌ها.</p>
    </div>
    <div class="p-6 rounded-xl bg-slate-50 border border-slate-200 text-right space-y-3">
      <div class="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">🛡️</div>
      <h3 class="font-bold text-lg text-slate-800">امنیت و پایداری</h3>
      <p class="text-slate-600 text-xs leading-relaxed">پشتیبان‌گیری خودکار و امنیت بالا برای حفظ اطلاعات کسب‌وکار شما.</p>
    </div>
  </div>
</section>`
  },
  {
    id: "pricing",
    title: "جدول قیمت‌گذاری (Pricing)",
    description: "۳ پلن قیمت‌گذاری شکیل با قابلیت انتخاب",
    icon: Sparkles,
    category: "فروش",
    html: `<section class="py-16 px-6 bg-slate-50 my-6 max-w-6xl mx-auto rounded-2xl border border-slate-200" dir="rtl">
  <div class="text-center max-w-2xl mx-auto mb-12 space-y-3">
    <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900">پلن‌های سرمایه‌گذاری و اشتراک</h2>
    <p class="text-slate-600 text-sm">بر اساس نیاز خود مناسب‌ترین پلن را انتخاب کنید</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between text-right space-y-6">
      <div class="space-y-4">
        <h3 class="font-bold text-lg text-slate-800">پلن پایه</h3>
        <div class="text-2xl font-black text-slate-900">۲۹۰,۰۰۰ <span class="text-xs font-normal text-slate-500">تومان/ماهانه</span></div>
        <ul class="space-y-2 text-xs text-slate-600">
          <li>✔ ساخت ۱ لندینگ پیج</li>
          <li>✔ پشتیبانی ایمیلی</li>
          <li>✔ دامنه اختصاصی</li>
        </ul>
      </div>
      <a href="#" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center block">سفارش پلن پایه</a>
    </div>
    <div class="p-6 bg-purple-600 text-white rounded-2xl border-2 border-purple-500 shadow-xl flex flex-col justify-between text-right space-y-6 relative">
      <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full">محبوب‌ترین</span>
      <div class="space-y-4">
        <h3 class="font-bold text-lg">پلن حرفه‌ای</h3>
        <div class="text-2xl font-black">۵۹۰,۰۰۰ <span class="text-xs font-normal text-purple-200">تومان/ماهانه</span></div>
        <ul class="space-y-2 text-xs text-purple-100">
          <li>✔ ساخت لندینگ پیج نامحدود</li>
          <li>✔ پشتیبانی ۲۴/۷ تلفنی</li>
          <li>✔ تحلیل پیشرفته آمار و Lead</li>
        </ul>
      </div>
      <a href="#" class="w-full py-2.5 rounded-xl bg-white text-purple-700 font-bold text-xs text-center block shadow-md hover:bg-slate-100">سفارش حرفه‌ای</a>
    </div>
    <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between text-right space-y-6">
      <div class="space-y-4">
        <h3 class="font-bold text-lg text-slate-800">پلن سازمانی</h3>
        <div class="text-2xl font-black text-slate-900">تماس بگیرید</div>
        <ul class="space-y-2 text-xs text-slate-600">
          <li>✔ زیرساخت اختصاصی</li>
          <li>✔ مدیر حساب اختصاصی</li>
          <li>✔ سفارشی‌سازی کامل کد</li>
        </ul>
      </div>
      <a href="#" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center block">مشاوره سازمانی</a>
    </div>
  </div>
</section>`
  },
  {
    id: "testimonials",
    title: "نظرات و رضایت مشتریان (Testimonials)",
    description: "کارت‌های نقل قول همراه با امتیاز و نام مشتری",
    icon: HelpCircle,
    category: "اعتمادسازی",
    html: `<section class="py-16 px-6 bg-white my-6 max-w-6xl mx-auto rounded-2xl border border-slate-200 shadow-sm" dir="rtl">
  <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
    <h2 class="text-2xl font-extrabold text-slate-900">نظرات مشتریان ما</h2>
    <p class="text-slate-600 text-xs">تجربه کاربران واقعی از استفاده از خدمات ما</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="p-6 rounded-xl bg-slate-50 border border-slate-200 text-right space-y-4">
      <div class="flex items-center gap-1 text-amber-400 text-sm">★★★★★</div>
      <p class="text-slate-700 text-xs leading-relaxed">"سرعت طراحی لندینگ‌پیج در این ابزار خیره‌کننده است. کمپین فروش ما در عرض چند ساعت آماده و منتشر شد."</p>
      <div class="flex items-center gap-3 pt-2">
        <div class="w-10 h-10 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-sm">م‌ر</div>
        <div>
          <div class="font-bold text-xs text-slate-800">محمد رضایی</div>
          <div class="text-[10px] text-slate-500">مدیر مارکتینگ آژانس دیجیتال</div>
        </div>
      </div>
    </div>
    <div class="p-6 rounded-xl bg-slate-50 border border-slate-200 text-right space-y-4">
      <div class="flex items-center gap-1 text-amber-400 text-sm">★★★★★</div>
      <p class="text-slate-700 text-xs leading-relaxed">"سادگی ویرایشگر و امکان خروجی گرفتن سریع عالی بود. افزایش قابل توجهی در تبدیل ورودی‌ها به مشتری داشتیم."</p>
      <div class="flex items-center gap-3 pt-2">
        <div class="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm">س‌ک</div>
        <div>
          <div class="font-bold text-xs text-slate-800">سارا کریمی</div>
          <div class="text-[10px] text-slate-500">بنیان‌گذار فروشگاه آنلاین</div>
        </div>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: "faq",
    title: "سوالات متداول (FAQ)",
    description: "کارت‌های سوال و پاسخ رایج",
    icon: HelpCircle,
    category: "پشتیبانی",
    html: `<section class="py-16 px-6 bg-slate-50 my-6 max-w-5xl mx-auto rounded-2xl border border-slate-200" dir="rtl">
  <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
    <h2 class="text-2xl font-extrabold text-slate-900">سوالات متداول</h2>
    <p class="text-slate-600 text-xs">پاسخ به رایج‌ترین پرسش‌های کاربران</p>
  </div>
  <div class="space-y-4">
    <div class="p-4 rounded-xl bg-white border border-slate-200 text-right space-y-2">
      <h3 class="font-bold text-sm text-slate-800">آیا برای استفاده نیاز به دانش کدنویسی دارم؟</h3>
      <p class="text-slate-600 text-xs leading-relaxed">خیر، تمام مراحل طراحی و ساخت لندینگ‌پیج به صورت بصری و کشیدن و رها کردن قابل انجام است.</p>
    </div>
    <div class="p-4 rounded-xl bg-white border border-slate-200 text-right space-y-2">
      <h3 class="font-bold text-sm text-slate-800">آیا امکان اتصال دامنه اختصاصی وجود دارد؟</h3>
      <p class="text-slate-600 text-xs leading-relaxed">بله، می‌توانید لندینگ‌پیج خود را روی دامنه اختصاصی خود با لایسنس SSL رایگان منتشر کنید.</p>
    </div>
    <div class="p-4 rounded-xl bg-white border border-slate-200 text-right space-y-2">
      <h3 class="font-bold text-sm text-slate-800">چگونه می‌توانم پشتیبانی دریافت کنم؟</h3>
      <p class="text-slate-600 text-xs leading-relaxed">تیم پشتیبانی ما به صورت ۲۴ ساعته از طریق تیکت و چت آنلاین پاسخگوی شماست.</p>
    </div>
  </div>
</section>`
  },
  {
    id: "cta",
    title: "دعوت به عمل شاخص (CTA Banner)",
    description: "بنر انگیزشی با دکمه ثبت‌نام و دریافت هدیه",
    icon: ExternalLink,
    category: "فروش",
    html: `<section class="py-12 px-6 bg-purple-600 text-white my-6 max-w-6xl mx-auto rounded-2xl shadow-lg text-center space-y-6" dir="rtl">
  <h2 class="text-2xl md:text-4xl font-black">امروز کسب‌وکار خود را تحول ببخشید</h2>
  <p class="text-purple-100 text-xs md:text-sm max-w-2xl mx-auto">۱۴ روز تست رایگان بدون نیاز به ثبت کارت اعتباری. همین حالا شروع کنید.</p>
  <div>
    <a href="#signup" class="inline-block px-8 py-3.5 rounded-xl bg-white text-purple-700 font-extrabold text-sm shadow-md hover:bg-slate-100 transition-all">ثبت‌نام و شروع تست رایگان</a>
  </div>
</section>`
  },
  {
    id: "footer",
    title: "پاورقی و ارتباط (Footer)",
    description: "اطلاعات تماس، لینک‌های سریع و حق کپی‌رایت",
    icon: Layers,
    category: "پاورقی",
    html: `<footer class="py-12 px-6 bg-slate-900 text-slate-300 my-6 max-w-6xl mx-auto rounded-2xl text-right" dir="rtl">
  <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
    <div class="space-y-3">
      <h4 class="font-bold text-white text-base">درباره پلتفرم</h4>
      <p class="text-xs text-slate-400 leading-relaxed">ارائه‌دهنده راه‌کارهای هوشمند طراحی لندینگ‌پیج و افزایش نرخ فروش.</p>
    </div>
    <div class="space-y-2 text-xs">
      <h4 class="font-bold text-white text-sm">لینک‌های سریع</h4>
      <ul class="space-y-1.5 text-slate-400">
        <li><a href="#" class="hover:text-white">امکانات</a></li>
        <li><a href="#" class="hover:text-white">پلن‌های قیمت</a></li>
        <li><a href="#" class="hover:text-white">نمونه کارها</a></li>
      </ul>
    </div>
    <div class="space-y-2 text-xs">
      <h4 class="font-bold text-white text-sm">ارتباط با ما</h4>
      <p class="text-slate-400">تهران، خیابان آزادی، پلاک ۱۰۰</p>
      <p class="text-slate-400">تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</p>
    </div>
    <div class="space-y-2 text-xs">
      <h4 class="font-bold text-white text-sm">عضویت در خبرنامه</h4>
      <div class="flex gap-2 pt-1">
        <input type="email" placeholder="ایمیل شما..." class="bg-slate-800 border border-slate-700 text-xs px-3 py-1.5 rounded-lg text-white w-full" />
        <button class="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg shrink-0">عضویت</button>
      </div>
    </div>
  </div>
  <div class="text-center text-xs text-slate-500">
    © کلیه حقوق این وب‌سایت محفوظ است.
  </div>
</footer>`
  },
  {
    id: "posts-carousel",
    title: "کاروسل پست‌های سایت (Posts Carousel)",
    description: "کاروسل تمام عرض و متحرک مقالات و پست‌های آموزشی سایت با حلقه بی‌نهایت و داده‌های واقعی",
    icon: FileText,
    category: "محتوا",
    html: `<section class="py-12 md:py-16 bg-slate-50 my-6 w-full rounded-3xl border border-solid border-slate-200 shadow-sm overflow-hidden box-border relative" dir="ltr" data-builder-id="section-posts-carousel">
  <style>
    @keyframes postsInfiniteScroll {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    .posts-marquee-track {
      display: flex;
      width: max-content;
      gap: 1.5rem;
      padding-right: 1.5rem;
      animation: postsInfiniteScroll 35s linear infinite;
      will-change: transform;
    }
    .posts-marquee-track:hover {
      animation-play-state: paused;
    }
    .post-card-item {
      cursor: pointer;
      user-select: none;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .post-card-item:hover {
      transform: translateY(-4px);
    }
  </style>
  <div class="max-w-7xl mx-auto px-4 md:px-12 mb-8" dir="rtl">
    <div class="flex flex-col md:flex-row items-end justify-between gap-4">
      <div class="space-y-1 text-right">
        <span class="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">📚 آخرین مطالب و مقالات</span>
        <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 m-0" data-builder-text-id="text-posts-title">پست‌ها و اخبار تازه‌تر</h2>
        <p class="text-slate-600 text-xs md:text-sm m-0" data-builder-text-id="text-posts-desc">مجموعه‌ای از مقالات آموزشی و تخصصی ما که به صورت خودکار و پیوسته در حلقه بی‌نهایت مرور می‌شوند. با کلیک روی هر پست، پیش‌نمایش در تب جدید باز خواهد شد.</p>
      </div>
      <div class="text-xs text-slate-400 font-medium hidden md:block">
        برای توقف اسکرول ماوس را نگه دارید • کلیک روی هر کارت برای باز شدن در تب جدید ↗
      </div>
    </div>
  </div>

  <div class="w-full overflow-hidden relative box-border py-2">
    <!-- Gradient Fade Edges -->
    <div class="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
    <div class="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>

    <div class="posts-marquee-track flex gap-6 pr-6 box-border" dir="rtl">
      <!-- Set 1 -->
      <article class="post-card-item w-[280px] md:w-[320px] bg-white rounded-2xl border border-solid border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg shrink-0 box-border group" role="button" tabindex="0" onclick="window.__goToPostPreview(event, '/post/online-store-guide-rakhsh')">
        <div class="box-border">
          <div class="h-44 bg-slate-100 overflow-hidden relative box-border">
            <img src="https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=60" alt="راهنمای جامع راه‌اندازی فروشگاه و ویترین آنلاین در رخش" class="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 m-0 p-0 border-0" />
            <span class="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow m-0">فروشگاه اینترنتی</span>
          </div>
          <div class="p-5 space-y-2 text-right box-border">
            <div class="text-[11px] text-slate-400 font-medium m-0">۷ شهریور ۱۴۰۳ • ۵ دقیقه مطالعه</div>
            <h3 class="font-bold text-base text-slate-900 line-clamp-2 leading-snug m-0 group-hover:text-purple-600 transition-colors">
              <a href="/post/online-store-guide-rakhsh" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, '/post/online-store-guide-rakhsh');" class="text-slate-900 group-hover:text-purple-600 text-decoration-none">راهنمای جامع راه‌اندازی فروشگاه و ویترین آنلاین در رخش</a>
            </h3>
            <p class="text-slate-600 text-xs line-clamp-3 leading-relaxed m-0">مراحل گام به گام ساخت فروشگاه اینترنتی، مدیریت موجودی کالا و فعال‌سازی روش‌های پرداخت در سامانه رخش.</p>
          </div>
        </div>
        <div class="p-5 pt-0 text-right box-border flex items-center justify-between">
          <a href="/post/online-store-guide-rakhsh" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, '/post/online-store-guide-rakhsh');" class="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors m-0 text-decoration-none">
            <span>مشاهده در تب جدید</span>
            <svg class="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
          <span class="text-[10px] text-slate-400 font-normal">پیش‌نمایش ↗</span>
        </div>
      </article>

      <article class="post-card-item w-[280px] md:w-[320px] bg-white rounded-2xl border border-solid border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg shrink-0 box-border group" role="button" tabindex="0" onclick="window.__goToPostPreview(event, '/post/new-admin-features-payment-gateways')">
        <div class="box-border">
          <div class="h-44 bg-slate-100 overflow-hidden relative box-border">
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60" alt="امکانات جدید پنل مدیریت و اتصال درگاه‌های ارزی و ریالی" class="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 m-0 p-0 border-0" />
            <span class="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow m-0">اطلاعیه</span>
          </div>
          <div class="p-5 space-y-2 text-right box-border">
            <div class="text-[11px] text-slate-400 font-medium m-0">۸ شهریور ۱۴۰۳ • ۴ دقیقه مطالعه</div>
            <h3 class="font-bold text-base text-slate-900 line-clamp-2 leading-snug m-0 group-hover:text-purple-600 transition-colors">
              <a href="/post/new-admin-features-payment-gateways" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, '/post/new-admin-features-payment-gateways');" class="text-slate-900 group-hover:text-purple-600 text-decoration-none">امکانات جدید پنل مدیریت و اتصال درگاه‌های ارزی و ریالی</a>
            </h3>
            <p class="text-slate-600 text-xs line-clamp-3 leading-relaxed m-0">مروری بر امکانات جدید پنل مدیریت، افزونه‌های کاربردی و بهینه‌سازی‌های فنی اخیر.</p>
          </div>
        </div>
        <div class="p-5 pt-0 text-right box-border flex items-center justify-between">
          <a href="/post/new-admin-features-payment-gateways" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, '/post/new-admin-features-payment-gateways');" class="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors m-0 text-decoration-none">
            <span>مشاهده در تب جدید</span>
            <svg class="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
          <span class="text-[10px] text-slate-400 font-normal">پیش‌نمایش ↗</span>
        </div>
      </article>

      <!-- Set 2 -->
      <article class="post-card-item w-[280px] md:w-[320px] bg-white rounded-2xl border border-solid border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg shrink-0 box-border group" role="button" tabindex="0" onclick="window.__goToPostPreview(event, '/post/online-store-guide-rakhsh')">
        <div class="box-border">
          <div class="h-44 bg-slate-100 overflow-hidden relative box-border">
            <img src="https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=60" alt="راهنمای جامع راه‌اندازی فروشگاه و ویترین آنلاین در رخش" class="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 m-0 p-0 border-0" />
            <span class="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow m-0">فروشگاه اینترنتی</span>
          </div>
          <div class="p-5 space-y-2 text-right box-border">
            <div class="text-[11px] text-slate-400 font-medium m-0">۷ شهریور ۱۴۰۳ • ۵ دقیقه مطالعه</div>
            <h3 class="font-bold text-base text-slate-900 line-clamp-2 leading-snug m-0 group-hover:text-purple-600 transition-colors">
              <a href="/post/online-store-guide-rakhsh" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, '/post/online-store-guide-rakhsh');" class="text-slate-900 group-hover:text-purple-600 text-decoration-none">راهنمای جامع راه‌اندازی فروشگاه و ویترین آنلاین در رخش</a>
            </h3>
            <p class="text-slate-600 text-xs line-clamp-3 leading-relaxed m-0">مراحل گام به گام ساخت فروشگاه اینترنتی، مدیریت موجودی کالا و فعال‌سازی روش‌های پرداخت در سامانه رخش.</p>
          </div>
        </div>
        <div class="p-5 pt-0 text-right box-border flex items-center justify-between">
          <a href="/post/online-store-guide-rakhsh" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, '/post/online-store-guide-rakhsh');" class="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors m-0 text-decoration-none">
            <span>مشاهده در تب جدید</span>
            <svg class="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
          <span class="text-[10px] text-slate-400 font-normal">پیش‌نمایش ↗</span>
        </div>
      </article>

      <article class="post-card-item w-[280px] md:w-[320px] bg-white rounded-2xl border border-solid border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg shrink-0 box-border group" role="button" tabindex="0" onclick="window.__goToPostPreview(event, '/post/new-admin-features-payment-gateways')">
        <div class="box-border">
          <div class="h-44 bg-slate-100 overflow-hidden relative box-border">
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60" alt="امکانات جدید پنل مدیریت و اتصال درگاه‌های ارزی و ریالی" class="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 m-0 p-0 border-0" />
            <span class="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow m-0">اطلاعیه</span>
          </div>
          <div class="p-5 space-y-2 text-right box-border">
            <div class="text-[11px] text-slate-400 font-medium m-0">۸ شهریور ۱۴۰۳ • ۴ دقیقه مطالعه</div>
            <h3 class="font-bold text-base text-slate-900 line-clamp-2 leading-snug m-0 group-hover:text-purple-600 transition-colors">
              <a href="/post/new-admin-features-payment-gateways" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, '/post/new-admin-features-payment-gateways');" class="text-slate-900 group-hover:text-purple-600 text-decoration-none">امکانات جدید پنل مدیریت و اتصال درگاه‌های ارزی و ریالی</a>
            </h3>
            <p class="text-slate-600 text-xs line-clamp-3 leading-relaxed m-0">مروری بر امکانات جدید پنل مدیریت، افزونه‌های کاربردی و بهینه‌سازی‌های فنی اخیر.</p>
          </div>
        </div>
        <div class="p-5 pt-0 text-right box-border flex items-center justify-between">
          <a href="/post/new-admin-features-payment-gateways" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, '/post/new-admin-features-payment-gateways');" class="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors m-0 text-decoration-none">
            <span>مشاهده در تب جدید</span>
            <svg class="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
          <span class="text-[10px] text-slate-400 font-normal">پیش‌نمایش ↗</span>
        </div>
      </article>
    </div>
  </div>
  <script>
    window.__goToPostPreview = function(e, url) {
      if (e) {
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
      }
      if (!url) return;
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (err) {
        window.location.href = url;
      }
    };

    (function initLandingRealPosts() {
      function formatPersianDate(dateStr) {
        if (!dateStr) return "به تازگی";
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return "به تازگی";
          return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric"
          }).format(d);
        } catch(e) {
          return "به تازگی";
        }
      }

      function calcReadTime(content) {
        if (!content) return "۳ دقیقه مطالعه";
        const words = content.replace(/[#*\`_~[\\]()>-]/g, ' ').trim().split(/\\s+/).filter(Boolean).length;
        const minutes = Math.max(2, Math.ceil(words / 130));
        const faMinutes = String(minutes).replace(/\\d/g, function(d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; });
        return faMinutes + " دقیقه مطالعه";
      }

      function escapeHtml(str) {
        if (!str) return "";
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function stripMarkdown(str) {
        if (!str) return "";
        return str
          .replace(/!\\[.*?\\]\\(.*?\\)/g, "")
          .replace(/\\[(.*?)\\]\\(.*?\\)/g, "$1")
          .replace(/[#*\`_~>-]/g, " ")
          .replace(/\\s+/g, " ")
          .trim();
      }

      function renderPostCard(post) {
        const title = escapeHtml(post.title || "نوشته بدون عنوان");
        const rawExcerpt = post.excerpt || stripMarkdown(post.content || "");
        const excerpt = escapeHtml(rawExcerpt.slice(0, 110) + (rawExcerpt.length > 110 ? "..." : ""));
        const category = escapeHtml(post.categoryName || (post.tags && post.tags[0]) || "مقاله آموزشی");
        const dateFormatted = formatPersianDate(post.publishedAt || post.createdAt);
        const readTime = calcReadTime(post.content || post.excerpt);
        const image = post.featuredImage || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80";
        const postUrl = post.slug ? "/post/" + encodeURIComponent(post.slug) : "/posts/" + encodeURIComponent(post.id);

        return '<article class="post-card-item w-[280px] md:w-[320px] bg-white rounded-2xl border border-solid border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg shrink-0 box-border group" role="button" tabindex="0" onclick="window.__goToPostPreview(event, \\'' + postUrl + '\\')">' +
          '<div class="box-border">' +
            '<div class="h-44 bg-slate-100 overflow-hidden relative box-border">' +
              '<img src="' + image + '" alt="' + title + '" class="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 m-0 p-0 border-0" onerror="this.src=\\'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80\\'" />' +
              '<span class="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow m-0">' + category + '</span>' +
            '</div>' +
            '<div class="p-5 space-y-2 text-right box-border">' +
              '<div class="text-[11px] text-slate-400 font-medium m-0">' + dateFormatted + ' • ' + readTime + '</div>' +
              '<h3 class="font-bold text-base text-slate-900 line-clamp-2 leading-snug m-0 group-hover:text-purple-600 transition-colors">' +
                '<a href="' + postUrl + '" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, \\'' + postUrl + '\\');" class="text-slate-900 group-hover:text-purple-600 text-decoration-none">' + title + '</a>' +
              '</h3>' +
              '<p class="text-slate-600 text-xs line-clamp-3 leading-relaxed m-0">' + (excerpt || "برای مطالعه متن کامل روی لینک زیر کلیک کنید...") + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="p-5 pt-0 text-right box-border flex items-center justify-between">' +
            '<a href="' + postUrl + '" target="_blank" rel="noopener noreferrer" onclick="window.__goToPostPreview(event, \\'' + postUrl + '\\');" class="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors m-0 text-decoration-none">' +
              '<span>مشاهده در تب جدید</span>' +
              '<svg class="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>' +
            '</a>' +
            '<span class="text-[10px] text-slate-400 font-normal">پیش‌نمایش ↗</span>' +
          '</div>' +
        '</article>';
      }

      function loadAndRenderPosts() {
        const tracks = document.querySelectorAll(".posts-marquee-track");
        if (!tracks.length) return;

        fetch("/api/posts?status=published")
          .then(function(res) {
            if (!res.ok) throw new Error("Status " + res.status);
            return res.json();
          })
          .then(function(data) {
            let posts = Array.isArray(data) ? data : (data && Array.isArray(data.posts) ? data.posts : []);
            posts = posts.filter(function(p) { return p.status === "published" || !p.status; });
            if (!posts.length) return;

            let half = [];
            while (half.length < Math.max(4, posts.length)) {
              half = half.concat(posts);
            }
            const fullList = half.concat(half);

            const cardsHtml = fullList.map(renderPostCard).join("");
            tracks.forEach(function(track) {
              track.innerHTML = cardsHtml;
            });
          })
          .catch(function(err) {
            console.warn("Could not fetch real published posts:", err);
          });
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadAndRenderPosts);
      } else {
        loadAndRenderPosts();
      }
      window.__loadLandingRealPosts = loadAndRenderPosts;
    })();
  </script>
</section>`,
  },
  {
    id: "gallery-carousel",
    title: "کاروسل متحرک تصاویر (Animated Image Carousel)",
    description: "اسلایدر افقی متحرک و خودکار تصاویر بدون متن و لینک اضافی",
    icon: Images,
    category: "گالری",
    html: `<section class="py-8 md:py-10 px-4 md:px-8 bg-slate-50 my-6 rounded-3xl border border-solid border-slate-200 shadow-sm overflow-hidden box-border relative" dir="ltr">
  <style>
    @keyframes infiniteScroll {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    .marquee-track {
      display: flex;
      gap: 1.25rem;
      padding-right: 1.25rem;
      width: max-content;
      animation: infiniteScroll 25s linear infinite;
      will-change: transform;
    }
    .marquee-track:hover {
      animation-play-state: paused;
    }
  </style>

  <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-end justify-between mb-4 gap-4 px-2 box-border" dir="rtl">
    <div class="space-y-1 max-w-xl text-right box-border">
      <span class="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold tracking-wider rounded-full uppercase border border-solid border-purple-200">گالری متحرک</span>
      <h2 class="text-xl md:text-2xl font-black text-slate-900 tracking-tight m-0">گالری تصاویر</h2>
      <p class="text-slate-600 text-xs md:text-sm leading-relaxed m-0">نمایش خودکار و پیوسته تصاویر با قابلیت توقف اسکرول با نگه داشتن ماوس.</p>
    </div>
    <div class="text-xs text-slate-400 font-medium hidden md:block">
      برای توقف اسکرول، ماوس را روی تصاویر نگه دارید ⏸️
    </div>
  </div>

  <div class="w-full overflow-hidden relative box-border py-2">
    <!-- Gradient Fade Edges -->
    <div class="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
    <div class="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>

    <div class="marquee-track flex gap-5 pr-5 box-border" dir="rtl">
      <!-- Set 1 -->
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&auto=format&fit=crop&q=80" alt="تصویر ۱" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=700&auto=format&fit=crop&q=80" alt="تصویر ۲" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&auto=format&fit=crop&q=80" alt="تصویر ۳" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&auto=format&fit=crop&q=80" alt="تصویر ۴" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=700&auto=format&fit=crop&q=80" alt="تصویر ۵" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&auto=format&fit=crop&q=80" alt="تصویر ۶" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>

      <!-- Set 2 (Exact Duplicate for Seamless Infinite Loop) -->
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&auto=format&fit=crop&q=80" alt="تصویر ۱" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=700&auto=format&fit=crop&q=80" alt="تصویر ۲" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&auto=format&fit=crop&q=80" alt="تصویر ۳" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&auto=format&fit=crop&q=80" alt="تصویر ۴" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=700&auto=format&fit=crop&q=80" alt="تصویر ۵" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
      <div class="w-[280px] md:w-[340px] h-[190px] md:h-[230px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-solid border-slate-200 shrink-0 box-border bg-slate-100 group relative">
        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&auto=format&fit=crop&q=80" alt="تصویر ۶" class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 m-0 p-0 border-0" />
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: "video-showcase",
    title: "پلیر ویدیوی استاندارد و خالص (Pure 16:9 Video Player)",
    description: "ویدیو پلیر تمیز ۱۶:۹ بدون بک‌گراند، بدون برچسب و بدون عنوان‌های اضافی با کنترل‌های کامل",
    icon: Video,
    category: "ویدیو و رسانه",
    html: `<section class="py-6 px-4 max-w-4xl mx-auto box-border" dir="rtl">
  <div class="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-black border border-slate-200">
    <video
      id="clean-single-video"
      controls
      preload="metadata"
      playsinline
      poster="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1200&auto=format&fit=crop&q=80"
      class="w-full h-full object-cover block"
    >
      <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
      مرورگر شما از تگ ویدیو پشتیبانی نمی‌کند.
    </video>
  </div>
</section>`
  },
  {
    id: "video-feature-split",
    title: "پلیر ویدیوی عریض و سینمایی خالص (Full-Width Clean Video)",
    description: "ویدیو پلیر عریض و باکیفیت بدون پس‌زمینه تیره، متن یا برچسب اضافی با گوشه‌های گرد و سایه ملایم",
    icon: Play,
    category: "ویدیو و رسانه",
    html: `<section class="py-6 px-2 md:px-6 w-full max-w-6xl mx-auto box-border" dir="rtl">
  <div class="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-slate-300/80">
    <video
      id="clean-fullwidth-video"
      controls
      preload="metadata"
      playsinline
      poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80"
      class="w-full h-full object-cover block"
    >
      <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" type="video/mp4" />
      مرورگر شما از تگ ویدیو پشتیبانی نمی‌کند.
    </video>
  </div>
</section>`
  },
  {
    id: "video-aparat-embed",
    title: "پلیر ویدیوی آپارات (Aparat Video Player)",
    description: "پلیر اختصاصی ویدیوهای آپارات بدون پس‌زمینه و المان اضافی - سازگار با کلیه کدهای ویدیو در آپارات",
    icon: Video,
    category: "ویدیو و رسانه",
    html: `<section class="py-6 px-4 max-w-4xl mx-auto box-border" dir="rtl">
  <div class="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-black border border-slate-200">
    <iframe
      src="https://www.aparat.com/video/video/embed/videohash/eR6v7/vt/frame"
      allowFullScreen="true"
      webkitallowfullscreen="true"
      mozallowfullscreen="true"
      class="w-full h-full border-0 absolute top-0 left-0"
    ></iframe>
  </div>
</section>`
  }
];

export default function VisualLandingBuilderPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Extract template ID from search params
  const searchParams = new URLSearchParams(window.location.search);
  const templateId = searchParams.get("template") || "default";

  // State
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [activeTab, setActiveTab] = useState<string>("element");
  const [htmlCode, setHtmlCode] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);

  // Selected Element State
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);

  // Floating text toolbar state
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<{
    top: number;
    left: number;
    visible: boolean;
  }>({ top: 0, left: 0, visible: false });

  // Media picker modal state
  const [mediaPickerOpen, setMediaPickerOpen] = useState<boolean>(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"image" | "background" | "video-poster" | "video-src">("image");
  const [uploadingAsset, setUploadingAsset] = useState<boolean>(false);
  const [customImageUrl, setCustomImageUrl] = useState<string>("");
  const [mediaSearchQuery, setMediaSearchQuery] = useState<string>("");

  // Restore backup modal state
  const [restoreModalOpen, setRestoreModalOpen] = useState<boolean>(false);

  // Sections & Text items outline
  const [sections, setSections] = useState<PageSection[]>([]);
  const [textItems, setTextItems] = useState<EditableTextItem[]>([]);
  const [addSectionModalOpen, setAddSectionModalOpen] = useState<boolean>(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState<string>("");

  // Theme settings
  const [primaryColor, setPrimaryColor] = useState<string>("#7c3aed");
  const [selectedFont, setSelectedFont] = useState<string>("Vazirmatn");

  // Iframe Ref & Bridge
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Builder Data
  const { data: builderData, isLoading, isError, refetch } = useQuery<BuilderData>({
    queryKey: ["template-builder-data", templateId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/landing/templates/${templateId}/builder-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "خطا در بارگذاری قالب" }));
        throw new Error(err.message || "قالب یافت نشد");
      }
      return res.json();
    },
    staleTime: 0,
  });

  // Initialize HTML and history when data loaded
  useEffect(() => {
    if (builderData?.html) {
      setHtmlCode(builderData.html);
      setHistory([builderData.html]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
    }
  }, [builderData?.html]);

  // Load Persian Font CDNs into host document head for sidebar live previews
  useEffect(() => {
    PERSIAN_FONTS.forEach((f) => {
      if (f.cdnUrl && !document.querySelector(`link[data-font-cdn="${f.font}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = f.cdnUrl;
        link.setAttribute("data-font-cdn", f.font);
        document.head.appendChild(link);
      }
    });
  }, []);

  // Save changes mutation
  const saveMutation = useMutation({
    mutationFn: async (htmlToSave: string) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/landing/templates/${templateId}/save-builder-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ htmlContent: htmlToSave }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "خطا در ذخیره قالب" }));
        throw new Error(err.message || "خطا در ذخیره قالب");
      }
      return res.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing/public-config"] });
      toast({
        title: "تغییرات قالب با موفقیت ذخیره شد",
        description: "صفحه اصلی سامانه با محتوا و طراحی جدید به‌روزرسانی گردید.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ذخیره تغییرات",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Restore backup mutation
  const restoreMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/landing/templates/${templateId}/restore-backup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "خطا در بازنشانی نسخه پشتیبان" }));
        throw new Error(err.message || "خطا در بازنشانی");
      }
      return res.json();
    },
    onSuccess: () => {
      setRestoreModalOpen(false);
      refetch();
      toast({
        title: "قالب به نسخه اولیه بازنشانی شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در بازنشانی نسخه اولیه",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Push new state to history stack
  const pushHistory = (newHtml: string) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newHtml);
    // Keep max 30 steps
    if (updatedHistory.length > 30) {
      updatedHistory.shift();
    }
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setHtmlCode(newHtml);
    setHasUnsavedChanges(true);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevHtml = history[prevIndex];
      setHtmlCode(prevHtml);
      setHasUnsavedChanges(true);
      updateIframeHtml(prevHtml);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextHtml = history[nextIndex];
      setHtmlCode(nextHtml);
      setHasUnsavedChanges(true);
      updateIframeHtml(nextHtml);
    }
  };

  // Extract sections and text items from the document
  const analyzeDocumentStructure = (doc: Document) => {
    // 1. Detect Sections
    const rawCandidates = Array.from(
      doc.querySelectorAll("header, nav, section, footer, main, [id^='section'], [class*='hero'], [class*='feature'], [class*='pricing'], [class*='about'], [class*='contact'], [class*='banner'], [class*='cta'], [class*='testimonial'], [class*='faq'], [class*='footer']")
    );

    let sectionElements: Element[] = [];
    if (rawCandidates.length >= 2) {
      // Filter out elements that are inside another candidate section
      sectionElements = rawCandidates.filter((el) => {
        return !rawCandidates.some((parent) => parent !== el && parent.contains(el));
      });
    } else {
      // Fallback to top-level divs/sections inside body or main
      const topDivs = Array.from(doc.querySelectorAll("body > div, body > main > div, #app > div, #root > div, body > section, body > header, body > footer"));
      sectionElements = topDivs.length > 0 ? topDivs : (doc.body ? Array.from(doc.body.children) : []);
    }

    const parsedSections: PageSection[] = [];
    const seenEls = new Set<Element>();

    let idx = 0;
    sectionElements.forEach((el) => {
      if (seenEls.has(el)) return;
      const tag = el.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || el.id === "rakhsh-builder-styles") return;
      seenEls.add(el);

      let heading = el.querySelector("h1, h2, h3, h4")?.textContent?.trim() || "";
      if (!heading) {
        if (tag === "header") heading = "هدر و منوی ناوبری (Header)";
        else if (tag === "footer") heading = "فوتر و پاورقی (Footer)";
        else if (tag === "nav") heading = "منوی ناوبری (Nav)";
        else if (el.id) heading = `بخش #${el.id}`;
        else heading = `بخش شماره ${idx + 1}`;
      }

      // Generate unique selector or dataset tag
      if (!el.getAttribute("data-builder-id")) {
        el.setAttribute("data-builder-id", `section-${idx}-${Date.now()}`);
      }

      parsedSections.push({
        id: el.getAttribute("data-builder-id")!,
        tagName: tag,
        title: heading.slice(0, 35),
        selector: `[data-builder-id="${el.getAttribute("data-builder-id")}"]`,
        index: idx,
        isVisible: (el as HTMLElement).style.display !== "none",
      });
      idx++;
    });

    setSections(parsedSections);

    // 2. Detect Editable Text Elements
    const headingsAndTexts = doc.querySelectorAll("h1, h2, h3, h4, h5, h6, p");
    const parsedTexts: EditableTextItem[] = [];
    headingsAndTexts.forEach((el, index) => {
      const text = el.textContent?.trim() || "";
      if (text.length > 2) {
        if (!el.getAttribute("data-builder-text-id")) {
          el.setAttribute("data-builder-text-id", `text-${index}`);
        }
        parsedTexts.push({
          selector: `[data-builder-text-id="${el.getAttribute("data-builder-text-id")}"]`,
          tagName: el.tagName.toLowerCase(),
          text: text,
          preview: text.length > 50 ? text.slice(0, 50) + "..." : text,
        });
      }
    });
    setTextItems(parsedTexts.slice(0, 40));
  };

  // Inject Visual Editor scripts & styles into the iframe
  const injectEditorBridge = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;

    // Remove any existing editor styling
    const existingStyle = doc.getElementById("rakhsh-builder-styles");
    if (existingStyle) existingStyle.remove();

    // Inject Editor helper stylesheet into iframe head
    const styleEl = doc.createElement("style");
    styleEl.id = "rakhsh-builder-styles";
    styleEl.innerHTML = `
      /* Rakhsh Live Visual Builder Overlays */
      .navbar-collapse,
      .navbar-collapse.collapse,
      .navbar-collapse.in,
      .navbar-collapse.collapsing,
      #bs-example-navbar-collapse-1 {
        visibility: visible !important;
      }
      @media (min-width: 768px) {
        .navbar-collapse,
        .navbar-collapse.collapse {
          display: block !important;
          visibility: visible !important;
          height: auto !important;
          opacity: 1 !important;
        }
      }
      .navbar-collapse.in,
      .navbar-collapse.show {
        display: block !important;
        visibility: visible !important;
        height: auto !important;
        opacity: 1 !important;
      }
      .rakhsh-hovered {
        outline: 2px dashed #8b5cf6 !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
      }
      .rakhsh-selected {
        outline: 3px solid #7c3aed !important;
        outline-offset: 3px !important;
        position: relative !important;
      }
      [contenteditable="true"]:focus {
        outline: 3px solid #10b981 !important;
        outline-offset: 3px !important;
        background-color: rgba(16, 185, 129, 0.05) !important;
      }
      a {
        pointer-events: ${viewMode === "visual" ? "none" : "auto"} !important;
      }
      button {
        cursor: ${viewMode === "visual" ? "pointer" : "default"} !important;
      }
    `;
    doc.head.appendChild(styleEl);

    // Attach click handler for mobile menu toggles inside iframe
    doc.querySelectorAll('.navbar-toggle, [data-toggle="collapse"], .navbar-toggler').forEach((btn) => {
      (btn as HTMLElement).onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetSel = btn.getAttribute("data-target") || btn.getAttribute("href") || btn.getAttribute("data-bs-target");
        if (targetSel) {
          const targetEl = doc.querySelector(targetSel);
          if (targetEl) {
            const isOpen = targetEl.classList.contains("in") || targetEl.classList.contains("show");
            if (isOpen) {
              targetEl.classList.remove("in", "show");
              (targetEl as HTMLElement).style.display = "";
            } else {
              targetEl.classList.add("in", "show");
              (targetEl as HTMLElement).style.display = "block";
              (targetEl as HTMLElement).style.visibility = "visible";
            }
          }
        }
      };
    });

    // Ensure active selected global font is injected into iframe head
    if (selectedFont) {
      const fontObj = PERSIAN_FONTS.find((f) => f.font === selectedFont);
      if (fontObj) {
        let linkEl = doc.querySelector("#landing-global-font-link") as HTMLLinkElement;
        if (fontObj.cdnUrl) {
          if (!linkEl) {
            linkEl = doc.createElement("link");
            linkEl.id = "landing-global-font-link";
            linkEl.rel = "stylesheet";
            doc.head.appendChild(linkEl);
          }
          linkEl.href = fontObj.cdnUrl;
        }

        let fontStyleEl = doc.querySelector("#landing-global-font-style") as HTMLStyleElement;
        if (!fontStyleEl) {
          fontStyleEl = doc.createElement("style");
          fontStyleEl.id = "landing-global-font-style";
          doc.head.appendChild(fontStyleEl);
        }
        fontStyleEl.textContent = `
          html, body, body *, h1, h2, h3, h4, h5, h6, p, a, button, input, textarea, select, span, div, li, td, th {
            font-family: ${fontObj.cssName} !important;
          }
        `;
      }
    }

    // Analyze structure
    analyzeDocumentStructure(doc);

    // In visual edit mode, attach interactive events
    if (viewMode === "visual") {
      let hoveredEl: HTMLElement | null = null;

      const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target || target === doc.body || target === doc.documentElement) return;
        if (hoveredEl && hoveredEl !== target) {
          hoveredEl.classList.remove("rakhsh-hovered");
        }
        hoveredEl = target;
        target.classList.add("rakhsh-hovered");
      };

      const handleMouseOut = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target) {
          target.classList.remove("rakhsh-hovered");
        }
      };

      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target || target === doc.body || target === doc.documentElement) return;

        const tag = target.tagName.toLowerCase();
        const isVideo = tag === "video" || !!target.closest("video");

        // Allow native video interactions (play/pause/scrub) without blocking click
        if (!isVideo) {
          e.preventDefault();
        }
        e.stopPropagation();

        // Clear previous selected
        doc.querySelectorAll(".rakhsh-selected").forEach((el) => el.classList.remove("rakhsh-selected"));

        const targetToSelect = isVideo ? ((tag === "video" ? target : target.closest("video")) as HTMLElement) : target;
        if (targetToSelect) {
          targetToSelect.classList.add("rakhsh-selected");
        }

        const isTextTag = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "strong", "em", "li", "label", "blockquote", "b", "i", "small", "a"].includes(tag);
        const isImgTag = tag === "img" || tag === "svg" || tag === "picture";

        // Assign a builder ID if missing
        if (!targetToSelect.getAttribute("data-builder-selected-id")) {
          targetToSelect.setAttribute("data-builder-selected-id", `el-${Date.now()}`);
        }
        const selector = `[data-builder-selected-id="${targetToSelect.getAttribute("data-builder-selected-id")}"]`;

        // If it's text, make it contentEditable
        if (isTextTag) {
          target.setAttribute("contenteditable", "true");
          target.focus();

          // Calculate floating toolbar position
          const rect = target.getBoundingClientRect();
          const iframeRect = iframe.getBoundingClientRect();

          setFloatingToolbarPos({
            top: Math.max(10, iframeRect.top + rect.top - 52),
            left: Math.max(20, iframeRect.left + rect.left + rect.width / 2 - 160),
            visible: true,
          });

          // Listen to input on contentEditable
          target.oninput = () => {
            const currentHtml = cleanAndSerializeIframeHtml(doc);
            setHtmlCode(currentHtml);
            setHasUnsavedChanges(true);
          };

          target.onblur = () => {
            target.removeAttribute("contenteditable");
            const finalHtml = cleanAndSerializeIframeHtml(doc);
            pushHistory(finalHtml);
          };
        } else {
          setFloatingToolbarPos((prev) => ({ ...prev, visible: false }));
        }

        // If it's an image, open media picker dialog
        if (isImgTag) {
          setMediaPickerTarget("image");
          setMediaPickerOpen(true);
        }

        // Populate Selected Element State
        setSelectedElement(extractElementInfo(targetToSelect, selector));
        setActiveTab("element");
      };

      if (doc.body) {
        doc.body.addEventListener("mouseover", handleMouseOver);
        doc.body.addEventListener("mouseout", handleMouseOut);
        doc.body.addEventListener("click", handleClick);
      } else {
        console.warn("doc.body is null, cannot attach events. Is the iframe fully loaded?");
      }
    } else {
      setFloatingToolbarPos((prev) => ({ ...prev, visible: false }));
    }

    // Trigger real posts hydration if available in iframe
    try {
      if ((iframe.contentWindow as any)?.__loadLandingRealPosts) {
        (iframe.contentWindow as any).__loadLandingRealPosts();
      }
    } catch (e) {
      // Ignore cross-origin or bridge invocation errors
    }
  };

  // Clean editor helper classes and serialize HTML
  const cleanAndSerializeIframeHtml = (doc: Document): string => {
    // Clone document without modifying live view
    const clonedDoc = doc.documentElement.cloneNode(true) as HTMLElement;

    // Remove helper styles and classes
    const styleEl = clonedDoc.querySelector("#rakhsh-builder-styles");
    if (styleEl) styleEl.remove();

    // Deduplicate font links and font styles
    const fontLinks = Array.from(clonedDoc.querySelectorAll("#landing-global-font-link"));
    if (fontLinks.length > 1) {
      fontLinks.slice(1).forEach((l) => l.remove());
    }
    const fontStyles = Array.from(clonedDoc.querySelectorAll("#landing-global-font-style"));
    if (fontStyles.length > 1) {
      fontStyles.slice(1).forEach((s) => s.remove());
    }

    // Remove runtime generated tailwind duplicate style tags so they don't pile up
    const anonymousStyles = Array.from(clonedDoc.querySelectorAll("head > style:not([id])"));
    anonymousStyles.forEach((st) => {
      if (st.innerHTML.includes("--tw-border-spacing-x") || st.innerHTML.includes("tailwindcss v3")) {
        st.remove();
      }
    });

    clonedDoc.querySelectorAll(".rakhsh-hovered, .rakhsh-selected").forEach((el) => {
      el.classList.remove("rakhsh-hovered");
      el.classList.remove("rakhsh-selected");
      if (el.classList.length === 0) el.removeAttribute("class");
    });

    clonedDoc.querySelectorAll("[contenteditable]").forEach((el) => {
      el.removeAttribute("contenteditable");
    });

    // Ensure menu fix style is present in head
    const existingFix = clonedDoc.querySelector("#landing-menu-fix-style");
    if (existingFix) existingFix.remove();

    const menuStyle = doc.createElement("style");
    menuStyle.id = "landing-menu-fix-style";
    menuStyle.innerHTML = `
      html, body {
        max-width: 100% !important;
        overflow-x: hidden !important;
      }
      img, video {
        max-width: 100% !important;
        height: auto;
      }
      @media (max-width: 767px) {
        .navbar-collapse.collapse:not(.in):not(.show) {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          opacity: 0 !important;
          overflow: hidden !important;
        }
        .navbar-collapse.collapse.in,
        .navbar-collapse.collapse.show {
          display: block !important;
          visibility: visible !important;
          height: auto !important;
          opacity: 1 !important;
          overflow: visible !important;
        }
      }
      @media (min-width: 768px) {
        .navbar-collapse,
        .navbar-collapse.collapse {
          display: block !important;
          visibility: visible !important;
          height: auto !important;
          opacity: 1 !important;
          overflow: visible !important;
        }
      }
    `;
    const head = clonedDoc.querySelector("head");
    if (head) head.appendChild(menuStyle);

    return "<!DOCTYPE html>\n" + clonedDoc.outerHTML;
  };

  // Update Iframe Document when HTML changes or resets
  const updateIframeHtml = (newHtml: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) {
      setTimeout(() => {
        const retryIframe = iframeRef.current;
        if (retryIframe && retryIframe.contentDocument) {
          updateIframeHtml(newHtml);
        }
      }, 100);
      return;
    }

    // Adjust relative assets path in HTML
    let adjustedHtml = newHtml;
    const folderBase = builderData?.folderBase || "";

    if (folderBase && folderBase !== "/") {
      // Fix relative paths like src="pics/..." to src="/landing-templates/tpl_.../pics/..."
      adjustedHtml = adjustedHtml.replace(/src="(?!http|\/|data:)([^"]+)"/g, `src="${folderBase}$1"`);
      adjustedHtml = adjustedHtml.replace(/href="(?!http|\/|#|mailto:|tel:)([^"]+\.css)"/g, `href="${folderBase}$1"`);
    }

    // Inject Tailwind CSS for visual builder templates if not present
    if (!adjustedHtml.includes("cdn.tailwindcss.com") && adjustedHtml.includes("</head>")) {
      adjustedHtml = adjustedHtml.replace(
        "</head>",
        `  <script src="https://cdn.tailwindcss.com" defer></script>\n  <script defer>tailwind.config = { corePlugins: { preflight: false, container: false } }</script>\n</head>`
      );
    }

    // Inject navbar collapse fix style if missing
    if (adjustedHtml.includes("landing-menu-fix-style")) {
      adjustedHtml = adjustedHtml.replace(/<style id="landing-menu-fix-style">[\s\S]*?<\/style>/gi, "");
    }
    const fixStyle = `<style id="landing-menu-fix-style">
      html, body {
        max-width: 100% !important;
        overflow-x: hidden !important;
      }
      img, video {
        max-width: 100% !important;
        height: auto;
      }
      @media (max-width: 767px) {
        .navbar-collapse.collapse:not(.in):not(.show) {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          opacity: 0 !important;
          overflow: hidden !important;
        }
        .navbar-collapse.collapse.in,
        .navbar-collapse.collapse.show {
          display: block !important;
          visibility: visible !important;
          height: auto !important;
          opacity: 1 !important;
          overflow: visible !important;
        }
      }
      @media (min-width: 768px) {
        .navbar-collapse,
        .navbar-collapse.collapse {
          display: block !important;
          visibility: visible !important;
          height: auto !important;
          opacity: 1 !important;
          overflow: visible !important;
        }
      }
    </style>`;
    if (adjustedHtml.includes("</head>")) {
      adjustedHtml = adjustedHtml.replace("</head>", `${fixStyle}\n</head>`);
    }

    iframe.contentDocument.open();
    iframe.contentDocument.write(adjustedHtml);
    iframe.contentDocument.close();

    // Re-inject editor after iframe loads
    injectEditorBridge();

    iframe.onload = () => {
      injectEditorBridge();
    };
  };

  // Initial load into iframe
  useEffect(() => {
    if (htmlCode && !isLoading) {
      updateIframeHtml(htmlCode);
    }
  }, [builderData?.template?.id, viewMode, isLoading, !!htmlCode]);

  // Execute DOM command on selected element or active selection
  const executeTextFormat = (command: string, value?: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    iframe.contentDocument.execCommand(command, false, value || "");
    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
    pushHistory(updatedHtml);
  };

  // Apply Image/Video Asset Replacement
  const handleApplyImage = (newSrc: string, altText?: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !selectedElement) return;

    const targetEl = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    if (targetEl) {
      const tag = targetEl.tagName.toLowerCase();

      if (mediaPickerTarget === "video-poster") {
        if (tag === "video") {
          targetEl.setAttribute("poster", newSrc);
        } else {
          const v = targetEl.querySelector("video");
          if (v) v.setAttribute("poster", newSrc);
        }
        setSelectedElement((prev) => (prev ? { ...prev, poster: newSrc } : null));
        toast({
          title: "تصویر پوستر ویدیو با موفقیت تنظیم شد",
        });
      } else if (mediaPickerTarget === "video-src") {
        if (tag === "video") {
          targetEl.setAttribute("src", newSrc);
          const s = targetEl.querySelector("source");
          if (s) s.setAttribute("src", newSrc);
          try { (targetEl as HTMLVideoElement).load(); } catch (e) {}
        } else {
          const v = targetEl.querySelector("video");
          if (v) {
            v.setAttribute("src", newSrc);
            const s = v.querySelector("source");
            if (s) s.setAttribute("src", newSrc);
            try { (v as HTMLVideoElement).load(); } catch (e) {}
          }
        }
        setSelectedElement((prev) => (prev ? { ...prev, videoSrc: newSrc, src: newSrc } : null));
        toast({
          title: "منبع فایل ویدیو با موفقیت تغییر کرد",
        });
      } else if (tag === "img") {
        targetEl.setAttribute("src", newSrc);
        if (altText) targetEl.setAttribute("alt", altText);
        setSelectedElement((prev) => (prev ? { ...prev, src: newSrc, alt: altText || prev.alt } : null));
        toast({
          title: "تصویر با موفقیت جایگزین شد",
        });
      } else {
        targetEl.style.backgroundImage = `url('${newSrc}')`;
        setSelectedElement((prev) => (prev ? { ...prev, src: newSrc, alt: altText || prev.alt } : null));
        toast({
          title: "تصویر پس‌زمینه با موفقیت اعمال شد",
        });
      }

      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      pushHistory(updatedHtml);
    }
    setMediaPickerOpen(false);
  };

  // Upload New Asset from Computer
  const handleUploadAssetFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/landing/templates/${templateId}/upload-asset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "خطا در بارگذاری فایل" }));
        throw new Error(err.message || "خطا در بارگذاری فایل");
      }

      const data = await res.json();
      refetch();

      handleApplyImage(data.assetUrl, file.name);

      toast({
        title: "تصویر جدید بارگذاری و اعمال شد",
      });
    } catch (err: any) {
      toast({
        title: "خطا در بارگذاری تصویر",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAsset(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Scroll to section or text in iframe & select it
  const handleScrollToSection = (selector: string, switchTabToElement = false) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const el = iframe.contentDocument.querySelector(selector) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      iframe.contentDocument.querySelectorAll(".rakhsh-selected").forEach((e) => e.classList.remove("rakhsh-selected"));
      el.classList.add("rakhsh-selected");

      const tag = el.tagName.toLowerCase();
      if (!el.getAttribute("data-builder-selected-id")) {
        el.setAttribute("data-builder-selected-id", `el-${Date.now()}`);
      }
      const actualSelector = `[data-builder-selected-id="${el.getAttribute("data-builder-selected-id")}"]`;

      setSelectedElement(extractElementInfo(el, actualSelector));

      if (switchTabToElement) {
        setActiveTab("element");
      }
    }
  };

  // Keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const iframe = iframeRef.current;
        let htmlToSave = htmlCode;
        if (iframe && iframe.contentDocument && viewMode !== "code") {
          htmlToSave = cleanAndSerializeIframeHtml(iframe.contentDocument);
        }
        saveMutation.mutate(htmlToSave);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault();
          handleRedo();
        }
      } else if (e.key === "Escape") {
        setFloatingToolbarPos((prev) => ({ ...prev, visible: false }));
        setSelectedElement(null);
        const iframe = iframeRef.current;
        if (iframe?.contentDocument) {
          iframe.contentDocument.querySelectorAll(".rakhsh-selected").forEach((el) => el.classList.remove("rakhsh-selected"));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [htmlCode, viewMode, historyIndex, history]);

  // Toggle Section Visibility
  const handleToggleSectionVisibility = (sectionId: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const el = iframe.contentDocument.querySelector(`[data-builder-id="${sectionId}"]`) as HTMLElement;
    if (el) {
      const isHidden = el.style.display === "none";
      el.style.display = isHidden ? "" : "none";

      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, isVisible: !isHidden } : s))
      );

      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      pushHistory(updatedHtml);
    }
  };

  // Duplicate Section
  const handleDuplicateSection = (sectionId: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const el = iframe.contentDocument.querySelector(`[data-builder-id="${sectionId}"]`) as HTMLElement;
    if (el) {
      const clone = el.cloneNode(true) as HTMLElement;
      const newId = `section-${Date.now()}`;
      clone.setAttribute("data-builder-id", newId);

      if (el.nextSibling) {
        el.parentNode?.insertBefore(clone, el.nextSibling);
      } else {
        el.parentNode?.appendChild(clone);
      }

      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      setHtmlCode(updatedHtml);
      setHasUnsavedChanges(true);
      pushHistory(updatedHtml);
      analyzeDocumentStructure(iframe.contentDocument);

      toast({
        title: "بخش با موفقیت تکثیر شد",
      });
    }
  };

  // Delete Section
  const handleDeleteSection = (sectionId: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const el = iframe.contentDocument.querySelector(`[data-builder-id="${sectionId}"]`) as HTMLElement;
    if (el) {
      el.remove();

      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      setHtmlCode(updatedHtml);
      setHasUnsavedChanges(true);
      pushHistory(updatedHtml);
      analyzeDocumentStructure(iframe.contentDocument);

      toast({
        title: "بخش با موفقیت حذف شد",
      });
    }
  };

  // Rename Section Title in List
  const handleRenameSection = (sectionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title: newTitle.trim() } : s))
    );
    setEditingSectionId(null);
    toast({
      title: "عنوان بخش بروزرسانی شد",
    });
  };

  // Add Pre-designed Section Template
  const handleAddSectionTemplate = (templateHtml: string, templateTitle: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;
    const tempContainer = doc.createElement("div");
    tempContainer.innerHTML = templateHtml.trim();
    const newEl = tempContainer.firstElementChild as HTMLElement;
    if (!newEl) return;

    const newId = `section-${Date.now()}`;
    newEl.setAttribute("data-builder-id", newId);

    // Insert before footer or at body end
    const footerEl = doc.querySelector("footer");
    if (footerEl && footerEl.parentNode) {
      footerEl.parentNode.insertBefore(newEl, footerEl);
    } else if (doc.body) {
      doc.body.appendChild(newEl);
    }

    const updatedHtml = cleanAndSerializeIframeHtml(doc);
    setHtmlCode(updatedHtml);
    setHasUnsavedChanges(true);
    pushHistory(updatedHtml);
    analyzeDocumentStructure(doc);
    setAddSectionModalOpen(false);

    setTimeout(() => {
      handleScrollToSection(`[data-builder-id="${newId}"]`);
    }, 150);

    toast({
      title: `بخش «${templateTitle}» با موفقیت اضافه شد`,
    });
  };

  // Move Section Up or Down
  const handleMoveSection = (sectionIndex: number, direction: "up" | "down") => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const currentSection = sections[sectionIndex];
    const targetSection = sections[direction === "up" ? sectionIndex - 1 : sectionIndex + 1];
    if (!currentSection || !targetSection) return;

    const currentEl = iframe.contentDocument.querySelector(currentSection.selector);
    const targetEl = iframe.contentDocument.querySelector(targetSection.selector);

    if (currentEl && targetEl && currentEl.parentNode && currentEl.parentNode === targetEl.parentNode) {
      const parent = currentEl.parentNode;
      if (direction === "up") {
        parent.insertBefore(currentEl, targetEl);
      } else {
        parent.insertBefore(targetEl, currentEl);
      }

      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      pushHistory(updatedHtml);
      analyzeDocumentStructure(iframe.contentDocument);
    }
  };

  // Helper to extract full computed & inline properties of an element
  const extractElementInfo = (target: HTMLElement, selector: string): SelectedElementInfo => {
    const tag = target.tagName.toLowerCase();
    const isVideo = tag === "video";
    const isIframe = tag === "iframe";
    const videoEl = isVideo ? (target as HTMLVideoElement) : (target.querySelector("video") as HTMLVideoElement | null);
    const iframeEl = isIframe ? (target as HTMLIFrameElement) : (target.querySelector("iframe") as HTMLIFrameElement | null);
    const sourceEl = videoEl ? videoEl.querySelector("source") : null;
    const computed = window.getComputedStyle(target);
    const videoSrcVal = videoEl ? (videoEl.getAttribute("src") || sourceEl?.getAttribute("src") || videoEl.src || undefined) : undefined;
    const iframeSrcVal = iframeEl ? (iframeEl.getAttribute("src") || iframeEl.src || undefined) : undefined;

    return {
      selector,
      tagName: tag,
      text: target.textContent?.trim() || "",
      src: target.getAttribute("src") || (target as HTMLImageElement).src || undefined,
      href: target.getAttribute("href") || undefined,
      target: target.getAttribute("target") || undefined,
      alt: target.getAttribute("alt") || undefined,
      poster: videoEl ? (videoEl.getAttribute("poster") || undefined) : undefined,
      controls: videoEl ? videoEl.hasAttribute("controls") : undefined,
      autoplay: videoEl ? videoEl.hasAttribute("autoplay") : undefined,
      loop: videoEl ? videoEl.hasAttribute("loop") : undefined,
      muted: videoEl ? videoEl.hasAttribute("muted") : undefined,
      playsinline: videoEl ? videoEl.hasAttribute("playsinline") : undefined,
      videoSrc: videoSrcVal,
      iframeSrc: iframeSrcVal,
      bgColor: target.style.backgroundColor || computed.backgroundColor || "transparent",
      textColor: target.style.color || computed.color || "#000000",
      fontSize: target.style.fontSize || computed.fontSize || "16px",
      fontFamily: target.style.fontFamily || computed.fontFamily || "Vazirmatn",
      textAlign: target.style.textAlign || computed.textAlign || "right",
      fontWeight: target.style.fontWeight || computed.fontWeight || "400",
      fontStyle: target.style.fontStyle || computed.fontStyle || "normal",
      textDecoration: target.style.textDecoration || computed.textDecoration || "none",
      lineHeight: target.style.lineHeight || computed.lineHeight || "1.5",
      borderRadius: target.style.borderRadius || computed.borderRadius || "0px",
      padding: target.style.padding || computed.padding || "0px",
      margin: target.style.margin || computed.margin || "0px",
      opacity: target.style.opacity || computed.opacity || "1",
      border: target.style.border || computed.border || "none",
      borderWidth: target.style.borderWidth || computed.borderWidth || "0px",
      borderColor: target.style.borderColor || computed.borderColor || "#cbd5e1",
      borderStyle: target.style.borderStyle || computed.borderStyle || "solid",
      boxShadow: target.style.boxShadow || computed.boxShadow || "none",
      classList: Array.from(target.classList).filter((c) => !c.startsWith("rakhsh-")),
    };
  };

  // Apply real-time CSS style to the active element
  const applyStyleToSelectedElement = (styleProp: string, value: string, recordHistory = false) => {
    if (!selectedElement) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const el = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    if (el) {
      (el.style as any)[styleProp] = value;

      setSelectedElement((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [styleProp]: value,
          ...(styleProp === "color" ? { textColor: value } : {}),
          ...(styleProp === "backgroundColor" ? { bgColor: value } : {}),
          ...(styleProp === "fontSize" ? { fontSize: value } : {}),
          ...(styleProp === "fontFamily" ? { fontFamily: value } : {}),
          ...(styleProp === "textAlign" ? { textAlign: value } : {}),
          ...(styleProp === "fontWeight" ? { fontWeight: value } : {}),
          ...(styleProp === "fontStyle" ? { fontStyle: value } : {}),
          ...(styleProp === "textDecoration" ? { textDecoration: value } : {}),
          ...(styleProp === "lineHeight" ? { lineHeight: value } : {}),
          ...(styleProp === "borderRadius" ? { borderRadius: value } : {}),
          ...(styleProp === "padding" ? { padding: value } : {}),
          ...(styleProp === "margin" ? { margin: value } : {}),
          ...(styleProp === "opacity" ? { opacity: value } : {}),
          ...(styleProp === "border" ? { border: value } : {}),
          ...(styleProp === "boxShadow" ? { boxShadow: value } : {}),
        };
      });

      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      setHtmlCode(updatedHtml);
      setHasUnsavedChanges(true);
      if (recordHistory) {
        pushHistory(updatedHtml);
      }
    }
  };

  // Commit style change to history stack on release / blur
  const commitStyleChangeToHistory = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentDocument) {
      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      pushHistory(updatedHtml);
    }
  };

  // Center Element in its Parent Container (e.g. Buttons, Cards, Images, Sections)
  const handleCenterElementBlock = () => {
    if (!selectedElement) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const el = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    if (el) {
      el.style.display = "block";
      el.style.marginLeft = "auto";
      el.style.marginRight = "auto";
      el.style.textAlign = "center";

      setSelectedElement((prev) => (prev ? { ...prev, textAlign: "center", margin: "0 auto" } : null));
      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      setHtmlCode(updatedHtml);
      setHasUnsavedChanges(true);
      pushHistory(updatedHtml);
      toast({
        title: "المان در مرکز صفحه تراز شد",
      });
    }
  };

  // Transform Tag (e.g. p to h2, span to button, etc.)
  const handleTransformTag = (newTag: string) => {
    if (!selectedElement) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const oldEl = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    if (!oldEl) return;

    const newEl = iframe.contentDocument.createElement(newTag);
    for (let i = 0; i < oldEl.attributes.length; i++) {
      const attr = oldEl.attributes[i];
      newEl.setAttribute(attr.name, attr.value);
    }
    while (oldEl.firstChild) {
      newEl.appendChild(oldEl.firstChild);
    }
    oldEl.parentNode?.replaceChild(newEl, oldEl);

    iframe.contentDocument.querySelectorAll(".rakhsh-selected").forEach((e) => e.classList.remove("rakhsh-selected"));
    newEl.classList.add("rakhsh-selected");

    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
    setHtmlCode(updatedHtml);
    setHasUnsavedChanges(true);
    pushHistory(updatedHtml);

    setSelectedElement((prev) => (prev ? { ...prev, tagName: newTag.toLowerCase() } : null));
    toast({
      title: `تگ با موفقیت به <${newTag.toUpperCase()}> تبدیل شد`,
    });
  };

  // Reset custom inline styles for selected element
  const handleResetElementStyles = () => {
    if (!selectedElement) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const el = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    if (el) {
      el.removeAttribute("style");
      const updatedInfo = extractElementInfo(el, selectedElement.selector);
      setSelectedElement(updatedInfo);

      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      setHtmlCode(updatedHtml);
      setHasUnsavedChanges(true);
      pushHistory(updatedHtml);
      toast({
        title: "استایل‌های سفارشی المان بازنشانی شد",
      });
    }
  };

  // Delete Element
  const handleDeleteSelectedElement = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !selectedElement) return;

    const targetEl = iframe.contentDocument.querySelector(selectedElement.selector);
    if (targetEl) {
      targetEl.remove();
      setSelectedElement(null);
      setFloatingToolbarPos((prev) => ({ ...prev, visible: false }));
      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      pushHistory(updatedHtml);
      toast({
        title: "المان با موفقیت حذف شد",
      });
    }
  };

  // Duplicate Element
  const handleDuplicateSelectedElement = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !selectedElement) return;

    const targetEl = iframe.contentDocument.querySelector(selectedElement.selector);
    if (targetEl && targetEl.parentNode) {
      const clone = targetEl.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-builder-selected-id");
      clone.classList.remove("rakhsh-selected", "rakhsh-hovered");
      targetEl.parentNode.insertBefore(clone, targetEl.nextSibling);

      const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
      pushHistory(updatedHtml);
      toast({
        title: "المان تکثیر شد",
      });
    }
  };

  // Dedicated Video Source Updater (Handles both direct <video> and <source> tags)
  const handleUpdateVideoSource = (newUrl: string) => {
    const cleanUrl = newUrl.trim();
    setSelectedElement((prev) => (prev ? { ...prev, videoSrc: cleanUrl, src: cleanUrl } : null));

    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !selectedElement) return;

    const el = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    if (!el) return;

    const tag = el.tagName.toLowerCase();
    const videoEl = tag === "video" ? (el as HTMLVideoElement) : (el.querySelector("video") as HTMLVideoElement | null);
    const iframeEl = tag === "iframe" ? (el as HTMLIFrameElement) : (el.querySelector("iframe") as HTMLIFrameElement | null);

    if (videoEl) {
      videoEl.setAttribute("src", cleanUrl);
      let s = videoEl.querySelector("source");
      if (!s) {
        s = iframe.contentDocument.createElement("source");
        videoEl.appendChild(s);
      }
      s.setAttribute("src", cleanUrl);
      if (cleanUrl.toLowerCase().endsWith(".webm")) {
        s.setAttribute("type", "video/webm");
      } else if (cleanUrl.toLowerCase().endsWith(".ogg")) {
        s.setAttribute("type", "video/ogg");
      } else {
        s.setAttribute("type", "video/mp4");
      }
      try {
        videoEl.load();
      } catch (err) {}
    } else if (iframeEl) {
      iframeEl.setAttribute("src", cleanUrl);
    }

    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
    setHtmlCode(updatedHtml);
    setHasUnsavedChanges(true);
    pushHistory(updatedHtml);
  };

  // Convert current player or video element into Aparat Embed Player safely
  const handleConvertToAparat = (aparatUrlOrHash: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !selectedElement) return;

    let hash = aparatUrlOrHash.trim();
    const vMatch = hash.match(/\/v\/([a-zA-Z0-9_-]+)/);
    if (vMatch) {
      hash = vMatch[1];
    } else if (hash.includes("videohash/")) {
      const vhMatch = hash.match(/videohash\/([a-zA-Z0-9_-]+)/);
      if (vhMatch) hash = vhMatch[1];
    }
    const aparatEmbedUrl = `https://www.aparat.com/video/video/embed/videohash/${hash}/vt/frame`;

    const el = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    if (!el) return;

    const tag = el.tagName.toLowerCase();

    if (tag === "iframe") {
      (el as HTMLIFrameElement).src = aparatEmbedUrl;
      el.setAttribute("src", aparatEmbedUrl);
      if (el.parentElement) {
        el.parentElement.className = "relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black border border-slate-200 mx-auto my-4 max-w-4xl";
      }
    } else {
      const wrapper = iframe.contentDocument.createElement("div");
      wrapper.className = "relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black border border-slate-200 mx-auto my-4 max-w-4xl";
      wrapper.innerHTML = `<iframe src="${aparatEmbedUrl}" allowFullScreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" class="w-full h-full border-0 absolute top-0 left-0"></iframe>`;

      if (tag === "video") {
        el.replaceWith(wrapper);
      } else {
        const videoInEl = el.querySelector("video");
        const iframeInEl = el.querySelector("iframe");
        if (videoInEl) {
          videoInEl.replaceWith(wrapper);
        } else if (iframeInEl) {
          iframeInEl.src = aparatEmbedUrl;
          iframeInEl.setAttribute("src", aparatEmbedUrl);
          if (iframeInEl.parentElement) {
            iframeInEl.parentElement.className = "relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black border border-slate-200 mx-auto my-4 max-w-4xl";
          }
        } else {
          el.innerHTML = "";
          el.appendChild(wrapper);
        }
      }
    }

    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
    setHtmlCode(updatedHtml);
    setHasUnsavedChanges(true);
    pushHistory(updatedHtml);
    toast({
      title: "پلیر با موفقیت به پلیر آپارات تبدیل شد ✨",
      description: "کادر و چیدمان ۱۶:۹ به صورت کاملاً مرتب و استاندارد تنظیم شد.",
    });
  };

  // Convert current player or video element into YouTube Embed Player safely
  const handleConvertToYouTube = (ytUrl: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !selectedElement) return;

    let videoId = "";
    const match1 = ytUrl.match(/v=([a-zA-Z0-9_-]+)/);
    const match2 = ytUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match1) videoId = match1[1];
    else if (match2) videoId = match2[1];
    else videoId = ytUrl.trim();

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;

    const el = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    if (!el) return;

    const tag = el.tagName.toLowerCase();

    if (tag === "iframe") {
      (el as HTMLIFrameElement).src = embedUrl;
      el.setAttribute("src", embedUrl);
      if (el.parentElement) {
        el.parentElement.className = "relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black border border-slate-200 mx-auto my-4 max-w-4xl";
      }
    } else {
      const wrapper = iframe.contentDocument.createElement("div");
      wrapper.className = "relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black border border-slate-200 mx-auto my-4 max-w-4xl";
      wrapper.innerHTML = `<iframe src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="w-full h-full border-0 absolute top-0 left-0"></iframe>`;

      if (tag === "video") {
        el.replaceWith(wrapper);
      } else {
        const videoInEl = el.querySelector("video");
        const iframeInEl = el.querySelector("iframe");
        if (videoInEl) {
          videoInEl.replaceWith(wrapper);
        } else if (iframeInEl) {
          iframeInEl.src = embedUrl;
          iframeInEl.setAttribute("src", embedUrl);
          if (iframeInEl.parentElement) {
            iframeInEl.parentElement.className = "relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black border border-slate-200 mx-auto my-4 max-w-4xl";
          }
        } else {
          el.innerHTML = "";
          el.appendChild(wrapper);
        }
      }
    }

    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
    setHtmlCode(updatedHtml);
    setHasUnsavedChanges(true);
    pushHistory(updatedHtml);
    toast({
      title: "پلیر با موفقیت به پلیر یوتیوب تبدیل شد ✨",
      description: "کادر و چیدمان ۱۶:۹ به صورت کاملاً مرتب و استاندارد تنظیم شد.",
    });
  };

  // Fix layout and aspect ratio of video/iframe container safely
  const handleFixVideoLayout = (aspectRatio: string = "aspect-video", objectFit: string = "object-cover", maxWidth: string = "max-w-4xl") => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !selectedElement) return;

    const el = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    if (!el) return;

    const tag = el.tagName.toLowerCase();

    if (tag === "iframe" || el.querySelector("iframe")) {
      const iframeEl = tag === "iframe" ? (el as HTMLIFrameElement) : el.querySelector("iframe")!;
      let container = iframeEl.parentElement as HTMLElement;
      if (!container || container === iframe.contentDocument.body) {
        const wrapper = iframe.contentDocument.createElement("div");
        iframeEl.replaceWith(wrapper);
        wrapper.appendChild(iframeEl);
        container = wrapper;
      }

      container.className = `relative w-full ${aspectRatio} rounded-2xl overflow-hidden shadow-xl bg-black border border-slate-200 mx-auto my-4 ${maxWidth}`;
      iframeEl.className = "w-full h-full border-0 absolute top-0 left-0";
    } else if (tag === "video" || el.querySelector("video")) {
      const videoEl = tag === "video" ? (el as HTMLVideoElement) : el.querySelector("video")!;
      videoEl.className = `w-full rounded-2xl shadow-xl mx-auto my-2 ${objectFit} ${maxWidth} h-auto`;
    }

    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
    setHtmlCode(updatedHtml);
    setHasUnsavedChanges(true);
    pushHistory(updatedHtml);
    toast({
      title: "چیدمان و ابعاد ویدیو مرتب شد ✨",
      description: "نسبت تصویر و کادر ویدیو کاملاً بهینه‌سازی و استاندارد شد.",
    });
  };

  // Upgrade HTTP to HTTPS for SSL compliance
  const handleUpgradeHttpToHttps = () => {
    if (!selectedElement) return;
    const currentSrc = selectedElement.videoSrc || selectedElement.src || "";
    if (currentSrc.startsWith("http://")) {
      const httpsSrc = currentSrc.replace("http://", "https://");
      handleUpdateVideoSource(httpsSrc);
      toast({
        title: "آدرس ویدیو به https ارتقا یافت",
        description: "پروتکل امن جهت جلوگیری از مسدودی مرورگر فعال شد.",
      });
    }
  };

  // Test Video Playback in live iframe with diagnostics
  const handleTestVideoPlayback = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !selectedElement) return;

    const el = iframe.contentDocument.querySelector(selectedElement.selector) as HTMLElement;
    const videoEl = el?.tagName.toLowerCase() === "video" ? (el as HTMLVideoElement) : (el?.querySelector("video") as HTMLVideoElement | null);

    if (!videoEl) {
      toast({
        title: "المان ویدیو یافت نشد",
        description: "لطفاً ابتدا روی پلیر ویدیوی صفحه کلیک کنید.",
        variant: "destructive",
      });
      return;
    }

    const src = videoEl.getAttribute("src") || videoEl.querySelector("source")?.getAttribute("src") || videoEl.src;
    if (!src) {
      toast({
        title: "آدرس ویدیو خالی است",
        description: "لطفاً ابتدا یک آدرس ویدیویی مستقیم وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    try {
      videoEl.load();
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            toast({
              title: "ویدیو بدون مشکل در حال پخش است ✅",
              description: "فایل ویدیوی شما کاملاً سالم است و پخش آن به درستی انجام می‌شود.",
            });
          })
          .catch((err: any) => {
            let errorMsg = "امکان پخش ویدیو وجود ندارد.";
            if (videoEl.error) {
              switch (videoEl.error.code) {
                case 1:
                  errorMsg = "بارگذاری ویدیو توسط مرورگر لغو شد (ABORTED).";
                  break;
                case 2:
                  errorMsg = "خطای شبکه یا مسدودی آدرس (NETWORK ERROR). لطفا اتصال یا لینک ویدیو را بررسی کنید.";
                  break;
                case 3:
                  errorMsg = "خطای رمزگشایی کدک ویدیو (DECODE ERROR). فرمت ویدیو استاندارد نیست.";
                  break;
                case 4:
                  errorMsg = "فایل در این آدرس یافت نشد (خطای ۴۰۴) یا سرور اجازه پخش مستقیم (CORS) نداده است.";
                  break;
              }
            } else if (err?.name === "NotAllowedError") {
              errorMsg = "پخش خودکار با صدا توسط مرورگر مسدود شده است. دکمه Play روی خود پلیر را بزنید یا حالت Muted را فعال کنید.";
            } else if (err?.message) {
              errorMsg = err.message;
            }
            toast({
              title: "خطا در پخش ویدیو ⚠️",
              description: errorMsg,
              variant: "destructive",
            });
          });
      }
    } catch (err: any) {
      toast({
        title: "خطا در فراخوانی پلیر",
        description: err?.message || "خطای ناشناخته",
        variant: "destructive",
      });
    }
  };

  // Apply Global Primary Color
  const handleApplyGlobalColor = (color: string) => {
    setPrimaryColor(color);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    // Look for buttons, primary badges, links and apply
    iframe.contentDocument.querySelectorAll("button, .btn, .btn-primary, [class*='bg-primary'], [class*='text-primary']").forEach((el) => {
      (el as HTMLElement).style.backgroundColor = color;
    });

    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
    pushHistory(updatedHtml);
  };

  // Apply Global Font to Page in Real-Time
  const handleApplyGlobalFont = (fontName: string) => {
    setSelectedFont(fontName);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const fontObj = PERSIAN_FONTS.find((f) => f.font === fontName) || PERSIAN_FONTS[0];
    const doc = iframe.contentDocument;

    // 1. Inject or update font CDN link in iframe head
    let linkEl = doc.querySelector("#landing-global-font-link") as HTMLLinkElement;
    if (fontObj.cdnUrl) {
      if (!linkEl) {
        linkEl = doc.createElement("link");
        linkEl.id = "landing-global-font-link";
        linkEl.rel = "stylesheet";
        doc.head.appendChild(linkEl);
      }
      linkEl.href = fontObj.cdnUrl;
    } else if (linkEl) {
      linkEl.remove();
    }

    // 2. Inject or update font style tag in iframe head
    let styleEl = doc.querySelector("#landing-global-font-style") as HTMLStyleElement;
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = "landing-global-font-style";
      doc.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      html, body, body *, h1, h2, h3, h4, h5, h6, p, a, button, input, textarea, select, span, div, li, td, th {
        font-family: ${fontObj.cssName} !important;
      }
    `;

    if (doc.body) {
      doc.body.style.fontFamily = fontObj.cssName;
    }

    // 3. Serialize and commit history
    const updatedHtml = cleanAndSerializeIframeHtml(doc);
    setHtmlCode(updatedHtml);
    setHasUnsavedChanges(true);
    pushHistory(updatedHtml);

    toast({
      title: "فونت صفحه با موفقیت تغییر کرد",
      description: `فونت سراسری صفحه به «${fontObj.name}» تغییر یافت.`,
    });
  };

  // Filtered Assets for Media Picker
  const filteredAssets = (builderData?.assets || []).filter((a) =>
    a.name.toLowerCase().includes(mediaSearchQuery.toLowerCase())
  );

  // Viewport widths
  const viewportWidth = {
    desktop: "w-full h-full",
    laptop: "w-[1024px] h-[90%] shadow-2xl rounded-lg border border-border/80 my-auto",
    tablet: "w-[768px] h-[85%] shadow-2xl rounded-2xl border-4 border-slate-700 my-auto",
    mobile: "w-[375px] h-[80%] shadow-2xl rounded-[32px] border-8 border-slate-800 my-auto",
  }[deviceMode];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 text-slate-900 overflow-hidden select-none font-sans" dir="rtl">
      {/* 1. TOP HEADER TOOLBAR */}
      <header className="h-14 bg-white border-b border-slate-200 px-3 flex items-center justify-between z-30 shrink-0 gap-2 shadow-2xs">
        {/* Left: Back & Template Info */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (hasUnsavedChanges) {
                setShowExitConfirmModal(true);
              } else {
                setLocation("/admin/landing");
              }
            }}
            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به پنل</span>
          </Button>

          <Separator orientation="vertical" className="h-5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 max-w-[250px] truncate block">
                {builderData?.template?.name || "قالب لندینگ"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Device Switcher & Mode Selector */}
        <div className="flex items-center gap-3">
          {/* Device Switcher */}
          <div className="bg-slate-100 border border-slate-200 p-0.5 rounded-lg flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeviceMode("desktop")}
                  className={`h-7 w-7 p-0 rounded-md ${deviceMode === "desktop" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>نمای دسکتاپ عریض (100%)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeviceMode("laptop")}
                  className={`h-7 w-7 p-0 rounded-md ${deviceMode === "laptop" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>نمای لپ‌تاپ (1024px)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeviceMode("tablet")}
                  className={`h-7 w-7 p-0 rounded-md ${deviceMode === "tablet" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>نمای تبلت (768px)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeviceMode("mobile")}
                  className={`h-7 w-7 p-0 rounded-md ${deviceMode === "mobile" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>نمای موبایل (375px)</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-5 bg-slate-200" />

          {/* View Modes */}
          <div className="bg-slate-100 border border-slate-200 p-0.5 rounded-lg flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode("visual")}
              className={`h-7 px-2.5 text-xs rounded-md gap-1.5 ${viewMode === "visual" ? "bg-purple-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ویرایشگر زنده</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode("preview")}
              className={`h-7 px-2.5 text-xs rounded-md gap-1.5 ${viewMode === "preview" ? "bg-purple-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>پیش‌نمایش</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode("code")}
              className={`h-7 px-2.5 text-xs rounded-md gap-1.5 ${viewMode === "code" ? "bg-purple-600 text-white font-bold shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>کد HTML</span>
            </Button>
          </div>
        </div>

        {/* Right: History, Preview Tab & Save Button */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 p-0.5 rounded-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="h-7 w-7 p-0 text-slate-700 disabled:opacity-30 hover:text-slate-900 hover:bg-slate-200/60"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>واگرد (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="h-7 w-7 p-0 text-slate-700 disabled:opacity-30 hover:text-slate-900 hover:bg-slate-200/60"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>ازنو (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>

          {/* Backup Restore */}
          {builderData?.hasBackup && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRestoreModalOpen(true)}
                  className="h-8 px-2 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-1 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">بازنشانی</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>بازنشانی قالب به نسخه پشتیبان اولیه</TooltipContent>
            </Tooltip>
          )}

          {/* Open live in tab */}
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-8 px-2.5 text-xs border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs"
          >
            <a
              href={builderData?.template?.isDefault ? "/public-landing?preview_template=default" : `/public-landing?preview_template=${templateId}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">مشاهده زنده</span>
            </a>
          </Button>

          {/* Save Button */}
          <Button
            size="sm"
            onClick={() => {
              const iframe = iframeRef.current;
              let htmlToSave = htmlCode;
              if (iframe && iframe.contentDocument && viewMode !== "code") {
                htmlToSave = cleanAndSerializeIframeHtml(iframe.contentDocument);
              }
              saveMutation.mutate(htmlToSave);
            }}
            disabled={saveMutation.isPending}
            className="h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm"
          >
            {saveMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>ذخیره تغییرات</span>
          </Button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-row-reverse overflow-hidden relative">
        {/* CENTER VIEWPORT (CANVAS / CODE) */}
        <main className="flex-1 bg-slate-200/80 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-sm font-medium">در حال آماده‌سازی محیط ویرایشگر زنده قالب...</p>
            </div>
          ) : isError ? (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center max-w-md">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-red-300 mb-1">خطا در بارگذاری قالب</h3>
              <p className="text-xs text-red-400/80 mb-4">قالب مورد نظر یافت نشد یا ساختار آن آسیب دیده است.</p>
              <Button size="sm" onClick={() => setLocation("/admin/landing")}>
                بازگشت به گالری قالب‌ها
              </Button>
            </div>
          ) : viewMode === "code" ? (
            /* Direct HTML Source Code Editor */
            <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">
              <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span className="font-mono text-slate-200">{builderData?.template?.entryFile || "index.html"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>ویرایشگر مستقیم کدهای منبع</span>
                </div>
              </div>
              <Textarea
                value={htmlCode}
                onChange={(e) => {
                  setHtmlCode(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="flex-1 font-mono text-xs p-4 bg-slate-900/90 text-emerald-400 resize-none border-0 focus-visible:ring-0 leading-relaxed overflow-auto"
                dir="ltr"
                spellCheck={false}
              />
            </div>
          ) : (
            /* Interactive Live Canvas Viewport */
            <div className={`transition-all duration-300 bg-white overflow-hidden relative flex flex-col ${viewportWidth}`}>
              {/* Device Frame Header (for laptop/tablet/mobile) */}
              {deviceMode !== "desktop" && (
                <div className="h-6 bg-slate-800 text-slate-400 text-[10px] px-3 flex items-center justify-between select-none border-b border-slate-700">
                  <span className="font-mono">
                    {deviceMode === "laptop" ? "1024 × 768" : deviceMode === "tablet" ? "768 × 1024" : "375 × 812"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                </div>
              )}

              {/* Interactive Iframe */}
              <iframe
                ref={iframeRef}
                title="Visual Landing Page Preview"
                className="w-full flex-1 border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
              />
            </div>
          )}


        </main>

        {/* RIGHT SIDEBAR INSPECTOR & TOOLS PANEL */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-20 overflow-hidden h-full shadow-xs text-slate-900" dir="rtl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0 h-full overflow-hidden" dir="rtl">
            {/* Sidebar Tab Header */}
            <div className="p-2 border-b border-slate-200 bg-slate-50 shrink-0" dir="rtl">
              <TabsList className="grid grid-cols-4 bg-slate-200/80 h-8 p-0.5 border border-slate-200" dir="rtl">
                <TabsTrigger value="element" className="text-[11px] gap-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-600 font-medium">
                  <Sliders className="w-3 h-3" />
                  <span>عنصر</span>
                </TabsTrigger>
                <TabsTrigger value="layers" className="text-[11px] gap-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-600 font-medium">
                  <Layers className="w-3 h-3" />
                  <span>بخش‌ها</span>
                </TabsTrigger>
                <TabsTrigger value="theme" className="text-[11px] gap-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-600 font-medium">
                  <Palette className="w-3 h-3" />
                  <span>استایل</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="text-[11px] gap-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-600 font-medium">
                  <ImageIcon className="w-3 h-3" />
                  <span>تصاویر</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: LAYERS & PAGE SECTIONS */}
            <TabsContent value="layers" className="flex-1 overflow-y-auto p-3 space-y-3 mt-0 min-h-0 pb-20 text-right" dir="rtl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>ساختار و بخش‌های صفحه</span>
                </span>
                <Badge variant="outline" className="text-[10px] text-purple-700 border-purple-200 bg-purple-50 font-bold">
                  {sections.length} بخش
                </Badge>
              </div>

              {/* Add New Section Button */}
              <Button
                size="sm"
                onClick={() => setAddSectionModalOpen(true)}
                className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن بخش آماده جدید</span>
              </Button>

              <div className="space-y-2 pt-1">
                {sections.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    بخشی برای نمایش یافت نشد
                  </div>
                ) : (
                  sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all flex flex-col gap-2 group shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 text-right flex-1 min-w-0">
                          <span className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center text-[10px] font-mono text-purple-700 shrink-0 border border-purple-200 font-bold">
                            {idx + 1}
                          </span>

                          {editingSectionId === section.id ? (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                value={editingSectionTitle}
                                onChange={(e) => setEditingSectionTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRenameSection(section.id, editingSectionTitle);
                                  if (e.key === "Escape") setEditingSectionId(null);
                                }}
                                className="h-6 text-xs bg-white text-right px-1.5 border-purple-300"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRenameSection(section.id, editingSectionTitle)}
                                className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50 shrink-0"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleScrollToSection(section.selector, true)}
                              className="flex items-center gap-1.5 text-right flex-1 truncate text-xs text-slate-800 hover:text-purple-600 font-medium"
                              title="برای اسکرول و تمرکز روی بخش کلیک کنید"
                            >
                              <span className="truncate">{section.title}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-300 text-slate-500 uppercase font-mono bg-white shrink-0">
                                {section.tagName}
                              </Badge>
                            </button>
                          )}
                        </div>

                        {/* Inline Edit Title Button */}
                        {editingSectionId !== section.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingSectionId(section.id);
                              setEditingSectionTitle(section.title);
                            }}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700 shrink-0"
                            title="ویرایش عنوان بخش"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      {/* Section Controls Toolbar */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <div className="flex items-center gap-1">
                          {/* Move Up */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveSection(idx, "up")}
                            disabled={idx === 0}
                            className="h-6 px-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 gap-1 text-[10px]"
                            title="انتقال به بالا"
                          >
                            <MoveUp className="w-3 h-3" />
                            <span>بالا</span>
                          </Button>

                          {/* Move Down */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveSection(idx, "down")}
                            disabled={idx === sections.length - 1}
                            className="h-6 px-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 gap-1 text-[10px]"
                            title="انتقال به پایین"
                          >
                            <MoveDown className="w-3 h-3" />
                            <span>پایین</span>
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Duplicate Section */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateSection(section.id)}
                            className="h-6 px-1.5 text-purple-600 hover:bg-purple-50 gap-1 text-[10px]"
                            title="تکثیر کامل این بخش"
                          >
                            <Copy className="w-3 h-3" />
                            <span>تکثیر</span>
                          </Button>

                          {/* Toggle Visibility */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleSectionVisibility(section.id)}
                            className={`h-6 px-1.5 gap-1 text-[10px] ${section.isVisible ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60" : "text-amber-600 bg-amber-50"}`}
                            title={section.isVisible ? "پنهان کردن بخش" : "نمایش بخش"}
                          >
                            {section.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{section.isVisible ? "نمایش" : "پنهان"}</span>
                          </Button>

                          {/* Delete Section */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSection(section.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="حذف کامل این بخش از صفحه"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Text Editor Shortcut List */}
              <Separator className="bg-slate-200 my-3" />
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>تیترها و متون سریع</span>
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {textItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleScrollToSection(item.selector, true)}
                      className="p-1.5 rounded bg-slate-50 border border-slate-200 hover:border-emerald-400 cursor-pointer text-right flex items-center justify-between text-[11px] text-slate-800"
                    >
                      <span className="truncate flex-1">{item.preview}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-300 text-slate-500 uppercase font-mono mr-1 bg-white shrink-0">
                        {item.tagName}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: ACTIVE ELEMENT PROPERTIES */}
            <TabsContent value="element" className="flex-1 overflow-y-auto p-3 space-y-4 mt-0 min-h-0 pb-28 text-right" dir="rtl">
              {selectedElement ? (
                <div className="space-y-4 text-xs text-right" dir="rtl">
                  {/* Header & Tag Transformer */}
                  <div className="p-2.5 rounded-lg bg-gradient-to-r from-purple-50 via-slate-50 to-purple-50/50 border border-purple-200 space-y-2 shadow-2xs text-right">
                    <div className="flex items-center justify-between text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-bold text-purple-700 uppercase font-mono text-[13px]">
                          &lt;{selectedElement.tagName}&gt;
                        </span>
                        <Badge variant="outline" className="border-purple-300 bg-purple-100/60 text-[9px] text-purple-800 px-1.5 py-0 h-4 font-bold">
                          المان فعال
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedElement(null);
                          const iframe = iframeRef.current;
                          if (iframe?.contentDocument) {
                            iframe.contentDocument.querySelectorAll(".rakhsh-selected").forEach((el) => el.classList.remove("rakhsh-selected"));
                          }
                        }}
                        className="h-5 px-1.5 text-[10px] text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                      >
                        <X className="w-3 h-3 ml-1" />
                        بستن انتخاب
                      </Button>
                    </div>

                    {/* Quick Tag Changer */}
                    <div className="flex items-center gap-1 pt-1 overflow-x-auto pb-0.5 text-right">
                      <span className="text-[10px] text-slate-500 shrink-0 ml-1">تبدیل تگ:</span>
                      {["h1", "h2", "h3", "p", "span", "button", "a", "div"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTransformTag(tag)}
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono transition-colors shrink-0 ${
                            selectedElement.tagName === tag
                              ? "bg-purple-600 text-white font-bold"
                              : "bg-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-300"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 1. DIRECT TEXT CONTENT EDIT */}
                  {selectedElement.text !== undefined && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-2 ring-1 ring-purple-500/20 text-right" dir="rtl">
                      <Label className="text-slate-800 text-xs font-bold flex items-center gap-1.5 justify-start text-right w-full">
                        <Edit3 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>ویرایش مستقیم متن المان:</span>
                      </Label>
                      <Textarea
                        value={selectedElement.text}
                        onChange={(e) => {
                          const newText = e.target.value;
                          setSelectedElement((prev) => (prev ? { ...prev, text: newText } : null));

                          const iframe = iframeRef.current;
                          if (iframe?.contentDocument) {
                            const el = iframe.contentDocument.querySelector(selectedElement.selector);
                            if (el) {
                              el.textContent = newText;
                              const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
                              setHtmlCode(updatedHtml);
                              setHasUnsavedChanges(true);
                            }
                          }
                        }}
                        className="bg-white border-slate-300 text-slate-900 text-xs min-h-[70px] focus:ring-2 focus:ring-purple-500 text-right font-sans"
                        placeholder="متن المان را وارد کنید..."
                        dir="rtl"
                      />
                    </div>
                  )}

                  {/* 2. TEXT ALIGNMENT & BLOCK PLACEMENT */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-3 text-right" dir="rtl">
                    <div className="flex items-center justify-between text-right">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 text-right">
                        <AlignCenter className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>ترازبندی و چینش المان</span>
                      </span>
                    </div>

                    {/* Text Alignment Buttons */}
                    <div className="space-y-1.5 text-right">
                      <div className="flex items-center justify-between text-[11px] text-slate-600 text-right">
                        <span className="text-right">تراز متن داخل المان:</span>
                        <span className="font-mono text-purple-600 font-bold text-[10px]">{selectedElement.textAlign || "right"}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => applyStyleToSelectedElement("textAlign", "right", true)}
                          className={`py-1.5 rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                            selectedElement.textAlign === "right"
                              ? "bg-purple-600 text-white shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                          }`}
                          title="راست‌چین"
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                          <span>راست</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => applyStyleToSelectedElement("textAlign", "center", true)}
                          className={`py-1.5 rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                            selectedElement.textAlign === "center"
                              ? "bg-purple-600 text-white shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                          }`}
                          title="وسط‌چین"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                          <span>وسط</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => applyStyleToSelectedElement("textAlign", "left", true)}
                          className={`py-1.5 rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                            selectedElement.textAlign === "left"
                              ? "bg-purple-600 text-white shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                          }`}
                          title="چپ‌چین"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                          <span>چپ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => applyStyleToSelectedElement("textAlign", "justify", true)}
                          className={`py-1.5 rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                            selectedElement.textAlign === "justify"
                              ? "bg-purple-600 text-white shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                          }`}
                          title="تراز دوطرفه"
                        >
                          <AlignJustify className="w-3.5 h-3.5" />
                          <span>دوطرفه</span>
                        </button>
                      </div>
                    </div>

                    {/* Block Placement in Container */}
                    <div className="pt-1 border-t border-slate-100 space-y-1.5 text-right">
                      <span className="text-[11px] text-slate-600 block text-right">وسط‌چین کردن کل کادر / المان در صفحه:</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <Button
                          size="sm"
                          type="button"
                          onClick={handleCenterElementBlock}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] h-7 gap-1 font-bold shadow-2xs"
                        >
                          <AlignCenter className="w-3 h-3" />
                          <span>وسط‌چین کل</span>
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => {
                            applyStyleToSelectedElement("display", "block");
                            applyStyleToSelectedElement("marginLeft", "0");
                            applyStyleToSelectedElement("marginRight", "auto", true);
                          }}
                          className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] h-7 gap-1 shadow-2xs"
                        >
                          <AlignRight className="w-3 h-3" />
                          <span>تراز راست کادر</span>
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => {
                            applyStyleToSelectedElement("display", "block");
                            applyStyleToSelectedElement("marginLeft", "auto");
                            applyStyleToSelectedElement("marginRight", "0", true);
                          }}
                          className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] h-7 gap-1 shadow-2xs"
                        >
                          <AlignLeft className="w-3 h-3" />
                          <span>تراز چپ کادر</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 2. FONT SIZE & TYPOGRAPHY */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-sky-600" />
                        <span>سایز قلم و تایپوگرافی</span>
                      </span>
                      <Badge variant="outline" className="font-mono text-[11px] text-sky-700 border-sky-300 bg-sky-50 font-bold">
                        {selectedElement.fontSize || "16px"}
                      </Badge>
                    </div>

                    {/* Font Size Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>اندازه فونت:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="8"
                            max="96"
                            value={parsePxValue(selectedElement.fontSize, 16)}
                            onChange={(e) => {
                              const val = `${e.target.value}px`;
                              applyStyleToSelectedElement("fontSize", val, true);
                            }}
                            className="w-14 h-6 text-center text-xs bg-white border-slate-300 text-sky-700 font-mono p-0 font-bold"
                          />
                          <span className="text-[10px]">px</span>
                        </div>
                      </div>

                      <Slider
                        value={[parsePxValue(selectedElement.fontSize, 16)]}
                        min={10}
                        max={72}
                        step={1}
                        onValueChange={(val) => {
                          applyStyleToSelectedElement("fontSize", `${val[0]}px`);
                        }}
                        onValueCommit={commitStyleChangeToHistory}
                        className="py-1"
                      />

                      {/* Font Size Presets */}
                      <div className="grid grid-cols-6 gap-1 pt-1">
                        {[
                          { label: "ریز", size: "12px" },
                          { label: "نرمال", size: "16px" },
                          { label: "متوسط", size: "20px" },
                          { label: "بزرگ", size: "28px" },
                          { label: "تیتر", size: "36px" },
                          { label: "ویژه", size: "48px" },
                        ].map((preset) => (
                          <button
                            key={preset.size}
                            type="button"
                            onClick={() => applyStyleToSelectedElement("fontSize", preset.size, true)}
                            className={`py-1 px-0.5 rounded text-[10px] text-center border transition-colors ${
                              parsePxValue(selectedElement.fontSize, 16) === parsePxValue(preset.size)
                                ? "bg-sky-500 border-sky-600 text-white font-bold shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Weight & Styles */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] text-slate-600 block">وزن و فرمت فونت:</span>
                      
                      {/* Bold / Italic / Underline / Strike buttons */}
                      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => {
                            const isBold = selectedElement.fontWeight === "bold" || parseInt(selectedElement.fontWeight || "400") >= 700;
                            applyStyleToSelectedElement("fontWeight", isBold ? "normal" : "bold", true);
                          }}
                          className={`py-1.5 rounded flex items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                            selectedElement.fontWeight === "bold" || parseInt(selectedElement.fontWeight || "400") >= 700
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                          }`}
                          title="پررنگ (Bold)"
                        >
                          <Bold className="w-3.5 h-3.5" />
                          <span>پررنگ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const isItalic = selectedElement.fontStyle === "italic";
                            applyStyleToSelectedElement("fontStyle", isItalic ? "normal" : "italic", true);
                          }}
                          className={`py-1.5 rounded flex items-center justify-center gap-1 text-[11px] italic transition-colors ${
                            selectedElement.fontStyle === "italic"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                          }`}
                          title="مایل (Italic)"
                        >
                          <Italic className="w-3.5 h-3.5" />
                          <span>مایل</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const isUnderline = selectedElement.textDecoration?.includes("underline");
                            applyStyleToSelectedElement("textDecoration", isUnderline ? "none" : "underline", true);
                          }}
                          className={`py-1.5 rounded flex items-center justify-center gap-1 text-[11px] underline transition-colors ${
                            selectedElement.textDecoration?.includes("underline")
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                          }`}
                          title="خط زیرین (Underline)"
                        >
                          <Underline className="w-3.5 h-3.5" />
                          <span>زیرخط</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const isStrike = selectedElement.textDecoration?.includes("line-through");
                            applyStyleToSelectedElement("textDecoration", isStrike ? "none" : "line-through", true);
                          }}
                          className={`py-1.5 rounded flex items-center justify-center gap-1 text-[11px] line-through transition-colors ${
                            selectedElement.textDecoration?.includes("line-through")
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                          }`}
                          title="خط‌خورده (Strikethrough)"
                        >
                          <Strikethrough className="w-3.5 h-3.5" />
                          <span>خط‌خورده</span>
                        </button>
                      </div>

                      {/* Weight Selector */}
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { label: "نازک", weight: "300" },
                          { label: "عادی", weight: "400" },
                          { label: "متوسط", weight: "600" },
                          { label: "پررنگ", weight: "700" },
                          { label: "سیاه", weight: "900" },
                        ].map((w) => (
                          <button
                            key={w.weight}
                            type="button"
                            onClick={() => applyStyleToSelectedElement("fontWeight", w.weight, true)}
                            className={`py-1 rounded text-[10px] text-center border transition-colors ${
                              selectedElement.fontWeight === w.weight
                                ? "bg-purple-600 border-purple-600 text-white font-bold shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>

                      {/* Line Height Selector */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-600">فاصله خطوط:</span>
                        <div className="flex gap-1">
                          {[
                            { label: "فشرده", val: "1.2" },
                            { label: "استاندارد", val: "1.6" },
                            { label: "باز", val: "2.0" },
                          ].map((lh) => (
                            <button
                              key={lh.val}
                              type="button"
                              onClick={() => applyStyleToSelectedElement("lineHeight", lh.val, true)}
                              className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                                selectedElement.lineHeight === lh.val
                                  ? "bg-purple-600 border-purple-600 text-white font-bold shadow-xs"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {lh.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Element Font Family Selector */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[11px] text-slate-600 block">نوع فونت این المان:</span>
                        <Select
                          value={PERSIAN_FONTS.find((f) => selectedElement.fontFamily?.toLowerCase().includes(f.font.toLowerCase()))?.font || "default"}
                          onValueChange={(fontVal) => {
                            if (fontVal === "default") {
                              applyStyleToSelectedElement("fontFamily", "", true);
                            } else {
                              const fontObj = PERSIAN_FONTS.find((f) => f.font === fontVal);
                              if (fontObj) {
                                const iframe = iframeRef.current;
                                if (iframe?.contentDocument && fontObj.cdnUrl) {
                                  const doc = iframe.contentDocument;
                                  if (!doc.querySelector(`link[href="${fontObj.cdnUrl}"]`)) {
                                    const link = doc.createElement("link");
                                    link.rel = "stylesheet";
                                    link.href = fontObj.cdnUrl;
                                    doc.head.appendChild(link);
                                  }
                                }
                                applyStyleToSelectedElement("fontFamily", fontObj.cssName, true);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-full h-8 bg-white border-slate-300 text-xs">
                            <SelectValue placeholder="پیش‌فرض (تابع فونت سراسری صفحه)" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-xs">
                            <SelectItem value="default">پیش‌فرض (تابع فونت سراسری صفحه)</SelectItem>
                            {PERSIAN_FONTS.map((f) => (
                              <SelectItem key={f.font} value={f.font}>
                                <span style={{ fontFamily: f.cssName }}>{f.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* 3. TEXT COLOR & PALETTE */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-amber-600" />
                        <span>رنگ متن (Text Color)</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: selectedElement.textColor || "#000000" }}
                        />
                        <span className="font-mono text-[10px] text-slate-700 font-bold">
                          {rgbToHex(selectedElement.textColor)}
                        </span>
                      </div>
                    </div>

                    {/* Color Input & Picker */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shrink-0 cursor-pointer shadow-2xs">
                        <input
                          type="color"
                          value={rgbToHex(selectedElement.textColor)}
                          onChange={(e) => applyStyleToSelectedElement("color", e.target.value)}
                          onBlur={commitStyleChangeToHistory}
                          className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-100"
                        />
                      </div>

                      <Input
                        value={rgbToHex(selectedElement.textColor)}
                        onChange={(e) => applyStyleToSelectedElement("color", e.target.value, true)}
                        className="bg-white border-slate-300 text-slate-900 text-xs font-mono h-8 flex-1"
                        placeholder="#000000"
                        dir="ltr"
                      />
                    </div>

                    {/* Quick Popular Color Circles */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500">رنگ‌های پرکاربرد:</span>
                      <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                        {[
                          { name: "سفید", hex: "#ffffff" },
                          { name: "تیره", hex: "#0f172a" },
                          { name: "خاکستری", hex: "#64748b" },
                          { name: "بنفش", hex: "#7c3aed" },
                          { name: "آبی", hex: "#0ea5e9" },
                          { name: "سبز", hex: "#10b981" },
                          { name: "قرمز", hex: "#ef4444" },
                          { name: "نارنجی", hex: "#f97316" },
                          { name: "طلایی", hex: "#eab308" },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => applyStyleToSelectedElement("color", c.hex, true)}
                            className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform shadow-2xs relative group"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. BACKGROUND COLOR & OPACITY */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Paintbrush className="w-3.5 h-3.5 text-emerald-600" />
                        <span>رنگ پس‌زمینه و ظاهر</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: selectedElement.bgColor || "transparent" }}
                        />
                        <span className="font-mono text-[10px] text-slate-700 font-bold">
                          {selectedElement.bgColor === "transparent" ? "شفاف" : rgbToHex(selectedElement.bgColor)}
                        </span>
                      </div>
                    </div>

                    {/* Bg Color Input & Picker */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shrink-0 cursor-pointer shadow-2xs">
                        <input
                          type="color"
                          value={rgbToHex(selectedElement.bgColor)}
                          onChange={(e) => applyStyleToSelectedElement("backgroundColor", e.target.value)}
                          onBlur={commitStyleChangeToHistory}
                          className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-100"
                        />
                      </div>

                      <Input
                        value={selectedElement.bgColor === "transparent" ? "transparent" : rgbToHex(selectedElement.bgColor)}
                        onChange={(e) => applyStyleToSelectedElement("backgroundColor", e.target.value, true)}
                        className="bg-white border-slate-300 text-slate-900 text-xs font-mono h-8 flex-1"
                        placeholder="#ffffff"
                        dir="ltr"
                      />

                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => applyStyleToSelectedElement("backgroundColor", "transparent", true)}
                        className="h-8 text-[10px] border-slate-300 bg-white text-slate-700 hover:bg-slate-50 px-2 shadow-2xs"
                      >
                        شفاف
                      </Button>
                    </div>

                    {/* Popular BG Colors */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { name: "سفید", hex: "#ffffff" },
                        { name: "روشن", hex: "#f8fafc" },
                        { name: "تیره اصلی", hex: "#090d16" },
                        { name: "سرمه‌ای", hex: "#0f172a" },
                        { name: "بنفش تیره", hex: "#2e1065" },
                        { name: "بنفش روشن", hex: "#7c3aed" },
                        { name: "سبز ملایم", hex: "#064e3b" },
                        { name: "طلایی ملایم", hex: "#78350f" },
                      ].map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => applyStyleToSelectedElement("backgroundColor", c.hex, true)}
                          className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition-transform shadow-2xs"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>

                    {/* Opacity Slider */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>شفافیت المان (Opacity):</span>
                        <span className="font-mono text-emerald-700 font-bold text-[10px]">
                          {Math.round(parseFloat(selectedElement.opacity || "1") * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[Math.round(parseFloat(selectedElement.opacity || "1") * 100)]}
                        min={10}
                        max={100}
                        step={5}
                        onValueChange={(val) => {
                          applyStyleToSelectedElement("opacity", (val[0] / 100).toString());
                        }}
                        onValueCommit={commitStyleChangeToHistory}
                        className="py-1"
                      />
                    </div>
                  </div>

                  {/* 5. BORDER RADIUS & SHADOW */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Square className="w-3.5 h-3.5 text-pink-600" />
                        <span>گوشه‌ها، کادر و سایه</span>
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] text-pink-700 border-pink-300 bg-pink-50 font-bold">
                        {selectedElement.borderRadius || "0px"}
                      </Badge>
                    </div>

                    {/* Border Radius Slider & Presets */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>گردی گوشه‌ها (Border Radius):</span>
                        <span className="font-mono text-[10px] text-slate-700 font-bold">
                          {parsePxValue(selectedElement.borderRadius, 0)}px
                        </span>
                      </div>
                      <Slider
                        value={[parsePxValue(selectedElement.borderRadius, 0)]}
                        min={0}
                        max={48}
                        step={2}
                        onValueChange={(val) => {
                          applyStyleToSelectedElement("borderRadius", `${val[0]}px`);
                        }}
                        onValueCommit={commitStyleChangeToHistory}
                        className="py-1"
                      />

                      {/* Presets */}
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { label: "تیز (0)", rad: "0px" },
                          { label: "کم (6px)", rad: "6px" },
                          { label: "متوسط", rad: "12px" },
                          { label: "گرد (24px)", rad: "24px" },
                          { label: "کپسولی", rad: "9999px" },
                        ].map((b) => (
                          <button
                            key={b.rad}
                            type="button"
                            onClick={() => applyStyleToSelectedElement("borderRadius", b.rad, true)}
                            className="py-1 rounded text-[10px] text-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border Width & Color */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] text-slate-600 block">کادر دور (Border):</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: "بدون کادر", border: "none" },
                          { label: "نازک (1px)", border: "1px solid rgba(0,0,0,0.15)" },
                          { label: "متوسط (2px)", border: "2px solid #7c3aed" },
                          { label: "خط‌چین", border: "2px dashed #7c3aed" },
                        ].map((brd) => (
                          <button
                            key={brd.label}
                            type="button"
                            onClick={() => applyStyleToSelectedElement("border", brd.border, true)}
                            className="py-1 rounded text-[10px] text-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                          >
                            {brd.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Box Shadows */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] text-slate-600 block">سایه المان (Box Shadow):</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: "بدون سایه", shadow: "none" },
                          { label: "سایه نرم", shadow: "0 4px 12px rgba(0,0,0,0.08)" },
                          { label: "سایه عمیق", shadow: "0 12px 30px rgba(0,0,0,0.15)" },
                          { label: "درخشش بنفش", shadow: "0 0 20px rgba(124,58,237,0.3)" },
                        ].map((sh) => (
                          <button
                            key={sh.label}
                            type="button"
                            onClick={() => applyStyleToSelectedElement("boxShadow", sh.shadow, true)}
                            className="py-1 rounded text-[10px] text-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                          >
                            {sh.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 6. PADDING & MARGIN (SPACING) */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Scaling className="w-3.5 h-3.5 text-amber-600" />
                        <span>فاصله‌ها (Padding و Margin)</span>
                      </span>
                    </div>

                    {/* Padding Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>فاصله داخلی (Padding):</span>
                        <span className="font-mono text-amber-700 font-bold text-[10px]">
                          {parsePxValue(selectedElement.padding, 0)}px
                        </span>
                      </div>
                      <Slider
                        value={[parsePxValue(selectedElement.padding, 0)]}
                        min={0}
                        max={64}
                        step={4}
                        onValueChange={(val) => {
                          applyStyleToSelectedElement("padding", `${val[0]}px`);
                        }}
                        onValueCommit={commitStyleChangeToHistory}
                        className="py-1"
                      />
                      <div className="flex gap-1 justify-between">
                        {["0px", "8px", "16px", "24px", "32px", "48px"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => applyStyleToSelectedElement("padding", p, true)}
                            className="flex-1 py-0.5 rounded text-[9px] text-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Margin Slider */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>فاصله بیرونی (Margin):</span>
                        <span className="font-mono text-amber-700 font-bold text-[10px]">
                          {parsePxValue(selectedElement.margin, 0)}px
                        </span>
                      </div>
                      <Slider
                        value={[parsePxValue(selectedElement.margin, 0)]}
                        min={0}
                        max={64}
                        step={4}
                        onValueChange={(val) => {
                          applyStyleToSelectedElement("margin", `${val[0]}px`);
                        }}
                        onValueCommit={commitStyleChangeToHistory}
                        className="py-1"
                      />
                      <div className="flex gap-1 justify-between">
                        {["0px", "8px", "16px", "24px", "32px", "48px"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => applyStyleToSelectedElement("margin", m, true)}
                            className="flex-1 py-0.5 rounded text-[9px] text-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs"
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 8. IMAGE & ASSET CONTROLS */}
                  {selectedElement.src && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-3 text-right" dir="rtl">
                      <Label className="text-slate-800 text-xs font-bold flex items-center gap-1.5 justify-start text-right w-full">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>تنظیمات تصویر (Image):</span>
                      </Label>

                      {/* Current Image Preview */}
                      <div className="h-24 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative group flex items-center justify-center">
                        <img
                          src={selectedElement.src}
                          alt={selectedElement.alt || "preview"}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="space-y-1.5 text-right">
                        <Label className="text-[11px] text-slate-600 block text-right">آدرس تصویر (src):</Label>
                        <div className="flex gap-1.5">
                          <Input
                            value={selectedElement.src}
                            onChange={(e) => {
                              const newSrc = e.target.value;
                              setSelectedElement((prev) => (prev ? { ...prev, src: newSrc } : null));
                              const iframe = iframeRef.current;
                              if (iframe?.contentDocument) {
                                const el = iframe.contentDocument.querySelector(selectedElement.selector);
                                if (el) el.setAttribute("src", newSrc);
                              }
                            }}
                            className="bg-white border-slate-300 text-slate-900 text-xs font-mono"
                            dir="ltr"
                          />
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => {
                              setMediaPickerTarget("image");
                              setMediaPickerOpen(true);
                            }}
                            className="bg-sky-600 hover:bg-sky-500 text-xs px-2.5 shrink-0 text-white shadow-2xs"
                          >
                            تغییر عکس
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-right">
                        <Label className="text-[11px] text-slate-600 block text-right">متن جایگزین (alt):</Label>
                        <Input
                          value={selectedElement.alt || ""}
                          onChange={(e) => {
                            const newAlt = e.target.value;
                            setSelectedElement((prev) => (prev ? { ...prev, alt: newAlt } : null));
                            const iframe = iframeRef.current;
                            if (iframe?.contentDocument) {
                              const el = iframe.contentDocument.querySelector(selectedElement.selector);
                              if (el) el.setAttribute("alt", newAlt);
                            }
                          }}
                          className="bg-white border-slate-300 text-slate-900 text-xs text-right"
                          placeholder="توضیح عکس برای موتورهای جستجو"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  )}

                  {/* VIDEO & MEDIA CONTROLS */}
                  {(selectedElement.tagName === "video" || selectedElement.videoSrc !== undefined || selectedElement.poster !== undefined || (selectedElement.tagName === "iframe" && (selectedElement.iframeSrc?.includes("aparat") || selectedElement.iframeSrc?.includes("youtube")))) && (
                    <div className="p-3 rounded-lg bg-white border border-purple-200 shadow-2xs space-y-3.5 text-right" dir="rtl">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-900 text-xs font-bold flex items-center gap-1.5 justify-start text-right">
                          <Video className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>تنظیمات ویدیو و پلیر فیلم</span>
                        </Label>
                        <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 border-purple-200 font-bold">
                          {selectedElement.tagName === "iframe" ? "Embed Video" : "HTML5 Video"}
                        </Badge>
                      </div>

                      {/* Video Source URL / Embed Source */}
                      <div className="space-y-1.5 text-right">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] text-slate-700 font-medium block text-right">آدرس فایل ویدیو (MP4/WebM یا آپارات):</Label>
                          <span className="text-[10px] text-slate-400 font-mono">Direct / Embed</span>
                        </div>
                        <div className="flex gap-1.5">
                          <Input
                            value={selectedElement.videoSrc || selectedElement.iframeSrc || selectedElement.src || ""}
                            onChange={(e) => {
                              const newSrc = e.target.value;
                              handleUpdateVideoSource(newSrc);
                            }}
                            className="bg-white border-slate-300 text-slate-900 text-xs font-mono"
                            placeholder="https://.../video.mp4 یا لینک آپارات"
                            dir="ltr"
                          />
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => {
                              setMediaPickerTarget("video-src");
                              setMediaPickerOpen(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-500 text-xs px-2.5 shrink-0 text-white shadow-2xs font-bold"
                          >
                            انتخاب / آپلود
                          </Button>
                        </div>
                      </div>

                      {/* Smart Link Detection Alerts */}
                      {(() => {
                        const currentUrl = selectedElement.videoSrc || selectedElement.iframeSrc || selectedElement.src || "";
                        const isAparatLink = currentUrl.includes("aparat.com") && !currentUrl.includes("/embed/");
                        const isYoutubeLink = (currentUrl.includes("youtube.com") || currentUrl.includes("youtu.be")) && !currentUrl.includes("/embed/");
                        const isHttpOnly = currentUrl.startsWith("http://");

                        if (isAparatLink) {
                          return (
                            <div className="p-2.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-900 text-[11px] space-y-2">
                              <div className="flex items-center gap-1.5 font-bold">
                                <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                                <span>لینک صفحه آپارات شناسایی شد!</span>
                              </div>
                              <p className="text-[10px] text-pink-800/90 leading-relaxed">
                                برای پخش ویدیوهای آپارات باید از پلیر امبد استفاده شود. با یک کلیک تبدیل کنید:
                              </p>
                              <Button
                                size="sm"
                                type="button"
                                onClick={() => handleConvertToAparat(currentUrl)}
                                className="w-full h-7 text-xs bg-pink-600 hover:bg-pink-700 text-white font-bold gap-1 shadow-2xs"
                              >
                                <span>⚡ تبدیل خودکار به پلیر آپارات</span>
                              </Button>
                            </div>
                          );
                        }

                        if (isYoutubeLink) {
                          return (
                            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-[11px] space-y-2">
                              <div className="flex items-center gap-1.5 font-bold">
                                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                                <span>لینک یوتیوب شناسایی شد!</span>
                              </div>
                              <p className="text-[10px] text-red-800/90 leading-relaxed">
                                پلیر HTML5 مستقیماً لینک صفحات یوتیوب را پخش نمی‌کند. با یک کلیک به پلیر استاندارد یوتیوب تبدیل کنید:
                              </p>
                              <Button
                                size="sm"
                                type="button"
                                onClick={() => handleConvertToYouTube(currentUrl)}
                                className="w-full h-7 text-xs bg-red-600 hover:bg-red-700 text-white font-bold gap-1 shadow-2xs"
                              >
                                <span>⚡ تبدیل خودکار به پلیر یوتیوب</span>
                              </Button>
                            </div>
                          );
                        }

                        if (isHttpOnly) {
                          return (
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>لینک به صورت غیرامن (http) است.</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={handleUpgradeHttpToHttps}
                                className="h-6 text-[10px] bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
                              >
                                ارتقا به https
                              </Button>
                            </div>
                          );
                        }

                        return null;
                      })()}

                      {/* Video Poster Image (Only for native video) */}
                      {selectedElement.tagName !== "iframe" && (
                        <div className="space-y-1.5 text-right">
                          <Label className="text-[11px] text-slate-700 font-medium block text-right">تصویر کاور / پوستر ویدیو (Poster):</Label>
                          <div className="flex gap-1.5">
                            <Input
                              value={selectedElement.poster || ""}
                              onChange={(e) => {
                                const newPoster = e.target.value;
                                setSelectedElement((prev) => (prev ? { ...prev, poster: newPoster } : null));
                                const iframe = iframeRef.current;
                                if (iframe?.contentDocument) {
                                  const el = iframe.contentDocument.querySelector(selectedElement.selector);
                                  if (el) {
                                    const videoEl = el.tagName.toLowerCase() === "video" ? (el as HTMLVideoElement) : el.querySelector("video");
                                    if (videoEl) videoEl.setAttribute("poster", newPoster);
                                    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
                                    setHtmlCode(updatedHtml);
                                    setHasUnsavedChanges(true);
                                  }
                                }
                              }}
                              className="bg-white border-slate-300 text-slate-900 text-xs font-mono"
                              placeholder="https://.../cover.jpg"
                              dir="ltr"
                            />
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => {
                                setMediaPickerTarget("video-poster");
                                setMediaPickerOpen(true);
                              }}
                              className="bg-sky-600 hover:bg-sky-500 text-xs px-2.5 shrink-0 text-white shadow-2xs"
                            >
                              انتخاب کاور
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Player Options Switches (Only for native HTML5 video) */}
                      {selectedElement.tagName !== "iframe" && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-700 block">قابلیت‌های پخش و تعامل کاربر:</span>

                          {/* Controls switch */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-600">نوار کنترل کامل (Play/Pause, ولوم و تمام‌صفحه):</span>
                            <Switch
                              checked={selectedElement.controls ?? true}
                              onCheckedChange={(checked) => {
                                setSelectedElement((prev) => (prev ? { ...prev, controls: checked } : null));
                                const iframe = iframeRef.current;
                                if (iframe?.contentDocument) {
                                  const el = iframe.contentDocument.querySelector(selectedElement.selector);
                                  const v = el?.tagName.toLowerCase() === "video" ? el : el?.querySelector("video");
                                  if (v) {
                                    if (checked) v.setAttribute("controls", "true");
                                    else v.removeAttribute("controls");
                                    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
                                    setHtmlCode(updatedHtml);
                                    setHasUnsavedChanges(true);
                                  }
                                }
                              }}
                            />
                          </div>

                          {/* Autoplay switch */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-600">پخش خودکار هنگام بارگذاری (Autoplay):</span>
                            <Switch
                              checked={!!selectedElement.autoplay}
                              onCheckedChange={(checked) => {
                                setSelectedElement((prev) => (prev ? { ...prev, autoplay: checked } : null));
                                const iframe = iframeRef.current;
                                if (iframe?.contentDocument) {
                                  const el = iframe.contentDocument.querySelector(selectedElement.selector);
                                  const v = el?.tagName.toLowerCase() === "video" ? el : el?.querySelector("video");
                                  if (v) {
                                    if (checked) {
                                      v.setAttribute("autoplay", "true");
                                      v.setAttribute("muted", "true");
                                    } else {
                                      v.removeAttribute("autoplay");
                                    }
                                    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
                                    setHtmlCode(updatedHtml);
                                    setHasUnsavedChanges(true);
                                  }
                                }
                              }}
                            />
                          </div>

                          {/* Loop switch */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-600">تکرار مداوم ویدیو (Loop):</span>
                            <Switch
                              checked={!!selectedElement.loop}
                              onCheckedChange={(checked) => {
                                setSelectedElement((prev) => (prev ? { ...prev, loop: checked } : null));
                                const iframe = iframeRef.current;
                                if (iframe?.contentDocument) {
                                  const el = iframe.contentDocument.querySelector(selectedElement.selector);
                                  const v = el?.tagName.toLowerCase() === "video" ? el : el?.querySelector("video");
                                  if (v) {
                                    if (checked) v.setAttribute("loop", "true");
                                    else v.removeAttribute("loop");
                                    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
                                    setHtmlCode(updatedHtml);
                                    setHasUnsavedChanges(true);
                                  }
                                }
                              }}
                            />
                          </div>

                          {/* Muted switch */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-600">شروع در حالت بی‌صدا (Muted):</span>
                            <Switch
                              checked={!!selectedElement.muted}
                              onCheckedChange={(checked) => {
                                setSelectedElement((prev) => (prev ? { ...prev, muted: checked } : null));
                                const iframe = iframeRef.current;
                                if (iframe?.contentDocument) {
                                  const el = iframe.contentDocument.querySelector(selectedElement.selector);
                                  const v = el?.tagName.toLowerCase() === "video" ? (el as HTMLVideoElement) : el?.querySelector("video");
                                  if (v) {
                                    if (checked) {
                                      v.setAttribute("muted", "true");
                                      (v as HTMLVideoElement).muted = true;
                                    } else {
                                      v.removeAttribute("muted");
                                      (v as HTMLVideoElement).muted = false;
                                    }
                                    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
                                    setHtmlCode(updatedHtml);
                                    setHasUnsavedChanges(true);
                                  }
                                }
                              }}
                            />
                          </div>

                          {/* Playsinline switch */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-600">پخش درون‌صفحه‌ای موبایل (Playsinline):</span>
                            <Switch
                              checked={selectedElement.playsinline ?? true}
                              onCheckedChange={(checked) => {
                                setSelectedElement((prev) => (prev ? { ...prev, playsinline: checked } : null));
                                const iframe = iframeRef.current;
                                if (iframe?.contentDocument) {
                                  const el = iframe.contentDocument.querySelector(selectedElement.selector);
                                  const v = el?.tagName.toLowerCase() === "video" ? el : el?.querySelector("video");
                                  if (v) {
                                    if (checked) v.setAttribute("playsinline", "true");
                                    else v.removeAttribute("playsinline");
                                    const updatedHtml = cleanAndSerializeIframeHtml(iframe.contentDocument);
                                    setHtmlCode(updatedHtml);
                                    setHasUnsavedChanges(true);
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Quick Playback Test & Diagnostics Button */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <Button
                          size="sm"
                          type="button"
                          onClick={handleTestVideoPlayback}
                          className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>▶️ تست و بررسی آنلاین پخش ویدیو</span>
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const iframe = iframeRef.current;
                              if (iframe?.contentDocument) {
                                const el = iframe.contentDocument.querySelector(selectedElement.selector);
                                const v = el?.tagName.toLowerCase() === "video" ? (el as HTMLVideoElement) : el?.querySelector("video");
                                if (v) v.play();
                              }
                            }}
                            className="flex-1 h-7 text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200 gap-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>پخش سریع</span>
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const iframe = iframeRef.current;
                              if (iframe?.contentDocument) {
                                const el = iframe.contentDocument.querySelector(selectedElement.selector);
                                const v = el?.tagName.toLowerCase() === "video" ? (el as HTMLVideoElement) : el?.querySelector("video");
                                if (v) v.pause();
                              }
                            }}
                            className="flex-1 h-7 text-[11px] text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200"
                          >
                            <span>توقف (Pause)</span>
                          </Button>
                        </div>
                      </div>

                      {/* Layout & Aspect Ratio Repair Section */}
                      <div className="pt-2.5 border-t border-slate-100 space-y-2 text-right" dir="rtl">
                        <Label className="text-[11px] font-bold text-slate-800 block">اصلاح ابعاد و به هم ریختگی صفحه:</Label>
                        
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => handleFixVideoLayout("aspect-video", "object-cover", "max-w-4xl")}
                          className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                          <span>🛠️ اصلاح خودکار چیدمان و همترازی پلیر</span>
                        </Button>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => handleFixVideoLayout("aspect-video", "object-cover", "max-w-4xl")}
                            className="h-7 text-[10px] text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200"
                          >
                            ۱۶:۹ (استاندارد)
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => handleFixVideoLayout("aspect-[4/3]", "object-contain", "max-w-4xl")}
                            className="h-7 text-[10px] text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200"
                          >
                            ۴:۳ (کلاسیک)
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => handleFixVideoLayout("aspect-square", "object-cover", "max-w-2xl")}
                            className="h-7 text-[10px] text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200"
                          >
                            ۱:۱ (مربع)
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => handleFixVideoLayout("h-auto", "object-contain", "w-full")}
                            className="h-7 text-[10px] text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200"
                          >
                            شناور (تمام عرض)
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 9. LINK & DESTINATION CONTROLS */}
                  {selectedElement.href !== undefined && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-3 text-right" dir="rtl">
                      <Label className="text-slate-800 text-xs font-bold flex items-center gap-1.5 justify-start text-right w-full">
                        <Link2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>تنظیمات پیوند (Link):</span>
                      </Label>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-slate-600">مقصد لینک (href):</Label>
                        <Input
                          value={selectedElement.href}
                          onChange={(e) => {
                            const newHref = e.target.value;
                            setSelectedElement((prev) => (prev ? { ...prev, href: newHref } : null));
                            const iframe = iframeRef.current;
                            if (iframe?.contentDocument) {
                              const el = iframe.contentDocument.querySelector(selectedElement.selector);
                              if (el) el.setAttribute("href", newHref);
                            }
                          }}
                          className="bg-white border-slate-300 text-slate-900 text-xs font-mono"
                          dir="ltr"
                          placeholder="#order or https://..."
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-600">باز شدن در برگه جدید (New Tab):</span>
                        <Switch
                          checked={selectedElement.target === "_blank"}
                          onCheckedChange={(checked) => {
                            const targetVal = checked ? "_blank" : "_self";
                            setSelectedElement((prev) => (prev ? { ...prev, target: targetVal } : null));
                            const iframe = iframeRef.current;
                            if (iframe?.contentDocument) {
                              const el = iframe.contentDocument.querySelector(selectedElement.selector);
                              if (el) {
                                if (checked) el.setAttribute("target", "_blank");
                                else el.removeAttribute("target");
                              }
                            }
                          }}
                        />
                      </div>

                      {selectedElement.href && (
                        <div className="pt-2 border-t border-slate-100">
                          <a
                            href={selectedElement.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors text-decoration-none"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>پیش‌نمایش این صفحه / لینک در برگه جدید</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 10. ELEMENT ACTIONS (DUPLICATE, RESET, DELETE) */}
                  <div className="pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={handleDuplicateSelectedElement}
                        className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5 text-purple-600" />
                        <span>تکثیر المان</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={handleResetElementStyles}
                        className="h-8 text-xs border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-amber-800 shadow-2xs gap-1.5 px-3 font-medium"
                        title="بازنشانی تمام استایل‌های درون‌خطی المان"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>بازنشانی استایل</span>
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      onClick={handleDeleteSelectedElement}
                      className="w-full h-8 text-xs gap-1.5 shadow-2xs font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف المان از صفحه</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-purple-600 shadow-2xs">
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">المان مورد نظر را انتخاب کنید</p>
                    <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                      روی هر متن، تیتر، دکمه، تصویر یا کارت در صفحه کلیک کنید تا تنظیمات زنده سایز، رنگ، وسط‌چین و استایل ظاهر شود.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: MEDIA & VIDEO ASSETS */}
            <TabsContent value="media" className="flex-1 overflow-y-auto p-3 space-y-4 mt-0 min-h-0 pb-20 text-right" dir="rtl">
              {/* Active Video Player Tools */}
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>ابزارهای فعال پخش فیلم و ویدیو</span>
                  </span>
                  <Badge variant="outline" className="text-[9px] bg-purple-100/80 text-purple-700 border-purple-300 font-bold">
                    ۲ ابزار آماده
                  </Badge>
                </div>
                <p className="text-[11px] text-purple-900/80 leading-relaxed">
                  می‌توانید هر یک از دو ابزار اختصاصی پخش ویدیو را با یک کلیک به صفحه اضافه کرده و ویدیو یا پوستر آن را شخصی‌سازی کنید:
                </p>

                <div className="space-y-2.5">
                  {/* Tool 1: Clean 16:9 Player */}
                  <div className="p-2.5 rounded-lg bg-white border border-purple-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>۱. پلیر استاندارد و خالص (Pure 16:9)</span>
                      </span>
                      <Badge variant="outline" className="text-[9px] font-mono bg-slate-50 text-slate-600">
                        بدون بک‌گراند
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      پلیر تمیز و مستقل بدون برچسب، پس‌زمینه تیره یا متن‌های اضافی همراه با کنترل کامل و پوستر.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        const showcaseTmpl = PRESET_SECTION_TEMPLATES.find((t) => t.id === "video-showcase");
                        if (showcaseTmpl) {
                          handleAddSectionTemplate(showcaseTmpl.html, showcaseTmpl.title);
                        }
                      }}
                      className="w-full h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>درج پلیر ویدیو در صفحه</span>
                    </Button>
                  </div>

                  {/* Tool 2: Full-Width Clean Video */}
                  <div className="p-2.5 rounded-lg bg-white border border-purple-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>۲. پلیر عریض و تمام‌عرض (Full-Width)</span>
                      </span>
                      <Badge variant="outline" className="text-[9px] font-mono bg-slate-50 text-slate-600">
                        عریض و مدرن
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      پلیر بزرگ و کشیده با حداکثر ابعاد بدون کادر اضافی و آماده پخش انواع فایل‌های ویدیویی.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        const splitTmpl = PRESET_SECTION_TEMPLATES.find((t) => t.id === "video-feature-split");
                        if (splitTmpl) {
                          handleAddSectionTemplate(splitTmpl.html, splitTmpl.title);
                        }
                      }}
                      className="w-full h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>درج پلیر عریض در صفحه</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Images Gallery */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>گالری تصاویر قالب</span>
                  </span>
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAsset}
                    className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white gap-1 px-2 shadow-2xs"
                  >
                    <Upload className="w-3 h-3" />
                    <span>بارگذاری عکس</span>
                  </Button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
                  onChange={handleUploadAssetFile}
                  className="hidden"
                />

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
                  <Input
                    value={mediaSearchQuery}
                    onChange={(e) => setMediaSearchQuery(e.target.value)}
                    placeholder="جستجو در تصاویر..."
                    className="bg-white border-slate-300 text-slate-900 text-xs pr-8 h-8"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
                  {filteredAssets.map((asset, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (selectedElement) {
                          handleApplyImage(asset.url, asset.name);
                        } else {
                          navigator.clipboard.writeText(asset.url);
                          toast({ title: "آدرس تصویر در کلیپ‌بورد کپی شد" });
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-500 cursor-pointer group flex flex-col justify-between shadow-2xs"
                    >
                      <div className="h-20 w-full bg-slate-50 rounded overflow-hidden flex items-center justify-center mb-1.5 relative border border-slate-100">
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = "/landing-previews/default.svg";
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-700 truncate font-mono font-medium" title={asset.name}>
                        {asset.name}
                      </span>
                      <span className="text-[9px] text-sky-600 group-hover:underline mt-0.5 font-bold">
                        {selectedElement ? "اعمال به عنصر انتخابی" : "کپی لینک"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: THEME & GLOBAL STYLES */}
            <TabsContent value="theme" className="flex-1 overflow-y-auto p-3 space-y-4 mt-0 min-h-0 pb-20">
              {/* Font Family Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-emerald-600" />
                    <span>فونت سراسری صفحه (Global Font)</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 border-purple-200 font-mono font-bold">
                    {selectedFont}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  با انتخاب هر فونت، تمام عناصر و تیترهای صفحه به‌صورت واقعیت زنده به آن فونت تغییر خواهند یافت.
                </p>

                <div className="space-y-2 pt-1">
                  {PERSIAN_FONTS.map((f) => {
                    const isSelected = selectedFont === f.font;
                    return (
                      <div
                        key={f.font}
                        onClick={() => handleApplyGlobalFont(f.font)}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer relative group ${
                          isSelected
                            ? "bg-purple-50/90 border-purple-500 ring-2 ring-purple-400/30 shadow-sm"
                            : "bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/80 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${isSelected ? "text-purple-900" : "text-slate-800"}`}>
                              {f.name}
                            </span>
                            {f.badge && (
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 h-4 border-slate-200 ${
                                  isSelected ? "bg-purple-200/60 text-purple-800 border-purple-300 font-bold" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {f.badge}
                              </Badge>
                            )}
                          </div>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-purple-400 shrink-0" />
                          )}
                        </div>

                        {/* Live Preview Text Box */}
                        <div
                          className={`p-2 rounded-lg border text-xs overflow-hidden transition-colors ${
                            isSelected ? "bg-white border-purple-200 text-purple-950 font-medium" : "bg-slate-50 border-slate-100 text-slate-700"
                          }`}
                          style={{ fontFamily: f.cssName }}
                          dir="rtl"
                        >
                          {f.sampleText}
                        </div>

                        <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-1">
                          {f.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* 3. MEDIA PICKER MODAL (When replacing an image or video) */}
      <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900 p-5 font-sans shadow-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
              {mediaPickerTarget === "video-src" ? (
                <>
                  <Video className="w-5 h-5 text-purple-600" />
                  <span>انتخاب یا بارگذاری فایل ویدیو</span>
                </>
              ) : mediaPickerTarget === "video-poster" ? (
                <>
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <span>انتخاب تصویر کاور / پوستر ویدیو</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <span>جایگزینی و ویرایش تصویر</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {mediaPickerTarget === "video-src"
                ? "می‌توانید از نمونه‌های آماده استفاده کنید، آدرس مستقیم ویدیو (MP4/WebM) را وارد کنید یا فایل جدید بارگذاری نمایید."
                : "تصویر جدید را از بین تصاویر قالب انتخاب کنید، یا از کامپیوتر بارگذاری نمایید."}
            </DialogDescription>
          </DialogHeader>

          {mediaPickerTarget === "video-src" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/70 border border-purple-200">
                <div className="space-y-0.5 text-right">
                  <span className="text-xs font-bold text-purple-900 block">بارگذاری مستقیم فایل ویدیو از کامپیوتر:</span>
                  <span className="text-[10px] text-purple-700">فرمت‌های مجاز: MP4, WebM, OGG (حداکثر حجم ۱۰۰ مگابایت)</span>
                </div>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAsset}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold gap-1.5 shadow-2xs shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingAsset ? "در حال ارسال..." : "انتخاب فایل ویدیو"}</span>
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-700 font-bold">یا وارد کردن لینک مستقیم فایل ویدیو (MP4 / WebM):</Label>
                <div className="flex gap-2">
                  <Input
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://domain.com/video.mp4"
                    className="bg-white border-slate-300 text-xs font-mono"
                    dir="ltr"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleApplyImage(customImageUrl)}
                    disabled={!customImageUrl}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs shrink-0 font-bold shadow-xs"
                  >
                    اعمال ویدیو
                  </Button>
                </div>
              </div>

              {/* Sample Videos to quickly pick */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700">ویدیوهای نمونه و آماده برای تست سریع:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      name: "ویدیوی نمایشی طبیعت و معرفی (Big Buck)",
                      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                      dur: "Full HD",
                    },
                    {
                      name: "تیزر موشن گرافیک و محصول (Elephants)",
                      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                      dur: "HD 1080",
                    },
                    {
                      name: "ویدیوی کوتاه تبلیغاتی و انرژی‌بخش (Blazes)",
                      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                      dur: "HD",
                    },
                    {
                      name: "دموی تیزر سریع سازمانی (Escapes)",
                      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                      dur: "HD",
                    },
                  ].map((sample, sIdx) => (
                    <div
                      key={sIdx}
                      onClick={() => handleApplyImage(sample.url)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/50 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium text-slate-800">{sample.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-slate-500 bg-white font-mono">
                        {sample.dur}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="gallery" className="space-y-4">
              <TabsList className="bg-slate-100 border border-slate-200 p-0.5 grid grid-cols-2">
                <TabsTrigger value="gallery" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white font-medium">
                  انتخاب از تصاویر قالب
                </TabsTrigger>
                <TabsTrigger value="url" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white font-medium">
                  آدرس مستقیم تصویر (URL)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="space-y-3 mt-0">
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAsset}
                    className="h-8 text-xs bg-purple-600 hover:bg-purple-500 text-white gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>بارگذاری عکس از کامپیوتر</span>
                  </Button>
                  <span className="text-xs text-slate-500">{filteredAssets.length} تصویر موجود</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {filteredAssets.map((asset, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleApplyImage(asset.url, asset.name)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-purple-500 cursor-pointer group flex flex-col justify-between shadow-2xs"
                    >
                      <div className="h-20 w-full bg-slate-50 rounded overflow-hidden flex items-center justify-center mb-1 border border-slate-100">
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] text-slate-700 truncate text-center font-mono font-medium">
                        {asset.name}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-3 mt-0">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-700">لینک مستقیم تصویر:</Label>
                  <Input
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="bg-white border-slate-300 text-xs font-mono"
                    dir="ltr"
                  />
                </div>
                {customImageUrl && (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-center h-32">
                    <img src={customImageUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() => handleApplyImage(customImageUrl)}
                  disabled={!customImageUrl}
                  className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-xs"
                >
                  اعمال این تصویر
                </Button>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMediaPickerOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. RESTORE BACKUP CONFIRMATION MODAL */}
      <Dialog open={restoreModalOpen} onOpenChange={setRestoreModalOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 p-5 font-sans shadow-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-600">
              <RotateCcw className="w-5 h-5" />
              <span>بازنشانی به نسخه اولیه قالب؟</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              آیا مطمئن هستید؟ تمام ویرایش‌ها و تغییراتی که اعمال کرده‌اید حذف شده و قالب به فایل اصلی پکیج اولیه بازگردانده خواهد شد.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRestoreModalOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              انصراف
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => restoreMutation.mutate()}
              disabled={restoreMutation.isPending}
              className="text-xs font-bold gap-1.5 shadow-xs"
            >
              {restoreMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>بله، بازنشانی شود</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. EXIT CONFIRMATION MODAL */}
      <Dialog open={showExitConfirmModal} onOpenChange={setShowExitConfirmModal}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 p-5 font-sans shadow-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>خروج بدون ذخیره‌سازی؟</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              تغییرات ذخیره‌نشده‌ای در قالب دارید. آیا مطمئن هستید که می‌خواهید بدون ذخیره‌سازی از ویرایشگر خارج شده و به پنل مدیریت بازگردید؟
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowExitConfirmModal(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              انصراف
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setShowExitConfirmModal(false);
                setLocation("/admin/landing");
              }}
              className="text-xs font-bold gap-1.5 shadow-xs"
            >
              <span>بله، خروج و بازگشت</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. ADD NEW SECTION MODAL */}
      <Dialog open={addSectionModalOpen} onOpenChange={setAddSectionModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900 p-5 font-sans shadow-xl max-h-[85vh] flex flex-col" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-purple-700">
              <Plus className="w-5 h-5" />
              <span>افزودن بخش جدید به صفحه</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              از بین بخش‌های آماده زیر، بلوک دلخواه خود را برای افزودن به لندینگ‌پیج انتخاب کنید:
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto py-3 pr-1 flex-1">
            {PRESET_SECTION_TEMPLATES.map((tmpl) => {
              const IconComp = tmpl.icon || Sparkles;
              return (
                <div
                  key={tmpl.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/40 transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
                >
                  <div className="space-y-1.5 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <IconComp className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>{tmpl.title}</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-600 font-bold">
                        {tmpl.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{tmpl.description}</p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddSectionTemplate(tmpl.html, tmpl.title)}
                    className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5 shadow-2xs mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن این بخش به صفحه</span>
                  </Button>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex justify-start">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAddSectionModalOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
