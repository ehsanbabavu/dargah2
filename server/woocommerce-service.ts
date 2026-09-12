import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";
import { type BlupalGateway, type BlupalTransaction } from "@shared/schema";
import { storage } from "./storage";
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

/**
 * Normalizes a URL or domain string to a clean domain hostname
 * e.g. "https://www.MyShop.ir/checkout/" -> "myshop.ir"
 */
export function normalizeDomain(input: string): string {
  if (!input || typeof input !== "string") return "";
  let cleaned = input.trim().toLowerCase();
  
  // Remove protocol
  cleaned = cleaned.replace(/^https?:\/\//, "");
  
  // Remove credentials if any
  if (cleaned.includes("@")) {
    cleaned = cleaned.split("@")[1];
  }

  // Remove path and query
  cleaned = cleaned.split("/")[0].split("?")[0].split("#")[0];

  // Remove port
  cleaned = cleaned.split(":")[0];

  // Remove leading www.
  if (cleaned.startsWith("www.")) {
    cleaned = cleaned.substring(4);
  }

  return cleaned.trim();
}

/**
 * Validates whether the incoming request domain matches the authorized domain
 */
export function isDomainAuthorized(candidate: string, authorized: string): boolean {
  const cleanCandidate = normalizeDomain(candidate);
  const cleanAuthorized = normalizeDomain(authorized);
  
  if (!cleanAuthorized) return true; // Not set yet - allows initial configuration
  if (!cleanCandidate) return false;

  // Exact match
  if (cleanCandidate === cleanAuthorized) return true;

  // Subdomain match (e.g. shop.example.com when example.com is authorized)
  if (cleanCandidate.endsWith("." + cleanAuthorized)) return true;

  // Localhost development aliases
  if (
    (cleanAuthorized === "localhost" || cleanAuthorized === "127.0.0.1") &&
    (cleanCandidate === "localhost" || cleanCandidate === "127.0.0.1")
  ) {
    return true;
  }

  return false;
}

/**
 * Generates the main WordPress / WooCommerce plugin entry code
 */
export function generatePluginPhpCode(serverBaseUrl: string, prefilledApiKey?: string): string {
  return generateMainPluginPhp(serverBaseUrl, prefilledApiKey);
}

/**
 * Generates the complete zip archive buffer containing the modular WordPress plugin
 * Folder and File Structure:
 * blupal-card-to-card-gateway/
 * ├── blupal-card-to-card-gateway.php   (Main Plugin Entry)
 * ├── includes/
 * │   ├── class-wc-gateway-blupal.php   (WC Payment Gateway Class)
 * │   ├── class-blupal-api.php          (API Client for Server Calls)
 * │   └── class-blupal-webhook.php      (Return Callback & Webhook Processor)
 * ├── assets/
 * │   ├── css/
 * │   │   └── admin.css                 (Admin styling for settings box)
 * │   └── images/
 * │       └── icon.svg                  (Gateway Icon for Checkout)
 * ├── languages/
 * │   └── wc-blupal-c2c.pot             (Translation Template)
 * └── readme.txt                        (WordPress Plugin Readme)
 */
export function createPluginZipArchive(serverBaseUrl: string, prefilledApiKey?: string): Buffer {
  const zip = new AdmZip();
  const folderName = "blupal-card-to-card-gateway";

  // 1. Main Plugin Entry Point
  const mainPhp = generateMainPluginPhp(serverBaseUrl, prefilledApiKey);
  zip.addFile(`${folderName}/blupal-card-to-card-gateway.php`, Buffer.from(mainPhp, "utf-8"));

  // 2. Includes: Modular Classes
  const gatewayPhp = generateGatewayClassPhp(serverBaseUrl, prefilledApiKey);
  zip.addFile(`${folderName}/includes/class-wc-gateway-blupal.php`, Buffer.from(gatewayPhp, "utf-8"));

  const apiPhp = generateApiClientPhp();
  zip.addFile(`${folderName}/includes/class-blupal-api.php`, Buffer.from(apiPhp, "utf-8"));

  const webhookPhp = generateWebhookPhp();
  zip.addFile(`${folderName}/includes/class-blupal-webhook.php`, Buffer.from(webhookPhp, "utf-8"));

  const blocksPhp = generateBlocksSupportPhp();
  zip.addFile(`${folderName}/includes/class-blupal-blocks-support.php`, Buffer.from(blocksPhp, "utf-8"));

  // 3. Assets: CSS, JS & Icons
  const adminCss = generateAdminCss();
  zip.addFile(`${folderName}/assets/css/admin.css`, Buffer.from(adminCss, "utf-8"));

  const blocksJs = generateBlocksJs();
  zip.addFile(`${folderName}/assets/js/blocks.js`, Buffer.from(blocksJs, "utf-8"));

  const iconSvg = generateIconSvg();
  zip.addFile(`${folderName}/assets/images/icon.svg`, Buffer.from(iconSvg, "utf-8"));

  // 4. Languages: POT Template
  const potContent = generatePotFile();
  zip.addFile(`${folderName}/languages/wc-blupal-c2c.pot`, Buffer.from(potContent, "utf-8"));

  // 5. Readme Documentation
  const readmeContent = generateReadmeTxt();
  zip.addFile(`${folderName}/readme.txt`, Buffer.from(readmeContent, "utf-8"));

  return zip.toBuffer();
}

/**
 * Saves a copy of the default plugin zip to public/downloads/
 */
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

/**
 * Notifies the customer's WooCommerce site when an invoice is confirmed as paid
 */
export async function notifyWooCommerceWebhook(tx: BlupalTransaction, trackingCode?: string): Promise<boolean> {
  if (!tx.callbackUrl) return false;

  try {
    const notifyUrl = tx.callbackUrl;
    console.log(`Sending WooCommerce Webhook to: ${notifyUrl} for invoice: ${tx.invoiceId}`);

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
      signal: AbortSignal.timeout(10000),
    });

    console.log(`WooCommerce Webhook Response for invoice ${tx.invoiceId}:`, res.status);
    return res.ok;
  } catch (err: any) {
    console.warn(`Failed to notify WooCommerce webhook (${tx.callbackUrl}):`, err.message);
    return false;
  }
}
