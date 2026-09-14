import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique(),
  phone: text("phone").notNull(),
  bankCardNumber: text("bank_card_number"), // شماره کارت بانکی (برای کاربران سطح 1)
  bankCardHolderName: text("bank_card_holder_name"), // نام صاحب کارت (برای کاربران سطح 1)
  bankCardApprovalStatus: text("bank_card_approval_status").default("pending"), // pending, approved, rejected
  password: text("password"),
  googleId: text("google_id"),
  role: text("role").notNull().default("user_level_1"), // admin, user_level_1
  parentUserId: varchar("parent_user_id"), // For hierarchical user management - will add reference later
  profilePicture: text("profile_picture"),
  storeName: text("store_name"), // نام فروشگاه برای ویترین شخصی (کاربران سطح 1)
  storeDescription: text("store_description"), // توضیحات فروشگاه
  storeLogo: text("store_logo"), // لوگوی فروشگاه
  isBlocked: boolean("is_blocked").notNull().default(false), // وضعیت مسدودی کاربر
  createdAt: timestamp("created_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("medium"),
  message: text("message").notNull(),
  status: text("status").notNull().default("unread"), // unread, read, closed
  attachments: text("attachments").array(),
  adminReply: text("admin_reply"),
  adminReplyAt: timestamp("admin_reply_at"),
  lastResponseAt: timestamp("last_response_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  userLevel: text("user_level").notNull().default("user_level_1"), // user_level_1
  priceBeforeDiscount: decimal("price_before_discount", { precision: 15, scale: 2 }),
  priceAfterDiscount: decimal("price_after_discount", { precision: 15, scale: 2 }),
  duration: text("duration").notNull().default("monthly"), // monthly, yearly
  features: text("features").array().default([]),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id),
  image: text("image"),
  quantity: integer("quantity").notNull().default(0),
  priceBeforeDiscount: decimal("price_before_discount", { precision: 15, scale: 2 }).notNull(),
  priceAfterDiscount: decimal("price_after_discount", { precision: 15, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sentMessages = pgTable("sent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  recipient: text("recipient").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("sent"), // sent, delivered, failed
  timestamp: timestamp("timestamp").defaultNow(),
});

export const receivedMessages = pgTable("received_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  whatsiPlusId: text("whatsiplus_id").notNull(), // شناسه اصلی از WhatsiPlus
  sender: text("sender").notNull(),
  message: text("message").notNull(),
  imageUrl: text("image_url"), // آدرس عکس در صورت وجود
  status: text("status").notNull().default("خوانده نشده"), // خوانده نشده, خوانده شده
  originalDate: text("original_date"), // تاریخ اصلی از WhatsiPlus
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  // Composite unique constraint on whatsiplus_id and user_id
  whatsiUserUnique: unique("received_messages_whatsi_user_unique").on(table.whatsiPlusId, table.userId),
}));

export const internalChats = pgTable("internal_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id),
  status: text("status").notNull().default("active"), // active, inactive, expired
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  remainingDays: integer("remaining_days").notNull().default(0),
  isTrialPeriod: boolean("is_trial_period").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  parentId: varchar("parent_id"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const carts = pgTable("carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  itemCount: integer("item_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: varchar("cart_id").notNull().references(() => carts.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(), // عنوان آدرس مثل "منزل" یا "محل کار"
  fullAddress: text("full_address").notNull(), // آدرس کامل متنی
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // عرض جغرافیایی
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // طول جغرافیایی
  postalCode: text("postal_code"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // کاربر سطح 2 که سفارش داده
  sellerId: varchar("seller_id").notNull().references(() => users.id), // کاربر سطح 1 که فروشنده است
  addressId: varchar("address_id").references(() => addresses.id), // آدرس تحویل
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("awaiting_payment"), // awaiting_payment, pending, confirmed, preparing, shipped, delivered, cancelled
  statusHistory: text("status_history").array().default([]), // تاریخچه تغییر وضعیت
  orderNumber: text("order_number").notNull().unique(), // شماره سفارش منحصر به فرد
  shippingMethod: text("shipping_method"), // روش ارسال: post_pishtaz, post_normal, piyk, free
  notes: text("notes"), // یادداشت‌های کاربر
  paymentStartedAt: timestamp("payment_started_at"), // زمان شروع پرداخت برای تایمر 10 دقیقه‌ای
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id), // اختیاری - ممکن است واریز مستقل باشد
  type: text("type").notNull(), // deposit, withdraw, order_payment, commission
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  transactionDate: text("transaction_date"), // تاریخ انجام تراکنش
  transactionTime: text("transaction_time"), // ساعت انجام تراکنش
  accountSource: text("account_source"), // از حساب
  paymentMethod: text("payment_method"), // cash, card, bank_transfer, etc.
  referenceId: text("reference_id"), // شماره پیگیری
  // Parent-child deposit approval fields
  initiatorUserId: varchar("initiator_user_id").references(() => users.id), // کاربر فرزند که تراکنش را ایجاد کرده
  parentUserId: varchar("parent_user_id").references(() => users.id), // کاربر والد که باید تایید کند
  approvedByUserId: varchar("approved_by_user_id").references(() => users.id), // کاربر والد که تایید کرده
  approvedAt: timestamp("approved_at"), // زمان تایید
  createdAt: timestamp("created_at").defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const passwordResetOtps = pgTable("password_reset_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  otp: text("otp").notNull(), // کد 6 رقمی
  isUsed: boolean("is_used").notNull().default(false), // آیا استفاده شده
  expiresAt: timestamp("expires_at").notNull(), // زمان انقضا (5 دقیقه)
  createdAt: timestamp("created_at").defaultNow(),
});

export const maintenanceMode = pgTable("maintenance_mode", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isEnabled: boolean("is_enabled").notNull().default(false), // فعال/غیرفعال
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Guest Chat Sessions - برای چت کاربران مهمان با ادمین
export const guestChatSessions = pgTable("guest_chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").notNull().unique(), // توکن منحصر به فرد برای session مهمان
  guestName: text("guest_name"), // نام مهمان (اختیاری)
  guestPhone: text("guest_phone"), // شماره تلفن مهمان (اختیاری)
  guestIpAddress: text("guest_ip_address"), // آدرس IP مهمان
  isActive: boolean("is_active").notNull().default(true), // آیا session فعال است
  lastMessageAt: timestamp("last_message_at").defaultNow(), // آخرین پیام
  unreadByAdmin: integer("unread_by_admin").notNull().default(0), // تعداد پیام‌های خوانده نشده توسط ادمین
  unreadByGuest: integer("unread_by_guest").notNull().default(0), // تعداد پیام‌های خوانده نشده توسط مهمان
  createdAt: timestamp("created_at").defaultNow(),
});

// Guest Chat Messages - پیام‌های چت مهمانان
export const guestChatMessages = pgTable("guest_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => guestChatSessions.id),
  message: text("message").notNull(),
  sender: text("sender").notNull(), // 'guest' | 'admin'
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("ایمیل معتبر وارد کنید").optional(),
});

// Schema for level 2 users where email and username are optional (username auto-generated from phone)
export const insertSubUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  email: true, // Remove email from required fields
  username: true, // Remove username from required fields - auto-generated from phone
}).extend({
  email: z.string().email("ایمیل معتبر وارد کنید").optional(), // Make email optional
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  lastResponseAt: true,
  adminReply: true,
  adminReplyAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  isDefault: true, // Prevent clients from setting isDefault
}).extend({
  priceBeforeDiscount: z.union([z.string(), z.number(), z.null()]).optional().transform(val => val === null || val === "" ? null : String(val)),
  priceAfterDiscount: z.union([z.string(), z.number(), z.null()]).optional().transform(val => val === null || val === "" ? null : String(val)),
  features: z.array(z.string()).default([]),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  priceBeforeDiscount: z.union([z.string(), z.number()]).transform(val => String(val)),
  priceAfterDiscount: z.union([z.string(), z.number(), z.null()]).transform(val => val === null ? null : String(val)),
});

export const insertSentMessageSchema = createInsertSchema(sentMessages).omit({
  id: true,
  timestamp: true,
});

export const insertReceivedMessageSchema = createInsertSchema(receivedMessages).omit({
  id: true,
  timestamp: true,
});

export const insertInternalChatSchema = createInsertSchema(internalChats).omit({
  id: true,
  createdAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdBy: true, // Server controls this field
  createdAt: true,
  updatedAt: true,
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  unitPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  totalPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  userId: true, // منع تغییر مالکیت
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  orderNumber: true, // Server generates this
}).extend({
  totalAmount: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
}).extend({
  unitPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  totalPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdBy: true, // Server controls this field
  createdAt: true,
  updatedAt: true,
});

export const updateFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdBy: true, // Cannot change creator
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertPasswordResetOtpSchema = createInsertSchema(passwordResetOtps).omit({
  id: true,
  createdAt: true,
});

export const updateCategoryOrderSchema = z.object({
  categoryId: z.string().uuid(),
  newOrder: z.number().int().min(0),
  newParentId: z.string().uuid().nullable().optional(),
});

// Ticket reply validation schema
export const ticketReplySchema = z.object({
  message: z.string().min(1, "پیام نمی‌تواند خالی باشد").max(1000, "پیام نمی‌تواند بیش از 1000 کاراکتر باشد"),
});

// Reset password validation schema
export const resetPasswordSchema = z.object({
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

// Guest Chat schemas
export const insertGuestChatSessionSchema = createInsertSchema(guestChatSessions).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertGuestChatMessageSchema = createInsertSchema(guestChatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type SentMessage = typeof sentMessages.$inferSelect;
export type InsertSentMessage = z.infer<typeof insertSentMessageSchema>;

export type ReceivedMessage = typeof receivedMessages.$inferSelect;
export type InsertReceivedMessage = z.infer<typeof insertReceivedMessageSchema>;

export type InternalChat = typeof internalChats.$inferSelect;
export type InsertInternalChat = z.infer<typeof insertInternalChatSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type UpdateFaq = z.infer<typeof updateFaqSchema>;

export type PasswordResetOtp = typeof passwordResetOtps.$inferSelect;
export type InsertPasswordResetOtp = z.infer<typeof insertPasswordResetOtpSchema>;

// Content Management for Website
export const contentSections = pgTable("content_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionKey: text("section_key").notNull().unique(), // e.g., "hero", "features", "pricing", etc.
  title: text("title"),
  subtitle: text("subtitle"),
  description: text("description"),
  content: text("content"), // JSON string for complex content
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContentSectionSchema = createInsertSchema(contentSections);
export const updateContentSectionSchema = createInsertSchema(contentSections).partial().required({ id: true });

export type ContentSection = typeof contentSections.$inferSelect;
export type InsertContentSection = z.infer<typeof insertContentSectionSchema>;
export type UpdateContentSection = z.infer<typeof updateContentSectionSchema>;

// Login Logs for tracking user logins
export const loginLogs = pgTable("login_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  username: text("username").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  loginAt: timestamp("login_at").defaultNow(),
});

export const insertLoginLogSchema = createInsertSchema(loginLogs);

export type LoginLog = typeof loginLogs.$inferSelect;
export type InsertLoginLog = z.infer<typeof insertLoginLogSchema>;

// Guest Chat Types
export type GuestChatSession = typeof guestChatSessions.$inferSelect;
export type InsertGuestChatSession = z.infer<typeof insertGuestChatSessionSchema>;

export type GuestChatMessage = typeof guestChatMessages.$inferSelect;
export type InsertGuestChatMessage = z.infer<typeof insertGuestChatMessageSchema>;

// Project Order Requests - Submissions from homepage popup
export const projectOrderRequests = pgTable("project_order_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, reviewed, contacted, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectOrderRequestSchema = createInsertSchema(projectOrderRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const updateProjectOrderRequestSchema = createInsertSchema(projectOrderRequests).partial().required({ id: true });

export type ProjectOrderRequest = typeof projectOrderRequests.$inferSelect;
export type InsertProjectOrderRequest = z.infer<typeof insertProjectOrderRequestSchema>;
export type UpdateProjectOrderRequest = z.infer<typeof updateProjectOrderRequestSchema>;

// Plugins Management - For enabling/disabling features
export const plugins = pgTable("plugins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // Unique identifier for the plugin
  displayName: text("display_name").notNull(), // Persian display name
  description: text("description"), // Plugin description
  icon: text("icon").notNull().default("Puzzle"), // Lucide icon name
  isEnabled: boolean("is_enabled").notNull().default(true), // Plugin status
  isBuiltIn: boolean("is_built_in").notNull().default(false), // Built-in plugins cannot be deleted
  settings: text("settings"), // JSON string for plugin-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPluginSchema = createInsertSchema(plugins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePluginSchema = createInsertSchema(plugins).partial().required({ id: true });

export type Plugin = typeof plugins.$inferSelect;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type UpdatePlugin = z.infer<typeof updatePluginSchema>;

// SEO & Google Indexing Settings (تنظیمات سئو و ثبت در گوگل)
export const seoSettings = pgTable("seo_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteTitle: text("site_title").notNull().default("سایت ساز رخش | طراحی و ساخت سایت حرفه‌ای"),
  siteDescription: text("site_description").notNull().default("پلتفرم جامع راه‌اندازی، مدیریت و رشد کسب‌وکارهای آنلاین و وب‌سایت‌های مدرن"),
  siteKeywords: text("site_keywords").default("طراحی سایت, سایت ساز, فروشگاه اینترنتی, سئو, وردپرس, رخش"),
  canonicalUrl: text("canonical_url"),
  googleSiteVerification: text("google_site_verification"),
  googleIndexingServiceAccountJson: text("google_indexing_service_account_json"),
  bingSiteVerification: text("bing_site_verification"),
  enableAutoIndexPosts: boolean("enable_auto_index_posts").notNull().default(true),
  enableSitemap: boolean("enable_sitemap").notNull().default(true),
  enableRobotsTxt: boolean("enable_robots_txt").notNull().default(true),
  robotsTxtContent: text("robots_txt_content").default("User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: /sitemap.xml"),
  schemaType: text("schema_type").notNull().default("Organization"),
  schemaOrganizationName: text("schema_organization_name").default("سایت ساز رخش"),
  schemaLogoUrl: text("schema_logo_url"),
  openGraphImage: text("open_graph_image"),
  twitterHandle: text("twitter_handle"),
  lastSitemapGeneratedAt: timestamp("last_sitemap_generated_at"),
  lastGooglePingAt: timestamp("last_google_ping_at"),
  totalGoogleSubmissions: integer("total_google_submissions").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSeoSettingsSchema = createInsertSchema(seoSettings).omit({
  id: true,
  updatedAt: true,
});

export const updateSeoSettingsSchema = createInsertSchema(seoSettings).partial();

export type SeoSettings = typeof seoSettings.$inferSelect;
export type InsertSeoSettings = z.infer<typeof insertSeoSettingsSchema>;
export type UpdateSeoSettings = z.infer<typeof updateSeoSettingsSchema>;

// SEO Google Indexing Logs
export const seoIndexingLogs = pgTable("seo_indexing_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  type: text("type").notNull().default("homepage"), // homepage, post, sitemap, custom
  status: text("status").notNull().default("success"), // success, pending, error
  engine: text("engine").notNull().default("google"), // google, bing
  responseMessage: text("response_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSeoIndexingLogSchema = createInsertSchema(seoIndexingLogs).omit({
  id: true,
  createdAt: true,
});

export type SeoIndexingLog = typeof seoIndexingLogs.$inferSelect;
export type InsertSeoIndexingLog = z.infer<typeof insertSeoIndexingLogSchema>;

// HTTPS & SSL Certificates (گواهینامه امنیتی SSL و پروتکل HTTPS)
export const sslCertificates = pgTable("ssl_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  domain: text("domain").notNull(),
  provider: text("provider").notNull().default("Let's Encrypt Free SSL"), // Let's Encrypt Free SSL, ZeroSSL, Cloudflare, Custom
  status: text("status").notNull().default("active"), // active, pending, renewing, expired, failed
  certificateType: text("certificate_type").notNull().default("DV (Domain Validated) 2048-bit RSA"),
  issuer: text("issuer").notNull().default("Let's Encrypt Authority X3 / ISRG Root X1"),
  serialNumber: text("serial_number").notNull(),
  fingerprintSha256: text("fingerprint_sha256").notNull(),
  issuedAt: timestamp("issued_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  autoRenew: boolean("auto_renew").notNull().default(true),
  forceHttpsRedirect: boolean("force_https_redirect").notNull().default(true),
  enableHsts: boolean("enable_hsts").notNull().default(true),
  enableTls13: boolean("enable_tls13").notNull().default(true),
  enableOcspStapling: boolean("enable_ocsp_stapling").notNull().default(true),
  certificatePem: text("certificate_pem"),
  privateKeyPem: text("private_key_pem"),
  caBundlePem: text("ca_bundle_pem"),
  csrPem: text("csr_pem"),
  dnsChallengeRecord: text("dns_challenge_record"),
  httpChallengePath: text("http_challenge_path"),
  lastCheckedAt: timestamp("last_checked_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSslCertificateSchema = createInsertSchema(sslCertificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSslCertificateSchema = createInsertSchema(sslCertificates).partial();

export type SslCertificate = typeof sslCertificates.$inferSelect;
export type InsertSslCertificate = z.infer<typeof insertSslCertificateSchema>;
export type UpdateSslCertificate = z.infer<typeof updateSslCertificateSchema>;

// SSL Activity Logs
export const sslLogs = pgTable("ssl_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  certificateId: varchar("certificate_id"),
  domain: text("domain").notNull(),
  action: text("action").notNull(), // issue, renew, force_https_toggle, verify_domain, revoke
  status: text("status").notNull().default("success"), // success, failed, in_progress
  message: text("message").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSslLogSchema = createInsertSchema(sslLogs).omit({
  id: true,
  createdAt: true,
});

export type SslLog = typeof sslLogs.$inferSelect;
export type InsertSslLog = z.infer<typeof insertSslLogSchema>;

// Blupal Gateway Settings for Level 1 Users
export const blupalGateways = pgTable("blupal_gateways", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  apiKey: text("api_key"),
  isActive: boolean("is_active").notNull().default(false),
  title: text("title").notNull().default("درگاه پرداخت کارت به کارت"),
  description: text("description").default("جهت پرداخت، اطلاعات خود را وارد کرده و پس از واریز کارت به کارت، وضعیت به صورت آنی تایید می‌گردد."),
  defaultAmount: decimal("default_amount", { precision: 15, scale: 2 }),
  minAmount: decimal("min_amount", { precision: 15, scale: 2 }).default("10000"),
  maxAmount: decimal("max_amount", { precision: 15, scale: 2 }).default("50000000"),
  cardNumber: text("card_number"),
  cardHolderName: text("card_holder_name"),
  bankName: text("bank_name"),
  supportPhone: text("support_phone"),
  slug: text("slug"),
  webhookSecret: text("webhook_secret"),
  successMessage: text("success_message").default("پرداخت شما با موفقیت تایید شد. از اعتماد شما متشکریم."),
  wpApiKey: text("wp_api_key"), // Dedicated API Key for WordPress / WooCommerce plugin
  wpAuthorizedDomain: text("wp_authorized_domain"), // Single authorized domain (e.g. client-shop.com)
  wpCallbackUrl: text("wp_callback_url"), // Optional default callback URL
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlupalGatewaySchema = createInsertSchema(blupalGateways).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BlupalGateway = typeof blupalGateways.$inferSelect;
export type InsertBlupalGateway = z.infer<typeof insertBlupalGatewaySchema>;

// Blupal Transactions (Isolated per Level 1 User)
export const blupalTransactions = pgTable("blupal_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  invoiceId: text("invoice_id").notNull().unique(),
  blupalInvoiceId: text("blupal_invoice_id"),
  paymentLink: text("payment_link"),
  payerName: text("payer_name").notNull(),
  payerPhone: text("payer_phone").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  finalAmount: decimal("final_amount", { precision: 15, scale: 2 }),
  destCardNumber: text("dest_card_number"),
  destCardHolder: text("dest_card_holder"),
  status: text("status").notNull().default("pending"), // pending, verifying, paid, expired, failed
  trackingCode: text("tracking_code"),
  cardLastFour: text("card_last_four"),
  payerCard: text("payer_card"),
  payerBankName: text("payer_bank_name"),
  mode: text("mode"), // live, sandbox
  description: text("description"),
  sourceDomain: text("source_domain"), // Originating WooCommerce domain (e.g. client-shop.com)
  orderId: text("order_id"), // WooCommerce order ID (e.g. 1042)
  callbackUrl: text("callback_url"), // WooCommerce return and webhook callback URL
  paidAt: timestamp("paid_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlupalTransactionSchema = createInsertSchema(blupalTransactions).omit({
  id: true,
  createdAt: true,
});

export type BlupalTransaction = typeof blupalTransactions.$inferSelect;
export type InsertBlupalTransaction = z.infer<typeof insertBlupalTransactionSchema>;

// Announcements (Admin broadcasts to Level 1 users, Level 2, or All)
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  targetAudience: text("target_audience").notNull().default("user_level_1"), // "user_level_1", "all"
  priority: text("priority").notNull().default("normal"), // "normal", "important", "urgent", "info"
  isPinned: boolean("is_pinned").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  authorId: varchar("author_id").notNull().references(() => users.id),
  authorName: text("author_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Announcement Read Receipts per User
export const announcementReads = pgTable("announcement_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: varchar("announcement_id").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").defaultNow(),
}, (table) => ({
  userAnnouncementUnique: unique("user_announcement_unique").on(table.userId, table.announcementId),
}));

export type AnnouncementRead = typeof announcementReads.$inferSelect;




