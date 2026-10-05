import fs from "fs";
import path from "path";
import { db } from "./db-storage";
import { storage } from "./storage";
import {
  users,
  tickets,
  subscriptions,
  userSubscriptions,
  products,
  sentMessages,
  receivedMessages,
  internalChats,
  categories,
  carts,
  cartItems,
  addresses,
  orders,
  orderItems,
  transactions,
  faqs,
  passwordResetOtps,
  maintenanceMode,
  guestChatSessions,
  guestChatMessages,
  contentSections,
  loginLogs,
  projectOrderRequests,
  plugins,
  seoSettings,
  seoIndexingLogs,
  sslCertificates,
  sslLogs,
  blupalGateways,
  blupalTransactions,
  announcements,
  announcementReads,
} from "@shared/schema";

const CONFIG_FILES: Record<string, string> = {
  telegram: "data-telegram-config.json",
  sms: "data-sms-config.json",
  landing: "data-landing-config.json",
  internalPages: "data-internal-pages-config.json",
  notFound: "data-not-found-config.json",
  loginPage: "data-login-page-config.json",
};

const TABLES_MAP: Record<string, any> = {
  users,
  subscriptions,
  userSubscriptions,
  products,
  categories,
  tickets,
  orders,
  orderItems,
  carts,
  cartItems,
  addresses,
  transactions,
  sentMessages,
  receivedMessages,
  internalChats,
  faqs,
  passwordResetOtps,
  maintenanceMode,
  guestChatSessions,
  guestChatMessages,
  contentSections,
  loginLogs,
  projectOrderRequests,
  plugins,
  seoSettings,
  seoIndexingLogs,
  sslCertificates,
  sslLogs,
  blupalGateways,
  blupalTransactions,
  announcements,
  announcementReads,
};

export interface SystemBackupData {
  appName: string;
  backupVersion: string;
  createdAt: string;
  type: string;
  systemConfigs: Record<string, any>;
  database: Record<string, any[]>;
}

export async function createFullSystemBackup(): Promise<{ backupFilePath: string; backupFileName: string; backupData: SystemBackupData }> {
  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // 1. Export JSON config files (Button states, settings, toggles)
  const systemConfigs: Record<string, any> = {};
  for (const [key, filename] of Object.entries(CONFIG_FILES)) {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      try {
        const rawContent = fs.readFileSync(filePath, "utf-8");
        systemConfigs[key] = JSON.parse(rawContent);
      } catch (err) {
        console.error(`Error reading ${filename} for backup:`, err);
        systemConfigs[key] = null;
      }
    } else {
      systemConfigs[key] = null;
    }
  }

  // 2. Export Database Tables
  const databaseData: Record<string, any[]> = {};

  if (process.env.DATABASE_URL) {
    for (const [tableName, tableSchema] of Object.entries(TABLES_MAP)) {
      try {
        const rows = await db.select().from(tableSchema);
        databaseData[tableName] = rows || [];
      } catch (err) {
        console.error(`Error fetching table ${tableName} for backup:`, err);
        databaseData[tableName] = [];
      }
    }
  } else {
    // Fallback if running without PostgreSQL
    try {
      databaseData["users"] = await storage.getAllUsers();
      databaseData["subscriptions"] = await storage.getAllSubscriptions();
      databaseData["userSubscriptions"] = await storage.getAllUserSubscriptions();
      databaseData["products"] = await storage.getAdminProducts();
      databaseData["allProducts"] = await storage.getAllProducts();
      databaseData["faqs"] = await storage.getAllFaqs(true);
      databaseData["plugins"] = await storage.getAllPlugins();
      databaseData["announcements"] = await storage.getAnnouncementsForUser("", "admin");
    } catch (err) {
      console.error("Error backing up in-memory storage:", err);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const backupFileName = `system-backup-${timestamp}.json`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  const backupData: SystemBackupData = {
    appName: "Rakhsh Store & Gateway System",
    backupVersion: "2.0.0",
    createdAt: new Date().toISOString(),
    type: "FULL_SYSTEM_BACKUP",
    systemConfigs,
    database: databaseData,
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf-8");

  return {
    backupFilePath,
    backupFileName,
    backupData,
  };
}

export async function restoreFullSystemBackup(backupData: SystemBackupData): Promise<{ message: string; restoredConfigsCount: number; restoredTablesCount: number }> {
  if (!backupData || (typeof backupData !== "object")) {
    throw new Error("فایل بک‌آپ نامعتبر یا خالی است");
  }

  let restoredConfigsCount = 0;
  let restoredTablesCount = 0;

  // 1. Restore JSON Config Files (Button toggles, settings, rules)
  if (backupData.systemConfigs && typeof backupData.systemConfigs === "object") {
    for (const [key, filename] of Object.entries(CONFIG_FILES)) {
      const configObj = backupData.systemConfigs[key];
      if (configObj && typeof configObj === "object") {
        const filePath = path.join(process.cwd(), filename);
        try {
          fs.writeFileSync(filePath, JSON.stringify(configObj, null, 2), "utf-8");
          restoredConfigsCount++;
        } catch (err) {
          console.error(`Error restoring config ${filename}:`, err);
        }
      }
    }
  }

  // 2. Restore Database Tables
  if (backupData.database && typeof backupData.database === "object") {
    if (process.env.DATABASE_URL) {
      // Order of insertion matters for foreign key constraints!
      const tableRestoreOrder = [
        "users",
        "subscriptions",
        "categories",
        "userSubscriptions",
        "products",
        "tickets",
        "carts",
        "cartItems",
        "addresses",
        "orders",
        "orderItems",
        "transactions",
        "sentMessages",
        "receivedMessages",
        "internalChats",
        "faqs",
        "passwordResetOtps",
        "maintenanceMode",
        "guestChatSessions",
        "guestChatMessages",
        "contentSections",
        "loginLogs",
        "projectOrderRequests",
        "plugins",
        "seoSettings",
        "seoIndexingLogs",
        "sslCertificates",
        "sslLogs",
        "blupalGateways",
        "blupalTransactions",
        "announcements",
        "announcementReads",
      ];

      for (const tableName of tableRestoreOrder) {
        const tableSchema = TABLES_MAP[tableName];
        const rows = backupData.database[tableName];

        if (tableSchema && Array.isArray(rows) && rows.length > 0) {
          try {
            // Restore batch in chunks of 50
            const chunkSize = 50;
            for (let i = 0; i < rows.length; i += chunkSize) {
              const chunk = rows.slice(i, i + chunkSize);
              // Prepare rows converting date strings to Date objects if needed
              const formattedChunk = chunk.map((row) => {
                const cleanRow: Record<string, any> = { ...row };
                for (const [k, v] of Object.entries(cleanRow)) {
                  if (typeof v === "string" && (k.endsWith("At") || k === "timestamp" || k === "date")) {
                    const parsedDate = new Date(v);
                    if (!isNaN(parsedDate.getTime())) {
                      cleanRow[k] = parsedDate;
                    }
                  }
                }
                return cleanRow;
              });

              await db.insert(tableSchema).values(formattedChunk).onConflictDoNothing();
            }
            restoredTablesCount++;
          } catch (err) {
            console.error(`Error restoring table ${tableName}:`, err);
          }
        }
      }
    }
  }

  return {
    message: "پشتیبان‌گیری کامل سیستم (تنظیمات دکمه‌ها، دیتابیس و داده‌های کاربران) با موفقیت بازیابی شد",
    restoredConfigsCount,
    restoredTablesCount,
  };
}
