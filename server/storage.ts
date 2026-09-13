import { type User, type InsertUser, type Ticket, type InsertTicket, type Subscription, type InsertSubscription, type Product, type InsertProduct, type SentMessage, type InsertSentMessage, type ReceivedMessage, type InsertReceivedMessage, type UserSubscription, type InsertUserSubscription, type Category, type InsertCategory, type Cart, type InsertCart, type CartItem, type InsertCartItem, type Address, type InsertAddress, type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type Transaction, type InsertTransaction, type InternalChat, type InsertInternalChat, type Faq, type InsertFaq, type UpdateFaq, type PasswordResetOtp, type InsertPasswordResetOtp, type VatSettings, type InsertVatSettings, type UpdateVatSettings, type LoginLog, type InsertLoginLog, type GuestChatSession, type GuestChatMessage, type ProjectOrderRequest, type InsertProjectOrderRequest, type Plugin, type InsertPlugin, type UpdatePlugin, type SeoSettings, type InsertSeoSettings, type UpdateSeoSettings, type SeoIndexingLog, type InsertSeoIndexingLog, type SslCertificate, type InsertSslCertificate, type UpdateSslCertificate, type SslLog, type InsertSslLog, type BlupalGateway, type InsertBlupalGateway, type BlupalTransaction, type InsertBlupalTransaction, type Announcement, type InsertAnnouncement, type AnnouncementRead } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  initializeAdminUser(): Promise<void>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getSubUsers(parentUserId: string): Promise<User[]>;
  getUsersVisibleToUser(userId: string, userRole: string): Promise<User[]>;
  
  // Tickets
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketsByUser(userId: string): Promise<Ticket[]>;
  getAllTickets(): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, ticket: Partial<Ticket>): Promise<Ticket | undefined>;
  deleteTicket(id: string): Promise<boolean>;
  markTicketAsRead(id: string): Promise<Ticket | undefined>;
  
  // Subscriptions
  getSubscription(id: string): Promise<Subscription | undefined>;
  getAllSubscriptions(): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, subscription: Partial<Subscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: string): Promise<boolean>;
  
  // Products
  getProduct(id: string, currentUserId: string, userRole: string): Promise<Product | undefined>;
  getProductsByUser(userId: string): Promise<Product[]>;
  getAllProducts(currentUserId?: string, userRole?: string): Promise<Product[]>;
  getAdminProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>, currentUserId: string, userRole: string): Promise<Product | undefined>;
  deleteProduct(id: string, currentUserId: string, userRole: string): Promise<boolean>;
  
  // Messages
  getSentMessagesByUser(userId: string): Promise<SentMessage[]>;
  createSentMessage(message: InsertSentMessage): Promise<SentMessage>;
  getReceivedMessagesByUser(userId: string): Promise<ReceivedMessage[]>;
  getReceivedMessagesByUserPaginated(userId: string, page: number, limit: number): Promise<{ messages: ReceivedMessage[], total: number, totalPages: number }>;
  getReceivedMessageByWhatsiPlusId(whatsiPlusId: string): Promise<ReceivedMessage | undefined>;
  getReceivedMessageByWhatsiPlusIdAndUser(whatsiPlusId: string, userId: string): Promise<ReceivedMessage | undefined>;
  createReceivedMessage(message: InsertReceivedMessage): Promise<ReceivedMessage>;
  updateReceivedMessageStatus(id: string, status: string): Promise<ReceivedMessage | undefined>;

  // User Subscriptions
  getUserSubscription(userId: string): Promise<UserSubscription & { subscriptionName?: string | null; subscriptionDescription?: string | null } | undefined>;
  getUserSubscriptionById(id: string): Promise<UserSubscription | undefined>;
  getUserSubscriptionsByUserId(userId: string): Promise<UserSubscription[]>;
  getAllUserSubscriptions(): Promise<UserSubscription[]>;
  createUserSubscription(userSubscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  deleteUserSubscription(id: string): Promise<boolean>;
  updateRemainingDays(id: string, remainingDays: number): Promise<UserSubscription | undefined>;
  getActiveUserSubscriptions(): Promise<UserSubscription[]>;
  getExpiredUserSubscriptions(): Promise<UserSubscription[]>;
  
  // Categories  
  getCategory(id: string, currentUserId: string, userRole: string): Promise<Category | undefined>;
  getAllCategories(currentUserId: string, userRole: string): Promise<Category[]>;
  getCategoriesByParent(parentId: string | null, currentUserId: string, userRole: string): Promise<Category[]>;
  getCategoryTree(currentUserId: string, userRole: string): Promise<Category[]>;
  createCategory(category: InsertCategory, createdBy: string): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>, currentUserId: string, userRole: string): Promise<Category | undefined>;
  deleteCategory(id: string, currentUserId: string, userRole: string): Promise<boolean>;
  reorderCategories(updates: { id: string; order: number; parentId?: string | null }[]): Promise<boolean>;
  
  // Cart
  getCart(userId: string): Promise<Cart | undefined>;
  getCartItems(userId: string): Promise<CartItem[]>;
  getCartItemsWithProducts(userId: string): Promise<(CartItem & { productName: string; productDescription?: string; productImage?: string })[]>;
  addToCart(userId: string, productId: string, quantity: number): Promise<CartItem>;
  updateCartItemQuantity(itemId: string, quantity: number, userId: string): Promise<CartItem | undefined>;
  removeFromCart(itemId: string, userId: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  
  // Addresses
  getAddress(id: string): Promise<Address | undefined>;
  getAddressesByUser(userId: string): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, address: Partial<Address>, userId: string): Promise<Address | undefined>;
  deleteAddress(id: string, userId: string): Promise<boolean>;
  setDefaultAddress(addressId: string, userId: string): Promise<boolean>;
  
  // Orders
  getOrder(id: string): Promise<(Order & { addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string; sellerFirstName?: string; sellerLastName?: string }) | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrdersBySeller(sellerId: string): Promise<(Order & { addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string })[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string, sellerId: string): Promise<Order | undefined>;
  generateOrderNumber(): string;
  getNewOrdersCount(sellerId: string): Promise<number>;
  getUnshippedOrdersCount(sellerId: string): Promise<number>;
  getPaidOrdersCount(sellerId: string): Promise<number>;
  getPendingOrdersCount(sellerId: string): Promise<number>;
  getPendingPaymentOrdersCount(userId: string): Promise<number>;
  getAwaitingPaymentOrdersByUser(userId: string): Promise<Order[]>;
  
  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  getOrderItemsWithProducts(orderId: string): Promise<(OrderItem & { productName: string; productDescription?: string; productImage?: string })[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  getTransactionsByUserAndType(userId: string, type: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string): Promise<Transaction | undefined>;
  getUserBalance(userId: string): Promise<number>;
  getPendingTransactionsCount(sellerId: string): Promise<number>;
  getSuccessfulTransactionsBySellers(sellerIds: string[]): Promise<Transaction[]>;
  // Deposit approval methods
  getDepositsByParent(parentUserId: string): Promise<Transaction[]>;
  approveDeposit(transactionId: string, approvedByUserId: string): Promise<Transaction | undefined>;
  getApprovedDepositsTotalByParent(parentUserId: string): Promise<number>;
  // Duplicate detection
  getTransactionByReferenceId(referenceId: string, userId: string): Promise<Transaction | undefined>;
  
  // Internal Chats
  getInternalChatById(id: string): Promise<InternalChat | undefined>;
  getInternalChatsBetweenUsers(user1Id: string, user2Id: string): Promise<InternalChat[]>;
  getInternalChatsForSeller(sellerId: string): Promise<(InternalChat & { senderName?: string; receiverName?: string })[]>;
  createInternalChat(chat: InsertInternalChat): Promise<InternalChat>;
  markInternalChatAsRead(id: string): Promise<InternalChat | undefined>;
  markMessagesFromSenderAsRead(senderId: string, receiverId: string): Promise<boolean>;
  getUnreadMessagesCountForUser(userId: string, userRole: string): Promise<number>;
  markAllMessagesAsReadForUser(userId: string, userRole: string): Promise<boolean>;
  
  // FAQs
  getFaq(id: string): Promise<Faq | undefined>;
  getAllFaqs(includeInactive?: boolean): Promise<Faq[]>;
  getActiveFaqs(): Promise<Faq[]>;
  getFaqsByCreator(creatorId: string): Promise<Faq[]>;
  createFaq(faq: InsertFaq, createdBy: string): Promise<Faq>;
  updateFaq(id: string, faq: UpdateFaq): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<boolean>;
  updateFaqOrder(id: string, newOrder: number): Promise<Faq | undefined>;
  
  // VAT Settings
  getVatSettings(userId: string): Promise<VatSettings | undefined>;
  updateVatSettings(userId: string, settings: UpdateVatSettings): Promise<VatSettings>;
  
  // Password Reset OTP
  createPasswordResetOtp(userId: string, otp: string, expiresAt: Date): Promise<PasswordResetOtp>;
  getValidPasswordResetOtp(userId: string, otp: string): Promise<PasswordResetOtp | undefined>;
  markOtpAsUsed(id: string): Promise<boolean>;
  deleteExpiredOtps(): Promise<void>;
  
  // Login Logs
  createLoginLog(log: InsertLoginLog): Promise<LoginLog>;
  getLoginLogs(page?: number, limit?: number): Promise<{ logs: LoginLog[], total: number, totalPages: number }>;
  getLoginLogsByUser(userId: string): Promise<LoginLog[]>;
  
  // Guest Chat Sessions
  createGuestChatSession(sessionToken: string, guestName?: string, guestPhone?: string, guestIpAddress?: string): Promise<GuestChatSession>;
  getGuestChatSessionByToken(sessionToken: string): Promise<GuestChatSession | undefined>;
  getAllGuestChatSessions(): Promise<GuestChatSession[]>;
  getActiveGuestChatSessions(): Promise<GuestChatSession[]>;
  updateGuestChatSession(sessionId: string, updates: Partial<GuestChatSession>): Promise<GuestChatSession | undefined>;
  closeGuestChatSession(sessionId: string): Promise<void>;
  
  // Guest Chat Messages
  createGuestChatMessage(sessionId: string, message: string, sender: 'guest' | 'admin'): Promise<GuestChatMessage>;
  getGuestChatMessages(sessionId: string): Promise<GuestChatMessage[]>;
  markGuestChatMessagesAsRead(sessionId: string, sender: 'guest' | 'admin'): Promise<void>;
  getTotalUnreadGuestChats(): Promise<number>;
  
  // Project Order Requests
  createProjectOrderRequest(data: InsertProjectOrderRequest): Promise<ProjectOrderRequest>;
  getProjectOrderRequests(): Promise<ProjectOrderRequest[]>;
  getProjectOrderRequestById(id: string): Promise<ProjectOrderRequest | undefined>;
  updateProjectOrderRequestStatus(id: string, status: string): Promise<ProjectOrderRequest | undefined>;
  deleteProjectOrderRequest(id: string): Promise<void>;
  
  // Plugins
  getPlugin(id: string): Promise<Plugin | undefined>;
  getPluginByName(name: string): Promise<Plugin | undefined>;
  getAllPlugins(): Promise<Plugin[]>;
  createPlugin(plugin: InsertPlugin): Promise<Plugin>;
  updatePlugin(id: string, plugin: Partial<Plugin>): Promise<Plugin | undefined>;
  deletePlugin(id: string): Promise<boolean>;
  togglePluginStatus(id: string): Promise<Plugin | undefined>;
  initializeDefaultPlugins(): Promise<void>;

  // SEO & Google Indexing
  getSeoSettings(): Promise<SeoSettings>;
  updateSeoSettings(settings: UpdateSeoSettings): Promise<SeoSettings>;
  getSeoIndexingLogs(limit?: number): Promise<SeoIndexingLog[]>;
  createSeoIndexingLog(log: InsertSeoIndexingLog): Promise<SeoIndexingLog>;

  // SSL & HTTPS Certificates
  getSslCertificates(userId?: string): Promise<SslCertificate[]>;
  getSslCertificateById(id: string): Promise<SslCertificate | undefined>;
  getSslCertificateByDomain(domain: string): Promise<SslCertificate | undefined>;
  createSslCertificate(cert: InsertSslCertificate): Promise<SslCertificate>;
  updateSslCertificate(id: string, cert: UpdateSslCertificate): Promise<SslCertificate | undefined>;
  deleteSslCertificate(id: string): Promise<boolean>;
  getSslLogs(certificateId?: string, limit?: number): Promise<SslLog[]>;
  createSslLog(log: InsertSslLog): Promise<SslLog>;

  // Blupal Gateway & Transactions
  getBlupalGateway(userId: string): Promise<BlupalGateway | undefined>;
  getAllBlupalGateways(): Promise<{ gateway: BlupalGateway; user: User }[]>;
  getBlupalGatewayBySlugOrUsername(slugOrUsername: string): Promise<{ gateway: BlupalGateway; user: User } | undefined>;
  getBlupalGatewayByWpApiKey(wpApiKey: string): Promise<BlupalGateway | undefined>;
  generateWpApiKey(userId: string): Promise<string>;
  saveBlupalGateway(userId: string, data: Partial<InsertBlupalGateway>): Promise<BlupalGateway>;
  getBlupalTransactions(userId: string, limit?: number, status?: string): Promise<BlupalTransaction[]>;
  getBlupalTransactionByInvoiceId(invoiceId: string): Promise<BlupalTransaction | undefined>;
  createBlupalTransaction(tx: InsertBlupalTransaction): Promise<BlupalTransaction>;
  updateBlupalTransaction(invoiceId: string, updates: Partial<BlupalTransaction>): Promise<BlupalTransaction | undefined>;
  getBlupalStats(userId: string): Promise<{ totalAmount: number; todayAmount: number; successCount: number; pendingCount: number; failedCount: number }>;

  // Announcements
  getAllAnnouncements(): Promise<Announcement[]>;
  getAnnouncementsForUser(userId: string, role: string): Promise<(Announcement & { isRead: boolean })[]>;
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;
  markAnnouncementAsRead(announcementId: string, userId: string): Promise<boolean>;
  getUnreadAnnouncementsCount(userId: string, role: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tickets: Map<string, Ticket>;
  private subscriptions: Map<string, Subscription>;
  private products: Map<string, Product>;
  private sentMessages: Map<string, SentMessage>;
  private receivedMessages: Map<string, ReceivedMessage>;
  private userSubscriptions: Map<string, UserSubscription>;
  private categories: Map<string, Category>;
  private carts: Map<string, Cart>;
  private cartItems: Map<string, CartItem>;
  private addresses: Map<string, Address>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private transactions: Map<string, Transaction>;
  private internalChats: Map<string, InternalChat>;
  private faqs: Map<string, Faq>;
  private passwordResetOtps: Map<string, PasswordResetOtp>;
  private vatSettings: Map<string, VatSettings>;
  private loginLogs: Map<string, LoginLog>;
  private plugins: Map<string, Plugin>;
  private seoSettings: SeoSettings;
  private seoIndexingLogs: Map<string, SeoIndexingLog>;
  private sslCertificates: Map<string, SslCertificate>;
  private sslLogs: Map<string, SslLog>;
  private blupalGateways: Map<string, BlupalGateway>;
  private blupalTransactions: Map<string, BlupalTransaction>;
  private announcements: Map<string, Announcement>;
  private announcementReads: Map<string, AnnouncementRead>;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.subscriptions = new Map();
    this.products = new Map();
    this.sentMessages = new Map();
    this.receivedMessages = new Map();
    this.userSubscriptions = new Map();
    this.categories = new Map();
    this.carts = new Map();
    this.cartItems = new Map();
    this.addresses = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.transactions = new Map();
    this.internalChats = new Map();
    this.faqs = new Map();
    this.passwordResetOtps = new Map();
    this.vatSettings = new Map();
    this.loginLogs = new Map();
    this.plugins = new Map();
    this.seoIndexingLogs = new Map();
    this.sslCertificates = new Map();
    this.sslLogs = new Map();
    this.blupalGateways = new Map();
    this.blupalTransactions = new Map();
    this.announcements = new Map();
    this.announcementReads = new Map();
    this.seoSettings = {
      id: randomUUID(),
      siteTitle: "سایت ساز رخش | طراحی و ساخت سایت حرفه‌ای",
      siteDescription: "پلتفرم جامع راه‌اندازی، مدیریت و رشد کسب‌وکارهای آنلاین و وب‌سایت‌های مدرن",
      siteKeywords: "طراحی سایت, سایت ساز, فروشگاه اینترنتی, سئو, وردپرس, رخش",
      canonicalUrl: null,
      googleSiteVerification: null,
      googleIndexingServiceAccountJson: null,
      bingSiteVerification: null,
      enableAutoIndexPosts: true,
      enableSitemap: true,
      enableRobotsTxt: true,
      robotsTxtContent: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: /sitemap.xml",
      schemaType: "Organization",
      schemaOrganizationName: "سایت ساز رخش",
      schemaLogoUrl: null,
      openGraphImage: null,
      twitterHandle: null,
      lastSitemapGeneratedAt: null,
      lastGooglePingAt: null,
      totalGoogleSubmissions: 0,
      updatedAt: new Date(),
    };
    this.seoIndexingLogs = new Map();
    
    // Create default admin user
    this.initializeAdminUser();
    
    // Create default free subscription
    this.initializeDefaultSubscription();

    // Initialize default plugins
    this.initializeDefaultPlugins().catch(console.error);

    // Initialize default SSL certificate for main site
    this.initializeDefaultSslCertificate().catch(console.error);
    
    // Create test data (user, categories, products)
    this.initializeTestData().catch(console.error);
  }

  private async initializeDefaultSslCertificate() {
    const defaultCertId = "default-ssl-main-cert";
    if (!this.sslCertificates.has(defaultCertId)) {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90); // 90 days validity

      const defaultCert: SslCertificate = {
        id: defaultCertId,
        userId: null,
        domain: "localhost",
        provider: "Let's Encrypt Free SSL",
        status: "active",
        certificateType: "DV (Domain Validated) 2048-bit RSA",
        issuer: "Let's Encrypt Authority X3 / ISRG Root X1",
        serialNumber: "04:" + Array.from({length: 16}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0')).join(':').toUpperCase(),
        fingerprintSha256: Array.from({length: 32}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0')).join(':').toUpperCase(),
        issuedAt: now,
        expiresAt: expiresAt,
        autoRenew: true,
        forceHttpsRedirect: true,
        enableHsts: true,
        enableTls13: true,
        enableOcspStapling: true,
        certificatePem: "-----BEGIN CERTIFICATE-----\nMIIEkjCCA3qgAwIBAgITAP+4kY7v3y4F...\n-----END CERTIFICATE-----",
        privateKeyPem: "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0wB5m...\n-----END RSA PRIVATE KEY-----",
        caBundlePem: "-----BEGIN CERTIFICATE-----\nMIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRHPtlVBgWDtwDQYJKoZIhvcNAQELBQAw\n-----END CERTIFICATE-----",
        csrPem: null,
        dnsChallengeRecord: "_acme-challenge.localhost IN TXT \"k7w8e9d-example-challenge-token\"",
        httpChallengePath: "/.well-known/acme-challenge/http-token-verify",
        lastCheckedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      this.sslCertificates.set(defaultCertId, defaultCert);

      const logId = randomUUID();
      this.sslLogs.set(logId, {
        id: logId,
        certificateId: defaultCertId,
        domain: "localhost",
        action: "issue",
        status: "success",
        message: "گواهینامه امنیتی رایگان Let's Encrypt با موفقیت صادر و پروتکل HTTPS فعال شد.",
        ipAddress: "127.0.0.1",
        createdAt: now,
      });
    }
  }

  public async initializeAdminUser() {
    // Use environment variable for admin password, fallback to default admin123
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    console.log("🔑 کاربر ادمین ایجاد شد - نام کاربری: ehsan");
    console.log(`🔑 رمز عبور: ${adminPassword}`);
    
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser: User = {
      id: randomUUID(),
      username: "ehsan",
      firstName: "احسان",
      lastName: "مدیر",
      email: "ehsan@admin.com",
      phone: "09123456789",
      bankCardNumber: null,
      bankCardHolderName: null,
      bankCardApprovalStatus: "approved",
      password: hashedPassword,
      googleId: null,
      role: "admin",
      parentUserId: null,
      profilePicture: null,
      storeName: null,
      storeDescription: null,
      storeLogo: null,
      isBlocked: false,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async initializeDefaultSubscription() {
    const defaultSubscription: Subscription = {
      id: randomUUID(),
      name: "اشتراک رایگان",
      description: "اشتراک پیش‌فرض رایگان 7 روزه",
      image: null,
      userLevel: "user_level_1",
      priceBeforeDiscount: "0",
      priceAfterDiscount: null,
      duration: "monthly",
      features: [
        "دسترسی پایه به سیستم",
        "پشتیبانی محدود",
        "7 روز استفاده رایگان"
      ],
      isActive: true,
      isDefault: true,
      createdAt: new Date(),
    };
    this.subscriptions.set(defaultSubscription.id, defaultSubscription);
  }

  private async initializeTestData() {
    // ایجاد کاربر سطح 1 تستی
    const testUserPassword = await bcrypt.hash("test123", 10);
    const testUser: User = {
      id: randomUUID(),
      username: "test_seller",
      firstName: "علی",
      lastName: "فروشنده تستی",
      email: "test@seller.com",
      phone: "09111234567",
      bankCardNumber: null,
      bankCardHolderName: null,
      bankCardApprovalStatus: "approved",
      password: testUserPassword,
      googleId: null,
      role: "user_level_1",
      parentUserId: null,
      profilePicture: null,
      storeName: null,
      storeDescription: null,
      storeLogo: null,
      isBlocked: false,
      createdAt: new Date(),
    };
    this.users.set(testUser.id, testUser);
    console.log("🔑 کاربر سطح 1 تستی ایجاد شد - نام کاربری: test_seller، رمز عبور: test123");

    // ایجاد 3 دسته‌بندی موبایل
    const mobileCategories = [
      {
        name: "گوشی‌های هوشمند",
        description: "انواع گوشی‌های هوشمند اندروید و آیفون"
      },
      {
        name: "لوازم جانبی موبایل",
        description: "کیف، کاور، محافظ صفحه و سایر لوازم جانبی"
      },
      {
        name: "تبلت و آیپد",
        description: "انواع تبلت‌های اندروید و آیپد اپل"
      }
    ];

    const createdCategories: Category[] = [];
    
    for (const categoryData of mobileCategories) {
      const category: Category = {
        id: randomUUID(),
        name: categoryData.name,
        description: categoryData.description,
        parentId: null,
        createdBy: testUser.id,
        order: createdCategories.length,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.categories.set(category.id, category);
      createdCategories.push(category);
    }
    console.log("📱 3 دسته‌بندی موبایل تستی ایجاد شد");

    // ایجاد 6 محصول تستی
    const testProducts = [
      {
        name: "آیفون 15 پرو مکس",
        description: "گوشی آیفون 15 پرو مکس با ظرفیت 256 گیگابایت، رنگ طلایی",
        categoryId: createdCategories[0].id,
        priceBeforeDiscount: "45000000",
        priceAfterDiscount: "43000000",
        quantity: 5,
        image: "/uploads/iphone15-pro-max.png"
      },
      {
        name: "سامسونگ گلکسی S24 اولترا",
        description: "گوشی سامسونگ گلکسی S24 اولترا با ظرفیت 512 گیگابایت",
        categoryId: createdCategories[0].id,
        priceBeforeDiscount: "35000000",
        priceAfterDiscount: "33500000",
        quantity: 8,
        image: "/uploads/samsung-s24-ultra.png"
      },
      {
        name: "کاور چرمی آیفون",
        description: "کاور چرمی اصل برای آیفون 15 سری، رنگ قهوه‌ای",
        categoryId: createdCategories[1].id,
        priceBeforeDiscount: "350000",
        priceAfterDiscount: "299000",
        quantity: 20,
        image: "/uploads/iphone-case.png"
      },
      {
        name: "محافظ صفحه شیشه‌ای",
        description: "محافظ صفحه شیشه‌ای ضد ضربه برای انواع گوشی",
        categoryId: createdCategories[1].id,
        priceBeforeDiscount: "120000",
        priceAfterDiscount: "95000",
        quantity: 50,
        image: "/uploads/screen-protector.png"
      },
      {
        name: "آیپد پرو 12.9 اینچ",
        description: "تبلت آیپد پرو 12.9 اینچ نسل پنجم با چیپ M2",
        categoryId: createdCategories[2].id,
        priceBeforeDiscount: "28000000",
        priceAfterDiscount: "26500000",
        quantity: 3,
        image: "/uploads/ipad-pro.png"
      },
      {
        name: "تبلت سامسونگ گلکسی Tab S9",
        description: "تبلت سامسونگ گلکسی Tab S9 با صفحه 11 اینچ",
        categoryId: createdCategories[2].id,
        priceBeforeDiscount: "18000000",
        priceAfterDiscount: "17200000",
        quantity: 6,
        image: "/uploads/samsung-tab-s9.png"
      }
    ];

    for (const productData of testProducts) {
      const product: Product = {
        id: randomUUID(),
        userId: testUser.id,
        name: productData.name,
        description: productData.description,
        categoryId: productData.categoryId,
        image: productData.image,
        quantity: productData.quantity,
        priceBeforeDiscount: productData.priceBeforeDiscount,
        priceAfterDiscount: productData.priceAfterDiscount,
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(product.id, product);
    }
    console.log("🛍️ 6 محصول تستی ایجاد شد");

    // ایجاد اشتراک فعال برای کاربر تستی
    const defaultSub = Array.from(this.subscriptions.values()).find(s => s.isDefault);
    if (defaultSub) {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const userSub: UserSubscription = {
        id: randomUUID(),
        userId: testUser.id,
        subscriptionId: defaultSub.id,
        status: "active",
        startDate,
        endDate,
        remainingDays: 30,
        isTrialPeriod: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.userSubscriptions.set(userSub.id, userSub);
    }

    // ایجاد محصولات نمونه برای ادمین جهت کاتالوگ محصولات ادمین
    const adminUser = Array.from(this.users.values()).find(u => u.role === 'admin');
    if (adminUser) {
      const adminProductsData = [
        {
          name: "هدفون بی‌سیم پرو",
          description: "هدفون بلوتوثی با کیفیت صدای استثنایی و حذف نویز فعال",
          priceBeforeDiscount: "2500000",
          priceAfterDiscount: "2200000",
          quantity: 50,
          image: "/uploads/headphones.png",
        },
        {
          name: "ساعت هوشمند اولترا",
          description: "ساعت هوشمند مجهز به پایش ضربان قلب، GPS و ضد آب",
          priceBeforeDiscount: "4200000",
          priceAfterDiscount: "3890000",
          quantity: 30,
          image: "/uploads/smartwatch.png",
        },
      ];

      for (const prod of adminProductsData) {
        const product: Product = {
          id: randomUUID(),
          userId: adminUser.id,
          name: prod.name,
          description: prod.description,
          categoryId: createdCategories[0]?.id || null,
          image: prod.image,
          quantity: prod.quantity,
          priceBeforeDiscount: prod.priceBeforeDiscount,
          priceAfterDiscount: prod.priceAfterDiscount,
          isActive: true,
          createdAt: new Date(),
        };
        this.products.set(product.id, product);
      }
    }

    console.log("✅ تمام داده‌های تستی با موفقیت ایجاد شدند");
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    const raw = (emailOrUsername || '').trim();
    const normalized = raw.toLowerCase();
    
    // Try email first
    const userByEmail = Array.from(this.users.values()).find(
      user => user.email && user.email.toLowerCase() === normalized
    );
    if (userByEmail) return userByEmail;
    
    // Try username
    const userByUsername = Array.from(this.users.values()).find(
      user => user.username && user.username.toLowerCase() === normalized
    );
    if (userByUsername) return userByUsername;

    // Support 'admin' as an alias for the admin user
    if (normalized === "admin" || normalized === "مدیر" || normalized === "administrator") {
      const adminUser = Array.from(this.users.values()).find(user => user.role === "admin");
      if (adminUser) return adminUser;
    }

    // Try phone number matching
    const cleanDigits = raw.replace(/\D/g, '').replace(/^(98|0098)/, '').replace(/^0/, '');
    if (cleanDigits.length >= 9) {
      const userByPhone = Array.from(this.users.values()).find(user => {
        if (!user.phone) return false;
        const userCleanDigits = user.phone.replace(/\D/g, '').replace(/^(98|0098)/, '').replace(/^0/, '');
        return userCleanDigits === cleanDigits;
      });
      if (userByPhone) return userByPhone;
    }

    return undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      email: insertUser.email || null,
      role: insertUser.role || 'user_level_1',
      password: insertUser.password || null,
      googleId: insertUser.googleId || null,
      profilePicture: insertUser.profilePicture || null,
      parentUserId: insertUser.parentUserId || null,
      bankCardNumber: insertUser.bankCardNumber || null,
      bankCardHolderName: insertUser.bankCardHolderName || null,
      bankCardApprovalStatus: insertUser.bankCardApprovalStatus || "pending",
      storeName: insertUser.storeName || null,
      storeDescription: insertUser.storeDescription || null,
      storeLogo: insertUser.storeLogo || null,
      isBlocked: insertUser.isBlocked !== undefined ? insertUser.isBlocked : false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, password: hashedPassword };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getSubUsers(parentUserId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.parentUserId === parentUserId);
  }

  async getUsersVisibleToUser(userId: string, userRole: string): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    
    if (userRole === 'admin') {
      // Admin can see all users
      return allUsers;
    } else if (userRole === 'user_level_1') {
      // Level 1 users can see their sub-users
      return allUsers.filter(user => user.parentUserId === userId);
    }
    
    return [];
  }

  // Tickets
  async getTicket(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(ticket => ticket.userId === userId);
  }

  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = randomUUID();
    const ticket: Ticket = {
      ...insertTicket,
      id,
      priority: insertTicket.priority || 'medium',
      attachments: insertTicket.attachments || null,
      status: "unread",
      adminReply: null,
      adminReplyAt: null,
      lastResponseAt: new Date(),
      createdAt: new Date(),
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    
    const updatedTicket = { ...ticket, ...updates };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async deleteTicket(id: string): Promise<boolean> {
    return this.tickets.delete(id);
  }

  async markTicketAsRead(id: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    const updatedTicket: Ticket = { ...ticket, status: "read" };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  // Subscriptions
  async getSubscription(id: string): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = {
      ...insertSubscription,
      id,
      userLevel: insertSubscription.userLevel || 'user_level_1',
      description: insertSubscription.description || null,
      image: insertSubscription.image || null,
      duration: insertSubscription.duration || 'monthly',
      priceBeforeDiscount: insertSubscription.priceBeforeDiscount || null,
      priceAfterDiscount: insertSubscription.priceAfterDiscount || null,
      features: insertSubscription.features || null,
      isActive: insertSubscription.isActive !== undefined ? insertSubscription.isActive : true,
      isDefault: false,
      createdAt: new Date(),
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...updates };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    return this.subscriptions.delete(id);
  }

  // Products
  async getProduct(id: string, currentUserId: string, userRole: string): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    // Apply role-based access control
    if (userRole === 'admin' || userRole === 'user_level_1') {
      // Admin and level 1 can only access their own products
      return product.userId === currentUserId ? product : undefined;
    }
    return undefined;
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.userId === userId);
  }

  async getAllProducts(currentUserId: string, userRole: string): Promise<Product[]> {
    if (!currentUserId || !userRole) {
      throw new Error('User context required for getAllProducts');
    }

    const allProducts = Array.from(this.products.values());
    
    return allProducts.filter(product => product.userId === currentUserId);
    
    return [];
  }

  async getAdminProducts(): Promise<Product[]> {
    const adminUser = Array.from(this.users.values()).find(user => user.role === 'admin');
    if (!adminUser) return [];
    return Array.from(this.products.values()).filter(
      product => product.userId === adminUser.id && product.isActive !== false
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      description: insertProduct.description || null,
      image: insertProduct.image || null,
      categoryId: insertProduct.categoryId || null,
      quantity: insertProduct.quantity || 0,
      priceAfterDiscount: insertProduct.priceAfterDiscount || null,
      isActive: insertProduct.isActive !== undefined ? insertProduct.isActive : true,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>, currentUserId: string, userRole: string): Promise<Product | undefined> {
    const product = await this.getProduct(id, currentUserId, userRole);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string, currentUserId: string, userRole: string): Promise<boolean> {
    const product = await this.getProduct(id, currentUserId, userRole);
    if (!product) return false;
    
    return this.products.delete(id);
  }

  // Messages
  async getSentMessagesByUser(userId: string): Promise<SentMessage[]> {
    return Array.from(this.sentMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async createSentMessage(insertMessage: InsertSentMessage): Promise<SentMessage> {
    const id = randomUUID();
    const message: SentMessage = {
      ...insertMessage,
      id,
      status: insertMessage.status || "sent",
      timestamp: new Date(),
    };
    this.sentMessages.set(id, message);
    return message;
  }

  async getReceivedMessagesByUser(userId: string): Promise<ReceivedMessage[]> {
    return Array.from(this.receivedMessages.values()).filter(message => message.userId === userId);
  }

  async getReceivedMessagesByUserPaginated(userId: string, page: number, limit: number): Promise<{ messages: ReceivedMessage[], total: number, totalPages: number }> {
    const allMessages = Array.from(this.receivedMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    
    const total = allMessages.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const messages = allMessages.slice(offset, offset + limit);
    
    return { messages, total, totalPages };
  }

  async getReceivedMessageByWhatsiPlusId(whatsiPlusId: string): Promise<ReceivedMessage | undefined> {
    return Array.from(this.receivedMessages.values()).find(message => message.whatsiPlusId === whatsiPlusId);
  }

  async getReceivedMessageByWhatsiPlusIdAndUser(whatsiPlusId: string, userId: string): Promise<ReceivedMessage | undefined> {
    return Array.from(this.receivedMessages.values()).find(message => 
      message.whatsiPlusId === whatsiPlusId && message.userId === userId
    );
  }

  async createReceivedMessage(insertMessage: InsertReceivedMessage): Promise<ReceivedMessage> {
    const id = randomUUID();
    const message: ReceivedMessage = {
      ...insertMessage,
      id,
      status: insertMessage.status || "خوانده نشده",
      originalDate: insertMessage.originalDate || null,
      imageUrl: insertMessage.imageUrl || null,
      timestamp: new Date(),
    };
    this.receivedMessages.set(id, message);
    return message;
  }

  async updateReceivedMessageStatus(id: string, status: string): Promise<ReceivedMessage | undefined> {
    const message = this.receivedMessages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, status };
    this.receivedMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  // User Subscriptions
  private normalizeUserSubscription(userSub: UserSubscription): UserSubscription {
    let endDate = userSub.endDate ? new Date(userSub.endDate) : null;
    const startDate = userSub.startDate ? new Date(userSub.startDate) : (userSub.createdAt ? new Date(userSub.createdAt) : new Date());

    // If endDate is missing or invalid but remainingDays > 0, calculate endDate from now
    if ((!endDate || isNaN(endDate.getTime())) && typeof userSub.remainingDays === 'number' && userSub.remainingDays > 0) {
      endDate = new Date(Date.now() + userSub.remainingDays * 24 * 60 * 60 * 1000);
    }

    const endDateTime = endDate && !isNaN(endDate.getTime()) ? endDate.getTime() : 0;
    let remainingDays = 0;
    if (endDateTime > 0) {
      const diffMs = endDateTime - Date.now();
      remainingDays = diffMs > 0 ? Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000))) : 0;
    }

    const status = remainingDays > 0 
      ? (userSub.status === 'suspended' ? 'suspended' : 'active') 
      : 'expired';

    const normalized: UserSubscription = {
      ...userSub,
      startDate,
      endDate: endDate || userSub.endDate,
      remainingDays,
      status,
    };

    if (
      userSub.remainingDays !== remainingDays ||
      userSub.status !== status ||
      userSub.endDate !== normalized.endDate
    ) {
      normalized.updatedAt = new Date();
      this.userSubscriptions.set(userSub.id, normalized);
    }

    return normalized;
  }

  async getUserSubscription(userId: string): Promise<UserSubscription & { subscriptionName?: string | null; subscriptionDescription?: string | null } | undefined> {
    const rawSubs = Array.from(this.userSubscriptions.values())
      .filter(sub => sub.userId === userId);
    if (rawSubs.length === 0) return undefined;

    // Normalize each subscription according to current real-time clock
    const userSubs = rawSubs.map(sub => this.normalizeUserSubscription(sub));

    // Prioritize active subscriptions with highest remaining days, then most recent
    userSubs.sort((a, b) => {
      const aActive = (a.status === 'active' && a.remainingDays > 0) ? 1 : 0;
      const bActive = (b.status === 'active' && b.remainingDays > 0) ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      if (a.remainingDays !== b.remainingDays) return b.remainingDays - a.remainingDays;
      const aTime = new Date(a.updatedAt || a.createdAt || a.startDate || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || b.startDate || 0).getTime();
      return bTime - aTime;
    });

    const userSub = userSubs[0];
    if (!userSub) return undefined;

    const subscription = this.subscriptions.get(userSub.subscriptionId);
    return {
      ...userSub,
      subscriptionName: subscription?.name,
      subscriptionDescription: subscription?.description,
    };
  }

  async getUserSubscriptionsByUserId(userId: string): Promise<UserSubscription[]> {
    const rawSubs = Array.from(this.userSubscriptions.values()).filter(sub => sub.userId === userId);
    return rawSubs.map(sub => this.normalizeUserSubscription(sub));
  }

  async getUserSubscriptionById(id: string): Promise<UserSubscription | undefined> {
    const raw = this.userSubscriptions.get(id);
    if (!raw) return undefined;
    return this.normalizeUserSubscription(raw);
  }

  async getAllUserSubscriptions(): Promise<UserSubscription[]> {
    return Array.from(this.userSubscriptions.values()).map(sub => this.normalizeUserSubscription(sub));
  }

  async createUserSubscription(insertUserSubscription: InsertUserSubscription): Promise<UserSubscription> {
    const id = randomUUID();
    const startDate = insertUserSubscription.startDate ? new Date(insertUserSubscription.startDate) : new Date();
    let remainingDays = typeof insertUserSubscription.remainingDays === 'number' ? Math.max(0, Math.floor(insertUserSubscription.remainingDays)) : 0;
    
    let endDate = insertUserSubscription.endDate ? new Date(insertUserSubscription.endDate) : null;
    if ((!endDate || isNaN(endDate.getTime())) && remainingDays > 0) {
      endDate = new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000);
    } else if (endDate && !isNaN(endDate.getTime())) {
      const diffMs = endDate.getTime() - Date.now();
      remainingDays = diffMs > 0 ? Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000))) : 0;
    }

    const status = remainingDays > 0 ? (insertUserSubscription.status || 'active') : 'expired';

    const userSubscription: UserSubscription = {
      ...insertUserSubscription,
      id,
      status,
      startDate,
      endDate: endDate || new Date(),
      remainingDays,
      isTrialPeriod: insertUserSubscription.isTrialPeriod || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userSubscriptions.set(id, userSubscription);
    return userSubscription;
  }

  async updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const existing = this.userSubscriptions.get(id);
    if (!existing) return undefined;
    
    let remainingDays = updates.remainingDays !== undefined ? updates.remainingDays : existing.remainingDays;
    let endDate = updates.endDate !== undefined 
      ? (updates.endDate ? new Date(updates.endDate) : null) 
      : (existing.endDate ? new Date(existing.endDate) : null);

    if (updates.remainingDays !== undefined && updates.endDate === undefined) {
      if (remainingDays > 0) {
        endDate = new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000);
      } else {
        endDate = new Date();
      }
    } else if (updates.endDate !== undefined && updates.remainingDays === undefined) {
      if (endDate && !isNaN(endDate.getTime())) {
        const diffMs = endDate.getTime() - Date.now();
        remainingDays = diffMs > 0 ? Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000))) : 0;
      }
    }

    const status = updates.status !== undefined 
      ? updates.status 
      : (remainingDays > 0 ? 'active' : 'expired');

    const updatedUserSubscription: UserSubscription = { 
      ...existing, 
      ...updates,
      endDate: endDate || existing.endDate,
      remainingDays,
      status,
      updatedAt: new Date()
    };
    this.userSubscriptions.set(id, updatedUserSubscription);
    return updatedUserSubscription;
  }

  async deleteUserSubscription(id: string): Promise<boolean> {
    return this.userSubscriptions.delete(id);
  }

  async updateRemainingDays(id: string, remainingDays: number): Promise<UserSubscription | undefined> {
    const userSubscription = this.userSubscriptions.get(id);
    if (!userSubscription) return undefined;
    
    const normalizedDays = Math.max(0, Math.floor(remainingDays));
    const status = normalizedDays <= 0 ? 'expired' : 'active';
    const endDate = normalizedDays > 0 
      ? new Date(Date.now() + normalizedDays * 24 * 60 * 60 * 1000)
      : new Date();

    const updatedUserSubscription: UserSubscription = { 
      ...userSubscription, 
      remainingDays: normalizedDays,
      endDate,
      status,
      updatedAt: new Date()
    };
    this.userSubscriptions.set(id, updatedUserSubscription);
    return updatedUserSubscription;
  }

  async getActiveUserSubscriptions(): Promise<UserSubscription[]> {
    const all = await this.getAllUserSubscriptions();
    return all.filter(sub => sub.status === 'active' && sub.remainingDays > 0);
  }

  async getExpiredUserSubscriptions(): Promise<UserSubscription[]> {
    const all = await this.getAllUserSubscriptions();
    return all.filter(sub => sub.status === 'expired' || sub.remainingDays <= 0);
  }

  // Categories
  async getCategory(id: string, currentUserId: string, userRole: string): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    // Check ownership based on user role
    if (userRole === 'admin' || userRole === 'user_level_1') {
      // Admin and level 1 can only access their own categories
      if (category.createdBy !== currentUserId) {
        return undefined;
      }
    } else if (userRole === 'user_level_2') {
      // Level 2 can only access categories from level 1 users
      const level1Users = Array.from(this.users.values()).filter(user => user.role === 'user_level_1');
      const level1UserIds = level1Users.map(user => user.id);
      if (!level1UserIds.includes(category.createdBy)) {
        return undefined;
      }
    } else {
      return undefined;
    }
    
    return category;
  }

  async getAllCategories(currentUserId: string, userRole: string): Promise<Category[]> {
    if (!currentUserId || !userRole) {
      throw new Error('User context required for getAllCategories');
    }

    const allCategories = Array.from(this.categories.values());
    let filteredCategories: Category[] = [];
    
    // Filter based on user role
    if (userRole === 'admin') {
      // Admin sees only their own categories
      filteredCategories = allCategories.filter(category => category.createdBy === currentUserId);
    } else if (userRole === 'user_level_1') {
      // Level 1 sees only their own categories  
      filteredCategories = allCategories.filter(category => category.createdBy === currentUserId);
    } else if (userRole === 'user_level_2') {
      // Level 2 sees only categories from level 1 users
      const level1Users = Array.from(this.users.values()).filter(user => user.role === 'user_level_1');
      const level1UserIds = level1Users.map(user => user.id);
      filteredCategories = allCategories.filter(category => level1UserIds.includes(category.createdBy));
    }
    
    return filteredCategories.sort((a, b) => a.order - b.order);
  }

  async getCategoriesByParent(parentId: string | null, currentUserId: string, userRole: string): Promise<Category[]> {
    const allCategories = await this.getAllCategories(currentUserId, userRole);
    return allCategories.filter(category => category.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }

  async getCategoryTree(currentUserId: string, userRole: string): Promise<Category[]> {
    const allCategories = await this.getAllCategories(currentUserId, userRole);
    
    // Build tree structure (this is a simplified version, full tree building would be more complex)
    return allCategories.filter(cat => cat.parentId === null);
  }

  async createCategory(insertCategory: InsertCategory, createdBy: string): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      ...insertCategory,
      id,
      description: insertCategory.description || null,
      parentId: insertCategory.parentId || null,
      order: insertCategory.order || 0,
      isActive: insertCategory.isActive !== undefined ? insertCategory.isActive : true,
      createdBy: createdBy, // Server provides this field
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>, currentUserId: string, userRole: string): Promise<Category | undefined> {
    const category = await this.getCategory(id, currentUserId, userRole);
    if (!category) return undefined;
    
    const updatedCategory = { 
      ...category, 
      ...updates,
      updatedAt: new Date()
    };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string, currentUserId: string, userRole: string): Promise<boolean> {
    const category = await this.getCategory(id, currentUserId, userRole);
    if (!category) return false;
    
    return this.categories.delete(id);
  }

  async reorderCategories(updates: { id: string; order: number; parentId?: string | null }[]): Promise<boolean> {
    try {
      for (const update of updates) {
        const category = this.categories.get(update.id);
        if (category) {
          const updatedCategory = {
            ...category,
            order: update.order,
            parentId: update.parentId !== undefined ? update.parentId : category.parentId,
            updatedAt: new Date()
          };
          this.categories.set(update.id, updatedCategory);
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // Cart implementation
  async getCart(userId: string): Promise<Cart | undefined> {
    return Array.from(this.carts.values()).find(cart => cart.userId === userId);
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    const cart = await this.getCart(userId);
    if (!cart) return [];
    
    return Array.from(this.cartItems.values()).filter(item => item.cartId === cart.id);
  }

  async getCartItemsWithProducts(userId: string): Promise<(CartItem & { productName: string; productDescription?: string; productImage?: string })[]> {
    const cartItems = await this.getCartItems(userId);
    
    return cartItems.map(item => {
      const product = this.products.get(item.productId);
      return {
        ...item,
        productName: product?.name || 'محصول حذف شده',
        productDescription: product?.description || undefined,
        productImage: product?.image || undefined,
      };
    });
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error('محصول یافت نشد');
    }

    // Get or create cart for user
    let cart = await this.getCart(userId);
    if (!cart) {
      const cartId = randomUUID();
      cart = {
        id: cartId,
        userId,
        totalAmount: "0",
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.carts.set(cartId, cart);
    }

    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.cartId === cart!.id && item.productId === productId
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      return await this.updateCartItemQuantity(existingItem.id, newQuantity, userId) || existingItem;
    } else {
      // Add new item
      const unitPrice = product.priceAfterDiscount || product.priceBeforeDiscount;
      const totalPrice = parseFloat(unitPrice) * quantity;
      
      const cartItemId = randomUUID();
      const cartItem: CartItem = {
        id: cartItemId,
        cartId: cart.id,
        productId,
        quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.cartItems.set(cartItemId, cartItem);
      await this.updateCartTotals(cart.id);
      return cartItem;
    }
  }

  async updateCartItemQuantity(itemId: string, quantity: number, userId: string): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(itemId);
    if (!cartItem) return undefined;

    // Verify item belongs to user's cart
    const cart = this.carts.get(cartItem.cartId);
    if (!cart || cart.userId !== userId) return undefined;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await this.removeFromCart(itemId, userId);
      return undefined;
    }

    const product = this.products.get(cartItem.productId);
    if (!product) return undefined;

    const unitPrice = parseFloat(cartItem.unitPrice);
    const totalPrice = unitPrice * quantity;

    const updatedItem: CartItem = {
      ...cartItem,
      quantity,
      totalPrice: totalPrice.toString(),
      updatedAt: new Date(),
    };

    this.cartItems.set(itemId, updatedItem);
    await this.updateCartTotals(cart.id);
    return updatedItem;
  }

  async removeFromCart(itemId: string, userId: string): Promise<boolean> {
    const cartItem = this.cartItems.get(itemId);
    if (!cartItem) return false;

    // Verify item belongs to user's cart
    const cart = this.carts.get(cartItem.cartId);
    if (!cart || cart.userId !== userId) return false;

    const removed = this.cartItems.delete(itemId);
    if (removed) {
      await this.updateCartTotals(cart.id);
    }
    return removed;
  }

  async clearCart(userId: string): Promise<boolean> {
    const cart = await this.getCart(userId);
    if (!cart) return false;

    // Remove all cart items
    const cartItems = Array.from(this.cartItems.values()).filter(item => item.cartId === cart.id);
    cartItems.forEach(item => this.cartItems.delete(item.id));

    // Update cart totals
    await this.updateCartTotals(cart.id);
    return true;
  }

  private async updateCartTotals(cartId: string): Promise<void> {
    const cart = this.carts.get(cartId);
    if (!cart) return;

    const cartItems = Array.from(this.cartItems.values()).filter(item => item.cartId === cartId);
    const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const updatedCart: Cart = {
      ...cart,
      totalAmount: totalAmount.toString(),
      itemCount,
      updatedAt: new Date(),
    };

    this.carts.set(cartId, updatedCart);
  }

  // Addresses
  async getAddress(id: string): Promise<Address | undefined> {
    return this.addresses.get(id);
  }

  async getAddressesByUser(userId: string): Promise<Address[]> {
    return Array.from(this.addresses.values()).filter(address => address.userId === userId);
  }

  async createAddress(insertAddress: InsertAddress): Promise<Address> {
    const id = randomUUID();
    
    // If this is the user's first address, set it as default
    const userAddresses = await this.getAddressesByUser(insertAddress.userId);
    const isFirstAddress = userAddresses.length === 0;
    
    const address: Address = {
      ...insertAddress,
      id,
      latitude: insertAddress.latitude || null,
      longitude: insertAddress.longitude || null,
      postalCode: insertAddress.postalCode || null,
      isDefault: insertAddress.isDefault || isFirstAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.addresses.set(id, address);
    return address;
  }

  async updateAddress(id: string, updates: Partial<Address>, userId: string): Promise<Address | undefined> {
    const address = this.addresses.get(id);
    if (!address || address.userId !== userId) return undefined;
    
    const updatedAddress: Address = {
      ...address,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.addresses.set(id, updatedAddress);
    return updatedAddress;
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const address = this.addresses.get(id);
    if (!address || address.userId !== userId) return false;
    
    return this.addresses.delete(id);
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<boolean> {
    const address = this.addresses.get(addressId);
    if (!address || address.userId !== userId) return false;
    
    // Remove default from all user addresses
    const userAddresses = await this.getAddressesByUser(userId);
    userAddresses.forEach(addr => {
      if (addr.isDefault) {
        const updatedAddr = { ...addr, isDefault: false, updatedAt: new Date() };
        this.addresses.set(addr.id, updatedAddr);
      }
    });
    
    // Set new default address
    const updatedAddress = { ...address, isDefault: true, updatedAt: new Date() };
    this.addresses.set(addressId, updatedAddress);
    return true;
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.sellerId === sellerId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const orderNumber = this.generateOrderNumber();
    
    const order: Order = {
      ...insertOrder,
      id,
      orderNumber,
      addressId: insertOrder.addressId || null,
      shippingMethod: insertOrder.shippingMethod || null,
      status: "pending",
      statusHistory: ["pending"],
      notes: insertOrder.notes || null,
      paymentStartedAt: insertOrder.paymentStartedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: string, status: string, sellerId: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order || order.sellerId !== sellerId) return undefined;
    
    const statusHistory = [...(order.statusHistory || []), status];
    
    const updatedOrder: Order = {
      ...order,
      status,
      statusHistory,
      updatedAt: new Date(),
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  async getNewOrdersCount(sellerId: string): Promise<number> {
    const sellerOrders = Array.from(this.orders.values())
      .filter(order => order.sellerId === sellerId && order.status === 'awaiting_payment');
    return sellerOrders.length;
  }

  async getUnshippedOrdersCount(sellerId: string): Promise<number> {
    const unpaidAndPendingStatuses = ['awaiting_payment', 'pending'];
    const sellerUnpaidAndPendingOrders = Array.from(this.orders.values())
      .filter(order => order.sellerId === sellerId && unpaidAndPendingStatuses.includes(order.status));
    return sellerUnpaidAndPendingOrders.length;
  }

  async getPaidOrdersCount(sellerId: string): Promise<number> {
    const paidOrders = Array.from(this.orders.values())
      .filter(order => order.sellerId === sellerId && order.status !== 'awaiting_payment');
    return paidOrders.length;
  }

  async getPendingOrdersCount(sellerId: string): Promise<number> {
    const pendingOrders = Array.from(this.orders.values())
      .filter(order => order.sellerId === sellerId && order.status === 'pending');
    return pendingOrders.length;
  }

  async getPendingPaymentOrdersCount(userId: string): Promise<number> {
    const userPendingPaymentOrders = Array.from(this.orders.values())
      .filter(order => order.userId === userId && order.status === 'awaiting_payment');
    return userPendingPaymentOrders.length;
  }

  async getAwaitingPaymentOrdersByUser(userId: string): Promise<Order[]> {
    // Get orders that are awaiting payment for user, sorted by creation date (oldest first)
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId && order.status === 'awaiting_payment')
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB; // oldest first
      });
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async getOrderItemsWithProducts(orderId: string): Promise<(OrderItem & { productName: string; productDescription?: string; productImage?: string })[]> {
    const orderItems = await this.getOrderItems(orderId);
    return orderItems.map(item => {
      const product = this.products.get(item.productId);
      return {
        ...item,
        productName: product?.name || 'محصول حذف شده',
        productDescription: product?.description || undefined,
        productImage: product?.image || undefined,
      };
    });
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = randomUUID();
    
    const orderItem: OrderItem = {
      ...insertOrderItem,
      id,
      createdAt: new Date(),
    };
    
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // Transactions
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getTransactionsByUserAndType(userId: string, type: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId && transaction.type === type)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      orderId: insertTransaction.orderId || null,
      status: insertTransaction.status || "pending",
      transactionDate: insertTransaction.transactionDate || null,
      transactionTime: insertTransaction.transactionTime || null,
      accountSource: insertTransaction.accountSource || null,
      paymentMethod: insertTransaction.paymentMethod || null,
      referenceId: insertTransaction.referenceId || null,
      // Parent-child deposit approval fields
      initiatorUserId: insertTransaction.initiatorUserId || null,
      parentUserId: insertTransaction.parentUserId || null,
      approvedByUserId: insertTransaction.approvedByUserId || null,
      approvedAt: insertTransaction.approvedAt || null,
      createdAt: new Date(),
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = {
      ...transaction,
      status,
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async getUserBalance(userId: string): Promise<number> {
    const transactions = await this.getTransactionsByUser(userId);
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    
    let balance = 0;
    completedTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'deposit') {
        balance += amount;
      } else if (transaction.type === 'withdraw' || transaction.type === 'order_payment') {
        balance -= amount;
      }
    });
    
    return Math.max(balance, 0);
  }

  async getPendingTransactionsCount(sellerId: string): Promise<number> {
    // Count transactions that are pending and belong to sub-users of this seller
    const subUsers = await this.getSubUsers(sellerId);
    const subUserIds = subUsers.map(user => user.id);
    
    return Array.from(this.transactions.values())
      .filter(transaction => 
        transaction.status === 'pending' && 
        subUserIds.includes(transaction.userId)
      ).length;
  }

  async getSuccessfulTransactionsBySellers(sellerIds: string[]): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => 
        transaction.status === 'completed' && 
        transaction.type === 'order_payment' &&
        transaction.orderId
      )
      .filter(transaction => {
        const order = this.orders.get(transaction.orderId!);
        return order && sellerIds.includes(order.sellerId);
      })
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // Deposit approval methods
  async getDepositsByParent(parentUserId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => 
        transaction.type === 'deposit' && 
        transaction.parentUserId === parentUserId
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async approveDeposit(transactionId: string, approvedByUserId: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = {
      ...transaction,
      status: 'completed',
      approvedByUserId,
      approvedAt: new Date(),
    };
    
    this.transactions.set(transactionId, updatedTransaction);
    return updatedTransaction;
  }

  async getApprovedDepositsTotalByParent(parentUserId: string): Promise<number> {
    const approvedDeposits = Array.from(this.transactions.values())
      .filter(transaction => 
        transaction.type === 'deposit' && 
        transaction.parentUserId === parentUserId &&
        transaction.status === 'completed' &&
        transaction.approvedByUserId
      );
    
    return approvedDeposits.reduce((total, transaction) => {
      return total + parseFloat(transaction.amount);
    }, 0);
  }

  async getTransactionByReferenceId(referenceId: string, userId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values())
      .find(transaction => 
        transaction.referenceId === referenceId && 
        transaction.userId === userId
      );
  }

  // Internal Chat methods
  async getInternalChatById(id: string): Promise<InternalChat | undefined> {
    return this.internalChats.get(id);
  }

  async getInternalChatsBetweenUsers(user1Id: string, user2Id: string): Promise<InternalChat[]> {
    return Array.from(this.internalChats.values())
      .filter(chat => 
        (chat.senderId === user1Id && chat.receiverId === user2Id) ||
        (chat.senderId === user2Id && chat.receiverId === user1Id)
      )
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async getInternalChatsForSeller(sellerId: string): Promise<(InternalChat & { senderName?: string; receiverName?: string })[]> {
    const chats = Array.from(this.internalChats.values())
      .filter(chat => chat.senderId === sellerId || chat.receiverId === sellerId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    return chats.map(chat => {
      const sender = this.users.get(chat.senderId);
      const receiver = this.users.get(chat.receiverId);
      return {
        ...chat,
        senderName: sender ? `${sender.firstName} ${sender.lastName}` : undefined,
        receiverName: receiver ? `${receiver.firstName} ${receiver.lastName}` : undefined,
      };
    });
  }

  async createInternalChat(chat: InsertInternalChat): Promise<InternalChat> {
    const id = randomUUID();
    const newChat: InternalChat = {
      ...chat,
      id,
      isRead: false,
      createdAt: new Date()
    };
    
    this.internalChats.set(id, newChat);
    return newChat;
  }

  async markInternalChatAsRead(id: string): Promise<InternalChat | undefined> {
    const chat = this.internalChats.get(id);
    if (!chat) return undefined;

    const updatedChat = { ...chat, isRead: true };
    this.internalChats.set(id, updatedChat);
    return updatedChat;
  }

  async getUnreadMessagesCountForUser(userId: string, userRole: string): Promise<number> {
    if (userRole === "user_level_1") {
      // کاربران سطح 1: تمام پیام‌های خوانده نشده از زیرمجموعه‌ها یا مدیر
      const admin = Array.from(this.users.values()).find(user => user.role === "admin");
      const subUsers = Array.from(this.users.values()).filter(user => user.parentUserId === userId);
      const subUserIds = subUsers.map(user => user.id);
      if (admin) {
        subUserIds.push(admin.id);
      }
      
      return Array.from(this.internalChats.values())
        .filter(chat => 
          subUserIds.includes(chat.senderId) && 
          chat.receiverId === userId && 
          !chat.isRead
        ).length;
    }
    
    return 0;
  }

  async markAllMessagesAsReadForUser(userId: string, userRole: string): Promise<boolean> {
    try {
      if (userRole === "user_level_2") {
        // کاربران سطح 2: علامت‌گذاری پیام‌های دریافتی از والد
        const user = this.users.get(userId);
        if (!user || !user.parentUserId) return true; // No parent means no messages to mark, which is success
        
        Array.from(this.internalChats.entries()).forEach(([id, chat]) => {
          if (chat.senderId === user.parentUserId && chat.receiverId === userId && !chat.isRead) {
            this.internalChats.set(id, { ...chat, isRead: true });
          }
        });
      } else if (userRole === "user_level_1") {
        // کاربران سطح 1: علامت‌گذاری پیام‌های دریافتی از زیرمجموعه‌ها
        const subUsers = Array.from(this.users.values()).filter(user => user.parentUserId === userId);
        const subUserIds = subUsers.map(user => user.id);
        
        Array.from(this.internalChats.entries()).forEach(([id, chat]) => {
          if (subUserIds.includes(chat.senderId) && chat.receiverId === userId && !chat.isRead) {
            this.internalChats.set(id, { ...chat, isRead: true });
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return false;
    }
  }

  async markMessagesFromSenderAsRead(senderId: string, receiverId: string): Promise<boolean> {
    try {
      Array.from(this.internalChats.entries()).forEach(([id, chat]) => {
        if (chat.senderId === senderId && chat.receiverId === receiverId && !chat.isRead) {
          this.internalChats.set(id, { ...chat, isRead: true });
        }
      });
      return true;
    } catch (error) {
      console.error("Error marking messages from sender as read:", error);
      return false;
    }
  }

  // FAQ methods
  async getFaq(id: string): Promise<Faq | undefined> {
    return this.faqs.get(id);
  }

  async getAllFaqs(includeInactive: boolean = false): Promise<Faq[]> {
    return Array.from(this.faqs.values())
      .filter(faq => includeInactive || faq.isActive)
      .sort((a, b) => a.order - b.order);
  }

  async getActiveFaqs(): Promise<Faq[]> {
    return Array.from(this.faqs.values())
      .filter(faq => faq.isActive)
      .sort((a, b) => a.order - b.order);
  }

  async getFaqsByCreator(creatorId: string): Promise<Faq[]> {
    return Array.from(this.faqs.values())
      .filter(faq => faq.isActive && faq.createdBy === creatorId)
      .sort((a, b) => a.order - b.order);
  }

  async createFaq(faq: InsertFaq, createdBy: string): Promise<Faq> {
    const id = randomUUID();
    const newFaq: Faq = {
      ...faq,
      id,
      createdBy,
      isActive: faq.isActive ?? true,
      order: faq.order ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.faqs.set(id, newFaq);
    return newFaq;
  }

  async updateFaq(id: string, faq: UpdateFaq): Promise<Faq | undefined> {
    const existingFaq = this.faqs.get(id);
    if (!existingFaq) return undefined;

    const updatedFaq: Faq = {
      ...existingFaq,
      ...faq,
      updatedAt: new Date(),
    };

    this.faqs.set(id, updatedFaq);
    return updatedFaq;
  }

  async deleteFaq(id: string): Promise<boolean> {
    return this.faqs.delete(id);
  }

  async updateFaqOrder(id: string, newOrder: number): Promise<Faq | undefined> {
    const faq = this.faqs.get(id);
    if (!faq) return undefined;

    const updatedFaq: Faq = {
      ...faq,
      order: newOrder,
      updatedAt: new Date(),
    };

    this.faqs.set(id, updatedFaq);
    return updatedFaq;
  }

  // VAT Settings
  async getVatSettings(userId: string): Promise<VatSettings | undefined> {
    return Array.from(this.vatSettings.values()).find(s => s.userId === userId);
  }

  async updateVatSettings(userId: string, settings: UpdateVatSettings): Promise<VatSettings> {
    const existing = await this.getVatSettings(userId);
    
    if (existing) {
      const updated: VatSettings = {
        ...existing,
        ...settings,
        updatedAt: new Date(),
      };
      this.vatSettings.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newSettings: VatSettings = {
        id,
        userId,
        vatPercentage: settings.vatPercentage ?? "9",
        isEnabled: settings.isEnabled ?? false,
        companyName: settings.companyName ?? null,
        address: settings.address ?? null,
        phoneNumber: settings.phoneNumber ?? null,
        nationalId: settings.nationalId ?? null,
        economicCode: settings.economicCode ?? null,
        stampImage: settings.stampImage ?? null,
        thankYouMessage: settings.thankYouMessage ?? "از خرید شما متشکریم",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.vatSettings.set(id, newSettings);
      return newSettings;
    }
  }

  // Password Reset OTP
  async createPasswordResetOtp(userId: string, otp: string, expiresAt: Date): Promise<PasswordResetOtp> {
    const id = randomUUID();
    const newOtp: PasswordResetOtp = {
      id,
      userId,
      otp,
      isUsed: false,
      expiresAt,
      createdAt: new Date(),
    };
    this.passwordResetOtps.set(id, newOtp);
    return newOtp;
  }

  async getValidPasswordResetOtp(userId: string, otp: string): Promise<PasswordResetOtp | undefined> {
    const now = new Date();
    return Array.from(this.passwordResetOtps.values()).find(
      otpRecord => 
        otpRecord.userId === userId && 
        otpRecord.otp === otp && 
        !otpRecord.isUsed && 
        otpRecord.expiresAt > now
    );
  }

  async markOtpAsUsed(id: string): Promise<boolean> {
    const otp = this.passwordResetOtps.get(id);
    if (otp) {
      otp.isUsed = true;
      this.passwordResetOtps.set(id, otp);
      return true;
    }
    return false;
  }

  async deleteExpiredOtps(): Promise<void> {
    const now = new Date();
    for (const [id, otp] of this.passwordResetOtps.entries()) {
      if (otp.isUsed || otp.expiresAt < now) {
        this.passwordResetOtps.delete(id);
      }
    }
  }

  // Login Logs
  async createLoginLog(log: InsertLoginLog): Promise<LoginLog> {
    const id = randomUUID();
    const newLog: LoginLog = {
      id,
      userId: log.userId,
      username: log.username,
      ipAddress: log.ipAddress || null,
      userAgent: log.userAgent || null,
      loginAt: new Date(),
    };
    this.loginLogs.set(id, newLog);
    return newLog;
  }

  async getLoginLogs(page: number = 1, limit: number = 50): Promise<{ logs: LoginLog[], total: number, totalPages: number }> {
    const allLogs = Array.from(this.loginLogs.values()).sort((a, b) => 
      (b.loginAt?.getTime() || 0) - (a.loginAt?.getTime() || 0)
    );
    const total = allLogs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const logs = allLogs.slice(startIndex, startIndex + limit);
    return { logs, total, totalPages };
  }

  async getLoginLogsByUser(userId: string): Promise<LoginLog[]> {
    return Array.from(this.loginLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => (b.loginAt?.getTime() || 0) - (a.loginAt?.getTime() || 0));
  }

  // Guest Chat Methods (stub implementation for MemStorage)
  private guestChatSessions: Map<string, GuestChatSession> = new Map();
  private guestChatMessages: Map<string, GuestChatMessage> = new Map();

  async createGuestChatSession(sessionToken: string, guestName?: string, guestPhone?: string, guestIpAddress?: string): Promise<GuestChatSession> {
    const session: GuestChatSession = {
      id: randomUUID(),
      sessionToken,
      guestName: guestName || null,
      guestPhone: guestPhone || null,
      guestIpAddress: guestIpAddress || null,
      isActive: true,
      lastMessageAt: new Date(),
      unreadByAdmin: 0,
      unreadByGuest: 0,
      createdAt: new Date(),
    };
    this.guestChatSessions.set(session.id, session);
    return session;
  }

  async getGuestChatSessionByToken(sessionToken: string): Promise<GuestChatSession | undefined> {
    return Array.from(this.guestChatSessions.values()).find(s => s.sessionToken === sessionToken);
  }

  async getAllGuestChatSessions(): Promise<GuestChatSession[]> {
    return Array.from(this.guestChatSessions.values()).sort((a, b) => 
      (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0)
    ).filter(session =>
      Array.from(this.guestChatMessages.values()).some(
        message => message.sessionId === session.id && message.sender === "guest"
      )
    );
  }

  async getActiveGuestChatSessions(): Promise<GuestChatSession[]> {
    return Array.from(this.guestChatSessions.values())
      .filter(s =>
        s.isActive &&
        Array.from(this.guestChatMessages.values()).some(
          message => message.sessionId === s.id && message.sender === "guest"
        )
      )
      .sort((a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0));
  }

  async updateGuestChatSession(sessionId: string, updates: Partial<GuestChatSession>): Promise<GuestChatSession | undefined> {
    const session = this.guestChatSessions.get(sessionId);
    if (!session) return undefined;
    const updated = { ...session, ...updates };
    this.guestChatSessions.set(sessionId, updated);
    return updated;
  }

  async closeGuestChatSession(sessionId: string): Promise<void> {
    const session = this.guestChatSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.guestChatSessions.set(sessionId, session);
    }
  }

  async createGuestChatMessage(sessionId: string, message: string, sender: 'guest' | 'admin'): Promise<GuestChatMessage> {
    const msg: GuestChatMessage = {
      id: randomUUID(),
      sessionId,
      message,
      sender,
      isRead: false,
      createdAt: new Date(),
    };
    this.guestChatMessages.set(msg.id, msg);
    
    const session = this.guestChatSessions.get(sessionId);
    if (session) {
      session.lastMessageAt = new Date();
      if (sender === 'guest') {
        session.unreadByAdmin = (session.unreadByAdmin || 0) + 1;
      } else {
        session.unreadByGuest = (session.unreadByGuest || 0) + 1;
      }
      this.guestChatSessions.set(sessionId, session);
    }
    return msg;
  }

  async getGuestChatMessages(sessionId: string): Promise<GuestChatMessage[]> {
    return Array.from(this.guestChatMessages.values())
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async markGuestChatMessagesAsRead(sessionId: string, sender: 'guest' | 'admin'): Promise<void> {
    const messageSender = sender === 'admin' ? 'guest' : 'admin';
    for (const [id, msg] of this.guestChatMessages.entries()) {
      if (msg.sessionId === sessionId && msg.sender === messageSender && !msg.isRead) {
        msg.isRead = true;
        this.guestChatMessages.set(id, msg);
      }
    }
    const session = this.guestChatSessions.get(sessionId);
    if (session) {
      if (sender === 'admin') {
        session.unreadByAdmin = 0;
      } else {
        session.unreadByGuest = 0;
      }
      this.guestChatSessions.set(sessionId, session);
    }
  }

  async getTotalUnreadGuestChats(): Promise<number> {
    let total = 0;
    for (const session of this.guestChatSessions.values()) {
      if (session.isActive) {
        const hasGuestMessage = Array.from(this.guestChatMessages.values()).some(
          message => message.sessionId === session.id && message.sender === "guest"
        );
        if (hasGuestMessage) {
          total += session.unreadByAdmin || 0;
        }
      }
    }
    return total;
  }

  // Project Order Request methods (stub implementation for MemStorage)
  private projectOrderRequests: Map<string, ProjectOrderRequest> = new Map();

  async createProjectOrderRequest(data: InsertProjectOrderRequest): Promise<ProjectOrderRequest> {
    const request: ProjectOrderRequest = {
      id: randomUUID(),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      description: data.description,
      status: 'pending',
      createdAt: new Date(),
    };
    this.projectOrderRequests.set(request.id, request);
    return request;
  }

  async getProjectOrderRequests(): Promise<ProjectOrderRequest[]> {
    return Array.from(this.projectOrderRequests.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getProjectOrderRequestById(id: string): Promise<ProjectOrderRequest | undefined> {
    return this.projectOrderRequests.get(id);
  }

  async updateProjectOrderRequestStatus(id: string, status: string): Promise<ProjectOrderRequest | undefined> {
    const request = this.projectOrderRequests.get(id);
    if (!request) return undefined;
    request.status = status;
    this.projectOrderRequests.set(id, request);
    return request;
  }

  async deleteProjectOrderRequest(id: string): Promise<void> {
    this.projectOrderRequests.delete(id);
  }

  // Plugin methods
  async getPlugin(id: string): Promise<Plugin | undefined> {
    return this.plugins.get(id);
  }

  async getPluginByName(name: string): Promise<Plugin | undefined> {
    return Array.from(this.plugins.values()).find(p => p.name === name);
  }

  async getAllPlugins(): Promise<Plugin[]> {
    if (this.plugins.size === 0) {
      await this.initializeDefaultPlugins();
    }
    return Array.from(this.plugins.values()).sort(
      (a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
    );
  }

  async createPlugin(plugin: InsertPlugin): Promise<Plugin> {
    const newPlugin: Plugin = {
      id: randomUUID(),
      name: plugin.name,
      displayName: plugin.displayName,
      description: plugin.description || null,
      icon: plugin.icon || "Puzzle",
      isEnabled: plugin.isEnabled ?? true,
      isBuiltIn: plugin.isBuiltIn ?? false,
      settings: plugin.settings || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.plugins.set(newPlugin.id, newPlugin);
    return newPlugin;
  }

  async updatePlugin(id: string, plugin: Partial<Plugin>): Promise<Plugin | undefined> {
    const existing = this.plugins.get(id);
    if (!existing) return undefined;
    const updated: Plugin = {
      ...existing,
      ...plugin,
      updatedAt: new Date(),
    };
    this.plugins.set(id, updated);
    return updated;
  }

  async deletePlugin(id: string): Promise<boolean> {
    const existing = this.plugins.get(id);
    if (existing?.isBuiltIn) {
      throw new Error("Cannot delete built-in plugins");
    }
    return this.plugins.delete(id);
  }

  async togglePluginStatus(id: string): Promise<Plugin | undefined> {
    const existing = this.plugins.get(id);
    if (!existing) return undefined;
    const updated: Plugin = {
      ...existing,
      isEnabled: !existing.isEnabled,
      updatedAt: new Date(),
    };
    this.plugins.set(id, updated);
    return updated;
  }

  async initializeDefaultPlugins(): Promise<void> {
    const pluginsToInitialize = [
      {
        name: "vat",
        displayName: "مالیات بر ارزش افزوده",
        description: "تنظیمات مالیات بر ارزش افزوده، اطلاعات شرکت و صدور فاکتور رسمی",
        icon: "Receipt",
      },
      {
        name: "backup",
        displayName: "پشتیبان‌گیری",
        description: "پشتیبان‌گیری و بازیابی دیتابیس، مدیریت حالت تعمیرات سایت",
        icon: "Database",
      },
      {
        name: "guest-chats",
        displayName: "چت مهمانان",
        description: "چت آنلاین با مهمانان سایت، پشتیبانی آنلاین و پاسخ‌دهی به سوالات کاربران",
        icon: "MessageSquare",
      },
      {
        name: "login-logs",
        displayName: "لاگ ورود",
        description: "ثبت و مشاهده تاریخچه ورود کاربران به سیستم",
        icon: "History",
      },
      {
        name: "subscriptions",
        displayName: "اشتراک‌ها",
        description: "مدیریت پلن‌های اشتراک و سطوح دسترسی کاربران",
        icon: "Crown",
      },
      {
        name: "internal-chats",
        displayName: "چت کاربران",
        description: "سیستم گفتگوی داخلی بین مدیریت، فروشندگان و کاربران",
        icon: "MessageCircle",
      },
      {
        name: "tickets",
        displayName: "تیکت‌ها",
        description: "سیستم تیکتینگ و پشتیبانی کاربران",
        icon: "Ticket",
      },
      {
        name: "bank-card",
        displayName: "کارت بانکی",
        description: "مدیریت اطلاعات حساب و کارت‌های بانکی",
        icon: "CreditCard",
      },
      {
        name: "seo",
        displayName: "سئو و ثبت در گوگل",
        description: "ثبت صفحات و مقالات در موتور گوگل، نقشه سایت XML، متاتگ‌ها و اسکیما",
        icon: "Search",
      },
      {
        name: "ssl",
        displayName: "پروتکل HTTPS و SSL",
        description: "صدور و تمدید رایگان گواهینامه امنیتی Let's Encrypt، ریدایرکت خودکار به HTTPS و امنیت دامنه",
        icon: "Lock",
      },
    ];

    // حذف پلاگین‌های منسوخ از سیستم در صورت وجود
    for (const [id, plugin] of this.plugins.entries()) {
      if (plugin.name === "ai" || plugin.name === "shipping" || plugin.name === "email" || plugin.name === "inventory" || plugin.name === "anbardari" || plugin.name === "business" || plugin.name === "commercial" || plugin.name === "tejari") {
        this.plugins.delete(id);
      }
    }

    for (const pluginData of pluginsToInitialize) {
      const existing = await this.getPluginByName(pluginData.name);
      if (!existing) {
        await this.createPlugin({
          ...pluginData,
          isEnabled: true,
          isBuiltIn: true,
        });
      }
    }
    console.log("✅ پلاگین‌های پیش‌فرض با موفقیت بارگذاری شدند");
  }

  // SEO & Google Indexing Methods
  async getSeoSettings(): Promise<SeoSettings> {
    return this.seoSettings;
  }

  async updateSeoSettings(settings: UpdateSeoSettings): Promise<SeoSettings> {
    this.seoSettings = {
      ...this.seoSettings,
      ...settings,
      updatedAt: new Date(),
    };
    return this.seoSettings;
  }

  async getSeoIndexingLogs(limit = 50): Promise<SeoIndexingLog[]> {
    return Array.from(this.seoIndexingLogs.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createSeoIndexingLog(log: InsertSeoIndexingLog): Promise<SeoIndexingLog> {
    const id = randomUUID();
    const newLog: SeoIndexingLog = {
      id,
      url: log.url,
      type: log.type ?? "homepage",
      status: log.status ?? "success",
      engine: log.engine ?? "google",
      responseMessage: log.responseMessage ?? null,
      createdAt: new Date(),
    };
    this.seoIndexingLogs.set(id, newLog);
    return newLog;
  }

  // SSL & HTTPS Certificates Methods
  async getSslCertificates(userId?: string): Promise<SslCertificate[]> {
    const certs = Array.from(this.sslCertificates.values());
    if (userId) {
      return certs.filter(c => c.userId === userId || c.userId === null);
    }
    return certs;
  }

  async getSslCertificateById(id: string): Promise<SslCertificate | undefined> {
    return this.sslCertificates.get(id);
  }

  async getSslCertificateByDomain(domain: string): Promise<SslCertificate | undefined> {
    const normalized = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return Array.from(this.sslCertificates.values()).find(
      c => c.domain.toLowerCase() === normalized
    );
  }

  async createSslCertificate(cert: InsertSslCertificate): Promise<SslCertificate> {
    const id = randomUUID();
    const now = new Date();
    const newCert: SslCertificate = {
      id,
      userId: cert.userId ?? null,
      domain: cert.domain,
      provider: cert.provider ?? "Let's Encrypt Free SSL",
      status: cert.status ?? "active",
      certificateType: cert.certificateType ?? "DV (Domain Validated) 2048-bit RSA",
      issuer: cert.issuer ?? "Let's Encrypt Authority X3 / ISRG Root X1",
      serialNumber: cert.serialNumber ?? ("04:" + Array.from({length: 16}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0')).join(':').toUpperCase()),
      fingerprintSha256: cert.fingerprintSha256 ?? Array.from({length: 32}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0')).join(':').toUpperCase(),
      issuedAt: cert.issuedAt ? new Date(cert.issuedAt) : now,
      expiresAt: cert.expiresAt ? new Date(cert.expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      autoRenew: cert.autoRenew ?? true,
      forceHttpsRedirect: cert.forceHttpsRedirect ?? true,
      enableHsts: cert.enableHsts ?? true,
      enableTls13: cert.enableTls13 ?? true,
      enableOcspStapling: cert.enableOcspStapling ?? true,
      certificatePem: cert.certificatePem ?? "-----BEGIN CERTIFICATE-----\nMIIEkjCCA3qgAwIBAgITAP+4kY7v3y4F...\n-----END CERTIFICATE-----",
      privateKeyPem: cert.privateKeyPem ?? "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0wB5m...\n-----END RSA PRIVATE KEY-----",
      caBundlePem: cert.caBundlePem ?? "-----BEGIN CERTIFICATE-----\nMIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRHPtlVBgWDtwDQYJKoZIhvcNAQELBQAw\n-----END CERTIFICATE-----",
      csrPem: cert.csrPem ?? null,
      dnsChallengeRecord: cert.dnsChallengeRecord ?? `_acme-challenge.${cert.domain} IN TXT "${randomUUID()}"`,
      httpChallengePath: cert.httpChallengePath ?? `/.well-known/acme-challenge/${randomUUID()}`,
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.sslCertificates.set(id, newCert);
    return newCert;
  }

  async updateSslCertificate(id: string, cert: UpdateSslCertificate): Promise<SslCertificate | undefined> {
    const existing = this.sslCertificates.get(id);
    if (!existing) return undefined;

    const updated: SslCertificate = {
      ...existing,
      ...cert,
      updatedAt: new Date(),
    };
    this.sslCertificates.set(id, updated);
    return updated;
  }

  async deleteSslCertificate(id: string): Promise<boolean> {
    return this.sslCertificates.delete(id);
  }

  async getSslLogs(certificateId?: string, limit = 50): Promise<SslLog[]> {
    const logs = Array.from(this.sslLogs.values());
    const filtered = certificateId ? logs.filter(l => l.certificateId === certificateId) : logs;
    return filtered
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createSslLog(log: InsertSslLog): Promise<SslLog> {
    const id = randomUUID();
    const newLog: SslLog = {
      id,
      certificateId: log.certificateId ?? null,
      domain: log.domain,
      action: log.action,
      status: log.status ?? "success",
      message: log.message,
      ipAddress: log.ipAddress ?? null,
      createdAt: new Date(),
    };
    this.sslLogs.set(id, newLog);
    return newLog;
  }

  // Blupal Gateway & Transactions
  async getBlupalGateway(userId: string): Promise<BlupalGateway | undefined> {
    for (const gw of this.blupalGateways.values()) {
      if (gw.userId === userId) return gw;
    }
    return undefined;
  }

  async getAllBlupalGateways(): Promise<{ gateway: BlupalGateway; user: User }[]> {
    const list: { gateway: BlupalGateway; user: User }[] = [];
    const seenUserIds = new Set<string>();

    for (const gw of this.blupalGateways.values()) {
      const u = this.users.get(gw.userId);
      if (u) {
        list.push({ gateway: gw, user: u });
        seenUserIds.add(u.id);
      }
    }

    // Also include level 1 users who may not have a gateway record yet
    for (const u of this.users.values()) {
      if (u.role === "user_level_1" && !seenUserIds.has(u.id)) {
        const gw = await this.getBlupalGateway(u.id);
        if (gw) {
          list.push({ gateway: gw, user: u });
          seenUserIds.add(u.id);
        }
      }
    }

    return list;
  }

  async getBlupalGatewayBySlugOrUsername(slugOrUsername: string): Promise<{ gateway: BlupalGateway; user: User } | undefined> {
    const lower = slugOrUsername.toLowerCase().trim();
    // 1. Check by username or user ID
    let user: User | undefined;
    for (const u of this.users.values()) {
      if (u.username?.toLowerCase() === lower || u.id === slugOrUsername) {
        user = u;
        break;
      }
    }

    if (user) {
      const gw = await this.getBlupalGateway(user.id);
      if (gw) {
        return { gateway: gw, user };
      }
      // If user exists but hasn't configured gateway yet, return empty defaults
      const defaultGw: BlupalGateway = {
        id: randomUUID(),
        userId: user.id,
        apiKey: null,
        isActive: false,
        title: `درگاه پرداخت ${user.firstName || ''} ${user.lastName || ''}`.trim() || "درگاه پرداخت کارت به کارت",
        description: "جهت پرداخت، اطلاعات خود را وارد کرده و پس از واریز کارت به کارت، وضعیت به صورت آنی تایید می‌گردد.",
        defaultAmount: null,
        minAmount: "10000",
        maxAmount: "50000000",
        cardNumber: null,
        cardHolderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
        bankName: null,
        supportPhone: user.phone || null,
        slug: user.username || null,
        webhookSecret: null,
        successMessage: "پرداخت شما با موفقیت تایید شد. از اعتماد شما متشکریم.",
        wpApiKey: null,
        wpAuthorizedDomain: null,
        wpCallbackUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.blupalGateways.set(defaultGw.id, defaultGw);
      return { gateway: defaultGw, user };
    }

    // 2. Check by gateway slug
    for (const gw of this.blupalGateways.values()) {
      if (gw.slug?.toLowerCase() === lower) {
        const u = this.users.get(gw.userId);
        if (u) return { gateway: gw, user: u };
      }
    }

    return undefined;
  }

  async getBlupalGatewayByWpApiKey(wpApiKey: string): Promise<BlupalGateway | undefined> {
    const cleanKey = wpApiKey?.trim();
    if (!cleanKey) return undefined;
    for (const gw of this.blupalGateways.values()) {
      if (gw.wpApiKey && gw.wpApiKey.trim() === cleanKey) {
        return gw;
      }
    }
    return undefined;
  }

  async generateWpApiKey(userId: string): Promise<string> {
    const newKey = "Rakhsh_Pay_" + randomUUID().replace(/-/g, "").slice(0, 32);
    await this.saveBlupalGateway(userId, { wpApiKey: newKey });
    return newKey;
  }

  async saveBlupalGateway(userId: string, data: Partial<InsertBlupalGateway>): Promise<BlupalGateway> {
    let existing: BlupalGateway | undefined;
    for (const gw of this.blupalGateways.values()) {
      if (gw.userId === userId) {
        existing = gw;
        break;
      }
    }

    const hasApiKey = Boolean(
      (data.apiKey && data.apiKey.trim().length > 0) || 
      (data.wpApiKey && data.wpApiKey.trim().length > 0)
    );
    const existingHasKey = Boolean(
      existing?.apiKey?.trim() || 
      existing?.wpApiKey?.trim()
    );
    const wasActive = existing ? existing.isActive : false;
    const computedActive = data.isActive !== undefined 
      ? (data.isActive && (hasApiKey || existingHasKey))
      : (hasApiKey || wasActive);

    if (existing) {
      const updated: BlupalGateway = {
        ...existing,
        ...data,
        isActive: computedActive,
        updatedAt: new Date(),
      };
      this.blupalGateways.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const user = this.users.get(userId);
      const created: BlupalGateway = {
        id,
        userId,
        apiKey: data.apiKey ?? null,
        isActive: hasApiKey,
        title: data.title ?? (user ? `درگاه پرداخت ${user.firstName || ''} ${user.lastName || ''}`.trim() : "درگاه پرداخت کارت به کارت"),
        description: data.description ?? "جهت پرداخت، اطلاعات خود را وارد کرده و پس از واریز کارت به کارت، وضعیت به صورت آنی تایید می‌گردد.",
        defaultAmount: data.defaultAmount ?? null,
        minAmount: data.minAmount ?? "10000",
        maxAmount: data.maxAmount ?? "50000000",
        cardNumber: data.cardNumber ?? null,
        cardHolderName: data.cardHolderName ?? (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null),
        bankName: data.bankName ?? null,
        supportPhone: data.supportPhone ?? (user?.phone || null),
        slug: data.slug ?? (user?.username || null),
        webhookSecret: data.webhookSecret ?? randomUUID().replace(/-/g, '').slice(0, 24),
        successMessage: data.successMessage ?? "پرداخت شما با موفقیت تایید شد. از اعتماد شما متشکریم.",
        wpApiKey: data.wpApiKey ?? null,
        wpAuthorizedDomain: data.wpAuthorizedDomain ?? null,
        wpCallbackUrl: data.wpCallbackUrl ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.blupalGateways.set(id, created);
      return created;
    }
  }

  async getBlupalTransactions(userId: string, limit = 50, status?: string): Promise<BlupalTransaction[]> {
    const list: BlupalTransaction[] = [];
    const twentyMinutesAgo = Date.now() - 20 * 60 * 1000;

    for (const tx of this.blupalTransactions.values()) {
      if (tx.userId === userId) {
        if ((tx.status === "pending" || tx.status === "verifying") && tx.createdAt) {
          if (new Date(tx.createdAt).getTime() < twentyMinutesAgo) {
            tx.status = "failed";
          }
        }
        if (!status || tx.status === status) {
          list.push(tx);
        }
      }
    }
    return list
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getBlupalTransactionByInvoiceId(invoiceId: string): Promise<BlupalTransaction | undefined> {
    for (const tx of this.blupalTransactions.values()) {
      if (tx.invoiceId === invoiceId) {
        return tx;
      }
    }
    return undefined;
  }

  async createBlupalTransaction(tx: InsertBlupalTransaction): Promise<BlupalTransaction> {
    const id = randomUUID();
    const newTx: BlupalTransaction = {
      id,
      userId: tx.userId,
      invoiceId: tx.invoiceId,
      blupalInvoiceId: tx.blupalInvoiceId ?? null,
      paymentLink: tx.paymentLink ?? null,
      finalAmount: tx.finalAmount ? String(tx.finalAmount) : null,
      payerName: tx.payerName,
      payerPhone: tx.payerPhone,
      payerCard: tx.payerCard ?? null,
      payerBankName: tx.payerBankName ?? null,
      mode: tx.mode ?? "live",
      amount: String(tx.amount),
      destCardNumber: tx.destCardNumber ?? null,
      destCardHolder: tx.destCardHolder ?? null,
      status: tx.status ?? "pending",
      trackingCode: tx.trackingCode ?? null,
      cardLastFour: tx.cardLastFour ?? null,
      description: tx.description ?? null,
      sourceDomain: tx.sourceDomain ?? null,
      orderId: tx.orderId ?? null,
      callbackUrl: tx.callbackUrl ?? null,
      paidAt: tx.paidAt ?? null,
      expiresAt: tx.expiresAt ?? new Date(Date.now() + 20 * 60 * 1000),
      createdAt: new Date(),
    };
    this.blupalTransactions.set(id, newTx);
    return newTx;
  }

  async updateBlupalTransaction(invoiceId: string, updates: Partial<BlupalTransaction>): Promise<BlupalTransaction | undefined> {
    let target: BlupalTransaction | undefined;
    for (const tx of this.blupalTransactions.values()) {
      if (tx.invoiceId === invoiceId) {
        target = tx;
        break;
      }
    }
    if (!target) return undefined;

    const updated: BlupalTransaction = {
      ...target,
      ...updates,
    };
    this.blupalTransactions.set(target.id, updated);
    return updated;
  }

  async getBlupalStats(userId: string): Promise<{ totalAmount: number; todayAmount: number; successCount: number; pendingCount: number; failedCount: number }> {
    let totalAmount = 0;
    let todayAmount = 0;
    let successCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const twentyMinutesAgo = Date.now() - 20 * 60 * 1000;

    for (const tx of this.blupalTransactions.values()) {
      if (tx.userId !== userId) continue;

      if ((tx.status === "pending" || tx.status === "verifying") && tx.createdAt) {
        if (new Date(tx.createdAt).getTime() < twentyMinutesAgo) {
          tx.status = "failed";
        }
      }

      const numAmount = parseFloat(tx.amount) || 0;
      if (tx.status === "paid") {
        totalAmount += numAmount;
        successCount++;
        if (tx.paidAt && new Date(tx.paidAt).getTime() >= todayStart.getTime()) {
          todayAmount += numAmount;
        } else if (tx.createdAt && new Date(tx.createdAt).getTime() >= todayStart.getTime()) {
          todayAmount += numAmount;
        }
      } else if (tx.status === "pending" || tx.status === "verifying") {
        pendingCount++;
      } else if (tx.status === "failed" || tx.status === "expired") {
        failedCount++;
      }
    }

    return { totalAmount, todayAmount, successCount, pendingCount, failedCount };
  }

  // Announcements Implementation
  async getAllAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }

  async getAnnouncementsForUser(userId: string, role: string): Promise<(Announcement & { isRead: boolean })[]> {
    const all = Array.from(this.announcements.values()).filter(a => {
      if (!a.isPublished) return false;
      if (role === "admin") return true;
      if (a.targetAudience === "all") return true;
      return a.targetAudience === role;
    });

    const userReads = new Set<string>();
    for (const read of this.announcementReads.values()) {
      if (read.userId === userId) {
        userReads.add(read.announcementId);
      }
    }

    return all
      .map(a => ({
        ...a,
        isRead: userReads.has(a.id),
      }))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const id = randomUUID();
    const newAnnouncement: Announcement = {
      ...announcement,
      id,
      targetAudience: announcement.targetAudience || "user_level_1",
      priority: announcement.priority || "normal",
      isPinned: announcement.isPinned ?? false,
      isPublished: announcement.isPublished ?? true,
      authorName: announcement.authorName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.announcements.set(id, newAnnouncement);
    return newAnnouncement;
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    const existing = this.announcements.get(id);
    if (!existing) return undefined;
    const updated: Announcement = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.announcements.set(id, updated);
    return updated;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    // Delete reads
    for (const [key, read] of this.announcementReads.entries()) {
      if (read.announcementId === id) {
        this.announcementReads.delete(key);
      }
    }
    return this.announcements.delete(id);
  }

  async markAnnouncementAsRead(announcementId: string, userId: string): Promise<boolean> {
    // Check if already read
    for (const read of this.announcementReads.values()) {
      if (read.announcementId === announcementId && read.userId === userId) {
        return true;
      }
    }
    const id = randomUUID();
    this.announcementReads.set(id, {
      id,
      announcementId,
      userId,
      readAt: new Date(),
    });
    return true;
  }

  async getUnreadAnnouncementsCount(userId: string, role: string): Promise<number> {
    const announcements = await this.getAnnouncementsForUser(userId, role);
    return announcements.filter(a => !a.isRead).length;
  }
}

import { DbStorage } from "./db-storage";

export const storage: IStorage = (process.env.DATABASE_URL && process.env.NODE_ENV !== "test")
  ? new DbStorage()
  : new MemStorage();

