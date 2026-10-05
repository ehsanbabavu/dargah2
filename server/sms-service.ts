import fs from "fs";
import path from "path";

export interface SmsConfig {
  token: string;
  templateId: number;
  apiUrl: string;
  isEnabled: boolean;
  updatedAt?: string;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "data-sms-config.json");

export const DEFAULT_SMS_CONFIG: SmsConfig = {
  token: process.env.SMS_API_TOKEN || "",
  templateId: 1,
  apiUrl: "https://s.api.ir/api/sw1/SmsOTP",
  isEnabled: true,
};

interface StoredOtp {
  code: string;
  expiresAt: number;
  isVerified?: boolean;
}

export class SmsService {
  private config: SmsConfig;
  private pendingOtps: Map<string, StoredOtp> = new Map();

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): SmsConfig {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SMS_CONFIG,
          ...parsed,
        };
      }
    } catch (error) {
      console.error("Error loading SMS config from file:", error);
    }
    return { ...DEFAULT_SMS_CONFIG };
  }

  private saveConfigToFile(config: SmsConfig): boolean {
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf8");
      return true;
    } catch (error) {
      console.error("Error saving SMS config to file:", error);
      return false;
    }
  }

  public getConfig(): SmsConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SmsConfig>): SmsConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfigToFile(this.config);
    return this.config;
  }

  public normalizeIranianPhone(rawPhone: string): string {
    if (!rawPhone) return "";
    let cleaned = rawPhone
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
      .replace(/[\s\-\+]/g, "")
      .trim();

    if (cleaned.startsWith("0098")) {
      cleaned = "0" + cleaned.substring(4);
    } else if (cleaned.startsWith("98")) {
      cleaned = "0" + cleaned.substring(2);
    } else if (cleaned.length === 10 && cleaned.startsWith("9")) {
      cleaned = "0" + cleaned;
    }

    return cleaned;
  }

  public isValidIranianMobile(phone: string): boolean {
    const normalized = this.normalizeIranianPhone(phone);
    return /^09\d{9}$/.test(normalized);
  }

  /**
   * Sends an OTP via the configured SMS API
   * POST https://s.api.ir/api/sw1/SmsOTP
   * Headers:
   *   Content-Type: application/json
   *   Accept: text/plain
   *   Authorization: Bearer <token>
   * Body:
   *   { "code": "123456", "mobile": "09120000000", "template": 1 }
   */
  public async sendOtpSms(mobile: string, code: string): Promise<{ success: boolean; message: string; apiResponse?: any }> {
    const normalizedMobile = this.normalizeIranianPhone(mobile);
    const token = this.config.token?.trim();
    const apiUrl = this.config.apiUrl || "https://s.api.ir/api/sw1/SmsOTP";
    const template = Number(this.config.templateId) || 1;

    if (!token) {
      console.warn("⚠️ SMS Token is not set in admin settings. OTP Code for", normalizedMobile, "is:", code);
      return {
        success: true,
        message: `توکن پیامک هنوز تنظیم نشده است. کد تست: ${code}`,
        apiResponse: { warning: "SMS token is not configured, logged code to console.", testCode: code }
      };
    }

    try {
      const payload = {
        code,
        mobile: normalizedMobile,
        template,
      };

      console.log(`[SMS-SERVICE] Sending OTP to ${normalizedMobile} with template ${template}...`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/plain",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        // Response might be plain text
      }

      if (!response.ok) {
        console.error(`[SMS-SERVICE] Failed with status ${response.status}:`, responseText);
        return {
          success: false,
          message: `خطا در ارسال پیامک (${response.status}): ${responseText || "خطای نامشخص سرویس دهنده"}`,
          apiResponse: parsedJson || responseText,
        };
      }

      console.log(`[SMS-SERVICE] Successfully sent OTP to ${normalizedMobile}:`, responseText);
      return {
        success: true,
        message: "پیامک با موفقیت ارسال شد",
        apiResponse: parsedJson || responseText,
      };
    } catch (error: any) {
      console.error("[SMS-SERVICE] Exception during SMS sending:", error);
      return {
        success: false,
        message: `خطای ارتباط با سرور پیامک: ${error.message || error}`,
      };
    }
  }

  /**
   * Generates a random code (5 or 6 digits) and stores it for the mobile number
   */
  public generateAndSaveOtp(mobile: string, validitySeconds = 120, digits = 6): string {
    const normalizedMobile = this.normalizeIranianPhone(mobile);
    const code = digits === 5 
      ? Math.floor(10000 + Math.random() * 90000).toString()
      : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + validitySeconds * 1000;

    this.pendingOtps.set(normalizedMobile, {
      code,
      expiresAt,
      isVerified: false,
    });

    return code;
  }

  /**
   * Sends an OTP via Voice Call API (Call OTP backup service)
   * POST https://s.api.ir/api/sw1/CallOTP
   * Headers:
   *   Content-Type: application/json
   *   Accept: text/plain
   *   Authorization: Bearer <token>
   * Body:
   *   { "code": "12345", "number": "09121112222" }
   */
  public async sendCallOtp(mobile: string, code: string): Promise<{ success: boolean; message: string; apiResponse?: any }> {
    const normalizedMobile = this.normalizeIranianPhone(mobile);
    const token = this.config.token?.trim();
    const callApiUrl = "https://s.api.ir/api/sw1/CallOTP";

    if (!token) {
      console.warn("⚠️ SMS/Call Token is not set in admin settings. Voice Call OTP Code for", normalizedMobile, "is:", code);
      return {
        success: true,
        message: `توکن پیامک/تماس هنوز تنظیم نشده است. کد تست تماس: ${code}`,
        apiResponse: { warning: "SMS/Call token is not configured, logged code to console.", testCode: code }
      };
    }

    try {
      const payload = {
        code,
        number: normalizedMobile,
      };

      console.log(`[CALL-OTP-SERVICE] Requesting Call OTP for ${normalizedMobile} with code ${code}...`);

      const response = await fetch(callApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/plain",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        // Response might be plain text
      }

      if (!response.ok) {
        console.error(`[CALL-OTP-SERVICE] Failed with status ${response.status}:`, responseText);
        return {
          success: false,
          message: `خطا در برقراری تماس صوتی (${response.status}): ${responseText || "خطای نامشخص سرویس تماس"}`,
          apiResponse: parsedJson || responseText,
        };
      }

      console.log(`[CALL-OTP-SERVICE] Successfully triggered Call OTP for ${normalizedMobile}:`, responseText);
      return {
        success: true,
        message: "تماس صوتی برای اعلام کد تایید برقرار شد. لطفاً به تماس پاسخ دهید.",
        apiResponse: parsedJson || responseText,
      };
    } catch (error: any) {
      console.error("[CALL-OTP-SERVICE] Exception during Call OTP:", error);
      return {
        success: false,
        message: `خطای ارتباط با سرور تماس صوتی: ${error.message || error}`,
      };
    }
  }

  /**
   * Verifies an entered OTP for a mobile number
   */
  public verifyOtp(mobile: string, enteredCode: string): { isValid: boolean; message: string } {
    const normalizedMobile = this.normalizeIranianPhone(mobile);
    const normalizedCode = enteredCode
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
      .trim();

    const stored = this.pendingOtps.get(normalizedMobile);
    if (!stored) {
      return { isValid: false, message: "کد تایید منقضی شده یا درخواستی ثبت نشده است. لطفاً مجدداً درخواست کد دهید." };
    }

    if (Date.now() > stored.expiresAt) {
      this.pendingOtps.delete(normalizedMobile);
      return { isValid: false, message: "کد تایید منقضی شده است. لطفاً مجدداً درخواست کد دهید." };
    }

    if (stored.code !== normalizedCode) {
      return { isValid: false, message: "کد تایید وارد شده نادرست است." };
    }

    stored.isVerified = true;
    this.pendingOtps.set(normalizedMobile, stored);

    return { isValid: true, message: "کد تایید با موفقیت تایید شد." };
  }

  /**
   * Checks whether the phone number has been verified via OTP
   */
  public isMobileVerified(mobile: string): boolean {
    const normalizedMobile = this.normalizeIranianPhone(mobile);
    const stored = this.pendingOtps.get(normalizedMobile);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      this.pendingOtps.delete(normalizedMobile);
      return false;
    }
    return Boolean(stored.isVerified);
  }

  /**
   * Clears verified OTP after successful user creation
   */
  public clearOtp(mobile: string): void {
    const normalizedMobile = this.normalizeIranianPhone(mobile);
    this.pendingOtps.delete(normalizedMobile);
  }
}

export const smsService = new SmsService();
