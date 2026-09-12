import fs from "fs";
import path from "path";
import type { IStorage } from "./storage";

export function normalizeIranianPhone(raw: string): string {
  if (!raw) return "";
  let clean = String(raw)
    .replace(/\s+/g, "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
    .replace(/[^0-9+]/g, "");
  
  if (clean.startsWith("+98")) clean = clean.slice(3);
  else if (clean.startsWith("0098")) clean = clean.slice(4);
  else if (clean.startsWith("98") && clean.length > 10) clean = clean.slice(2);
  
  if (!clean.startsWith("0") && clean.length === 10) clean = "0" + clean;
  return clean;
}

export interface TelegramButton {
  id: string;
  text: string;
  type: "url" | "command" | "text";
  value: string;
}

export interface TelegramCommandResponse {
  id: string;
  command: string;
  description: string;
  response: string;
  isEnabled: boolean;
  isSystem?: boolean;
  parentId?: string | null;
  mediaType?: "photo" | "video" | "document" | "audio" | "none";
  mediaUrl?: string;
}

export interface TelegramBotUser {
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phoneVerifiedAt?: string;
  languageCode?: string;
  firstSeenAt: string;
  lastActiveAt: string;
  messageCount: number;
  lastMessage?: string;
  isBlocked?: boolean;
  notes?: string;
}

export interface TelegramLogEntry {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "webhook" | "notification";
  message: string;
  details?: any;
}

export interface TelegramConfig {
  botToken: string;
  isEnabled: boolean;
  botUsername?: string;
  botFirstName?: string;
  botId?: number;
  adminChatId: string;
  apiBaseUrl: string;
  webhookUrl?: string;
  isWebhookSet: boolean;
  
  // Notification Triggers
  notifications: {
    successBloPalTxLevel1: boolean;
    answeredTicketLevel1: boolean;
    subscriptionExpiry3DaysLevel1: boolean;
    newAnnouncementsLevel1: boolean;
  };

  // Bot Messages and Commands
  botResponses: {
    welcomeMessage: string;
    helpMessage: string;
    aboutMessage: string;
    contactMessage: string;
    enableCatalog: boolean;
    enableOrderTracking: boolean;
  };

  // Interactive Menu Buttons
  menuButtons: TelegramButton[];

  // Bot Commands & Auto-Responses
  botCommands: TelegramCommandResponse[];

  // Bot Users (Subscribers & Interacting users)
  botUsers: TelegramBotUser[];

  // Stats
  stats: {
    totalMessagesSent: number;
    totalUpdatesReceived: number;
    lastActiveAt?: string;
  };

  // Recent Action Logs
  logs: TelegramLogEntry[];
  
  updatedAt?: string;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "data-telegram-config.json");

export const DEFAULT_BOT_COMMANDS: TelegramCommandResponse[] = [
  {
    id: "cmd-start",
    command: "/start",
    description: "شروع ربات و پیام خوش‌آمدهای خوش‌آمدگویی",
    response: "سلام! 👋\nبه ربات رسمی سامانه و فروشگاه رخش خوش آمدید.\nاز منوی زیر می‌توانید به بخش‌های مختلف دسترسی پیدا کنید:",
    isEnabled: false,
    isSystem: true,
  },
  {
    id: "cmd-help",
    command: "/help",
    description: "راهنمای دستورات ربات",
    response: "راهنمای استفاده از ربات:\n\n🛒 /products - مشاهده جدیدترین محصولات\n📦 /track - پیگیری وضعیت سفارش\nℹ️ /about - درباره ما\n📞 /contact - تماس با پشتیبانی",
    isEnabled: false,
    isSystem: true,
  },
  {
    id: "cmd-about",
    command: "/about",
    description: "درباره ما و معرفی سامانه",
    response: "سامانه هوشمند رخش\nارائه دهنده پیشرفته‌ترین خدمات فروشگاهی، محتوایی و پشتیبانی مشتریان.",
    isEnabled: false,
    isSystem: true,
  },
  {
    id: "cmd-contact",
    command: "/contact",
    description: "راه‌های ارتباطی و پشتیبانی",
    response: "📞 راه‌های ارتباطی با پشتیبانی:\n\nتلفن: ۰۲۱-۸۸۸۸۸۸۸۸\nایمیل: support@rakhsh.ir\nساعت پاسخگویی: همه روزه از ۹ الی ۲۱",
    isEnabled: false,
    isSystem: true,
  },
  {
    id: "cmd-products",
    command: "/products",
    description: "کاتالوگ محصولات فروشگاه",
    response: "🛒 مشاهده کاتالوگ محصولات با دریافت قیمت آنلاین از سایت",
    isEnabled: false,
    isSystem: true,
  },
  {
    id: "cmd-track",
    command: "/track",
    description: "پیگیری وضعیت سفارش خرید",
    response: "📦 جهت پیگیری سفارش خود، شماره سفارش را ارسال کنید.",
    isEnabled: false,
    isSystem: true,
  }
];

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  isEnabled: false,
  adminChatId: "",
  apiBaseUrl: "https://api.telegram.org",
  isWebhookSet: false,
  notifications: {
    successBloPalTxLevel1: true,
    answeredTicketLevel1: true,
    subscriptionExpiry3DaysLevel1: true,
    newAnnouncementsLevel1: true,
  },
  botResponses: {
    welcomeMessage: "سلام! 👋\nبه ربات رسمی سامانه و فروشگاه رخش خوش آمدید.\nاز منوی زیر می‌توانید به بخش‌های مختلف دسترسی پیدا کنید:",
    helpMessage: "راهنمای استفاده از ربات:\n\n🛒 /products - مشاهده جدیدترین محصولات\n📦 /track - پیگیری وضعیت سفارش\nℹ️ /about - درباره ما\n📞 /contact - تماس با پشتیبانی",
    aboutMessage: "سامانه هوشمند رخش\nارائه دهنده پیشرفته‌ترین خدمات فروشگاهی، محتوایی و پشتیبانی مشتریان.",
    contactMessage: "📞 راه‌های ارتباطی با پشتیبانی:\n\nتلفن: ۰۲۱-۸۸۸۸۸۸۸۸\nایمیل: support@rakhsh.ir\nساعت پاسخگویی: همه روزه از ۹ الی ۲۱",
    enableCatalog: true,
    enableOrderTracking: true,
  },
  botCommands: DEFAULT_BOT_COMMANDS,
  menuButtons: [
    {
      id: "btn-1",
      text: "🛒 مشاهده محصولات",
      type: "command",
      value: "/products",
    },
    {
      id: "btn-2",
      text: "🌐 ورود به وب‌سایت",
      type: "url",
      value: "https://rakhsh.ir",
    },
    {
      id: "btn-3",
      text: "📞 تماس با پشتیبانی",
      type: "command",
      value: "/contact",
    },
    {
      id: "btn-4",
      text: "ℹ️ درباره ما",
      type: "command",
      value: "/about",
    },
  ],
  botUsers: [
    {
      chatId: "99999",
      username: "admin_rakhsh",
      firstName: "مدیر",
      lastName: "سامانه",
      languageCode: "fa",
      firstSeenAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      lastActiveAt: new Date().toISOString(),
      messageCount: 14,
      lastMessage: "/start",
      isBlocked: false,
      notes: "حساب کاربری مدیریت در تلگرام",
    }
  ],
  stats: {
    totalMessagesSent: 0,
    totalUpdatesReceived: 0,
  },
  logs: [],
};

export class TelegramService {
  private config: TelegramConfig;
  private isPolling: boolean = false;
  private pollingAbortController: AbortController | null = null;
  private lastUpdateId: number = 0;
  private storageInstance: IStorage | null = null;
  private pollingLoopRunning: boolean = false;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): TelegramConfig {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_TELEGRAM_CONFIG,
          ...parsed,
          notifications: {
            ...DEFAULT_TELEGRAM_CONFIG.notifications,
            ...(parsed.notifications || {}),
          },
          botResponses: {
            ...DEFAULT_TELEGRAM_CONFIG.botResponses,
            ...(parsed.botResponses || {}),
          },
          stats: {
            ...DEFAULT_TELEGRAM_CONFIG.stats,
            ...(parsed.stats || {}),
          },
          logs: parsed.logs || [],
          menuButtons: parsed.menuButtons || DEFAULT_TELEGRAM_CONFIG.menuButtons,
          botCommands: parsed.botCommands || DEFAULT_BOT_COMMANDS,
          botUsers: parsed.botUsers || DEFAULT_TELEGRAM_CONFIG.botUsers,
        };
      }
    } catch (error) {
      console.error("Error loading Telegram config from file:", error);
    }
    return { ...DEFAULT_TELEGRAM_CONFIG };
  }

  private saveConfigToFile(config: TelegramConfig): boolean {
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf8");
      return true;
    } catch (error) {
      console.error("Error saving Telegram config to file:", error);
      return false;
    }
  }

  public addLog(type: TelegramLogEntry["type"], message: string, details?: any) {
    const entry: TelegramLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
      details,
    };
    this.config.logs = [entry, ...(this.config.logs || [])].slice(0, 50);
    this.saveConfigToFile(this.config);
  }

  public getConfig(): TelegramConfig {
    return { ...this.config };
  }

  public getBotUsers(): TelegramBotUser[] {
    return this.config.botUsers || [];
  }

  public recordBotUser(data: {
    chatId: string | number;
    username?: string;
    firstName?: string;
    lastName?: string;
    languageCode?: string;
    phoneNumber?: string;
    phoneVerifiedAt?: string;
    text?: string;
  }): TelegramBotUser {
    const strChatId = String(data.chatId);
    if (!this.config.botUsers) {
      this.config.botUsers = [];
    }

    const existingIdx = this.config.botUsers.findIndex((u) => String(u.chatId) === strChatId);
    const now = new Date().toISOString();

    if (existingIdx >= 0) {
      const existing = this.config.botUsers[existingIdx];
      const updated: TelegramBotUser = {
        ...existing,
        username: data.username !== undefined ? data.username : existing.username,
        firstName: data.firstName !== undefined ? data.firstName : existing.firstName,
        lastName: data.lastName !== undefined ? data.lastName : existing.lastName,
        languageCode: data.languageCode !== undefined ? data.languageCode : existing.languageCode,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : existing.phoneNumber,
        phoneVerifiedAt: data.phoneVerifiedAt !== undefined ? data.phoneVerifiedAt : existing.phoneVerifiedAt,
        lastActiveAt: now,
        messageCount: (existing.messageCount || 0) + 1,
        lastMessage: data.text ? data.text.slice(0, 150) : existing.lastMessage,
      };
      this.config.botUsers[existingIdx] = updated;
      this.saveConfigToFile(this.config);
      return updated;
    } else {
      const newUser: TelegramBotUser = {
        chatId: strChatId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        languageCode: data.languageCode || "fa",
        phoneNumber: data.phoneNumber,
        phoneVerifiedAt: data.phoneVerifiedAt,
        firstSeenAt: now,
        lastActiveAt: now,
        messageCount: 1,
        lastMessage: data.text ? data.text.slice(0, 150) : "",
        isBlocked: false,
      };
      this.config.botUsers.unshift(newUser);
      this.saveConfigToFile(this.config);
      return newUser;
    }
  }

  public addOrUpdateBotUser(user: Partial<TelegramBotUser> & { chatId: string | number }): TelegramBotUser {
    const strChatId = String(user.chatId);
    if (!this.config.botUsers) {
      this.config.botUsers = [];
    }

    const existingIdx = this.config.botUsers.findIndex((u) => String(u.chatId) === strChatId);
    const now = new Date().toISOString();

    if (existingIdx >= 0) {
      const existing = this.config.botUsers[existingIdx];
      const updated: TelegramBotUser = {
        ...existing,
        ...user,
        chatId: strChatId,
        lastActiveAt: now,
      };
      this.config.botUsers[existingIdx] = updated;
      this.saveConfigToFile(this.config);
      this.addLog("info", `مشخصات کاربر تلگرام ${strChatId} به‌روز شد`);
      return updated;
    } else {
      const newUser: TelegramBotUser = {
        chatId: strChatId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        languageCode: user.languageCode || "fa",
        phoneNumber: user.phoneNumber,
        phoneVerifiedAt: user.phoneVerifiedAt,
        firstSeenAt: now,
        lastActiveAt: now,
        messageCount: user.messageCount || 0,
        lastMessage: user.lastMessage || "",
        isBlocked: user.isBlocked || false,
        notes: user.notes,
      };
      this.config.botUsers.unshift(newUser);
      this.saveConfigToFile(this.config);
      this.addLog("info", `کاربر جدید تلگرام ${strChatId} ثبت شد`);
      return newUser;
    }
  }

  public deleteBotUser(chatId: string | number): boolean {
    const strChatId = String(chatId);
    if (!this.config.botUsers) return false;
    const initialLen = this.config.botUsers.length;
    this.config.botUsers = this.config.botUsers.filter((u) => String(u.chatId) !== strChatId);
    if (this.config.botUsers.length !== initialLen) {
      this.saveConfigToFile(this.config);
      this.addLog("info", `کاربر تلگرام ${strChatId} حذف شد`);
      return true;
    }
    return false;
  }

  public toggleBlockBotUser(chatId: string | number): { isBlocked: boolean } {
    const strChatId = String(chatId);
    if (!this.config.botUsers) this.config.botUsers = [];
    const user = this.config.botUsers.find((u) => String(u.chatId) === strChatId);
    if (!user) {
      const newUser = this.addOrUpdateBotUser({ chatId: strChatId, isBlocked: true });
      return { isBlocked: newUser.isBlocked || false };
    }
    user.isBlocked = !user.isBlocked;
    this.saveConfigToFile(this.config);
    this.addLog("info", `وضعیت مسدودی کاربر تلگرام ${strChatId} به ${user.isBlocked ? "مسدود" : "فعال"} تغییر یافت`);
    return { isBlocked: user.isBlocked };
  }

  public updateConfig(newConfig: Partial<TelegramConfig>): TelegramConfig {
    const wasEnabled = this.config.isEnabled;
    this.config = {
      ...this.config,
      ...newConfig,
      notifications: {
        ...this.config.notifications,
        ...(newConfig.notifications || {}),
      },
      botResponses: {
        ...this.config.botResponses,
        ...(newConfig.botResponses || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    if (newConfig.botCommands) {
      this.config.menuButtons = [];
    }
    this.saveConfigToFile(this.config);
    this.addLog("info", "تنظیمات ربات تلگرام با موفقیت به‌روزرسانی شد");

    // Sync commands with Telegram if enabled
    if (this.config.isEnabled && this.config.botToken) {
      this.syncCommandsWithTelegram().catch((err) => {
        console.error("Error syncing commands with Telegram on config update:", err);
      });
    }

    // Manage polling lifecycle based on new state
    if (this.config.isEnabled && !this.config.isWebhookSet && this.storageInstance) {
      this.startPolling(this.storageInstance).catch(() => {});
    } else if (!this.config.isEnabled) {
      this.stopPolling();
    }

    return this.config;
  }

  /**
   * Telegram Bot API: setMyCommands to sync commands in Telegram menu
   */
  public async syncCommandsWithTelegram(): Promise<{ success: boolean; error?: string }> {
    const token = this.config.botToken?.trim();
    if (!token) {
      return { success: false, error: "توکن ربات تلگرام تنظیم نشده است" };
    }

    try {
      // Get all enabled commands, format them properly for Telegram setMyCommands API
      // Telegram requires commands to be 1-32 chars, lowercase English letters, digits, and underscores, starting with a letter.
      const rawCommands = this.config.botCommands || [];
      const formattedCommands = rawCommands
        .filter(c => c.isEnabled)
        .map(c => {
          let cmd = c.command.trim().toLowerCase();
          if (cmd.startsWith("/")) {
            cmd = cmd.substring(1);
          }
          // Remove any characters that are not lowercase English, digits, or underscores
          cmd = cmd.replace(/[^a-z0-9_]/g, "");
          return {
            command: cmd,
            description: c.description.substring(0, 256) || "دستور ربات",
          };
        })
        .filter(c => c.command.length > 0 && c.command.length <= 32 && /^[a-z]/.test(c.command));

      const url = `${this.getBaseUrl()}/bot${token}/setMyCommands`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands: formattedCommands }),
      });
      const result = await response.json();

      // Keep Telegram chat menu button to default so BotFather's Mini App / Web App takes precedence
      try {
        await fetch(`${this.getBaseUrl()}/bot${token}/setChatMenuButton`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menu_button: { type: "default" } }),
        });
      } catch {
        // non-blocking
      }

      if (result.ok) {
        this.addLog("success", "لیست دستورات ربات تلگرام با موفقیت همگام‌سازی شد", { count: formattedCommands.length });
        return { success: true };
      } else {
        const errMsg = result.description || "خطای ناشناخته در همگام‌سازی منو";
        this.addLog("error", `خطا در همگام‌سازی دستورات منو: ${errMsg}`);
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      this.addLog("error", `عدم امکان همگام‌سازی دستورات با تلگرام: ${err.message}`);
      return { success: false, error: err.message || "خطای ارتباط با تلگرام" };
    }
  }

  /**
   * Remove chat menu commands and restore default Telegram Mini App / Web App button
   */
  public async removeChatMenuAndCommands(): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.config.botToken?.trim();
    if (!token) {
      return { success: false, error: "توکن ربات تلگرام تنظیم نشده است" };
    }

    try {
      // 1. Delete all commands from Telegram API so the / commands popup disappears
      await fetch(`${this.getBaseUrl()}/bot${token}/deleteMyCommands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // 2. Set chat menu button to default so BotFather's Mini App / Web App button takes over
      await fetch(`${this.getBaseUrl()}/bot${token}/setChatMenuButton`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_button: { type: "default" } }),
      });

      this.addLog("info", "منوی دستورات کنار چت حذف شد و دکمه پیش‌فرض تلگرام (برنامک وب / Mini App) فعال گردید.");
      return {
        success: true,
        message: "منوی دستورات کنار چت با موفقیت حذف شد و دکمه پیش‌فرض برنامک تلگرام (Mini App) فعال گردید.",
      };
    } catch (err: any) {
      this.addLog("error", `خطا در حذف منوی کنار چت: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Build dynamic Reply Keyboard Markup strictly reflecting current botCommands and menuButtons
   */
  public buildMainReplyKeyboard(): any {
    const keyboardRows: any[][] = [];

    // Always include phone registration button
    keyboardRows.push([
      {
        text: "📱 ارسال شماره تلفن من",
        request_contact: true,
      },
    ]);

    const btnItems: any[] = [];

    // Dynamically derive buttons strictly from enabled root bot commands (excluding /start and sub-commands)
    const enabledCmds = (this.config.botCommands || []).filter(c => c.isEnabled && c.command !== "/start" && !c.parentId);
    for (const c of enabledCmds) {
      let label = c.description?.trim();
      if (!label || label.length > 28) {
        if (c.command === "/contact") label = "📞 تماس با پشتیبانی";
        else if (c.command === "/products") label = "🛒 مشاهده محصولات";
        else if (c.command === "/about") label = "ℹ️ درباره ما";
        else if (c.command === "/help") label = "❓ راهنما";
        else if (c.command === "/track") label = "📦 پیگیری سفارش";
        else label = c.command;
      }
      btnItems.push({ text: label });
    }

    // Split buttons into 2 per row
    for (let i = 0; i < btnItems.length; i += 2) {
      keyboardRows.push(btnItems.slice(i, i + 2));
    }

    return {
      keyboard: keyboardRows,
      resize_keyboard: true,
      one_time_keyboard: false,
    };
  }

  /**
   * Build sub-menu Reply Keyboard Markup for a command that has sub-commands
   */
  public buildSubMenuReplyKeyboard(parentCmdId: string): any {
    const parentCmd = (this.config.botCommands || []).find(c => c.id === parentCmdId);
    const subCmds = (this.config.botCommands || []).filter(c => c.isEnabled && c.parentId === parentCmdId);
    if (subCmds.length === 0) return null;

    const keyboardRows: any[][] = [];
    const btnItems: any[] = [];
    for (const sub of subCmds) {
      let label = sub.description?.trim() || sub.command;
      btnItems.push({ text: label });
    }
    for (let i = 0; i < btnItems.length; i += 2) {
      keyboardRows.push(btnItems.slice(i, i + 2));
    }

    // Dynamic multi-level navigation row
    if (parentCmd && parentCmd.parentId) {
      const grandParentCmd = (this.config.botCommands || []).find(c => c.id === parentCmd.parentId);
      const grandParentLabel = grandParentCmd?.description?.trim() || grandParentCmd?.command;
      
      const backBtnLabel = grandParentLabel ? `🔙 بازگشت به ${grandParentLabel}` : "🔙 بازگشت به منوی قبلی";
      keyboardRows.push([
        { text: backBtnLabel },
        { text: "🏠 منوی اصلی" }
      ]);
    } else {
      keyboardRows.push([{ text: "🔙 بازگشت به منوی اصلی" }]);
    }

    return {
      keyboard: keyboardRows,
      resize_keyboard: true,
      one_time_keyboard: false,
    };
  }

  /**
   * Build dynamic Inline Keyboard Markup based on custom menuButtons
   */
  public buildInlineKeyboard(): any {
    const inlineKeyboard: any[] = [];
    const rows: any[] = [];

    if (this.config.menuButtons && this.config.menuButtons.length > 0) {
      for (const btn of this.config.menuButtons) {
        if (btn.type === "url" && btn.value?.startsWith("http")) {
          rows.push({ text: btn.text, url: btn.value });
        } else {
          rows.push({ text: btn.text, callback_data: btn.value });
        }
      }
    }

    for (let i = 0; i < rows.length; i += 2) {
      inlineKeyboard.push(rows.slice(i, i + 2));
    }

    return inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;
  }

  /**
   * Sync menu silently with Telegram without sending change reports or messages to users
   */
  public async pushMenuToUsers(): Promise<{ success: boolean; sentCount: number; message?: string }> {
    const syncRes = await this.syncCommandsWithTelegram();
    this.addLog("info", "منوی ربات در سرور تلگرام به صورت خاموش و بدون ارسال پیام به کاربران همگام‌سازی شد.");
    return {
      success: syncRes.success,
      sentCount: 0,
      message: syncRes.success
        ? "منو و دکمه‌های ربات بدون ارسال هیچ پیامی به کاربران، در سرور تلگرام با موفقیت همگام‌سازی شد."
        : (syncRes.error || "خطا در همگام‌سازی"),
    };
  }

  private getBaseUrl(): string {
    const custom = this.config.apiBaseUrl?.trim();
    if (custom && custom.startsWith("http")) {
      return custom.replace(/\/$/, "");
    }
    return "https://api.telegram.org";
  }

  /**
   * Telegram Bot API: getMe
   */
  public async getMe(): Promise<{ success: boolean; data?: any; error?: string }> {
    const token = this.config.botToken?.trim();
    if (!token) {
      return { success: false, error: "توکن ربات تلگرام تنظیم نشده است" };
    }

    try {
      const url = `${this.getBaseUrl()}/bot${token}/getMe`;
      const response = await fetch(url, { method: "GET" });
      const result = await response.json();

      if (result.ok && result.result) {
        this.config.botUsername = result.result.username;
        this.config.botFirstName = result.result.first_name;
        this.config.botId = result.result.id;
        this.config.stats.lastActiveAt = new Date().toISOString();
        this.saveConfigToFile(this.config);
        this.addLog("success", `ارتباط با ربات @${result.result.username} برقرار شد`, result.result);
        return { success: true, data: result.result };
      } else {
        const errMsg = result.description || "خطای ناشناخته از تلگرام";
        this.addLog("error", `خطای اعتبارسنجی توکن: ${errMsg}`);
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      this.addLog("error", `عدم امکان برقراری ارتباط با تلگرام: ${err.message}`);
      return { success: false, error: err.message || "خطای اتصال به سرور تلگرام" };
    }
  }

  /**
   * Helper to handle blocked user state gracefully
   */
  private handleUserBlocked(chatId: string | number) {
    const user = (this.config.botUsers || []).find(u => String(u.chatId) === String(chatId));
    if (user && !user.isBlocked) {
      user.isBlocked = true;
      this.saveConfigToFile(this.config);
      this.addLog("info", `کاربر با شناسه چت ${chatId} ربات را متوقف یا مسدود نموده است.`);
    }
  }

  /**
   * Telegram Bot API: sendMessage
   */
  public async sendMessage(
    chatId: string | number,
    text: string,
    options?: {
      parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
      reply_markup?: any;
    }
  ): Promise<{ success: boolean; messageId?: number; error?: string; wasBlocked?: boolean }> {
    const token = this.config.botToken?.trim();
    if (!token) {
      return { success: false, error: "توکن ربات تنظیم نشده است" };
    }

    // Check if user is known to be blocked
    const existingUser = (this.config.botUsers || []).find(u => String(u.chatId) === String(chatId));
    if (existingUser?.isBlocked) {
      return { success: false, error: "کاربر ربات را مسدود نموده است", wasBlocked: true };
    }

    // Ensure non-empty text to prevent Telegram API "message text is empty" error
    const sendText = text?.trim() || "درخواست شما دریافت شد.";

    const executeFetch = async (reqBody: Record<string, any>) => {
      const url = `${this.getBaseUrl()}/bot${token}/sendMessage`;
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(15000), // 15s timeout
      });
    };

    try {
      const body: Record<string, any> = {
        chat_id: chatId,
        text: sendText,
        parse_mode: options?.parse_mode || "HTML",
      };

      if (options?.reply_markup) {
        body.reply_markup = options.reply_markup;
      }

      let response: Response;
      try {
        response = await executeFetch(body);
      } catch (firstErr: any) {
        // Socket closed or transient fetch error -> retry once after short pause
        console.warn(`⚠️ [Telegram Bot] SendMessage fetch glitch (${firstErr.message}), retrying once...`);
        await new Promise(r => setTimeout(r, 400));
        response = await executeFetch(body);
      }

      let result = await response.json();

      // Check if user blocked the bot
      if (!result.ok && result.description?.includes("bot was blocked by the user")) {
        this.handleUserBlocked(chatId);
        console.warn(`⚠️ [Telegram Bot] Bot blocked by user ${chatId}`);
        return { success: false, error: "کاربر ربات را مسدود یا متوقف کرده است", wasBlocked: true };
      }

      // If Telegram rejects due to HTML entity parsing failure (e.g. invalid HTML tags or unescaped & in URLs)
      if (!result.ok && options?.parse_mode && (
        result.description?.includes("can't parse entities") ||
        result.description?.includes("tag") ||
        result.description?.includes("unmatched") ||
        result.description?.includes("Unsupported")
      )) {
        console.warn("⚠️ [Telegram Bot] HTML parse mode failed, retrying without parse_mode:", result.description);
        const retryBody = { ...body };
        delete retryBody.parse_mode;
        retryBody.text = sendText.replace(/<[^>]*>/g, ""); // strip HTML tags for plain text
        const retryResponse = await executeFetch(retryBody);
        result = await retryResponse.json();
      }

      if (result.ok && result.result) {
        this.config.stats.totalMessagesSent = (this.config.stats.totalMessagesSent || 0) + 1;
        this.config.stats.lastActiveAt = new Date().toISOString();
        this.saveConfigToFile(this.config);
        return { success: true, messageId: result.result.message_id };
      } else {
        if (!result.description?.includes("blocked")) {
          console.error("❌ Telegram sendMessage error:", result.description);
        }
        return { success: false, error: result.description || "ارسال پیام با خطا مواجه شد" };
      }
    } catch (err: any) {
      console.warn("⚠️ [Telegram Bot] sendMessage network exception:", err.message);
      return { success: false, error: err.message || "خطای شبکه در ارسال پیام به تلگرام" };
    }
  }

  /**
   * Send response with media (photo, video, document, audio) or fallback to text sendMessage
   */
  public async sendMediaResponse(
    chatId: string | number,
    text: string,
    mediaType?: "photo" | "video" | "document" | "audio" | "none",
    mediaUrl?: string,
    options?: {
      parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
      reply_markup?: any;
    }
  ): Promise<{ success: boolean; messageId?: number; error?: string; wasBlocked?: boolean }> {
    const token = this.config.botToken?.trim();
    const cleanMediaUrl = mediaUrl?.trim() || "";
    const captionText = text?.trim() || "";

    // Skip if user is known to be blocked
    const existingUser = (this.config.botUsers || []).find(u => String(u.chatId) === String(chatId));
    if (existingUser?.isBlocked) {
      return { success: false, error: "کاربر ربات را مسدود نموده است", wasBlocked: true };
    }

    // Robust fallback handler: ensures link is sent as text + inline button if Telegram media fails or isn't a direct file
    const sendFallbackWithMessageAndUrl = async () => {
      let fallbackText = captionText;
      if (cleanMediaUrl) {
        if (fallbackText) {
          if (!fallbackText.includes(cleanMediaUrl)) {
            fallbackText += `\n\n🎥 <b>مشاهده ویدیو / لینک:</b>\n${cleanMediaUrl}`;
          }
        } else {
          fallbackText = `🎥 <b>مشاهده ویدیو / لینک:</b>\n${cleanMediaUrl}`;
        }
      }
      if (!fallbackText) {
        fallbackText = "درخواست شما دریافت شد.";
      }

      // Attach inline button if cleanMediaUrl is an HTTP/HTTPS link
      const fallbackOptions = { ...options };
      if (cleanMediaUrl.startsWith("http")) {
        const existingInline = options?.reply_markup?.inline_keyboard || [];
        const hasUrlButton = existingInline.some((row: any[]) => row.some((btn: any) => btn.url === cleanMediaUrl));
        if (!hasUrlButton) {
          fallbackOptions.reply_markup = {
            ...options?.reply_markup,
            inline_keyboard: [
              ...existingInline,
              [{ text: "🎥 تماشای ویدیو / بازکردن لینک", url: cleanMediaUrl }]
            ]
          };
        }
      }

      return this.sendMessage(chatId, fallbackText, fallbackOptions);
    };

    if (!token || !mediaType || mediaType === "none" || !cleanMediaUrl) {
      return sendFallbackWithMessageAndUrl();
    }

    try {
      let telegramMethod = "sendPhoto";
      let paramName = "photo";

      if (mediaType === "video") {
        telegramMethod = "sendVideo";
        paramName = "video";
      } else if (mediaType === "document") {
        telegramMethod = "sendDocument";
        paramName = "document";
      } else if (mediaType === "audio") {
        telegramMethod = "sendAudio";
        paramName = "audio";
      }

      // Check if mediaUrl is a local file path
      const isLocal = cleanMediaUrl.startsWith("/uploads/") || cleanMediaUrl.startsWith("uploads/") || cleanMediaUrl.startsWith("/stamppic/") || cleanMediaUrl.startsWith("stamppic/");

      if (isLocal) {
        const relativePath = cleanMediaUrl.startsWith("/") ? cleanMediaUrl.slice(1) : cleanMediaUrl;
        const localPath = path.join(process.cwd(), relativePath);

        if (fs.existsSync(localPath)) {
          const fileBuffer = fs.readFileSync(localPath);
          const fileName = path.basename(localPath);
          const formData = new FormData();

          formData.append("chat_id", String(chatId));
          if (captionText) {
            formData.append("caption", captionText);
            formData.append("parse_mode", options?.parse_mode || "HTML");
          }
          if (options?.reply_markup) {
            formData.append("reply_markup", JSON.stringify(options.reply_markup));
          }

          const blob = new Blob([fileBuffer]);
          formData.append(paramName, blob, fileName);

          const url = `${this.getBaseUrl()}/bot${token}/${telegramMethod}`;

          let response: Response;
          try {
            response = await fetch(url, {
              method: "POST",
              body: formData,
              signal: AbortSignal.timeout(25000), // 25s for local file upload
            });
          } catch (localErr: any) {
            console.warn(`⚠️ [Telegram Bot] Local file upload fetch glitch (${localErr.message}), retrying fallback...`);
            return sendFallbackWithMessageAndUrl();
          }

          const result = await response.json();
          if (result.ok && result.result) {
            this.config.stats.totalMessagesSent = (this.config.stats.totalMessagesSent || 0) + 1;
            this.config.stats.lastActiveAt = new Date().toISOString();
            this.saveConfigToFile(this.config);
            return { success: true, messageId: result.result.message_id };
          } else {
            if (result.description?.includes("bot was blocked by the user")) {
              this.handleUserBlocked(chatId);
              return { success: false, error: "کاربر ربات را مسدود کرده است", wasBlocked: true };
            }
            console.warn(`⚠️ Telegram ${telegramMethod} local file error:`, result.description);
            return sendFallbackWithMessageAndUrl();
          }
        }
      }

      // Remote URL or File ID
      const url = `${this.getBaseUrl()}/bot${token}/${telegramMethod}`;
      const body: Record<string, any> = {
        chat_id: chatId,
        [paramName]: cleanMediaUrl,
        caption: captionText,
        parse_mode: options?.parse_mode || "HTML",
      };

      if (options?.reply_markup) {
        body.reply_markup = options.reply_markup;
      }

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20000), // 20s network timeout
        });
      } catch (fetchErr: any) {
        console.warn(`⚠️ [Telegram Bot] Remote media fetch glitch (${fetchErr.message}), falling back to text message...`);
        return sendFallbackWithMessageAndUrl();
      }

      const result = await response.json();
      if (result.ok && result.result) {
        this.config.stats.totalMessagesSent = (this.config.stats.totalMessagesSent || 0) + 1;
        this.config.stats.lastActiveAt = new Date().toISOString();
        this.saveConfigToFile(this.config);
        return { success: true, messageId: result.result.message_id };
      } else {
        if (result.description?.includes("bot was blocked by the user")) {
          this.handleUserBlocked(chatId);
          return { success: false, error: "کاربر ربات را مسدود کرده است", wasBlocked: true };
        }
        console.warn(`⚠️ Telegram ${telegramMethod} remote error:`, result.description);
        return sendFallbackWithMessageAndUrl();
      }
    } catch (err: any) {
      console.warn(`⚠️ Error sending media response (${err.message}), falling back to text message...`);
      return sendFallbackWithMessageAndUrl();
    }
  }

  /**
   * Telegram Bot API: setWebhook
   */
  public async setWebhook(webhookUrl: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.config.botToken?.trim();
    if (!token) {
      return { success: false, error: "توکن ربات تنظیم نشده است" };
    }

    // Stop polling if active before setting webhook to avoid Telegram 409 conflict
    this.stopPolling();

    try {
      let cleanUrl = webhookUrl?.trim() || "";
      if (cleanUrl.startsWith("http://")) {
        cleanUrl = cleanUrl.replace(/^http:\/\//, "https://");
      }
      if (!cleanUrl.startsWith("https://")) {
        cleanUrl = `https://${cleanUrl}`;
      }

      const url = `${this.getBaseUrl()}/bot${token}/setWebhook`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: cleanUrl,
          allowed_updates: ["message", "edited_message", "callback_query", "channel_post"],
        }),
      });

      const result = await response.json();
      if (result.ok) {
        this.config.webhookUrl = cleanUrl;
        this.config.isWebhookSet = true;
        this.saveConfigToFile(this.config);
        this.addLog("success", `وب‌هوک تلگرام با موفقیت روی آدرس ${cleanUrl} تنظیم شد`);
        return { success: true, message: result.description || "وب‌هوک با موفقیت فعال شد" };
      } else {
        this.addLog("error", `خطا در فعال‌سازی وب‌هوک: ${result.description}`);
        return { success: false, error: result.description || "خطا در تنظیم وب‌هوک" };
      }
    } catch (err: any) {
      this.addLog("error", `خطای اتصال در تنظیم وب‌هوک: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Telegram Bot API: deleteWebhook
   */
  public async deleteWebhook(): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.config.botToken?.trim();
    if (!token) {
      return { success: false, error: "توکن ربات تنظیم نشده است" };
    }

    try {
      const url = `${this.getBaseUrl()}/bot${token}/deleteWebhook?drop_pending_updates=false`;
      const response = await fetch(url, { method: "POST" });
      const result = await response.json();

      if (result.ok) {
        this.config.isWebhookSet = false;
        this.saveConfigToFile(this.config);
        this.addLog("info", "وب‌هوک تلگرام غیرفعال شد");
        return { success: true, message: result.description || "وب‌هوک حذف شد" };
      } else {
        return { success: false, error: result.description || "خطا در حذف وب‌هوک" };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Telegram Bot API: getWebhookInfo
   */
  public async getWebhookInfo(): Promise<{ success: boolean; data?: any; error?: string }> {
    const token = this.config.botToken?.trim();
    if (!token) {
      return { success: false, error: "توکن ربات تنظیم نشده است" };
    }

    try {
      const url = `${this.getBaseUrl()}/bot${token}/getWebhookInfo`;
      const response = await fetch(url, { method: "GET" });
      const result = await response.json();

      if (result.ok && result.result) {
        this.config.isWebhookSet = Boolean(result.result.url);
        if (result.result.url) {
          this.config.webhookUrl = result.result.url;
        }
        this.saveConfigToFile(this.config);
        return { success: true, data: result.result };
      } else {
        return { success: false, error: result.description || "خطا در دریافت وضعیت وب‌هوک" };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Polling Engine: Get Current Polling Status
   */
  public getPollingStatus(): {
    isPolling: boolean;
    lastUpdateId: number;
    isWebhookSet: boolean;
    isEnabled: boolean;
    hasToken: boolean;
  } {
    return {
      isPolling: this.isPolling,
      lastUpdateId: this.lastUpdateId,
      isWebhookSet: Boolean(this.config.isWebhookSet),
      isEnabled: Boolean(this.config.isEnabled),
      hasToken: Boolean(this.config.botToken?.trim()),
    };
  }

  /**
   * Polling Engine: Start Long Polling
   */
  public async startPolling(storage: IStorage): Promise<{ success: boolean; message: string }> {
    this.storageInstance = storage;

    const token = this.config.botToken?.trim();
    if (!token) {
      return { success: false, message: "توکن ربات تلگرام تنظیم نشده است" };
    }

    if (!this.config.isEnabled) {
      return { success: false, message: "ربات تلگرام در تنظیمات غیرفعال است" };
    }

    if (this.isPolling && this.pollingLoopRunning) {
      return { success: true, message: "دریافت خودکار پیام‌ها (Polling) در حال حاضر فعال است" };
    }

    // If webhook is set, delete it first to allow getUpdates
    try {
      await this.deleteWebhook();
    } catch (e) {
      // ignore
    }

    this.isPolling = true;
    this.pollingAbortController = new AbortController();
    this.addLog("info", "سرویس دریافت خودکار پیام‌های ربات تلگرام (Long Polling) فعال شد");
    console.log("🚀 [Telegram Bot] Long Polling started successfully.");

    // Run the async polling loop in background
    this.runPollingLoop();

    return { success: true, message: "دریافت زنده پیام‌ها (Polling) با موفقیت فعال گردید" };
  }

  /**
   * Polling Engine: Stop Long Polling
   */
  public stopPolling(): { success: boolean; message: string } {
    if (!this.isPolling) {
      return { success: true, message: "Polling قبلاً متوقف شده است" };
    }

    this.isPolling = false;
    if (this.pollingAbortController) {
      try {
        this.pollingAbortController.abort();
      } catch (e) {
        // ignore
      }
      this.pollingAbortController = null;
    }

    this.addLog("info", "سرویس Polling ربات تلگرام متوقف شد");
    console.log("🛑 [Telegram Bot] Long Polling stopped.");
    return { success: true, message: "دریافت خودکار پیام‌ها متوقف شد" };
  }

  /**
   * Internal Background Polling Loop
   */
  private async runPollingLoop(): Promise<void> {
    if (this.pollingLoopRunning) return;
    this.pollingLoopRunning = true;

    while (this.isPolling) {
      const token = this.config.botToken?.trim();
      if (!token || !this.config.isEnabled || !this.storageInstance) {
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }

      try {
        const offset = this.lastUpdateId > 0 ? this.lastUpdateId + 1 : 0;
        const url = `${this.getBaseUrl()}/bot${token}/getUpdates?offset=${offset}&timeout=20&allowed_updates=["message","edited_message","callback_query"]`;

        const response = await fetch(url, {
          method: "GET",
          signal: this.pollingAbortController?.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          // If conflict due to webhook, auto-delete webhook and retry
          if (errData.description?.includes("can't use getUpdates") || errData.description?.includes("Conflict")) {
            console.warn("⚠️ [Telegram Bot] Conflict detected with webhook. Auto-deleting webhook...");
            await this.deleteWebhook();
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }

        const data = await response.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            if (update.update_id >= this.lastUpdateId) {
              this.lastUpdateId = update.update_id;
            }

            try {
              if (this.storageInstance) {
                await this.handleWebhookUpdate(update, this.storageInstance);
              }
            } catch (handleErr: any) {
              console.error("❌ [Telegram Bot] Error handling update:", handleErr);
            }
          }
        }
      } catch (loopErr: any) {
        if (loopErr.name === "AbortError" || !this.isPolling) {
          break;
        }
        // Network timeout or temporary glitch: wait 2.5 seconds before retrying
        await new Promise((r) => setTimeout(r, 2500));
      }
    }

    this.pollingLoopRunning = false;
  }

  /**
   * Sends a test message to the configured adminChatId or custom recipient
   */
  public async sendTestMessage(targetChatId?: string, customText?: string): Promise<{ success: boolean; message: string }> {
    const target = targetChatId?.trim() || this.config.adminChatId?.trim();
    if (!target) {
      return {
        success: false,
        message: "شناسه چت (Chat ID) یا کانال مقصد جهت ارسال تست وارد نشده است",
      };
    }

    const timeStr = new Date().toLocaleTimeString("fa-IR");
    const dateStr = new Date().toLocaleDateString("fa-IR");
    
    const text = customText?.trim() || 
      `🤖 <b>پیام تست ربات تلگرام رخش</b>\n\n` +
      `✅ ارتباط با بات با موفقیت برقرار است!\n` +
      `📅 تاریخ: ${dateStr}\n` +
      `⏰ ساعت: ${timeStr}\n` +
      `🔗 وضعیت سامانه: فعال و متصل\n\n` +
      `<i>این پیام جهت اطمینان از عملکرد صحیح اعلان‌های تلگرام ارسال شده است.</i>`;

    const res = await this.sendMessage(target, text, { parse_mode: "HTML" });
    if (res.success) {
      this.addLog("success", `پیام تست با موفقیت به چت ${target} ارسال شد`);
      return { success: true, message: `پیام تست به چت ${target} ارسال شد` };
    } else {
      this.addLog("error", `خطا در ارسال پیام تست به ${target}: ${res.error}`);
      return { success: false, message: res.error || "ارسال پیام تست ناموفق بود" };
    }
  }

  /**
   * Broadcast announcement message
   */
  public async broadcast(
    chatIds: string[],
    text: string,
    button?: { text: string; url: string }
  ): Promise<{ success: boolean; sentCount: number; failedCount: number; errors: string[] }> {
    if (!chatIds || chatIds.length === 0) {
      const defaultTarget = this.config.adminChatId?.trim();
      if (defaultTarget) chatIds = [defaultTarget];
    }

    if (!chatIds || chatIds.length === 0) {
      return { success: false, sentCount: 0, failedCount: 0, errors: ["مقصدی برای ارسال پیام مشخص نشده است"] };
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    const replyMarkup = button?.text && button?.url ? {
      inline_keyboard: [
        [{ text: button.text, url: button.url }]
      ]
    } : undefined;

    for (const chatId of chatIds) {
      const res = await this.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      });

      if (res.success) {
        sent++;
      } else {
        failed++;
        if (res.error) errors.push(`${chatId}: ${res.error}`);
      }
    }

    this.addLog(
      sent > 0 ? "success" : "error",
      `ارسال همگانی انجام شد: ${sent} ارسال موفق، ${failed} ناموفق`
    );

    return {
      success: sent > 0,
      sentCount: sent,
      failedCount: failed,
      errors,
    };
  }

  /**
   * Automated Admin Notification dispatcher
   */
  public async sendAdminNotification(
    eventType: string,
    title: string,
    messageLines: string[]
  ): Promise<boolean> {
    if (!this.config.isEnabled) return false;
    
    // Check if key exists in config notifications and is turned off
    const notificationsObj = this.config.notifications as any;
    if (eventType in notificationsObj) {
      if (!notificationsObj[eventType]) return false;
    }
    
    const adminChatId = this.config.adminChatId?.trim();
    if (!adminChatId) return false;

    const timeStr = new Date().toLocaleTimeString("fa-IR");
    const dateStr = new Date().toLocaleDateString("fa-IR");

    const formattedText = 
      `🔔 <b>${title}</b>\n\n` +
      messageLines.map(line => `▫️ ${line}`).join("\n") +
      `\n\n🕒 ${dateStr} - ${timeStr}`;

    const res = await this.sendMessage(adminChatId, formattedText, { parse_mode: "HTML" });
    if (res.success) {
      this.addLog("notification", `اعلان «${title}» به ادمین ارسال شد`);
      return true;
    } else {
      this.addLog("warning", `عدم موفقیت در ارسال اعلان تلگرام: ${res.error}`);
      return false;
    }
  }

  /**
   * Send formatted User List to Telegram Chat
   */
  public async sendUsersListToTelegram(
    targetChatId: string | number,
    storage: IStorage,
    options?: { limit?: number; role?: string; search?: string }
  ): Promise<{ success: boolean; totalUsers: number; message: string }> {
    const allUsers = await storage.getAllUsers();
    if (!allUsers || allUsers.length === 0) {
      await this.sendMessage(targetChatId, "👥 در حال حاضر هیچ کاربری در سامانه ثبت نشده است.", { parse_mode: "HTML" });
      return { success: true, totalUsers: 0, message: "هیچ کاربری در سامانه یافت نشد" };
    }

    const total = allUsers.length;
    const adminCount = allUsers.filter(u => u.role === "admin").length;
    const level1Count = allUsers.filter(u => u.role === "user_level_1").length;
    const blockedCount = allUsers.filter(u => u.isBlocked).length;

    let filtered = [...allUsers];

    if (options?.role && options.role !== "all") {
      filtered = filtered.filter(u => u.role === options.role);
    }

    if (options?.search) {
      const q = options.search.trim().toLowerCase();
      filtered = filtered.filter(u => 
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.firstName && u.firstName.toLowerCase().includes(q)) ||
        (u.lastName && u.lastName.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    filtered.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    const limit = options?.limit || 20;
    const displayUsers = filtered.slice(0, limit);

    const timeStr = new Date().toLocaleTimeString("fa-IR");
    const dateStr = new Date().toLocaleDateString("fa-IR");

    const searchNote = options?.search ? `🔎 جستجو: <b>${options.search}</b>\n` : "";
    const roleNote = options?.role && options.role !== "all" ? `🏷 فیلتر نقش: <b>${options.role}</b>\n` : "";

    const summaryHeader = 
      `👥 <b>گزارش لیست کاربران سامانه رخش</b>\n\n` +
      `📊 <b>خلاصه وضعیت کاربران:</b>\n` +
      `▫️ کل کاربران ثبت‌شده: <b>${total.toLocaleString("fa-IR")} نفر</b>\n` +
      `▫️ مدیران سیستم (Admin): <b>${adminCount.toLocaleString("fa-IR")} نفر</b>\n` +
      `▫️ کاربران عادی / سطح یک: <b>${level1Count.toLocaleString("fa-IR")} نفر</b>\n` +
      (blockedCount > 0 ? `▫️ کاربران مسدود: <b>${blockedCount.toLocaleString("fa-IR")} نفر</b>\n` : "") +
      searchNote + roleNote +
      `\n📋 <b>نمایش ${displayUsers.length.toLocaleString("fa-IR")} کاربر اخیر:</b>\n` +
      `────────────────────\n\n`;

    if (displayUsers.length === 0) {
      const msg = summaryHeader + `⚠️ کاربری با مشخصات درخواستی یافت نشد.`;
      await this.sendMessage(targetChatId, msg, { parse_mode: "HTML" });
      return { success: true, totalUsers: total, message: "کاربری یافت نشد" };
    }

    let usersText = "";
    displayUsers.forEach((u, idx) => {
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "بدون نام";
      const roleBadge = u.role === "admin" ? "👑 مدیر کل" : "👤 کاربر";
      const statusBadge = u.isBlocked ? "🔴 مسدود" : "🟢 فعال";
      const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString("fa-IR") : "نامشخص";

      usersText += 
        `<b>${idx + 1}. ${fullName}</b> (${roleBadge})\n` +
        `📱 موبایل: <code>${u.phone || "-"}</code>\n` +
        `🏷 نام کاربری: <code>${u.username || "-"}</code>\n` +
        (u.email ? `✉️ ایمیل: <code>${u.email}</code>\n` : "") +
        (u.storeName ? `🏬 فروشگاه: ${u.storeName}\n` : "") +
        `📅 عضویت: ${regDate} | وضعیت: ${statusBadge}\n` +
        `────────────────────\n`;
    });

    const fullMessage = summaryHeader + usersText + `\n🕒 زمان گزارش: ${dateStr} - ${timeStr}`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "🔄 بروزرسانی لیست کاربران", callback_data: "/users" },
          { text: "🛒 محصولات فروشگاه", callback_data: "/products" },
        ]
      ]
    };

    if (fullMessage.length > 4000) {
      await this.sendMessage(targetChatId, summaryHeader, { parse_mode: "HTML" });
      
      for (let i = 0; i < displayUsers.length; i += 7) {
        const chunk = displayUsers.slice(i, i + 7);
        let chunkMsg = "";
        chunk.forEach((u, cIdx) => {
          const idx = i + cIdx + 1;
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "بدون نام";
          const roleBadge = u.role === "admin" ? "👑 مدیر" : "👤 کاربر";
          const statusBadge = u.isBlocked ? "🔴 مسدود" : "🟢 فعال";
          const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString("fa-IR") : "-";

          chunkMsg += 
            `<b>${idx}. ${fullName}</b> (${roleBadge})\n` +
            `📱 <code>${u.phone || "-"}</code> | 🏷 <code>${u.username || "-"}</code>\n` +
            `📅 ${regDate} | ${statusBadge}\n\n`;
        });
        const isLast = (i + 7) >= displayUsers.length;
        await this.sendMessage(targetChatId, chunkMsg, { 
          parse_mode: "HTML",
          reply_markup: isLast ? inlineKeyboard : undefined
        });
      }
    } else {
      await this.sendMessage(targetChatId, fullMessage, { parse_mode: "HTML", reply_markup: inlineKeyboard });
    }

    this.addLog("info", `لیست کاربران (${displayUsers.length} نفر) به تلگرام چت ${targetChatId} ارسال شد`);
    return { 
      success: true, 
      totalUsers: total, 
      message: `لیست ${displayUsers.length} کاربر با موفقیت به تلگرام ارسال شد` 
    };
  }

  /**
   * Incoming Webhook Update Handler
   */
  public async handleWebhookUpdate(update: any, storage: IStorage): Promise<{ handled: boolean }> {
    this.config.stats.totalUpdatesReceived = (this.config.stats.totalUpdatesReceived || 0) + 1;
    this.config.stats.lastActiveAt = new Date().toISOString();
    this.saveConfigToFile(this.config);

    const callbackQuery = update.callback_query;
    const message = update.message || update.edited_message || callbackQuery?.message;
    
    // Answer callback query if applicable
    if (callbackQuery?.id) {
      const token = this.config.botToken?.trim();
      if (token) {
        fetch(`${this.getBaseUrl()}/bot${token}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: callbackQuery.id }),
        }).catch(() => {});
      }
    }

    const chatId = callbackQuery ? callbackQuery.message?.chat?.id : message?.chat?.id;
    if (!chatId) return { handled: false };

    const fromObj = callbackQuery ? callbackQuery.from : message?.from;
    const senderName = [fromObj?.first_name, fromObj?.last_name].filter(Boolean).join(" ") || "کاربر عزیز";

    const isAdminChat = Boolean(this.config.adminChatId && String(chatId) === String(this.config.adminChatId));
    const mainReplyKeyboard = this.buildMainReplyKeyboard();
    const inlineReplyMarkup = this.buildInlineKeyboard();

    // =========================================================================
    // CASE 1: USER SHARED PHONE NUMBER / CONTACT
    // =========================================================================
    if (message?.contact) {
      const contact = message.contact;
      const rawPhone = contact.phone_number || "";
      const normalizedPhone = normalizeIranianPhone(rawPhone);

      const registeredUser = this.recordBotUser({
        chatId: String(chatId),
        username: fromObj?.username,
        firstName: contact.first_name || fromObj?.first_name,
        lastName: contact.last_name || fromObj?.last_name,
        languageCode: fromObj?.language_code,
        phoneNumber: normalizedPhone,
        phoneVerifiedAt: new Date().toISOString(),
        text: `📱 شماره تماس ارسال شد: ${normalizedPhone}`,
      });

      if (registeredUser.isBlocked) {
        this.addLog("warning", `شماره تماس از کاربر مسدودشده دریافت شد: ${senderName} (${chatId})`);
        return { handled: true };
      }

      this.addLog("success", `شماره تلفن واقعی کاربر تلگرام دریافت و ذخیره شد: ${senderName} (${chatId}) -> ${normalizedPhone}`, {
        chatId,
        rawPhone,
        normalizedPhone,
        contact,
      });

      // Check if user exists in database storage
      let matchedAppUser: any = null;
      try {
        const allDbUsers = await storage.getAllUsers();
        matchedAppUser = allDbUsers.find((u) => {
          if (!u.phone) return false;
          return normalizeIranianPhone(u.phone) === normalizedPhone;
        });
      } catch (err) {
        // ignore
      }

      let confirmationText = `✅ <b>شماره تلفن شما با موفقیت تایید و ذخیره شد:</b>\n📱 <code>${normalizedPhone}</code>\n\nاطلاعات تماس شما در پایگاه‌داده سامانه ثبت گردید.`;

      if (matchedAppUser) {
        const dbFullName = [matchedAppUser.firstName, matchedAppUser.lastName].filter(Boolean).join(" ") || matchedAppUser.username;
        confirmationText += `\n\n🎉 <i>حساب کاربری شما در سامانه با موفقیت شناسایی و متصل گردید (${dbFullName}).</i>`;
      }

      confirmationText += `\n\nاز طریق منوی زیر می‌توانید به خدمات مختلف دسترسی داشته باشید:`;

      await this.sendMessage(chatId, confirmationText, {
        parse_mode: "HTML",
        reply_markup: mainReplyKeyboard,
      });

      if (inlineReplyMarkup) {
        await this.sendMessage(chatId, "دستورات و لینک‌های سریع:", {
          parse_mode: "HTML",
          reply_markup: inlineReplyMarkup,
        });
      }

      return { handled: true };
    }

    let text = (callbackQuery ? callbackQuery.data : message?.text)?.trim() || "";
    if (!text) {
      return { handled: false };
    }

    // Check if clicked button matches custom menuButtons
    const matchedMenuBtn = (this.config.menuButtons || []).find(
      b => b.text.trim().toLowerCase() === text.toLowerCase() ||
           b.value.trim().toLowerCase() === text.toLowerCase()
    );
    if (matchedMenuBtn) {
      if (matchedMenuBtn.type === "url") {
        await this.sendMessage(chatId, `🌐 <b>${matchedMenuBtn.text}</b>\n\nبرای مشاهده یا ورود روی لینک زیر کلیک کنید:\n🔗 ${matchedMenuBtn.value}`, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[{ text: matchedMenuBtn.text, url: matchedMenuBtn.value }]]
          }
        });
        return { handled: true };
      } else {
        text = matchedMenuBtn.value.trim();
      }
    }

    // Track/Record Bot User in Subscribers list
    const registeredUser = this.recordBotUser({
      chatId: String(chatId),
      username: fromObj?.username,
      firstName: fromObj?.first_name,
      lastName: fromObj?.last_name,
      languageCode: fromObj?.language_code,
      text: text,
    });

    if (registeredUser.isBlocked) {
      this.addLog("warning", `پیام از کاربر مسدودشده تلگرام نادیده گرفته شد: ${senderName} (${chatId})`);
      return { handled: true };
    }

    this.addLog("webhook", `پیام دریافتی از ${senderName} (${chatId}): "${text}"`);

    // =========================================================================
    // CASE 2: COMMANDS & TEXT MESSAGES
    // =========================================================================

    // User clicked or sent "ارسال شماره تلفن" as text (instead of using native contact button)
    if (text === "📱 ارسال شماره تلفن من" || text === "ارسال شماره تلفن" || text === "ارسال شماره") {
      await this.sendMessage(
        chatId,
        `ℹ️ <b>ارسال شماره تلفن:</b>\n\nلطفاً روی دکمه <b>«📱 ارسال شماره تلفن من»</b> که در صفحه کلید تلگرام شما قرار دارد کلیک کنید تا شماره همراه شما توسط تلگرام تایید و مستقیماً ارسال گردد.`,
        {
          parse_mode: "HTML",
          reply_markup: mainReplyKeyboard,
        }
      );
      return { handled: true };
    }

    // Command: /users or /userlist or لیست کاربران
    if (text === "/users" || text === "/userlist" || text === "لیست کاربران" || text === "کاربران" || text === "👥 لیست کاربران") {
      if (!isAdminChat) {
        await this.sendMessage(
          chatId,
          `⛔️ <b>دسترسی غیرمجاز</b>\n\nدریافت لیست کاربران سامانه صرفاً برای مدیر سیستم مجاز است.\nشناسه چت شما: <code>${chatId}</code>\nدر صورت لزوم این شناسه را در بخش ربات تلگرام پنل مدیریت ثبت کنید.`,
          { parse_mode: "HTML" }
        );
        return { handled: true };
      }

      await this.sendUsersListToTelegram(chatId, storage);
      return { handled: true };
    }

    // Command: /user <query> (search user)
    if (text.startsWith("/user ") || text.startsWith("/finduser ")) {
      if (!isAdminChat) {
        await this.sendMessage(
          chatId,
          `⛔️ <b>دسترسی غیرمجاز</b>\n\nجستجوی اطلاعات کاربران صرفاً برای مدیر سیستم مجاز می‌باشد.`,
          { parse_mode: "HTML" }
        );
        return { handled: true };
      }

      const query = text.replace(/^\/(user|finduser)\s+/, "").trim();
      if (!query) {
        await this.sendMessage(
          chatId,
          `ℹ️ راهنمای جستجوی کاربر:\n\nفرمت: <code>/user [نام یا موبایل یا نام کاربری]</code>\nمثال: <code>/user 0912</code>`,
          { parse_mode: "HTML" }
        );
        return { handled: true };
      }

      await this.sendUsersListToTelegram(chatId, storage, { search: query, limit: 10 });
      return { handled: true };
    }

    // Return to main menu if requested
    if (
      text === "🔙 بازگشت به منوی اصلی" ||
      text === "بازگشت به منوی اصلی" ||
      text === "🏠 منوی اصلی" ||
      text === "منوی اصلی" ||
      text === "بازگشت" ||
      text === "/menu"
    ) {
      await this.sendMessage(chatId, "به منوی اصلی بازگشتید. لطفاً گزینه مورد نظر خود را انتخاب کنید:", {
        parse_mode: "HTML",
        reply_markup: mainReplyKeyboard,
      });
      return { handled: true };
    }

    // Load commands list - Strictly only enabled commands!
    const botCommands = (this.config.botCommands || []).filter(c => c.isEnabled);

    // Multi-level Back button handler (e.g. "🔙 بازگشت به 📂 محصولات")
    if (text.startsWith("🔙 بازگشت به ") || text.startsWith("بازگشت به ")) {
      const targetLabel = text.replace(/^(🔙\s*)?بازگشت\s*به\s*/, "").trim().toLowerCase();
      if (targetLabel === "منوی اصلی" || targetLabel === "اصلی") {
        await this.sendMessage(chatId, "به منوی اصلی بازگشتید. لطفاً گزینه مورد نظر خود را انتخاب کنید:", {
          parse_mode: "HTML",
          reply_markup: mainReplyKeyboard,
        });
        return { handled: true };
      }

      // Find parent command by label or description
      const parentMatch = botCommands.find(c => {
        const cmd = c.command.trim().toLowerCase();
        const desc = c.description?.trim().toLowerCase();
        return (desc && (desc === targetLabel || desc.includes(targetLabel) || targetLabel.includes(desc))) ||
               (cmd && (cmd === targetLabel || cmd.includes(targetLabel) || targetLabel.includes(cmd)));
      });

      if (parentMatch) {
        const subMenu = this.buildSubMenuReplyKeyboard(parentMatch.id) || mainReplyKeyboard;
        await this.sendMediaResponse(
          chatId,
          parentMatch.response || `به منوی <b>${parentMatch.description || parentMatch.command}</b> بازگشتید.`,
          parentMatch.mediaType,
          parentMatch.mediaUrl,
          {
            parse_mode: "HTML",
            reply_markup: subMenu,
          }
        );
        return { handled: true };
      }
    }

    // Check if there is a match in our custom commands
    const matchedCmd = botCommands.find(c => {
      const normalizedCmd = c.command.trim().toLowerCase();
      const normalizedText = text.trim().toLowerCase();
      const cleanCmd = normalizedCmd.replace(/^\//, "");
      const cleanText = normalizedText.replace(/^\//, "").replace(/^[\u2000-\u3300\ud83c-\udff0\ufe00-\ufe0f\s]+/, "");
      const desc = c.description?.trim().toLowerCase();
      const cleanDesc = desc?.replace(/^[\u2000-\u3300\ud83c-\udff0\ufe00-\ufe0f\s]+/, "");

      return (
        normalizedText === normalizedCmd ||
        cleanText === cleanCmd ||
        normalizedText === desc ||
        cleanText === cleanDesc ||
        normalizedText.startsWith(normalizedCmd + " ") ||
        cleanText.startsWith(cleanCmd + " ") ||
        (desc && (normalizedText.includes(desc) || desc.includes(normalizedText) || cleanText.includes(cleanDesc || "") || (cleanDesc && cleanDesc.includes(cleanText)))) ||
        (normalizedCmd === "/start" && (cleanText === "شروع" || cleanText === "start")) ||
        (normalizedCmd === "/help" && (cleanText === "راهنما" || cleanText === "help")) ||
        (normalizedCmd === "/about" && (cleanText === "درباره ما" || cleanText === "about")) ||
        (normalizedCmd === "/contact" && (cleanText === "تماس با ما" || cleanText === "تماس با پشتیبانی" || cleanText === "contact")) ||
        (normalizedCmd === "/products" && (cleanText === "مشاهده محصولات" || cleanText === "products" || cleanText.includes("محصولات"))) ||
        (normalizedCmd === "/track" && (cleanText === "پیگیری سفارش" || cleanText === "track"))
      );
    });

    if (matchedCmd) {
      if (!matchedCmd.isEnabled) {
        await this.sendMessage(chatId, "⚠️ این بخش موقتاً توسط مدیر سیستم غیرفعال شده است.", {
          parse_mode: "HTML",
          reply_markup: mainReplyKeyboard,
        });
        return { handled: true };
      }

      // Check if this command has sub-commands
      const subMenuMarkup = this.buildSubMenuReplyKeyboard(matchedCmd.id);
      // Determine active keyboard:
      // 1. If this command has sub-commands, show its sub-menu keyboard
      // 2. If this command is a sub-command (has parentId), keep the parent's sub-menu keyboard active
      // 3. Otherwise, use mainReplyKeyboard
      const activeKeyboard = subMenuMarkup 
        || (matchedCmd.parentId ? this.buildSubMenuReplyKeyboard(matchedCmd.parentId) : null) 
        || mainReplyKeyboard;

      // If it's a custom command (not system), we reply with its custom response directly!
      if (!matchedCmd.isSystem) {
        await this.sendMediaResponse(chatId, matchedCmd.response, matchedCmd.mediaType, matchedCmd.mediaUrl, {
          parse_mode: "HTML",
          reply_markup: activeKeyboard,
        });
        return { handled: true };
      }

      // For system commands, run their specific logic but use their configured response text and media!
      if (matchedCmd.command === "/start") {
        let adminHint = "";
        if (isAdminChat) {
          adminHint = `\n\n👑 <b>دسترسی مدیریت تشخیص داده شد:</b>\n▫️ /users - دریافت سریع لیست کاربران سامانه\n▫️ /user [نام/شماره] - جستجوی مشخصات کاربر`;
        }

        let phonePrompt = "";
        if (registeredUser.phoneNumber) {
          phonePrompt = `\n\n📱 <b>شماره تماس ثبت‌شده شما:</b> <code>${registeredUser.phoneNumber}</code> ✅\n<i>(برای به‌روزرسانی شماره می‌توانید مجدداً از دکمه «📱 ارسال شماره تلفن من» استفاده کنید)</i>`;
        } else {
          phonePrompt = `\n\n👇 <b>برای ثبت شماره تلفن واقعی خود و دریافت خدمات، روی دکمه «📱 ارسال شماره تلفن من» در پایین کلیک کنید:</b>`;
        }

        const startText = `سلام <b>${senderName}</b> عزیز! 👋\n\n${matchedCmd.response}${phonePrompt}${adminHint}`;

        await this.sendMediaResponse(
          chatId,
          startText,
          matchedCmd.mediaType,
          matchedCmd.mediaUrl,
          {
            parse_mode: "HTML",
            reply_markup: mainReplyKeyboard,
          }
        );

        if (inlineReplyMarkup) {
          await this.sendMessage(chatId, "🌐 منوی دسترسی سریع:", {
            parse_mode: "HTML",
            reply_markup: inlineReplyMarkup,
          });
        }
        return { handled: true };
      }

      if (matchedCmd.command === "/help") {
        let helpText = matchedCmd.response;
        if (isAdminChat) {
          helpText += `\n\n👑 <b>دستورات ویژه مدیر سامانه:</b>\n👥 /users - دریافت لیست و گزارش کاربران سامانه\n🔍 /user [کلمه] - جستجوی کاربر با موبایل یا نام`;
        }
        await this.sendMediaResponse(
          chatId,
          helpText,
          matchedCmd.mediaType,
          matchedCmd.mediaUrl,
          { parse_mode: "HTML", reply_markup: activeKeyboard }
        );
        return { handled: true };
      }

      if (matchedCmd.command === "/about") {
        await this.sendMediaResponse(
          chatId,
          `ℹ️ <b>درباره سامانه:</b>\n\n${matchedCmd.response}`,
          matchedCmd.mediaType,
          matchedCmd.mediaUrl,
          { parse_mode: "HTML", reply_markup: activeKeyboard }
        );
        return { handled: true };
      }

      if (matchedCmd.command === "/contact") {
        await this.sendMediaResponse(
          chatId,
          matchedCmd.response,
          matchedCmd.mediaType,
          matchedCmd.mediaUrl,
          { parse_mode: "HTML", reply_markup: activeKeyboard }
        );
        return { handled: true };
      }

      if (matchedCmd.command === "/products") {
        try {
          const allProducts = await storage.getAllProducts();
          const activeProducts = (allProducts || []).filter(p => p.isActive !== false).slice(0, 5);

          if (activeProducts.length === 0) {
            await this.sendMessage(chatId, "🛍️ در حال حاضر محصولی در فروشگاه ثبت نشده است.", { parse_mode: "HTML", reply_markup: activeKeyboard });
            return { handled: true };
          }

          let catalogText = `🛍️ <b>جدیدترین محصولات فروشگاه رخش:</b>\n\n`;
          activeProducts.forEach((p, idx) => {
            const rawPrice = p.priceAfterDiscount || p.priceBeforeDiscount || "0";
            const priceStr = Number(rawPrice).toLocaleString("fa-IR") + " تومان";
            catalogText += `${idx + 1}. <b>${p.name}</b>\n💰 قیمت: ${priceStr}\n\n`;
          });
          catalogText += `🌐 جهت مشاهده کامل و خرید آنلاین، وارد وب‌سایت شوید.`;

          await this.sendMessage(chatId, catalogText, { parse_mode: "HTML", reply_markup: activeKeyboard });
          return { handled: true };
        } catch (err) {
          await this.sendMessage(chatId, "خطا در دریافت لیست محصولات. لطفاً بعداً تلاش کنید.", { parse_mode: "HTML", reply_markup: activeKeyboard });
          return { handled: true };
        }
      }

      if (matchedCmd.command === "/track") {
        await this.sendMessage(chatId, matchedCmd.response, { parse_mode: "HTML", reply_markup: activeKeyboard });
        return { handled: true };
      }
    }

    // Default response for other messages
    let defaultMsg = `پیام شما دریافت شد. لطفاً از گزینه‌های منوی زیر استفاده کنید:\n\n📱 ارسال شماره تلفن من - ثبت شماره همراه`;
    for (const c of botCommands.filter(c => c.command !== "/start")) {
      defaultMsg += `\n▫️ ${c.command} - ${c.description || ""}`;
    }
    if (this.config.menuButtons && this.config.menuButtons.length > 0) {
      for (const btn of this.config.menuButtons) {
        defaultMsg += `\n▫️ ${btn.text}`;
      }
    }
    if (isAdminChat) {
      defaultMsg += `\n\n👑 /users - لیست کاربران سامانه`;
    }
    await this.sendMessage(chatId, defaultMsg, { parse_mode: "HTML", reply_markup: mainReplyKeyboard });

    return { handled: true };
  }
}

export const telegramService = new TelegramService();
