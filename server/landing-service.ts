import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import puppeteer from "puppeteer";

export interface TemplateItem {
  id: string; // e.g. "default", "tpl_17246012345"
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
  extractedHeaderHtml?: string | null;
  extractedFooterHtml?: string | null;
  isDefault?: boolean;
  showQuickNav?: boolean;
  showChatWidget?: boolean;
}

export interface LandingConfig {
  activeTemplateId: string;
  mode: "default" | "custom";
  templates: TemplateItem[];
  showQuickNav: boolean;
  showChatWidget: boolean;
  activeHeaderHtml?: string | null;
  activeFooterHtml?: string | null;
  templateStylesheets?: string[];
  defaultPreviewImage?: string | null;
  // Legacy compatibility fields
  hasUploadedZip?: boolean;
  customType?: "zip" | "html";
  title?: string;
  entryFile?: string;
  fileSize?: number;
  filesCount?: number;
  filesList?: string[];
  uploadedAt?: string | null;
  previewImage?: string | null;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "data-landing-config.json");
const TEMPLATES_ROOT_DIR = path.join(process.cwd(), "public", "landing-templates");
const CUSTOM_LANDING_DIR = path.join(process.cwd(), "public", "custom-landing");
const PREVIEWS_DIR = path.join(process.cwd(), "public", "landing-previews");

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

export class LandingService {
  private config: LandingConfig;
  private isCapturing: boolean = false;

  constructor() {
    this.ensureDirectoryExists(TEMPLATES_ROOT_DIR);
    this.ensureDirectoryExists(CUSTOM_LANDING_DIR);
    this.ensureDirectoryExists(PREVIEWS_DIR);
    this.config = this.loadConfig();
    this.initDefaultPreview();
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
        console.error("Error creating default landing preview SVG:", e);
      }
    }
    // Background screenshot capture for crisp real preview
    setTimeout(() => {
      this.refreshScreenshots().catch((e) => {
        console.log("Initial screenshot refresh note:", e?.message);
      });
    }, 4000);
  }

  private generateDefaultSvgPreview(targetPath: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800" direction="rtl">
      <defs>
        <linearGradient id="textGrad" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#9333ea" />
          <stop offset="50%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
        <linearGradient id="btnGrad" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#16a34a" />
          <stop offset="100%" stop-color="#059669" />
        </linearGradient>
        <linearGradient id="glowGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#67e8f9" stop-opacity="0.2" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="#000" flood-opacity="0.08" />
        </filter>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="#7c3aed" flood-opacity="0.15" />
        </filter>
      </defs>
      
      <!-- Crisp White Background -->
      <rect width="1280" height="800" fill="#ffffff" />
      
      <!-- Subtle ambient background blur orbs -->
      <circle cx="1100" cy="150" r="180" fill="#f3e8ff" opacity="0.6" filter="blur(40px)" />
      <circle cx="250" cy="400" r="220" fill="#e0f2fe" opacity="0.6" filter="blur(50px)" />
      <circle cx="450" cy="200" r="150" fill="#fdf4ff" opacity="0.7" filter="blur(30px)" />

      <!-- Top Navbar -->
      <rect x="0" y="0" width="1280" height="84" fill="#ffffff" fill-opacity="0.95" />
      <line x1="0" y1="84" x2="1280" y2="84" stroke="#f1f5f9" stroke-width="1.5" />
      
      <g transform="translate(1080, 22)">
        <!-- Logo -->
        <circle cx="22" cy="20" r="20" fill="#8b5cf6" />
        <text x="-15" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#1e293b" text-anchor="end">Rakhsh</text>
      </g>
      
      <!-- Nav Links -->
      <g transform="translate(750, 48)" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="#475569" text-anchor="middle">
        <text x="180">اشتراک‌ها</text>
        <text x="80">آخرین اخبار</text>
        <text x="-20">سوالات متداول</text>
        <text x="-130">ارتباط با ما</text>
      </g>
      
      <!-- Top Action Button -->
      <g transform="translate(80, 22)">
        <rect width="140" height="42" rx="10" fill="url(#btnGrad)" filter="url(#shadow)" />
        <text x="70" y="26" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">ورود و ثبت‌نام</text>
      </g>

      <!-- Main Hero Section -->
      <g transform="translate(1200, 240)" text-anchor="end">
        <text x="0" y="0" font-family="system-ui, sans-serif" font-size="52" font-weight="900" fill="#0f172a">دستیار هوشمند</text>
        <text x="0" y="70" font-family="system-ui, sans-serif" font-size="56" font-weight="900" fill="url(#textGrad)">۲۴ ساعته</text>
        
        <text x="0" y="140" font-family="system-ui, sans-serif" font-size="19" font-weight="500" fill="#64748b">
          با این ربات به راحتی یک کارمند ۲۴ ساعته استخدام کنید و به راحتی
        </text>
        <text x="0" y="175" font-family="system-ui, sans-serif" font-size="19" font-weight="500" fill="#64748b">
          کارهای روزمره و فروش محصولات خود را مدیریت کنید.
        </text>

        <g transform="translate(0, 230)">
          <rect x="-170" y="0" width="170" height="52" rx="12" fill="url(#btnGrad)" filter="url(#shadow)" />
          <text x="-85" y="32" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">شروع رایگان</text>

          <rect x="-330" y="0" width="140" height="52" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
          <text x="-260" y="32" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="#334155" text-anchor="middle">مشاهده دمو</text>
        </g>
      </g>

      <!-- Left Column: Robot Card -->
      <g transform="translate(120, 150)">
        <rect x="40" y="40" width="380" height="420" rx="36" fill="url(#glowGrad1)" filter="blur(25px)" />
        <rect x="60" y="50" width="340" height="390" rx="28" fill="#ffffff" stroke="#f1f5f9" stroke-width="2" filter="url(#cardShadow)" />
        <circle cx="230" cy="210" r="85" fill="#f8fafc" stroke="#e2e8f0" stroke-width="3" />
        <rect x="170" y="165" width="120" height="85" rx="24" fill="#0f172a" />
        <circle cx="195" cy="205" r="10" fill="#38bdf8" />
        <circle cx="265" cy="205" r="10" fill="#38bdf8" />
        <path d="M210,225 Q230,238 250,225" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round" />
        <circle cx="230" cy="140" r="7" fill="#a855f7" />
        <line x1="230" y1="147" x2="230" y2="165" stroke="#a855f7" stroke-width="3" />

        <g transform="translate(320, 130)" filter="url(#shadow)">
          <rect width="130" height="48" rx="14" fill="#ffffff" stroke="#f1f5f9" stroke-width="1" />
          <circle cx="24" cy="24" r="14" fill="#dcfce7" />
          <text x="24" y="29" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#16a34a" text-anchor="middle">✓</text>
          <text x="75" y="29" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#1e293b" text-anchor="middle">پاسخ خودکار</text>
        </g>

        <g transform="translate(10, 310)" filter="url(#shadow)">
          <rect width="120" height="54" rx="16" fill="#ffffff" stroke="#f1f5f9" stroke-width="1" />
          <text x="60" y="26" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">پشتیبانی فعال</text>
          <text x="60" y="44" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#2563eb" text-anchor="middle">۲۴ / ۷ آنلاین</text>
        </g>
      </g>

      <g transform="translate(640, 720)" fill="#e2e8f0">
        <circle cx="-30" cy="0" r="4" />
        <circle cx="0" cy="0" r="5" fill="#8b5cf6" />
        <circle cx="30" cy="0" r="4" />
      </g>
    </svg>`;
    fs.writeFileSync(targetPath, svg, "utf-8");
  }

  private loadConfig(): LandingConfig {
    const defaultTemplate: TemplateItem = {
      id: "default",
      name: "پیش‌فرض سامانه",
      type: "default",
      entryFile: "home",
      folderName: "default",
      entryUrl: "/public-landing?preview_template=default",
      previewImage: this.getDefaultPreviewImage(),
      uploadedAt: null,
      fileSize: 0,
      filesCount: 0,
      filesList: [],
      isDefault: true,
    };

    const initialConfig: LandingConfig = {
      activeTemplateId: "default",
      mode: "default",
      templates: [defaultTemplate],
      showQuickNav: false,
      showChatWidget: true,
      defaultPreviewImage: "/landing-previews/default.png",
    };

    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8").trim();
        if (!raw) return initialConfig;
        const parsed = JSON.parse(raw);

        // Migration logic: if old config format (no templates array)
        if (!Array.isArray(parsed.templates)) {
          const templates: TemplateItem[] = [defaultTemplate];

          if (parsed.hasUploadedZip && parsed.title) {
            const legacyId = "tpl_custom_1";
            const legacyFolder = "tpl_custom_1";
            const legacyPath = path.join(TEMPLATES_ROOT_DIR, legacyFolder);

            // Copy existing custom-landing folder to templates/tpl_custom_1 if needed
            if (fs.existsSync(CUSTOM_LANDING_DIR) && !fs.existsSync(legacyPath)) {
              try {
                this.copyDirectory(CUSTOM_LANDING_DIR, legacyPath);
              } catch (err) {
                console.error("Error migrating legacy custom landing folder:", err);
              }
            }

            const legacyTemplate: TemplateItem = {
              id: legacyId,
              name: parsed.title || "قالب اختصاصی",
              type: parsed.customType || "zip",
              entryFile: parsed.entryFile || "index.html",
              folderName: legacyFolder,
              entryUrl: `/landing-templates/${legacyFolder}/${parsed.entryFile || "index.html"}`,
              previewImage: parsed.previewImage || this.findTemplatePreviewImage(legacyFolder),
              uploadedAt: parsed.uploadedAt || new Date().toISOString(),
              fileSize: parsed.fileSize || 0,
              filesCount: parsed.filesCount || 0,
              filesList: parsed.filesList || [],
              customHtml: parsed.customHtml || "",
              isDefault: false,
            };
            templates.push(legacyTemplate);
          }

          const activeId = parsed.mode === "custom" && templates.length > 1 ? templates[1].id : "default";

          return {
            ...initialConfig,
            ...parsed,
            templates,
            activeTemplateId: activeId,
            mode: activeId === "default" ? "default" : "custom",
          };
        }

        // Ensure default template always exists in templates array
        let templates = parsed.templates as TemplateItem[];
        if (!templates.some((t) => t.id === "default")) {
          templates.unshift(defaultTemplate);
        }

        // Sync preview URLs for all templates
        templates = templates.map((t) => {
          if (t.isDefault || t.id === "default") {
            return {
              ...t,
              previewImage: this.getDefaultPreviewImage(),
            };
          }
          const shot = this.getTemplateScreenshotPath(t.id);
          const localImg = this.findTemplatePreviewImage(t.folderName);
          return {
            ...t,
            previewImage: shot || localImg || t.previewImage || null,
          };
        });

        const activeTemplateId = parsed.activeTemplateId || (parsed.mode === "custom" && templates.length > 1 ? templates[1].id : "default");

        return {
          ...initialConfig,
          ...parsed,
          templates,
          activeTemplateId,
          mode: activeTemplateId === "default" ? "default" : "custom",
        };
      }
    } catch (e) {
      console.error("Error reading landing config:", e);
    }

    return initialConfig;
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.config, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving landing config:", e);
    }
  }

  public getTemplateScreenshotPath(templateId: string): string | null {
    if (templateId === "default") {
      const p = path.join(PREVIEWS_DIR, "default.png");
      if (fs.existsSync(p)) {
        const stats = fs.statSync(p);
        return `/landing-previews/default.png?v=${stats.mtimeMs}`;
      }
      return "/landing-previews/default.png";
    }

    const customShot = path.join(PREVIEWS_DIR, `${templateId}.png`);
    if (fs.existsSync(customShot)) {
      const stats = fs.statSync(customShot);
      return `/landing-previews/${templateId}.png?v=${stats.mtimeMs}`;
    }
    return null;
  }

  public findTemplatePreviewImage(folderName: string): string | null {
    const templateDir = path.join(TEMPLATES_ROOT_DIR, folderName);
    if (!fs.existsSync(templateDir)) {
      return null;
    }

    try {
      const entries = fs.readdirSync(templateDir, { withFileTypes: true });
      const imageFiles: string[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          const lower = entry.name.toLowerCase();
          if (
            lower.endsWith(".jpg") ||
            lower.endsWith(".jpeg") ||
            lower.endsWith(".png") ||
            lower.endsWith(".webp") ||
            lower.endsWith(".svg")
          ) {
            imageFiles.push(entry.name);
          }
        }
      }

      if (imageFiles.length > 0) {
        const prioritized = imageFiles.find((img) => {
          const l = img.toLowerCase();
          return (
            l.includes("preview") ||
            l.includes("template") ||
            l.includes("screen") ||
            l.includes("cover") ||
            l.includes("landy") ||
            l.includes("demo")
          );
        });
        const selected = prioritized || imageFiles[0];
        return `/landing-templates/${folderName}/${selected}`;
      }

      // Search subdirectories
      const allFiles = this.scanFolderFiles(templateDir);
      const subImages = allFiles.filter((f) => {
        const lower = f.toLowerCase();
        return (
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.endsWith(".webp") ||
          lower.endsWith(".svg")
        );
      });

      if (subImages.length > 0) {
        const prioritizedSub = subImages.find((img) => {
          const l = img.toLowerCase();
          return (
            l.includes("preview") ||
            l.includes("template") ||
            l.includes("screen") ||
            l.includes("cover") ||
            l.includes("landy") ||
            l.includes("demo") ||
            l.includes("banner")
          );
        });
        const selectedSub = prioritizedSub || subImages[0];
        return `/landing-templates/${folderName}/${selectedSub}`;
      }
    } catch (e) {
      console.error(`Error finding preview image for template folder ${folderName}:`, e);
    }

    return null;
  }

  public getDefaultPreviewImage(): string {
    const pngPath = path.join(PREVIEWS_DIR, "default.png");
    if (fs.existsSync(pngPath)) {
      const stats = fs.statSync(pngPath);
      return `/landing-previews/default.png?v=${stats.mtimeMs}`;
    }
    const svgPath = path.join(PREVIEWS_DIR, "default.svg");
    if (fs.existsSync(svgPath)) {
      return "/landing-previews/default.svg";
    }
    return "/landing-previews/default.png";
  }

  public async refreshScreenshots(): Promise<{ defaultPreview: string; customPreviews: Record<string, string | null> }> {
    if (this.isCapturing) {
      const customPreviews: Record<string, string | null> = {};
      for (const t of this.config.templates) {
        if (!t.isDefault) {
          customPreviews[t.id] = t.previewImage || null;
        }
      }
      return {
        defaultPreview: this.getDefaultPreviewImage(),
        customPreviews,
      };
    }

    this.isCapturing = true;
    let browser: any = null;

    try {
      const execPath = getChromiumExecutablePath();
      const launchOptions: any = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--window-size=1280,800",
        ],
      };
      if (execPath) {
        launchOptions.executablePath = execPath;
      }

      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

      // 1. Capture Default Template
      try {
        const defaultUrl = "http://localhost:3000/public-landing?preview_template=default";
        await page.goto(defaultUrl, { waitUntil: "networkidle2", timeout: 15000 });
        await new Promise((r) => setTimeout(r, 1200));
        const defaultPng = path.join(PREVIEWS_DIR, "default.png");
        const defaultJpg = path.join(PREVIEWS_DIR, "default.jpg");
        await page.screenshot({ path: defaultPng });
        await page.screenshot({ path: defaultJpg, quality: 85 });
      } catch (err: any) {
        console.log("Note capturing default screenshot:", err?.message);
      }

      // 2. Capture Each Custom Template
      const customPreviews: Record<string, string | null> = {};
      for (const template of this.config.templates) {
        if (template.isDefault || template.id === "default") continue;

        try {
          const targetUrl = `http://localhost:3000/public-landing?preview_template=${template.id}`;
          await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 15000 });
          await new Promise((r) => setTimeout(r, 1200));

          const shotPng = path.join(PREVIEWS_DIR, `${template.id}.png`);
          await page.screenshot({ path: shotPng });

          const stats = fs.statSync(shotPng);
          const previewUrl = `/landing-previews/${template.id}.png?v=${stats.mtimeMs}`;
          template.previewImage = previewUrl;
          customPreviews[template.id] = previewUrl;
        } catch (err: any) {
          console.log(`Note capturing screenshot for template ${template.id}:`, err?.message);
          customPreviews[template.id] = template.previewImage || null;
        }
      }

      this.saveConfig();

      return {
        defaultPreview: this.getDefaultPreviewImage(),
        customPreviews,
      };
    } catch (e: any) {
      console.error("Screenshot capture error:", e?.message);
      const customPreviews: Record<string, string | null> = {};
      for (const t of this.config.templates) {
        if (!t.isDefault) {
          customPreviews[t.id] = t.previewImage || null;
        }
      }
      return {
        defaultPreview: this.getDefaultPreviewImage(),
        customPreviews,
      };
    } finally {
      this.isCapturing = false;
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
    }
  }

  public async capturePageScreenshot(urlPath: string, outputName: string = "custom-page", fullPage: boolean = true): Promise<string | null> {
    let browser: any = null;
    try {
      const execPath = getChromiumExecutablePath();
      const launchOptions: any = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--window-size=1280,900",
        ],
      };
      if (execPath) {
        launchOptions.executablePath = execPath;
      }

      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

      const targetUrl = urlPath.startsWith("http") ? urlPath : `http://localhost:3000${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;
      await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 15000 });
      await new Promise((r) => setTimeout(r, 1500));

      const cleanName = outputName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const outPng = path.join(PREVIEWS_DIR, `${cleanName}.png`);
      await page.screenshot({ path: outPng, fullPage });

      const stats = fs.statSync(outPng);
      return `/landing-previews/${cleanName}.png?v=${stats.mtimeMs}`;
    } catch (e: any) {
      console.error("Page screenshot error:", e?.message);
      return null;
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
    }
  }

  public extractHeaderAndFooterFromHtml(htmlContent: string, folderName?: string): { headerHtml: string | null; footerHtml: string | null } {
    let headerHtml: string | null = null;
    let footerHtml: string | null = null;

    if (!htmlContent || typeof htmlContent !== "string") {
      return { headerHtml: null, footerHtml: null };
    }

    // 1. Extract Header
    // Match <header ...> ... </header>
    const headerMatch = htmlContent.match(/<header[\s\S]*?<\/header>/i);
    if (headerMatch) {
      headerHtml = headerMatch[0];
    } else {
      // Match <nav ...> ... </nav>
      const navMatch = htmlContent.match(/<nav[\s\S]*?<\/nav>/i);
      if (navMatch) {
        headerHtml = navMatch[0];
      } else {
        // Match <div ... class/id containing header/navbar ...> ... </div>
        const divHeaderMatch = htmlContent.match(/<div[^>]*?(?:id|class)=["'][^"']*(?:header|top-bar|navbar)[^"']*["'][\s\S]*?<\/div>/i);
        if (divHeaderMatch) {
          headerHtml = divHeaderMatch[0];
        }
      }
    }

    // 2. Extract Footer
    // Match <footer ...> ... </footer>
    const footerMatch = htmlContent.match(/<footer[\s\S]*?<\/footer>/i);
    if (footerMatch) {
      footerHtml = footerMatch[0];
    } else {
      // Match <div ... class/id containing footer ...> ... </div>
      const divFooterMatch = htmlContent.match(/<div[^>]*?(?:id|class)=["'][^"']*(?:footer|bottom-bar)[^"']*["'][\s\S]*?<\/div>/i);
      if (divFooterMatch) {
        footerHtml = divFooterMatch[0];
      }
    }

    // Adjust relative asset paths if folderName is provided
    if (folderName) {
      const assetPrefix = `/landing-templates/${folderName}/`;
      const fixPaths = (markup: string) => {
        return markup.replace(/(src|href)=["'](?!http:\/\/|https:\/\/|\/\/|\/|data:|#)([^"']+)["']/gi, (_m, attr, url) => {
          return `${attr}="${assetPrefix}${url}"`;
        });
      };

      if (headerHtml) headerHtml = fixPaths(headerHtml);
      if (footerHtml) footerHtml = fixPaths(footerHtml);
    }

    return { headerHtml, footerHtml };
  }

  public getTemplateSectionHtml(section: "header" | "footer", templateId?: string): string | null {
    const target = templateId ? this.getTemplate(templateId) : this.getActiveTemplate();
    if (!target || target.isDefault) {
      return null;
    }

    let fullHtml = "";
    let folderBase = "";

    if (target.type === "zip" && target.folderName) {
      const entryPath = path.join(TEMPLATES_ROOT_DIR, target.folderName, target.entryFile || "index.html");
      if (fs.existsSync(entryPath)) {
        fullHtml = fs.readFileSync(entryPath, "utf8");
      }
      folderBase = `/landing-templates/${target.folderName}/`;
    } else if (target.type === "html" && target.customHtml) {
      fullHtml = target.customHtml;
    }

    if (!fullHtml) {
      return null;
    }

    // Extract head inner content
    let headInner = "";
    const headMatch = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      headInner = headMatch[1];
    }

    // Extract section html
    let sectionHtml = "";
    if (section === "header") {
      const headerMatch = fullHtml.match(/<header[\s\S]*?<\/header>/i);
      if (headerMatch) {
        sectionHtml = headerMatch[0];
      } else {
        const navMatch = fullHtml.match(/<nav[\s\S]*?<\/nav>/i);
        if (navMatch) sectionHtml = navMatch[0];
        else {
          const divHeaderMatch = fullHtml.match(/<div[^>]*?(?:id|class)=["'][^"']*(?:header|top-bar|navbar)[^"']*["'][\s\S]*?<\/div>/i);
          if (divHeaderMatch) sectionHtml = divHeaderMatch[0];
        }
      }

      // If template uses main-menu-container with menu-bg-overlay, activate the template's gradient background
      if (sectionHtml.includes("main-menu-container") && !sectionHtml.includes("menu-bg-overlay")) {
        sectionHtml = sectionHtml.replace(/class=["']([^"']*main-menu-container[^"']*)["']/i, 'class="$1 menu-bg-overlay"');
      }
    } else if (section === "footer") {
      const footerMatch = fullHtml.match(/<footer[\s\S]*?<\/footer>/i);
      if (footerMatch) {
        sectionHtml = footerMatch[0];
      } else {
        const divFooterMatch = fullHtml.match(/<div[^>]*?(?:id|class)=["'][^"']*(?:footer|bottom-bar)[^"']*["'][\s\S]*?<\/div>/i);
        if (divFooterMatch) sectionHtml = divFooterMatch[0];
      }
    }

    if (!sectionHtml) {
      return null;
    }

    // Extract scripts at bottom of body
    const scriptMatches = fullHtml.match(/<script[\s\S]*?<\/script>/gi) || [];
    const scriptsHtml = scriptMatches.join("\n");

    const baseTag = folderBase ? `<base href="${folderBase}">` : "";

    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  ${baseTag}
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${headInner}
  <style>
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      overflow: hidden !important;
    }
    .main-menu-container.navbar-fixed-top {
      position: relative !important;
      top: 0 !important;
    }
  </style>
</head>
<body>
  ${sectionHtml}
  ${scriptsHtml}
  <script>
    (function() {
      // Intercept anchor clicks to navigate to root landing page with hash in parent window
      document.addEventListener('click', function(e) {
        var target = e.target;
        while (target && target.tagName !== 'A') {
          target = target.parentElement;
        }
        if (target && target.tagName === 'A') {
          var href = target.getAttribute('href');
          if (href) {
            e.preventDefault();
            e.stopPropagation();
            if (href.startsWith('#')) {
              // Anchor link like #home, #about, #contact-us, #services
              if (href === '#' || href === '#home' || href === '#top') {
                window.parent.location.href = '/';
                return;
              }
              if (window.parent.location.pathname === '/' || window.parent.location.pathname === '') {
                try {
                  var templateIframe = window.parent.document.querySelector('iframe');
                  if (templateIframe && templateIframe.contentWindow && templateIframe !== window) {
                    var iframeTargetEl = templateIframe.contentWindow.document.querySelector(href);
                    if (iframeTargetEl) {
                      iframeTargetEl.scrollIntoView({ behavior: 'smooth' });
                      window.parent.history.pushState(null, '', href);
                      return;
                    }
                  }
                  var targetEl = window.parent.document.querySelector(href);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                    window.parent.history.pushState(null, '', href);
                    return;
                  }
                } catch(err) {}
                window.parent.location.hash = href;
              } else {
                // When on internal pages like /post/..., navigate to root with anchor
                window.parent.location.href = '/' + href;
              }
            } else if (href.startsWith('http://') || href.startsWith('https://')) {
              window.parent.location.href = href;
            } else if (href === '/' || href === 'index.html' || href === './' || href === '#') {
              window.parent.location.href = '/';
            } else {
              window.parent.location.href = href.startsWith('/') ? href : ('/' + href);
            }
          }
        }
      }, true);

      function sendHeight() {
        try {
          var body = document.body;
          var html = document.documentElement;
          var height = Math.max(
            body.scrollHeight || 0,
            body.offsetHeight || 0,
            html.clientHeight || 0,
            html.scrollHeight || 0,
            html.offsetHeight || 0
          );
          if (height > 0) {
            window.parent.postMessage({
              type: 'TEMPLATE_SECTION_HEIGHT',
              section: '${section}',
              height: height
            }, '*');
          }
        } catch(e) {}
      }
      window.addEventListener('load', sendHeight);
      window.addEventListener('resize', sendHeight);
      if (window.MutationObserver) {
        new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
      }
      setTimeout(sendHeight, 100);
      setTimeout(sendHeight, 300);
      setTimeout(sendHeight, 800);
      setTimeout(sendHeight, 1800);
      setTimeout(sendHeight, 3000);
    })();
  </script>
</body>
</html>`;
  }

  public getConfig(): LandingConfig {
    const active = this.getActiveTemplate();
    const activeHeader = active?.extractedHeaderHtml !== undefined ? active.extractedHeaderHtml : (this.config.activeHeaderHtml || null);
    const activeFooter = active?.extractedFooterHtml !== undefined ? active.extractedFooterHtml : (this.config.activeFooterHtml || null);

    const templateStylesheets: string[] = [];
    if (active && active.type === "zip" && active.folderName && Array.isArray(active.filesList)) {
      const cssFiles = active.filesList.filter((f) => f.toLowerCase().endsWith(".css"));
      cssFiles.forEach((f) => {
        templateStylesheets.push(`/landing-templates/${active.folderName}/${f}`);
      });
    }

    const isCustomValid = active && !active.isDefault && this.isTemplateValidOnDisk(active);

    return {
      ...this.config,
      mode: (this.config.mode === "custom" && isCustomValid) ? "custom" : "default",
      activeHeaderHtml: isCustomValid ? activeHeader : null,
      activeFooterHtml: isCustomValid ? activeFooter : null,
      templateStylesheets: isCustomValid ? templateStylesheets : [],
      hasUploadedZip: this.config.templates.some((t) => !t.isDefault),
      customType: active?.type === "html" ? "html" : "zip",
      title: active?.name || "قالب اختصاصی",
      entryFile: active?.entryFile || "index.html",
      fileSize: active?.fileSize || 0,
      filesCount: active?.filesCount || 0,
      filesList: active?.filesList || [],
      uploadedAt: active?.uploadedAt || null,
      previewImage: active?.previewImage || null,
      defaultPreviewImage: this.getDefaultPreviewImage(),
    };
  }

  public isTemplateValidOnDisk(template: TemplateItem): boolean {
    if (!template || template.isDefault || template.id === "default") return true;
    if (template.folderName) {
      const entryPath = path.join(TEMPLATES_ROOT_DIR, template.folderName, template.entryFile || "index.html");
      if (fs.existsSync(entryPath)) return true;
    }
    const customPath = path.join(CUSTOM_LANDING_DIR, template.entryFile || "index.html");
    if (fs.existsSync(customPath)) return true;
    return false;
  }

  public getActiveTemplate(): TemplateItem {
    const found = this.config.templates.find((t) => t.id === this.config.activeTemplateId);
    if (found && this.isTemplateValidOnDisk(found)) return found;
    const def = this.config.templates.find((t) => t.isDefault || t.id === "default");
    if (def) return def;
    return this.config.templates[0];
  }

  public getTemplate(id: string): TemplateItem | undefined {
    return this.config.templates.find((t) => t.id === id);
  }

  public updateSettings(partial: Partial<LandingConfig>): LandingConfig {
    this.config = {
      ...this.config,
      ...partial,
    };
    this.saveConfig();
    return this.getConfig();
  }

  public activateTemplate(templateId: string): LandingConfig {
    const exists = this.config.templates.some((t) => t.id === templateId);
    if (!exists) {
      throw new Error("قالب مورد نظر یافت نشد");
    }

    this.config.activeTemplateId = templateId;
    this.config.mode = templateId === "default" ? "default" : "custom";

    // Sync files to public/custom-landing for backward compatibility
    const active = this.getActiveTemplate();
    if (active.isDefault || active.id === "default") {
      this.config.activeHeaderHtml = null;
      this.config.activeFooterHtml = null;
    } else {
      if (active.extractedHeaderHtml !== undefined) {
        this.config.activeHeaderHtml = active.extractedHeaderHtml;
        this.config.activeFooterHtml = active.extractedFooterHtml;
      } else if (active.folderName) {
        try {
          const entryPath = path.join(TEMPLATES_ROOT_DIR, active.folderName, active.entryFile || "index.html");
          if (fs.existsSync(entryPath)) {
            const rawHtml = fs.readFileSync(entryPath, "utf-8");
            const extracted = this.extractHeaderAndFooterFromHtml(rawHtml, active.folderName);
            active.extractedHeaderHtml = extracted.headerHtml;
            active.extractedFooterHtml = extracted.footerHtml;
            this.config.activeHeaderHtml = extracted.headerHtml;
            this.config.activeFooterHtml = extracted.footerHtml;
          }
        } catch (e) {
          console.error("Error extracting header/footer on activation:", e);
        }
      }
    }

    if (!active.isDefault && active.folderName) {
      const srcDir = path.join(TEMPLATES_ROOT_DIR, active.folderName);
      if (fs.existsSync(srcDir)) {
        this.cleanLandingDirectory(CUSTOM_LANDING_DIR);
        this.copyDirectory(srcDir, CUSTOM_LANDING_DIR);
      }
    }

    this.saveConfig();
    return this.getConfig();
  }

  public toggleMode(mode?: "default" | "custom"): LandingConfig {
    if (mode === "default") {
      this.config.activeTemplateId = "default";
      this.config.mode = "default";
    } else if (mode === "custom") {
      const firstCustom = this.config.templates.find((t) => !t.isDefault);
      if (firstCustom) {
        this.config.activeTemplateId = firstCustom.id;
        this.config.mode = "custom";
      } else {
        this.config.activeTemplateId = "default";
        this.config.mode = "default";
      }
    } else {
      if (this.config.mode === "default") {
        const firstCustom = this.config.templates.find((t) => !t.isDefault);
        if (firstCustom) {
          this.config.activeTemplateId = firstCustom.id;
          this.config.mode = "custom";
        }
      } else {
        this.config.activeTemplateId = "default";
        this.config.mode = "default";
      }
    }
    this.saveConfig();
    return this.getConfig();
  }

  public deleteTemplate(templateId: string): LandingConfig {
    if (templateId === "default") {
      throw new Error("امکان حذف قالب پیش‌فرض سیستم وجود ندارد");
    }

    const templateIndex = this.config.templates.findIndex((t) => t.id === templateId);
    if (templateIndex === -1) {
      throw new Error("قالب مورد نظر یافت نشد");
    }

    const template = this.config.templates[templateIndex];

    // 1. Delete template folder
    const templateDir = path.join(TEMPLATES_ROOT_DIR, template.folderName);
    if (fs.existsSync(templateDir)) {
      try {
        fs.rmSync(templateDir, { recursive: true, force: true });
      } catch (e) {
        console.error(`Error deleting template folder ${templateDir}:`, e);
      }
    }

    // 2. Delete screenshot if exists
    const shotPath = path.join(PREVIEWS_DIR, `${template.id}.png`);
    if (fs.existsSync(shotPath)) {
      try {
        fs.unlinkSync(shotPath);
      } catch {}
    }

    // 3. Remove from config
    this.config.templates.splice(templateIndex, 1);

    // 4. If deleted template was active, switch to default or another available template
    if (this.config.activeTemplateId === templateId) {
      this.config.activeTemplateId = "default";
      this.config.mode = "default";
      this.cleanLandingDirectory(CUSTOM_LANDING_DIR);
    }

    this.saveConfig();
    return this.getConfig();
  }

  public updateTemplateSettings(
    templateId: string,
    updates: { title?: string; showQuickNav?: boolean; showChatWidget?: boolean }
  ): LandingConfig {
    const template = this.config.templates.find((t) => t.id === templateId);
    if (!template) {
      if (templateId === "default") {
        if (updates.showQuickNav !== undefined) this.config.showQuickNav = updates.showQuickNav;
        if (updates.showChatWidget !== undefined) this.config.showChatWidget = updates.showChatWidget;
        this.saveConfig();
        return this.getConfig();
      }
      throw new Error("قالب یافت نشد");
    }

    if (updates.title !== undefined) {
      template.name = updates.title.trim() || template.name;
    }
    if (updates.showQuickNav !== undefined) {
      template.showQuickNav = updates.showQuickNav;
      if (this.config.activeTemplateId === templateId) {
        this.config.showQuickNav = updates.showQuickNav;
      }
    }
    if (updates.showChatWidget !== undefined) {
      template.showChatWidget = updates.showChatWidget;
      if (this.config.activeTemplateId === templateId) {
        this.config.showChatWidget = updates.showChatWidget;
      }
    }

    this.saveConfig();
    return this.getConfig();
  }

  public updateTemplateTitle(templateId: string, newTitle: string): LandingConfig {
    return this.updateTemplateSettings(templateId, { title: newTitle });
  }

  private scanFolderFiles(dir: string): string[] {
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
      console.error("Error scanning folder files:", e);
    }
    return allFiles;
  }

  /**
   * استخراج امن پکیج ZIP و افزودن آن به عنوان یک قالب جدید در گالری
   */
  public async extractZipTemplate(
    zipFilePath: string,
    originalName: string,
    fileSize: number
  ): Promise<{ success: boolean; message: string; template: TemplateItem; config: LandingConfig }> {
    try {
      const templateId = `tpl_${Date.now()}`;
      const folderName = templateId;
      const targetDir = path.join(TEMPLATES_ROOT_DIR, folderName);

      this.ensureDirectoryExists(targetDir);

      const zip = new AdmZip(zipFilePath);
      const zipEntries = zip.getEntries();

      if (zipEntries.length === 0) {
        throw new Error("فایل فشرده خالی است");
      }

      // Check root folders
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

          if (
            targetRelativePath.toLowerCase() === "index.html" ||
            targetRelativePath.toLowerCase().endsWith("/index.html")
          ) {
            foundIndexHtml = true;
          }
        }
      }

      const files = this.scanFolderFiles(targetDir);
      let entryFile = "index.html";

      if (!foundIndexHtml) {
        const htmlFile = files.find((f) => f.endsWith(".html"));
        if (htmlFile) {
          entryFile = htmlFile;
        } else {
          const defaultHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${originalName}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .box { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; }
    h1 { color: #38bdf8; margin-top: 0; }
  </style>
</head>
<body>
  <div class="box">
    <h1>قالب با موفقیت بارگذاری شد</h1>
    <p>فایل‌های قالب شما با موفقیت در سیستم قرار گرفتند.</p>
  </div>
</body>
</html>`;
          fs.writeFileSync(path.join(targetDir, "index.html"), defaultHtml, "utf-8");
          entryFile = "index.html";
        }
      }

      const cleanTitle = originalName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      // Extract Header and Footer from the entry file
      let extractedHeaderHtml: string | null = null;
      let extractedFooterHtml: string | null = null;
      try {
        const entryFullPath = path.join(targetDir, entryFile);
        if (fs.existsSync(entryFullPath)) {
          const rawHtml = fs.readFileSync(entryFullPath, "utf-8");
          const extracted = this.extractHeaderAndFooterFromHtml(rawHtml, folderName);
          extractedHeaderHtml = extracted.headerHtml;
          extractedFooterHtml = extracted.footerHtml;
        }
      } catch (extractErr) {
        console.error("Error extracting header/footer from zip template:", extractErr);
      }

      const newTemplate: TemplateItem = {
        id: templateId,
        name: cleanTitle || "قالب جدید",
        type: "zip",
        entryFile: entryFile,
        folderName: folderName,
        entryUrl: `/landing-templates/${folderName}/${entryFile}`,
        previewImage: this.findTemplatePreviewImage(folderName),
        uploadedAt: new Date().toISOString(),
        fileSize: fileSize,
        filesCount: files.length,
        filesList: files.slice(0, 50),
        extractedHeaderHtml: extractedHeaderHtml,
        extractedFooterHtml: extractedFooterHtml,
        isDefault: false,
      };

      // Add to templates list
      this.config.templates.push(newTemplate);
      this.config.activeTemplateId = templateId;
      this.config.mode = "custom";
      this.config.showQuickNav = false;
      this.config.activeHeaderHtml = extractedHeaderHtml;
      this.config.activeFooterHtml = extractedFooterHtml;

      // Also copy to custom-landing for backward compatibility
      this.cleanLandingDirectory(CUSTOM_LANDING_DIR);
      this.copyDirectory(targetDir, CUSTOM_LANDING_DIR);

      this.saveConfig();

      // Trigger asynchronous screenshot
      this.refreshScreenshots().catch(() => {});

      // Clean temp zip
      try {
        if (fs.existsSync(zipFilePath)) {
          fs.unlinkSync(zipFilePath);
        }
      } catch {}

      return {
        success: true,
        message: "قالب جدید با موفقیت به لیست قالب‌ها اضافه و فعال شد",
        template: newTemplate,
        config: this.getConfig(),
      };
    } catch (error: any) {
      console.error("Error extracting zip landing template:", error);
      throw new Error(error.message || "خطا در پردازش و استخراج فایل زیپ قالب");
    }
  }

  /**
   * ذخیره مستقیم کدهای HTML/CSS سفارشی به عنوان قالب جدید
   */
  public saveCustomHtml(
    htmlContent: string,
    title?: string
  ): { success: boolean; template: TemplateItem; config: LandingConfig } {
    const templateId = `tpl_${Date.now()}`;
    const folderName = templateId;
    const targetDir = path.join(TEMPLATES_ROOT_DIR, folderName);

    this.ensureDirectoryExists(targetDir);

    const indexPath = path.join(targetDir, "index.html");
    fs.writeFileSync(indexPath, htmlContent, "utf-8");

    let extractedHeaderHtml: string | null = null;
    let extractedFooterHtml: string | null = null;
    try {
      const extracted = this.extractHeaderAndFooterFromHtml(htmlContent, folderName);
      extractedHeaderHtml = extracted.headerHtml;
      extractedFooterHtml = extracted.footerHtml;
    } catch (extractErr) {
      console.error("Error extracting header/footer from html:", extractErr);
    }

    const newTemplate: TemplateItem = {
      id: templateId,
      name: title || `قالب HTML اختصاصی ${new Date().toLocaleDateString("fa-IR")}`,
      type: "html",
      entryFile: "index.html",
      folderName: folderName,
      entryUrl: `/landing-templates/${folderName}/index.html`,
      previewImage: null,
      uploadedAt: new Date().toISOString(),
      fileSize: Buffer.byteLength(htmlContent, "utf-8"),
      filesCount: 1,
      filesList: ["index.html"],
      customHtml: htmlContent,
      extractedHeaderHtml: extractedHeaderHtml,
      extractedFooterHtml: extractedFooterHtml,
      isDefault: false,
    };

    this.config.templates.push(newTemplate);
    this.config.activeTemplateId = templateId;
    this.config.mode = "custom";
    this.config.showQuickNav = false;
    this.config.activeHeaderHtml = extractedHeaderHtml;
    this.config.activeFooterHtml = extractedFooterHtml;

    // Sync to custom-landing
    this.cleanLandingDirectory(CUSTOM_LANDING_DIR);
    this.copyDirectory(targetDir, CUSTOM_LANDING_DIR);

    this.saveConfig();

    // Trigger screenshot
    this.refreshScreenshots().catch(() => {});

    return {
      success: true,
      template: newTemplate,
      config: this.getConfig(),
    };
  }

  /**
   * بازنشانی به قالب پیش‌فرض
   */
  public resetToDefault(): LandingConfig {
    this.config.activeTemplateId = "default";
    this.config.mode = "default";
    this.config.activeHeaderHtml = null;
    this.config.activeFooterHtml = null;
    this.saveConfig();
    return this.getConfig();
  }

  /**
   * دریافت داده‌های کامل برای ویرایشگر بصری زنده قالب
   */
  public getTemplateBuilderData(templateId: string): {
    template: TemplateItem;
    html: string;
    assets: { url: string; name: string; size?: number }[];
    hasBackup: boolean;
    folderBase: string;
  } {
    const template = this.getTemplate(templateId) || (templateId === "default" ? this.config.templates.find(t => t.isDefault) : null);
    if (!template) {
      throw new Error("قالب مورد نظر یافت نشد");
    }

    let html = "";
    let folderBase = "";
    let targetDir = "";
    let hasBackup = false;

    if (template.isDefault || template.id === "default") {
      folderBase = "/";
      targetDir = path.join(TEMPLATES_ROOT_DIR, "default");
      const defaultIndexPath = path.join(targetDir, "index.html");
      if (fs.existsSync(defaultIndexPath)) {
        html = fs.readFileSync(defaultIndexPath, "utf-8");
        hasBackup = fs.existsSync(path.join(targetDir, "index.html.bak"));
      } else {
        // Generate baseline HTML for default template
        html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>صفحه اصلی - سامانه رخش</title>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', system-ui, sans-serif; }
    body { background-color: #f8fafc; color: #0f172a; line-height: 1.6; }
    header { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 1.5rem; font-weight: 900; color: #7c3aed; text-decoration: none; display: flex; align-items: center; gap: 0.5rem; }
    nav a { margin-right: 1.5rem; color: #475569; text-decoration: none; font-weight: 500; }
    nav a:hover { color: #7c3aed; }
    .hero { padding: 5rem 2rem; text-align: center; background: linear-gradient(135deg, #fdf4ff 0%, #e0f2fe 100%); }
    .hero h1 { font-size: 3rem; font-weight: 900; color: #1e1b4b; margin-bottom: 1.5rem; }
    .hero p { font-size: 1.25rem; color: #475569; max-width: 700px; margin: 0 auto 2.5rem; }
    .btn-primary { background: #7c3aed; color: #fff; padding: 0.85rem 2rem; border-radius: 0.75rem; text-decoration: none; font-weight: 700; display: inline-block; }
    .features { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
    .feature-card { background: #fff; padding: 2rem; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .feature-card h3 { font-size: 1.25rem; margin-bottom: 0.75rem; color: #1e293b; }
    .feature-card p { color: #64748b; font-size: 0.95rem; }
    footer { background: #0f172a; color: #94a3b8; padding: 3rem 2rem; text-align: center; }
  </style>
</head>
<body>
  <header>
    <a href="#" class="logo">🚀 سامانه رخش</a>
    <nav>
      <a href="#features">ویژگی‌ها</a>
      <a href="#about">درباره ما</a>
      <a href="#contact">تماس</a>
      <a href="/login" class="btn-primary" style="padding: 0.5rem 1.25rem; font-size: 0.9rem;">ورود به پنل</a>
    </nav>
  </header>
  <section class="hero">
    <h1>دستیار هوشمند و سیستم جامع مدیریت</h1>
    <p>با سامانه پیشرفته رخش کارهای روزمره، پاسخ‌دهی به مشتریان و فروش آنلاین خود را به صورت ۲۴ ساعته خودکار کنید.</p>
    <a href="/register" class="btn-primary">شروع رایگان و راه‌اندازی</a>
  </section>
  <section id="features" class="features">
    <div class="feature-card">
      <h3>🤖 ربات هوشمند ۲۴ ساعته</h3>
      <p>پاسخ‌دهی سریع و خودکار به مشتریان در پیام‌رسان‌ها و وب‌سایت بدون نیاز به اپراتور انسانی.</p>
    </div>
    <div class="feature-card">
      <h3>📊 داشبورد تحلیلی و گزارشات</h3>
      <p>مشاهده لحظه‌ای آمار فروش، گزارش‌های مالی و پیام‌های دریافتی با نمودارهای دقیق.</p>
    </div>
    <div class="feature-card">
      <h3>⚡ سرعت بالا و پایداری</h3>
      <p>طراحی مدرن، بهینه‌سازی شده برای موبایل و دسکتاپ با امنیت و سرعت بی‌نظیر.</p>
    </div>
  </section>
  <footer id="contact">
    <p>© ۱۴۰۵ کلیه حقوق برای سامانه رخش محفوظ است.</p>
  </footer>
</body>
</html>`;
      }
    } else {
      folderBase = `/landing-templates/${template.folderName}/`;
      targetDir = path.join(TEMPLATES_ROOT_DIR, template.folderName);
      const entryPath = path.join(targetDir, template.entryFile || "index.html");

      if (fs.existsSync(entryPath)) {
        html = fs.readFileSync(entryPath, "utf-8");
        hasBackup = fs.existsSync(path.join(targetDir, `${template.entryFile || "index.html"}.bak`));
      } else if (template.customHtml) {
        html = template.customHtml;
      }
    }

    // Collect all media and video assets in the template directory
    const assets: { url: string; name: string; size?: number }[] = [];
    if (targetDir && fs.existsSync(targetDir)) {
      const allFiles = this.scanFolderFiles(targetDir);
      for (const file of allFiles) {
        const lower = file.toLowerCase();
        if (
          lower.endsWith(".png") ||
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".svg") ||
          lower.endsWith(".webp") ||
          lower.endsWith(".gif") ||
          lower.endsWith(".ico") ||
          lower.endsWith(".mp4") ||
          lower.endsWith(".webm") ||
          lower.endsWith(".ogg") ||
          lower.endsWith(".mov") ||
          lower.endsWith(".mkv")
        ) {
          const filePath = path.join(targetDir, file);
          let size = 0;
          try {
            size = fs.statSync(filePath).size;
          } catch {}
          assets.push({
            url: template.isDefault ? `/landing-templates/default/${file}` : `/landing-templates/${template.folderName}/${file}`,
            name: file,
            size,
          });
        }
      }
    }

    // Also include default icons/placeholders if assets list is small
    if (assets.length < 5) {
      assets.push(
        { url: "/assets/insta-logo.png", name: "لوگوی اینستاگرام" },
        { url: "/landing-previews/default.png", name: "تصویر پیش‌فرض" }
      );
    }

    return {
      template,
      html,
      assets,
      hasBackup,
      folderBase,
    };
  }

  /**
   * ذخیره کدهای ویرایش شده از Visual Builder در فایل‌های قالب
   */
  public saveTemplateBuilderContent(
    templateId: string,
    htmlContent: string
  ): { success: boolean; message: string; template: TemplateItem; config: LandingConfig } {
    if (!htmlContent || typeof htmlContent !== "string") {
      throw new Error("محتوای HTML نامعتبر است");
    }

    let template = this.getTemplate(templateId);
    if (!template && templateId === "default") {
      template = this.config.templates.find(t => t.isDefault);
    }

    if (!template) {
      throw new Error("قالب یافت نشد");
    }

    let targetDir = "";
    let entryFileName = template.entryFile || "index.html";

    if (template.isDefault || template.id === "default") {
      targetDir = path.join(TEMPLATES_ROOT_DIR, "default");
      this.ensureDirectoryExists(targetDir);
      entryFileName = "index.html";
      template.entryFile = "index.html";
      template.folderName = "default";
      template.entryUrl = "/landing-templates/default/index.html";
      template.type = "html";
      template.customHtml = htmlContent;
    } else {
      targetDir = path.join(TEMPLATES_ROOT_DIR, template.folderName);
      this.ensureDirectoryExists(targetDir);
      template.customHtml = htmlContent;
    }

    const entryPath = path.join(targetDir, entryFileName);
    const backupPath = path.join(targetDir, `${entryFileName}.bak`);

    // Create backup before first overwrite if not exists
    if (fs.existsSync(entryPath) && !fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(entryPath, backupPath);
      } catch (err) {
        console.error("Error creating template backup file:", err);
      }
    }

    // Ensure navbar collapse & responsive fix style is present in saved HTML head
    if (htmlContent.includes("landing-menu-fix-style")) {
      htmlContent = htmlContent.replace(/<style id="landing-menu-fix-style">[\s\S]*?<\/style>/gi, "");
    }
    const fixStyle = `  <style id="landing-menu-fix-style">
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
  </style>\n</head>`;
    if (htmlContent.includes("</head>")) {
      htmlContent = htmlContent.replace("</head>", fixStyle);
    }

    // Write updated content
    fs.writeFileSync(entryPath, htmlContent, "utf-8");

    template.fileSize = Buffer.byteLength(htmlContent, "utf-8");

    // Extract Header and Footer from updated content
    try {
      const extracted = this.extractHeaderAndFooterFromHtml(htmlContent, template.folderName);
      template.extractedHeaderHtml = extracted.headerHtml;
      template.extractedFooterHtml = extracted.footerHtml;

      if (this.config.activeTemplateId === template.id) {
        this.config.activeHeaderHtml = extracted.headerHtml;
        this.config.activeFooterHtml = extracted.footerHtml;
      }
    } catch (extractErr) {
      console.error("Error extracting header/footer after save:", extractErr);
    }

    // If template is active, sync to custom-landing directory
    if (this.config.activeTemplateId === template.id) {
      try {
        this.cleanLandingDirectory(CUSTOM_LANDING_DIR);
        this.copyDirectory(targetDir, CUSTOM_LANDING_DIR);
      } catch (err) {
        console.error("Error syncing active template to custom-landing:", err);
      }
    }

    this.saveConfig();

    // Trigger preview refresh asynchronously
    setTimeout(() => {
      this.refreshScreenshots().catch(() => {});
    }, 1000);

    return {
      success: true,
      message: "تغییرات قالب با موفقیت ذخیره و در سامانه اعمال شد",
      template,
      config: this.getConfig(),
    };
  }

  /**
   * بازنشانی قالب به نسخه پشتیبان اولیه
   */
  public restoreTemplateBackup(
    templateId: string
  ): { success: boolean; message: string; template: TemplateItem; config: LandingConfig } {
    const template = this.getTemplate(templateId) || (templateId === "default" ? this.config.templates.find(t => t.isDefault) : null);
    if (!template) {
      throw new Error("قالب یافت نشد");
    }

    const folderName = template.isDefault ? "default" : template.folderName;
    const targetDir = path.join(TEMPLATES_ROOT_DIR, folderName);
    const entryFileName = template.entryFile || "index.html";
    const entryPath = path.join(targetDir, entryFileName);
    const backupPath = path.join(targetDir, `${entryFileName}.bak`);

    if (!fs.existsSync(backupPath)) {
      throw new Error("نسخه پشتیبان اولیه برای این قالب یافت نشد");
    }

    fs.copyFileSync(backupPath, entryPath);
    const restoredHtml = fs.readFileSync(entryPath, "utf-8");

    template.customHtml = restoredHtml;
    template.fileSize = Buffer.byteLength(restoredHtml, "utf-8");

    const extracted = this.extractHeaderAndFooterFromHtml(restoredHtml, folderName);
    template.extractedHeaderHtml = extracted.headerHtml;
    template.extractedFooterHtml = extracted.footerHtml;

    if (this.config.activeTemplateId === template.id) {
      this.config.activeHeaderHtml = extracted.headerHtml;
      this.config.activeFooterHtml = extracted.footerHtml;
      this.cleanLandingDirectory(CUSTOM_LANDING_DIR);
      this.copyDirectory(targetDir, CUSTOM_LANDING_DIR);
    }

    this.saveConfig();
    this.refreshScreenshots().catch(() => {});

    return {
      success: true,
      message: "قالب با موفقیت به نسخه پشتیبان اولیه بازنشانی شد",
      template,
      config: this.getConfig(),
    };
  }

  /**
   * افزودن تصویر جدید به گالری دارایی‌های قالب
   */
  public saveUploadedAsset(
    templateId: string,
    fileName: string,
    fileBuffer: Buffer
  ): { success: boolean; assetUrl: string; name: string } {
    const template = this.getTemplate(templateId) || (templateId === "default" ? this.config.templates.find(t => t.isDefault) : null);
    if (!template) {
      throw new Error("قالب یافت نشد");
    }

    const folderName = template.isDefault ? "default" : template.folderName;
    const targetDir = path.join(TEMPLATES_ROOT_DIR, folderName, "pics");
    this.ensureDirectoryExists(targetDir);

    const cleanName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const targetPath = path.join(targetDir, cleanName);

    fs.writeFileSync(targetPath, fileBuffer);

    // If active, sync to custom-landing/pics
    if (this.config.activeTemplateId === template.id) {
      const customPicsDir = path.join(CUSTOM_LANDING_DIR, "pics");
      this.ensureDirectoryExists(customPicsDir);
      fs.writeFileSync(path.join(customPicsDir, cleanName), fileBuffer);
    }

    const relativeUrl = template.isDefault
      ? `/landing-templates/default/pics/${cleanName}`
      : `/landing-templates/${template.folderName}/pics/${cleanName}`;

    return {
      success: true,
      assetUrl: relativeUrl,
      name: cleanName,
    };
  }

  private cleanLandingDirectory(dir: string): void {
    if (!fs.existsSync(dir)) return;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const curPath = path.join(dir, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          fs.rmSync(curPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(curPath);
        }
      }
    } catch (e) {
      console.error(`Error cleaning directory ${dir}:`, e);
    }
  }

  private copyDirectory(src: string, dest: string): void {
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
}

export const landingService = new LandingService();

