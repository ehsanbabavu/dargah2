import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

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
  category?: "store" | "general";
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

const CONFIG_FILE_PATH = path.join(process.cwd(), "data-internal-pages-config.json");
const TEMPLATES_ROOT_DIR = path.join(process.cwd(), "public", "internal-templates");
const PREVIEWS_DIR = path.join(process.cwd(), "public", "landing-previews");

export class InternalPagesService {
  private config: InternalPagesConfig;

  constructor() {
    this.ensureDirectoryExists(TEMPLATES_ROOT_DIR);
    this.ensureDirectoryExists(PREVIEWS_DIR);
    this.initDefaultSvgPreviews();
    this.config = this.loadConfig();
  }

  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private initDefaultSvgPreviews() {
    const postsPreviewSvg = path.join(PREVIEWS_DIR, "posts-template-preview.svg");
    const postsBannerSvg = path.join(PREVIEWS_DIR, "posts-preview-banner.svg");

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
  </defs>
  <rect width="800" height="500" rx="16" fill="url(#bgGrad)" />
  
  <!-- Header Bar -->
  <rect x="40" y="30" width="720" height="50" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
  <circle cx="70" cy="55" r="14" fill="url(#accentGrad)" />
  <rect x="100" y="48" width="160" height="14" rx="4" fill="#94a3b8" />
  <rect x="560" y="44" width="80" height="22" rx="6" fill="#3b82f6" opacity="0.8" />
  <rect x="650" y="44" width="85" height="22" rx="6" fill="#10b981" opacity="0.9" />

  <!-- Breadcrumb & Tag Pills -->
  <rect x="40" y="95" width="240" height="18" rx="4" fill="#475569" />
  <rect x="580" y="95" width="180" height="28" rx="6" fill="url(#accentGrad)" />

  <!-- Main Grid Layout (Posts/Editorial Template) -->
  <!-- Main Featured Article Card -->
  <rect x="40" y="135" width="460" height="325" rx="12" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
  <rect x="60" y="155" width="420" height="150" rx="8" fill="#334155" />
  <path d="M100 240 L180 170 L260 220 L340 160 L420 230" stroke="#6366f1" stroke-width="3" fill="none" opacity="0.7"/>
  <circle cx="180" cy="170" r="5" fill="#a855f7" />
  <circle cx="340" cy="160" r="5" fill="#6366f1" />
  <rect x="60" y="320" width="110" height="18" rx="4" fill="url(#goldGrad)" />
  <rect x="60" y="348" width="350" height="18" rx="4" fill="#f8fafc" />
  <rect x="60" y="375" width="400" height="12" rx="3" fill="#64748b" />
  <rect x="60" y="393" width="280" height="12" rx="3" fill="#64748b" />
  <circle cx="80" cy="428" r="9" fill="#a855f7" />
  <rect x="96" y="424" width="90" height="10" rx="3" fill="#94a3b8" />
  <rect x="390" y="422" width="70" height="16" rx="4" fill="#334155" />

  <!-- Sidebar Articles -->
  <rect x="520" y="135" width="240" height="155" rx="12" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
  <rect x="535" y="150" width="70" height="16" rx="4" fill="#6366f1" opacity="0.85" />
  <rect x="535" y="174" width="180" height="14" rx="3" fill="#f1f5f9" />
  <rect x="535" y="194" width="200" height="10" rx="3" fill="#64748b" />
  <rect x="535" y="210" width="150" height="10" rx="3" fill="#64748b" />
  <rect x="535" y="240" width="90" height="20" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1" />

  <rect x="520" y="305" width="240" height="155" rx="12" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
  <rect x="535" y="320" width="70" height="16" rx="4" fill="#10b981" opacity="0.85" />
  <rect x="535" y="344" width="180" height="14" rx="3" fill="#f1f5f9" />
  <rect x="535" y="364" width="200" height="10" rx="3" fill="#64748b" />
  <rect x="535" y="380" width="150" height="10" rx="3" fill="#64748b" />
  <rect x="535" y="410" width="90" height="20" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1" />

  <!-- Title Badge Overlay -->
  <rect x="40" y="470" width="720" height="24" rx="6" fill="#1e1b4b" opacity="0.9" />
  <text x="400" y="486" fill="#a5f3fc" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">قالب اختصاصی مدیریت و نمایش مقالات (/admin/posts)</text>
</svg>`;

    try {
      if (!fs.existsSync(postsPreviewSvg)) {
        fs.writeFileSync(postsPreviewSvg, svgContent, "utf-8");
      }
      if (!fs.existsSync(postsBannerSvg)) {
        fs.writeFileSync(postsBannerSvg, svgContent, "utf-8");
      }
    } catch (e) {
      console.error("Error writing posts preview SVG:", e);
    }
  }

  private getDefaultTemplates(): InternalPageTemplateItem[] {
    return [
      {
        id: "internal-store-catalog",
        name: "قالب ویترین و فروشگاه محصولات",
        type: "default",
        entryFile: "catalog.html",
        folderName: "internal-store-catalog",
        entryUrl: "/vitrin",
        previewImage: "/landing-previews/default.svg",
        uploadedAt: null,
        fileSize: 1024 * 32,
        filesCount: 4,
        filesList: ["catalog.html", "product.html", "cart.html", "checkout.html"],
        isDefault: true,
        targetPath: "/vitrin",
        category: "store",
        showQuickNav: true,
        showChatWidget: true,
        customTitle: "قالب ویترین محصولات و فروشگاه اینترنتی",
        description: "لایه‌بندی شیک برای گرید محصولات، فیلترها و جزئیات خرید با سبد خرید یکپارچه.",
        features: ["گرید مدرن کارت محصول", "فیلتر پیشرفته بر اساس قیمت و دسته", "سبد خرید یکپارچه"]
      },
      {
        id: "internal-general-page",
        name: "قالب عمومی صفحات محتوایی و تماس",
        type: "default",
        entryFile: "page.html",
        folderName: "internal-general-page",
        entryUrl: "/faqs",
        previewImage: "/landing-previews/default.svg",
        uploadedAt: null,
        fileSize: 1024 * 18,
        filesCount: 2,
        filesList: ["page.html", "faq.html"],
        isDefault: false,
        targetPath: "/faqs",
        category: "general",
        showQuickNav: true,
        showChatWidget: true,
        customTitle: "قالب استاندارد صفحات متنی و سوالات متداول",
        description: "قالب ساده و شیک مناسب برای صفحات درباره ما، تماس، قوانین و شرایط و پرسش‌های متداول.",
        features: ["آکاردئون هوشمند پرسش و پاسخ", "فرمت‌بندی زیبای متون طولانی"]
      },
    ];
  }

  private loadConfig(): InternalPagesConfig {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.templates)) {
          // Filter out any legacy posts templates
          parsed.templates = parsed.templates.filter((t: any) => t.category !== "posts" && !t.id?.includes("posts"));
          if (parsed.templates.length === 0) {
            parsed.templates = this.getDefaultTemplates();
          }
          if (!parsed.activeTemplateId || parsed.activeTemplateId.includes("posts")) {
            parsed.activeTemplateId = parsed.templates[0].id;
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error reading internal pages config, creating default:", err);
    }

    const initialConfig: InternalPagesConfig = {
      activeTemplateId: "internal-store-catalog",
      mode: "default",
      templates: this.getDefaultTemplates(),
      showQuickNav: true,
      showChatWidget: true,
      defaultPreviewImage: "/landing-previews/default.svg",
    };
    this.saveConfig(initialConfig);
    return initialConfig;
  }

  private saveConfig(config: InternalPagesConfig) {
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
      this.config = config;
    } catch (err) {
      console.error("Error saving internal pages config:", err);
    }
  }

  public getConfig(): InternalPagesConfig {
    return this.config;
  }

  public getActiveTemplate(): InternalPageTemplateItem | undefined {
    return (
      this.config.templates.find((t) => t.id === this.config.activeTemplateId) ||
      this.config.templates.find((t) => t.isDefault) ||
      this.config.templates[0]
    );
  }

  public getTemplate(id: string): InternalPageTemplateItem | undefined {
    return this.config.templates.find((t) => t.id === id);
  }

  public activateTemplate(id: string): InternalPagesConfig {
    const template = this.config.templates.find((t) => t.id === id);
    if (!template) {
      throw new Error(`قالب صفحات داخلی با شناسه "${id}" یافت نشد`);
    }

    this.config.activeTemplateId = id;
    this.config.mode = template.isDefault ? "default" : "custom";
    this.saveConfig(this.config);
    return this.config;
  }

  public setAsDefaultTemplate(id: string): InternalPagesConfig {
    const template = this.config.templates.find((t) => t.id === id);
    if (!template) {
      throw new Error(`قالب صفحات داخلی با شناسه "${id}" یافت نشد`);
    }

    this.config.templates = this.config.templates.map((t) => ({
      ...t,
      isDefault: t.id === id,
    }));
    this.config.activeTemplateId = id;
    this.saveConfig(this.config);
    return this.config;
  }

  public saveCustomHtml(htmlContent: string, title?: string, targetPath: string = "/admin/internal-pages"): { config: InternalPagesConfig; template: InternalPageTemplateItem } {
    const templateId = `internal-html-${Date.now()}`;
    const templateName = title?.trim() || "قالب اختصاصی صفحات داخلی";

    const newTemplate: InternalPageTemplateItem = {
      id: templateId,
      name: templateName,
      type: "html",
      entryFile: "index.html",
      folderName: templateId,
      entryUrl: targetPath,
      previewImage: "/landing-previews/pages-template-preview.svg",
      uploadedAt: new Date().toISOString(),
      fileSize: Buffer.byteLength(htmlContent, "utf-8"),
      filesCount: 1,
      filesList: ["index.html"],
      customHtml: htmlContent,
      isDefault: false,
      targetPath,
      category: targetPath.includes("store") ? "store" : "general",
      showQuickNav: true,
      showChatWidget: true,
      customTitle: templateName,
    };

    this.config.templates.push(newTemplate);
    this.config.activeTemplateId = templateId;
    this.config.mode = "custom";
    this.saveConfig(this.config);

    return { config: this.config, template: newTemplate };
  }

  public async extractZipTemplate(zipFilePath: string, originalName: string, fileSize: number, targetPath: string = "/admin/internal-pages"): Promise<{ message: string; template: InternalPageTemplateItem; config: InternalPagesConfig }> {
    const zip = new AdmZip(zipFilePath);
    const templateId = `internal-zip-${Date.now()}`;
    const folderName = templateId;
    const destDir = path.join(TEMPLATES_ROOT_DIR, folderName);

    this.ensureDirectoryExists(destDir);
    zip.extractAllTo(destDir, true);

    const filesList = fs.readdirSync(destDir);
    const hasIndexHtml = filesList.some((f) => f.toLowerCase() === "index.html");
    const entryFile = hasIndexHtml ? (filesList.find((f) => f.toLowerCase() === "index.html") || "index.html") : (filesList[0] || "index.html");

    const templateName = originalName.replace(/\.zip$/i, "") || "قالب آپلود شده صفحات داخلی";

    const newTemplate: InternalPageTemplateItem = {
      id: templateId,
      name: templateName,
      type: "zip",
      entryFile,
      folderName,
      entryUrl: `/internal-templates/${folderName}/${entryFile}`,
      previewImage: "/landing-previews/pages-template-preview.svg",
      uploadedAt: new Date().toISOString(),
      fileSize,
      filesCount: filesList.length,
      filesList,
      isDefault: false,
      targetPath,
      category: targetPath.includes("store") ? "store" : "general",
      showQuickNav: true,
      showChatWidget: true,
      customTitle: templateName,
    };

    this.config.templates.push(newTemplate);
    this.config.activeTemplateId = templateId;
    this.config.mode = "custom";
    this.saveConfig(this.config);

    try {
      if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
    } catch {}

    return {
      message: "قالب صفحات داخلی با موفقیت استخراج و فعال شد",
      template: newTemplate,
      config: this.config,
    };
  }

  public deleteTemplate(id: string): InternalPagesConfig {
    const template = this.config.templates.find((t) => t.id === id);
    if (!template) {
      throw new Error("قالب مورد نظر یافت نشد");
    }
    if (template.isDefault) {
      throw new Error("امکان حذف قالب پیش‌فرض سامانه وجود ندارد");
    }

    if (template.type === "zip") {
      const folderPath = path.join(TEMPLATES_ROOT_DIR, template.folderName);
      try {
        if (fs.existsSync(folderPath)) {
          fs.rmSync(folderPath, { recursive: true, force: true });
        }
      } catch (err) {
        console.error("Error removing template folder:", err);
      }
    }

    this.config.templates = this.config.templates.filter((t) => t.id !== id);

    if (this.config.activeTemplateId === id) {
      const defaultTemplate = this.config.templates.find((t) => t.isDefault) || this.config.templates[0];
      this.config.activeTemplateId = defaultTemplate ? defaultTemplate.id : "internal-posts-editorial";
      this.config.mode = "default";
    }

    this.saveConfig(this.config);
    return this.config;
  }

  public updateTemplateSettings(
    id: string,
    updates: {
      name?: string;
      title?: string;
      showQuickNav?: boolean;
      showChatWidget?: boolean;
      customTitle?: string;
      description?: string;
      targetPath?: string;
    }
  ): InternalPagesConfig {
    const templateIndex = this.config.templates.findIndex((t) => t.id === id);
    if (templateIndex === -1) {
      throw new Error("قالب مورد نظر یافت نشد");
    }

    const t = this.config.templates[templateIndex];
    if (updates.name) t.name = updates.name.trim();
    if (updates.title) t.customTitle = updates.title.trim();
    if (updates.customTitle !== undefined) t.customTitle = updates.customTitle.trim();
    if (updates.description !== undefined) t.description = updates.description.trim();
    if (updates.targetPath !== undefined) t.targetPath = updates.targetPath.trim();
    if (updates.showQuickNav !== undefined) t.showQuickNav = updates.showQuickNav;
    if (updates.showChatWidget !== undefined) t.showChatWidget = updates.showChatWidget;

    this.saveConfig(this.config);
    return this.config;
  }

  public resetToDefault(): InternalPagesConfig {
    const defaultTemplate = this.config.templates.find((t) => t.id === "internal-posts-editorial") || this.config.templates[0];
    this.config.activeTemplateId = defaultTemplate ? defaultTemplate.id : "internal-posts-editorial";
    this.config.mode = "default";
    this.saveConfig(this.config);
    return this.config;
  }
}

export const internalPagesService = new InternalPagesService();
