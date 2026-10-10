import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";
import { type BlupalTransaction } from "@shared/schema";
import {
  generateMainPluginPhp,
  generateGatewayClassPhp,
  generateApiClientPhp,
  generateWebhookPhp,
  generateAdminCss,
  generateIconSvg,
  generatePotFile,
  generateReadmeTxt,
  generateBlocksSupportPhp,
  generateBlocksJs,
} from "./woocommerce-plugin-files";

export function normalizeDomain(input: string): string {
  if (!input || typeof input !== "string") return "";
  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, "");
  if (cleaned.includes("@")) {
    cleaned = cleaned.split("@")[1];
  }
  cleaned = cleaned.split("/")[0].split("?")[0].split("#")[0];
  cleaned = cleaned.split(":")[0];
  if (cleaned.startsWith("www.")) {
    cleaned = cleaned.substring(4);
  }
  return cleaned.trim();
}

export function isDomainAuthorized(candidate: string, authorized: string): boolean {
  const cleanCandidate = normalizeDomain(candidate);
  const cleanAuthorized = normalizeDomain(authorized);
  if (!cleanAuthorized) return true;
  if (!cleanCandidate) return false;
  if (cleanCandidate === cleanAuthorized) return true;
  if (cleanCandidate.endsWith("." + cleanAuthorized)) return true;
  return false;
}

export function createPluginZipArchive(serverBaseUrl: string, prefilledApiKey?: string): Buffer {
  const zip = new AdmZip();
  const folderName = "blupal-card-to-card-gateway";

  const mainPhp = generateMainPluginPhp(serverBaseUrl, prefilledApiKey);
  zip.addFile(`${folderName}/blupal-card-to-card-gateway.php`, Buffer.from(mainPhp, "utf-8"));

  const gatewayPhp = generateGatewayClassPhp(serverBaseUrl, prefilledApiKey);
  zip.addFile(`${folderName}/includes/class-wc-gateway-blupal.php`, Buffer.from(gatewayPhp, "utf-8"));

  const apiPhp = generateApiClientPhp();
  zip.addFile(`${folderName}/includes/class-blupal-api.php`, Buffer.from(apiPhp, "utf-8"));

  const webhookPhp = generateWebhookPhp();
  zip.addFile(`${folderName}/includes/class-blupal-webhook.php`, Buffer.from(webhookPhp, "utf-8"));

  const blocksPhp = generateBlocksSupportPhp();
  zip.addFile(`${folderName}/includes/class-blupal-blocks-support.php`, Buffer.from(blocksPhp, "utf-8"));

  const adminCss = generateAdminCss();
  zip.addFile(`${folderName}/assets/css/admin.css`, Buffer.from(adminCss, "utf-8"));

  const blocksJs = generateBlocksJs();
  zip.addFile(`${folderName}/assets/js/blocks.js`, Buffer.from(blocksJs, "utf-8"));

  const iconSvg = generateIconSvg();
  zip.addFile(`${folderName}/assets/images/icon.svg`, Buffer.from(iconSvg, "utf-8"));

  const rakhshLogoPath = path.join(process.cwd(), "public/images/card-to-card-icon.png");
  if (fs.existsSync(rakhshLogoPath)) {
    const rakhshLogoBuffer = fs.readFileSync(rakhshLogoPath);
    zip.addFile(`${folderName}/assets/images/icon.png`, rakhshLogoBuffer);
    zip.addFile(`${folderName}/assets/images/rakhsh-logo.png`, rakhshLogoBuffer);
  }

  const potContent = generatePotFile();
  zip.addFile(`${folderName}/languages/wc-blupal-c2c.pot`, Buffer.from(potContent, "utf-8"));

  const readmeContent = generateReadmeTxt();
  zip.addFile(`${folderName}/readme.txt`, Buffer.from(readmeContent, "utf-8"));

  return zip.toBuffer();
}

export function ensurePluginZipFile(serverBaseUrl: string): string {
  const downloadsDir = path.join(process.cwd(), "public", "downloads");
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const zipPath = path.join(downloadsDir, "blupal-woocommerce-card-to-card.zip");
  const zipBuffer = createPluginZipArchive(serverBaseUrl);
  fs.writeFileSync(zipPath, zipBuffer);
  return zipPath;
}

export function isSafePublicWebhookUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase().trim();
    if (!hostname) return false;

    const blockedHosts = [
      'localhost', '127.0.0.1', '0.0.0.0', '::1',
      'metadata.google.internal', '169.254.169.254', 'instance-data',
    ];
    if (blockedHosts.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return false;
    }

    const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const a = parseInt(ipMatch[1], 10);
      const b = parseInt(ipMatch[2], 10);
      if (a === 10) return false;
      if (a === 127) return false;
      if (a === 169 && b === 254) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 0) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function notifyWooCommerceWebhook(tx: BlupalTransaction, trackingCode?: string): Promise<boolean> {
  if (!tx.callbackUrl) return false;
  try {
    const notifyUrl = tx.callbackUrl;
    if (!isSafePublicWebhookUrl(notifyUrl)) {
      console.warn(`[SSRF-PREVENTION] Blocked unsafe WooCommerce webhook URL: ${notifyUrl}`);
      return false;
    }

    const res = await fetch(notifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Blupal-Webhook-Service/1.0",
      },
      body: JSON.stringify({
        event: "payment.completed",
        order_id: tx.orderId,
        invoice_id: tx.invoiceId,
        tracking_code: trackingCode || tx.trackingCode || "TRX-VERIFIED",
        card_last_four: tx.cardLastFour,
        amount: tx.amount,
        status: "paid",
        paid_at: tx.paidAt || new Date().toISOString(),
      }),
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch (err: any) {
    console.warn(`Failed to notify WooCommerce webhook (${tx.callbackUrl}):`, err.message);
    return false;
  }
}
