import fs from "fs";
import path from "path";
import { db } from "./db-storage";
import { storage } from "./storage";
import { landingService } from "./landing-service";
import { internalPagesService } from "./internal-pages-service";
import { loginPageService } from "./login-page-service";
import { smsService } from "./sms-service";
import { telegramService } from "./telegram-service";
import { notFoundService } from "./not-found-service";
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

export const CONFIG_FILES: Record<string, string> = {
  telegram: "data-telegram-config.json",
  sms: "data-sms-config.json",
  landing: "data-landing-config.json",
  internalPages: "data-internal-pages-config.json",
  notFound: "data-not-found-config.json",
  loginPage: "data-login-page-config.json",
};

export const TABLES_MAP: Record<string, any> = {
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

export interface SystemBackupSummary {
  totalTables: number;
  totalRecords: number;
  totalConfigs: number;
  payments: {
    gatewaysCount: number;
    blupalTransactionsCount: number;
    walletTransactionsCount: number;
    ordersCount: number;
    orderItemsCount: number;
    subscriptionsCount: number;
    cartsCount: number;
  };
  buttonsAndConfigs: {
    landingButtons: boolean;
    internalPagesButtons: boolean;
    loginButtons: boolean;
    smsConfig: boolean;
    telegramConfig: boolean;
    notFoundButtons: boolean;
    contentSectionsCount: number;
  };
  system: {
    usersCount: number;
    productsCount: number;
    categoriesCount: number;
    ticketsCount: number;
    chatsCount: number;
    announcementsCount: number;
  };
}

export interface SystemBackupData {
  appName: string;
  backupVersion: string;
  createdAt: string;
  type: string;
  summary: SystemBackupSummary;
  systemConfigs: Record<string, any>;
  database: Record<string, any[]>;
}

export async function createFullSystemBackup(): Promise<{
  backupFilePath: string;
  backupFileName: string;
  backupData: SystemBackupData;
}> {
  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // 1. Export JSON configuration files (Button states, layout toggles, CTA buttons, templates, SMS/Telegram configs)
  const systemConfigs: Record<string, any> = {};
  let totalConfigs = 0;
  for (const [key, filename] of Object.entries(CONFIG_FILES)) {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      try {
        const rawContent = fs.readFileSync(filePath, "utf-8");
        systemConfigs[key] = JSON.parse(rawContent);
        totalConfigs++;
      } catch (err) {
        console.error(`Error reading ${filename} for backup:`, err);
        systemConfigs[key] = null;
      }
    } else {
      systemConfigs[key] = null;
    }
  }

  // 2. Export All Database Tables (Payments, Gateways, Transactions, Orders, Users, Buttons & System Data)
  const databaseData: Record<string, any[]> = {};

  // First, extract from memory storage to guarantee all payment, gateway, and program data is captured
  try {
    const storageData = await storage.exportAllTables();
    for (const [tableName, rows] of Object.entries(storageData)) {
      if (Array.isArray(rows) && rows.length > 0) {
        databaseData[tableName] = rows;
      }
    }
  } catch (err) {
    console.error("Error exporting data from storage:", err);
  }

  // If PostgreSQL is connected, fetch and merge/prefer Postgres records
  if (process.env.DATABASE_URL) {
    for (const [tableName, tableSchema] of Object.entries(TABLES_MAP)) {
      try {
        const rows = await db.select().from(tableSchema);
        if (Array.isArray(rows) && rows.length > 0) {
          databaseData[tableName] = rows;
        } else if (!databaseData[tableName]) {
          databaseData[tableName] = [];
        }
      } catch (err) {
        console.error(`Error fetching table ${tableName} for backup:`, err);
        if (!databaseData[tableName]) {
          databaseData[tableName] = [];
        }
      }
    }
  }

  // Calculate detailed summary statistics for verification and display
  let totalRecords = 0;
  let populatedTablesCount = 0;
  for (const rows of Object.values(databaseData)) {
    if (Array.isArray(rows)) {
      totalRecords += rows.length;
      if (rows.length > 0) populatedTablesCount++;
    }
  }

  const summary: SystemBackupSummary = {
    totalTables: populatedTablesCount,
    totalRecords,
    totalConfigs,
    payments: {
      gatewaysCount: databaseData.blupalGateways?.length || 0,
      blupalTransactionsCount: databaseData.blupalTransactions?.length || 0,
      walletTransactionsCount: databaseData.transactions?.length || 0,
      ordersCount: databaseData.orders?.length || 0,
      orderItemsCount: databaseData.orderItems?.length || 0,
      subscriptionsCount: (databaseData.subscriptions?.length || 0) + (databaseData.userSubscriptions?.length || 0),
      cartsCount: (databaseData.carts?.length || 0) + (databaseData.cartItems?.length || 0),
    },
    buttonsAndConfigs: {
      landingButtons: Boolean(systemConfigs.landing),
      internalPagesButtons: Boolean(systemConfigs.internalPages),
      loginButtons: Boolean(systemConfigs.loginPage),
      smsConfig: Boolean(systemConfigs.sms),
      telegramConfig: Boolean(systemConfigs.telegram),
      notFoundButtons: Boolean(systemConfigs.notFound),
      contentSectionsCount: databaseData.contentSections?.length || 0,
    },
    system: {
      usersCount: databaseData.users?.length || 0,
      productsCount: databaseData.products?.length || 0,
      categoriesCount: databaseData.categories?.length || 0,
      ticketsCount: databaseData.tickets?.length || 0,
      chatsCount: (databaseData.internalChats?.length || 0) + (databaseData.guestChatMessages?.length || 0),
      announcementsCount: databaseData.announcements?.length || 0,
    },
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const backupFileName = `system-backup-${timestamp}.json`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  const backupData: SystemBackupData = {
    appName: "Rakhsh Store & Gateway System",
    backupVersion: "3.0.0",
    createdAt: new Date().toISOString(),
    type: "FULL_SYSTEM_BACKUP",
    summary,
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

export async function restoreFullSystemBackup(backupData: any): Promise<{
  message: string;
  restoredConfigsCount: number;
  restoredTablesCount: number;
  restoredRecordsCount: number;
  summary: any;
}> {
  if (!backupData || typeof backupData !== "object") {
    throw new Error("فایل بک‌آپ نامعتبر یا خالی است");
  }

  let restoredConfigsCount = 0;
  let restoredTablesCount = 0;
  let restoredRecordsCount = 0;

  // 1. Restore JSON Configuration Files (Button toggles, templates, layout settings, SMS & Telegram configs)
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

    // Immediately reload all in-memory services to apply restored button states and configs
    try {
      landingService.reloadConfig();
    } catch (e) {
      console.warn("Could not reload landing config:", e);
    }
    try {
      internalPagesService.reloadConfig();
    } catch (e) {
      console.warn("Could not reload internal pages config:", e);
    }
    try {
      loginPageService.reloadConfig();
    } catch (e) {
      console.warn("Could not reload login page config:", e);
    }
    try {
      smsService.reloadConfig();
    } catch (e) {
      console.warn("Could not reload SMS config:", e);
    }
    try {
      telegramService.reloadConfig();
    } catch (e) {
      console.warn("Could not reload Telegram config:", e);
    }
    try {
      notFoundService.reloadConfig();
    } catch (e) {
      console.warn("Could not reload 404 config:", e);
    }
  }

  // 2. Restore All Database Tables into Storage (and PostgreSQL if connected)
  if (backupData.database && typeof backupData.database === "object") {
    // A) Restore into Storage (MemStorage & DbStorage unified handler)
    try {
      const storageResult = await storage.importAllTables(backupData.database);
      restoredRecordsCount += storageResult.restoredCount;
      restoredTablesCount = Math.max(restoredTablesCount, storageResult.tablesCount);
    } catch (err) {
      console.error("Error restoring into storage:", err);
    }

    // B) Restore into PostgreSQL if DATABASE_URL is active
    if (process.env.DATABASE_URL) {
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
            const chunkSize = 50;
            for (let i = 0; i < rows.length; i += chunkSize) {
              const chunk = rows.slice(i, i + chunkSize);
              const formattedChunk = chunk.map((row) => {
                const cleanRow: Record<string, any> = { ...row };
                for (const [k, v] of Object.entries(cleanRow)) {
                  if (
                    typeof v === "string" &&
                    (k.endsWith("At") ||
                      k === "timestamp" ||
                      k === "date" ||
                      k === "paidAt" ||
                      k === "readAt" ||
                      k === "startDate" ||
                      k === "endDate" ||
                      k === "expiresAt")
                  ) {
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
          } catch (err) {
            console.error(`Error restoring PostgreSQL table ${tableName}:`, err);
          }
        }
      }
    }
  }

  const restoredSummary = {
    gateways: backupData.database?.blupalGateways?.length || 0,
    blupalTransactions: backupData.database?.blupalTransactions?.length || 0,
    walletTransactions: backupData.database?.transactions?.length || 0,
    orders: backupData.database?.orders?.length || 0,
    users: backupData.database?.users?.length || 0,
    configs: restoredConfigsCount,
    totalRecords: restoredRecordsCount,
  };

  return {
    message: "پشتیبان‌گیری کامل سیستم (اطلاعات پرداخت، درگاه‌ها، تراکنش‌ها، وضعیت دکمه‌ها و داده‌های سامانه) با موفقیت بازیابی شد",
    restoredConfigsCount,
    restoredTablesCount,
    restoredRecordsCount,
    summary: restoredSummary,
  };
}
