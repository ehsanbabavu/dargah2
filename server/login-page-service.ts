import fs from "fs";
import path from "path";

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

const CONFIG_FILE_PATH = path.join(process.cwd(), "data-login-page-config.json");
const LOGIN_ASSETS_DIR = path.join(process.cwd(), "public", "login-assets");

export const DEFAULT_LOGIN_CONFIG: LoginPageConfig = {
  gradientType: "preset",
  gradientPreset: "blue-purple",
  fromColor: "#2563eb",
  viaColor: "#9333ea",
  toColor: "#4338ca",
  gradientDirection: "to-br",
  customCssGradient: "linear-gradient(135deg, #2563eb 0%, #9333ea 50%, #4338ca 100%)",
  
  imageType: "default",
  imageUrl: "",
  imageFit: "contain",
  imageOverlayOpacity: 0,
  welcomeTitle: "ورود به حساب کاربری",
  welcomeSubtitle: "خوش آمدید! برای دسترسی به پنل، وارد شوید.",
};

export class LoginPageService {
  private config: LoginPageConfig;

  constructor() {
    this.ensureDirectoryExists(LOGIN_ASSETS_DIR);
    this.config = this.loadConfig();
  }

  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadConfig(): LoginPageConfig {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_LOGIN_CONFIG,
          ...parsed,
        };
      }
    } catch (err) {
      console.error("Error loading login page config:", err);
    }
    return { ...DEFAULT_LOGIN_CONFIG };
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.config, null, 2), "utf8");
    } catch (err) {
      console.error("Error saving login page config:", err);
    }
  }

  public getConfig(): LoginPageConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<LoginPageConfig>): LoginPageConfig {
    this.config = {
      ...this.config,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfig();
    return this.getConfig();
  }

  public resetToDefault(): LoginPageConfig {
    this.config = {
      ...DEFAULT_LOGIN_CONFIG,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfig();
    return this.getConfig();
  }
}

export const loginPageService = new LoginPageService();
