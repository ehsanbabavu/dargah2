import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import puppeteer from "puppeteer";

export interface NotFoundTemplateItem {
  id: string; // e.g. "default", "notfound_zip_17246012345"
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
  autoRedirectSeconds: number; // 0 = disabled
  defaultPreviewImage?: string | null;
  // Legacy / Direct access fields
  entryFile?: string;
  fileSize?: number;
  filesCount?: number;
  filesList?: string[];
  uploadedAt?: string | null;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "data-not-found-config.json");
const TEMPLATES_ROOT_DIR = path.join(process.cwd(), "public", "not-found-templates");
const CUSTOM_NOT_FOUND_DIR = path.join(process.cwd(), "public", "custom-not-found");
const PREVIEWS_DIR = path.join(process.cwd(), "public", "not-found-previews");

function getChromiumExecutablePath(): string | undefined {
  const possiblePaths = [
    "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium-browser",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  try {
    const nixStore = "/nix/store";
    if (fs.existsSync(nixStore)) {
      const entries = fs.readdirSync(nixStore);
      const chromDir = entries.find((e) => e.includes("chromium") && !e.endsWith(".drv"));
      if (chromDir) {
        const binPath = path.join(nixStore, chromDir, "bin", "chromium-browser");
        if (fs.existsSync(binPath)) return binPath;
        const binPath2 = path.join(nixStore, chromDir, "bin", "chromium");
        if (fs.existsSync(binPath2)) return binPath2;
      }
    }
  } catch {}
  return undefined;
}

export class NotFoundService {
  private config: NotFoundConfig;
  private isCapturing: boolean = false;

  constructor() {
    this.ensureDirectoryExists(TEMPLATES_ROOT_DIR);
    this.ensureDirectoryExists(CUSTOM_NOT_FOUND_DIR);
    this.ensureDirectoryExists(PREVIEWS_DIR);
    this.initDefaultPreview();
    this.config = this.loadConfig();
    this.repairExistingTemplates();
  }

  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private initDefaultPreview() {
    const defaultSvgPath = path.join(PREVIEWS_DIR, "default.svg");
    const defaultPngPath = path.join(PREVIEWS_DIR, "default.png");
    if (!fs.existsSync(defaultSvgPath) && !fs.existsSync(defaultPngPath)) {
      try {
        this.generateDefaultSvgPreview(defaultSvgPath);
      } catch (e) {
        console.error("Error creating default 404 preview SVG:", e);
      }
    }
  }

  private generateDefaultSvgPreview(targetPath: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800" direction="rtl">
      <defs>
        <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
        <linearGradient id="btnGrad" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="1280" height="800" fill="#f8fafc" />
      <circle cx="640" cy="400" r="300" fill="#eff6ff" opacity="0.8" />
      <circle cx="350" cy="250" r="180" fill="#f3e8ff" opacity="0.6" />
      
      <!-- 404 Large Display -->
      <g transform="translate(640, 320)" text-anchor="middle">
        <text font-family="system-ui, -apple-system, sans-serif" font-size="140" font-weight="900" fill="url(#neonGrad)" letter-spacing="4">404</text>
        <text y="70" font-family="system-ui, sans-serif" font-size="30" font-weight="800" fill="#0f172a">صفحه مورد نظر پیدا نشد!</text>
        <text y="115" font-family="system-ui, sans-serif" font-size="18" font-weight="500" fill="#64748b">متأسفانه صفحه‌ای که به دنبال آن بودید وجود ندارد یا حذف شده است.</text>
      </g>

      <!-- Return Button -->
      <g transform="translate(640, 500)">
        <rect x="-110" y="0" width="220" height="52" rx="14" fill="url(#btnGrad)" />
        <text x="0" y="32" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">بازگشت به صفحه اصلی</text>
      </g>
    </svg>`;
    fs.writeFileSync(targetPath, svg, "utf-8");
  }

  public getDefaultPreviewImage(): string {
    const pngPath = path.join(PREVIEWS_DIR, "default.png");
    if (fs.existsSync(pngPath)) {
      const stats = fs.statSync(pngPath);
      return `/not-found-previews/default.png?v=${stats.mtimeMs}`;
    }
    const svgPath = path.join(PREVIEWS_DIR, "default.svg");
    if (fs.existsSync(svgPath)) {
      return "/not-found-previews/default.svg";
    }
    return "/not-found-previews/default.svg";
  }

  public scanFolderFiles(dir: string): string[] {
    const allFiles: string[] = [];
    const walk = (currentDir: string, base: string = "") => {
      if (!fs.existsSync(currentDir)) return;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const relativePath = base ? `${base}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(path.join(currentDir, entry.name), relativePath);
        } else {
          allFiles.push(relativePath);
        }
      }
    };
    try {
      walk(dir);
    } catch (e) {
      console.error("Error scanning 404 folder files:", e);
    }
    return allFiles;
  }

  public findTemplatePreviewImage(folderName: string): string | null {
    try {
      const templateDir = path.join(TEMPLATES_ROOT_DIR, folderName);
      if (!fs.existsSync(templateDir)) return null;

      const allFiles = this.scanFolderFiles(templateDir);
      const imageFiles = allFiles.filter((f) => {
        const lower = f.toLowerCase();
        return (
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.endsWith(".webp") ||
          lower.endsWith(".svg") ||
          lower.endsWith(".gif")
        );
      });

      if (imageFiles.length > 0) {
        const prioritized = imageFiles.find((img) => {
          const l = img.toLowerCase();
          return (
            l.includes("preview") ||
            l.includes("template") ||
            l.includes("screen") ||
            l.includes("cover") ||
            l.includes("demo") ||
            l.includes("thumb") ||
            l.includes("404") ||
            l.includes("character")
          );
        });
        const selected = prioritized || imageFiles[0];
        return `/not-found-templates/${folderName}/${selected}`;
      }
    } catch (e) {
      console.error(`Error finding 404 preview image for template ${folderName}:`, e);
    }
    return null;
  }

  private copyDirectory(src: string, dest: string) {
    this.ensureDirectoryExists(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Scans and auto-repairs all existing templates on disk:
   * 1. Unwraps single root subfolders if any
   * 2. Resolves actual HTML entry file
   * 3. Sets accurate preview image
   */
  private repairExistingTemplates() {
    let hasChanges = false;

    this.config.templates = this.config.templates.map((tpl) => {
      if (tpl.isDefault || tpl.id === "default") {
        return {
          ...tpl,
          previewImage: tpl.previewImage || this.getDefaultPreviewImage(),
        };
      }

      const folderName = tpl.folderName || tpl.id;
      const templateDir = path.join(TEMPLATES_ROOT_DIR, folderName);

      if (!fs.existsSync(templateDir)) {
        return tpl;
      }

      // Check if folder contains a single subfolder and unwrap it if so
      try {
        const topEntries = fs.readdirSync(templateDir, { withFileTypes: true });
        const subDirs = topEntries.filter((e) => e.isDirectory());
        const subFiles = topEntries.filter((e) => !e.isDirectory());

        if (subFiles.length === 0 && subDirs.length === 1) {
          const singleSubDir = path.join(templateDir, subDirs[0].name);
          const tempMoveDir = path.join(TEMPLATES_ROOT_DIR, `${folderName}_temp_${Date.now()}`);
          fs.renameSync(singleSubDir, tempMoveDir);
          
          const innerEntries = fs.readdirSync(tempMoveDir);
          for (const item of innerEntries) {
            fs.renameSync(path.join(tempMoveDir, item), path.join(templateDir, item));
          }
          try {
            fs.rmSync(tempMoveDir, { recursive: true, force: true });
          } catch {}
          hasChanges = true;
        }
      } catch (err) {
        console.error(`Error unwrapping 404 template folder ${folderName}:`, err);
      }

      // Find real entry file
      const files = this.scanFolderFiles(templateDir);
      let entryFile = tpl.entryFile || "index.html";

      const fileExists = fs.existsSync(path.join(templateDir, entryFile));
      if (!fileExists) {
        const htmlFiles = files.filter((f) => f.toLowerCase().endsWith(".html") || f.toLowerCase().endsWith(".htm"));
        if (htmlFiles.some((f) => f.toLowerCase() === "404.html" || f.toLowerCase().endsWith("/404.html"))) {
          entryFile = htmlFiles.find((f) => f.toLowerCase() === "404.html" || f.toLowerCase().endsWith("/404.html"))!;
        } else if (htmlFiles.some((f) => f.toLowerCase() === "index.html" || f.toLowerCase().endsWith("/index.html"))) {
          entryFile = htmlFiles.find((f) => f.toLowerCase() === "index.html" || f.toLowerCase().endsWith("/index.html"))!;
        } else if (htmlFiles.length > 0) {
          entryFile = htmlFiles[0];
        }
        hasChanges = true;
      }

      const preview = this.findTemplatePreviewImage(folderName) || tpl.previewImage || this.getDefaultPreviewImage();

      // Sync to custom-not-found folder as well
      const customTarget = path.join(CUSTOM_NOT_FOUND_DIR, folderName);
      if (!fs.existsSync(customTarget)) {
        try {
          this.copyDirectory(templateDir, customTarget);
        } catch {}
      }

      return {
        ...tpl,
        folderName,
        entryFile,
        entryUrl: `/not-found-templates/${folderName}/${entryFile}`,
        previewImage: preview,
        filesCount: files.length,
        filesList: files,
      };
    });

    if (hasChanges) {
      this.saveConfigToFile(this.config);
    }
  }

  public getDefaultTemplates(): NotFoundTemplateItem[] {
    const defaultTemplate1: NotFoundTemplateItem = {
      id: "default",
      name: "پیش‌فرض ۱ سامانه (طراحی مدرن)",
      type: "default",
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
      showSearchBox: true,
      showChatWidget: true,
      customTitle: "صفحه مورد نظر پیدا نشد",
      customMessage: "متأسفانه صفحه‌ای که به دنبال آن بودید یافت نشد یا به آدرس دیگری منتقل شده است.",
    };

    return [defaultTemplate1];
  }

  private loadConfig(): NotFoundConfig {
    const defaultTemplates = this.getDefaultTemplates();

    const initialConfig: NotFoundConfig = {
      activeTemplateId: "default",
      mode: "default",
      templates: defaultTemplates,
      showHomeButton: true,
      homeButtonText: "بازگشت به صفحه اصلی",
      showSearchBox: true,
      showChatWidget: true,
      customTitle: "صفحه مورد نظر پیدا نشد",
      customMessage: "متأسفانه صفحه‌ای که به دنبال آن بودید یافت نشد یا به آدرس دیگری منتقل شده است.",
      autoRedirectSeconds: 0,
      defaultPreviewImage: "/not-found-previews/default.svg",
    };

    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8").trim();
        if (!raw) return initialConfig;
        const parsed = JSON.parse(raw);

        let currentTemplates: NotFoundTemplateItem[] = Array.isArray(parsed.templates) ? parsed.templates : [];

        // Ensure default is present
        const hasDefault1 = currentTemplates.some((t) => t.id === "default");
        if (!hasDefault1) {
          currentTemplates.unshift(defaultTemplates[0]);
        } else {
          currentTemplates = currentTemplates.map((t) =>
            t.id === "default"
              ? {
                  ...defaultTemplates[0],
                  ...t,
                  name: t.name || defaultTemplates[0].name,
                  isDefault: true,
                }
              : t
          );
        }

        // Remove default-2 if present (user deleted it)
        currentTemplates = currentTemplates.filter(
          (t) => t.id !== "notfound_zip_1787773510963" && t.id !== "default-2"
        );

        let activeId = parsed.activeTemplateId || "default";
        if (activeId === "notfound_zip_1787773510963" || activeId === "default-2") {
          activeId = "default";
        }

        const activeTpl = currentTemplates.find((t) => t.id === activeId) || currentTemplates[0];

        return {
          ...initialConfig,
          ...parsed,
          activeTemplateId: activeId,
          mode: activeTpl.id === "default" ? "default" : "custom",
          templates: currentTemplates,
        };
      }
    } catch (e) {
      console.error("Error loading not-found config:", e);
    }
    this.saveConfigToFile(initialConfig);
    return initialConfig;
  }

  private saveConfigToFile(cfg: NotFoundConfig) {
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(cfg, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving not-found config to file:", e);
    }
  }

  public getConfig(): NotFoundConfig {
    return { ...this.config };
  }

  public getActiveTemplate(): NotFoundTemplateItem | undefined {
    return (
      this.config.templates.find((t) => t.id === this.config.activeTemplateId) ||
      this.config.templates.find((t) => t.isDefault) ||
      this.config.templates[0]
    );
  }

  public getTemplate(id: string): NotFoundTemplateItem | undefined {
    return this.config.templates.find((t) => t.id === id);
  }

  public async extractZipTemplate(
    zipFilePath: string,
    originalName: string,
    fileSize: number
  ): Promise<{ message: string; template: NotFoundTemplateItem; config: NotFoundConfig }> {
    const templateId = `notfound_zip_${Date.now()}`;
    const targetDir = path.join(TEMPLATES_ROOT_DIR, templateId);
    this.ensureDirectoryExists(targetDir);

    try {
      const zip = new AdmZip(zipFilePath);
      const zipEntries = zip.getEntries();

      if (zipEntries.length === 0) {
        throw new Error("فایل فشرده خالی است");
      }

      // Check for single common root folder
      let commonRootFolder = "";
      const rootFolders = new Set<string>();
      let hasRootFiles = false;

      for (const entry of zipEntries) {
        const parts = entry.entryName.split("/").filter(Boolean);
        if (parts.length > 0) {
          if (!entry.isDirectory && parts.length === 1) {
            hasRootFiles = true;
          } else if (parts.length > 1) {
            rootFolders.add(parts[0]);
          }
        }
      }

      if (!hasRootFiles && rootFolders.size === 1) {
        commonRootFolder = Array.from(rootFolders)[0];
      }

      let foundIndexHtml = false;

      for (const entry of zipEntries) {
        let targetRelativePath = entry.entryName;

        if (commonRootFolder && targetRelativePath.startsWith(commonRootFolder + "/")) {
          targetRelativePath = targetRelativePath.substring(commonRootFolder.length + 1);
        }

        if (!targetRelativePath || targetRelativePath.includes("..")) {
          continue;
        }

        const targetFullPath = path.join(targetDir, targetRelativePath);

        if (entry.isDirectory) {
          if (!fs.existsSync(targetFullPath)) {
            fs.mkdirSync(targetFullPath, { recursive: true });
          }
        } else {
          const parentDir = path.dirname(targetFullPath);
          if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
          }

          fs.writeFileSync(targetFullPath, entry.getData());

          const lowerName = targetRelativePath.toLowerCase();
          if (
            lowerName === "index.html" ||
            lowerName === "404.html" ||
            lowerName.endsWith("/index.html") ||
            lowerName.endsWith("/404.html")
          ) {
            foundIndexHtml = true;
          }
        }
      }

      const files = this.scanFolderFiles(targetDir);
      let entryFile = "index.html";

      const htmlFiles = files.filter((f) => f.toLowerCase().endsWith(".html") || f.toLowerCase().endsWith(".htm"));
      if (htmlFiles.some((f) => f.toLowerCase() === "404.html" || f.toLowerCase().endsWith("/404.html"))) {
        entryFile = htmlFiles.find((f) => f.toLowerCase() === "404.html" || f.toLowerCase().endsWith("/404.html"))!;
      } else if (htmlFiles.some((f) => f.toLowerCase() === "index.html" || f.toLowerCase().endsWith("/index.html"))) {
        entryFile = htmlFiles.find((f) => f.toLowerCase() === "index.html" || f.toLowerCase().endsWith("/index.html"))!;
      } else if (htmlFiles.length > 0) {
        entryFile = htmlFiles[0];
      } else {
        // Create a fallback 404 html if none existed
        const defaultHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${originalName}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .box { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; }
    h1 { color: #38bdf8; margin-top: 0; font-size: 3rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>۴۰۴</h1>
    <h2>صفحه مورد نظر یافت نشد</h2>
    <p>قالب اختصاصی ${originalName}</p>
  </div>
</body>
</html>`;
        fs.writeFileSync(path.join(targetDir, "index.html"), defaultHtml, "utf-8");
        entryFile = "index.html";
        files.push("index.html");
      }

      // Copy also to custom-not-found for direct serving
      const customTarget = path.join(CUSTOM_NOT_FOUND_DIR, templateId);
      this.ensureDirectoryExists(customTarget);
      this.copyDirectory(targetDir, customTarget);

      const templateName = originalName.replace(/\.zip$/i, "") || "قالب اختصاصی ۴۰۴";
      const localPreview = this.findTemplatePreviewImage(templateId);

      const newTemplate: NotFoundTemplateItem = {
        id: templateId,
        name: templateName,
        type: "zip",
        entryFile,
        folderName: templateId,
        entryUrl: `/not-found-templates/${templateId}/${entryFile}`,
        previewImage: localPreview || this.getDefaultPreviewImage(),
        uploadedAt: new Date().toISOString(),
        fileSize,
        filesCount: files.length,
        filesList: files,
        isDefault: false,
        showHomeButton: true,
        showSearchBox: false,
        showChatWidget: true,
      };

      this.config.templates = [...this.config.templates, newTemplate];
      this.config.activeTemplateId = templateId;
      this.config.mode = "custom";

      this.saveConfigToFile(this.config);

      // Cleanup uploaded temp zip
      try {
        if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
      } catch {}

      return {
        message: "پکیج قالب ۴۰۴ با موفقیت بارگذاری، استخراج و فعال شد",
        template: newTemplate,
        config: this.config,
      };
    } catch (e: any) {
      console.error("Error extracting 404 ZIP template:", e);
      throw new Error(`خطا در استخراج فایل زیپ ۴۰۴: ${e.message}`);
    }
  }

  public saveCustomHtml(
    htmlContent: string,
    title?: string
  ): { message: string; template: NotFoundTemplateItem; config: NotFoundConfig } {
    const templateId = `notfound_html_${Date.now()}`;
    const targetDir = path.join(TEMPLATES_ROOT_DIR, templateId);
    this.ensureDirectoryExists(targetDir);

    const entryFile = "404.html";
    const htmlFilePath = path.join(targetDir, entryFile);
    fs.writeFileSync(htmlFilePath, htmlContent, "utf-8");

    // Copy to custom-not-found folder
    const customTarget = path.join(CUSTOM_NOT_FOUND_DIR, templateId);
    this.ensureDirectoryExists(customTarget);
    fs.writeFileSync(path.join(customTarget, entryFile), htmlContent, "utf-8");

    const templateName = title?.trim() || "قالب کد اختصاصی ۴۰۴";

    const newTemplate: NotFoundTemplateItem = {
      id: templateId,
      name: templateName,
      type: "html",
      entryFile,
      folderName: templateId,
      entryUrl: `/not-found-templates/${templateId}/${entryFile}`,
      previewImage: this.getDefaultPreviewImage(),
      uploadedAt: new Date().toISOString(),
      fileSize: Buffer.byteLength(htmlContent, "utf-8"),
      filesCount: 1,
      filesList: [entryFile],
      customHtml: htmlContent,
      isDefault: false,
      showHomeButton: true,
      showSearchBox: false,
      showChatWidget: true,
    };

    this.config.templates = [...this.config.templates, newTemplate];
    this.config.activeTemplateId = templateId;
    this.config.mode = "custom";

    this.saveConfigToFile(this.config);

    return {
      message: "قالب کد HTML اختصاصی ۴۰۴ با موفقیت ایجاد و فعال شد",
      template: newTemplate,
      config: this.config,
    };
  }

  public activateTemplate(id: string): NotFoundConfig {
    const tpl = this.config.templates.find((t) => t.id === id);
    if (!tpl) {
      throw new Error("قالب مورد نظر یافت نشد");
    }

    this.config.activeTemplateId = id;
    this.config.mode = id === "default" ? "default" : "custom";
    this.saveConfigToFile(this.config);
    return this.config;
  }

  public deleteTemplate(id: string): NotFoundConfig {
    const tpl = this.config.templates.find((t) => t.id === id);
    if (!tpl) {
      throw new Error("قالب مورد نظر یافت نشد");
    }
    if (tpl.isDefault || tpl.id === "default") {
      throw new Error("امکان حذف قالب‌های پیش‌فرض سیستم وجود ندارد");
    }

    // Delete folder from disk
    try {
      const templateDir = path.join(TEMPLATES_ROOT_DIR, tpl.folderName || id);
      if (fs.existsSync(templateDir)) {
        fs.rmSync(templateDir, { recursive: true, force: true });
      }
      const customDir = path.join(CUSTOM_NOT_FOUND_DIR, tpl.folderName || id);
      if (fs.existsSync(customDir)) {
        fs.rmSync(customDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error("Error removing 404 template files from disk:", e);
    }

    this.config.templates = this.config.templates.filter((t) => t.id !== id);

    if (this.config.activeTemplateId === id) {
      const defaultTpl = this.config.templates.find((t) => t.isDefault) || this.config.templates[0];
      this.config.activeTemplateId = defaultTpl ? defaultTpl.id : "default";
      this.config.mode = this.config.activeTemplateId === "default" ? "default" : "custom";
    }

    this.saveConfigToFile(this.config);
    return this.config;
  }

  public updateTemplateSettings(
    id: string,
    settings: {
      title?: string;
      showHomeButton?: boolean;
      showSearchBox?: boolean;
      showChatWidget?: boolean;
      customTitle?: string;
      customMessage?: string;
    }
  ): NotFoundConfig {
    this.config.templates = this.config.templates.map((tpl) => {
      if (tpl.id === id) {
        return {
          ...tpl,
          ...(settings.title && { name: settings.title }),
          ...(settings.showHomeButton !== undefined && { showHomeButton: settings.showHomeButton }),
          ...(settings.showSearchBox !== undefined && { showSearchBox: settings.showSearchBox }),
          ...(settings.showChatWidget !== undefined && { showChatWidget: settings.showChatWidget }),
          ...(settings.customTitle !== undefined && { customTitle: settings.customTitle }),
          ...(settings.customMessage !== undefined && { customMessage: settings.customMessage }),
        };
      }
      return tpl;
    });

    this.saveConfigToFile(this.config);
    return this.config;
  }

  public toggleMode(mode: "default" | "custom"): NotFoundConfig {
    this.config.mode = mode;
    if (mode === "default") {
      this.config.activeTemplateId = "default";
    } else {
      const customTpl = this.config.templates.find((t) => t.id !== "default");
      if (customTpl) {
        this.config.activeTemplateId = customTpl.id;
      }
    }
    this.saveConfigToFile(this.config);
    return this.config;
  }

  public updateSettings(settings: Partial<NotFoundConfig>): NotFoundConfig {
    this.config = {
      ...this.config,
      ...settings,
    };
    this.saveConfigToFile(this.config);
    return this.config;
  }

  public resetToDefault(): NotFoundConfig {
    const defaultTemplates = this.getDefaultTemplates();

    this.config = {
      activeTemplateId: "default",
      mode: "default",
      templates: defaultTemplates,
      showHomeButton: true,
      homeButtonText: "بازگشت به صفحه اصلی",
      showSearchBox: true,
      showChatWidget: true,
      customTitle: "صفحه مورد نظر پیدا نشد",
      customMessage: "متأسفانه صفحه‌ای که به دنبال آن بودید یافت نشد یا به آدرس دیگری منتقل شده است.",
      autoRedirectSeconds: 0,
      defaultPreviewImage: "/not-found-previews/default.svg",
    };

    this.saveConfigToFile(this.config);
    return this.config;
  }
}

export const notFoundService = new NotFoundService();
