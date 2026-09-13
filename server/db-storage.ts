import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql, desc, and, gte, or, inArray, ne, ilike, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { users, tickets, subscriptions, products, sentMessages, receivedMessages, userSubscriptions, categories, carts, cartItems, addresses, orders, orderItems, transactions, internalChats, faqs, passwordResetOtps, vatSettings, contentSections, loginLogs, guestChatSessions, guestChatMessages, projectOrderRequests, plugins, seoSettings, seoIndexingLogs, sslCertificates, sslLogs, blupalGateways, blupalTransactions, announcements, announcementReads } from "@shared/schema";
import { type User, type InsertUser, type Ticket, type InsertTicket, type Subscription, type InsertSubscription, type Product, type InsertProduct, type SentMessage, type InsertSentMessage, type ReceivedMessage, type InsertReceivedMessage, type UserSubscription, type InsertUserSubscription, type Category, type InsertCategory, type Cart, type InsertCart, type CartItem, type InsertCartItem, type Address, type InsertAddress, type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type Transaction, type InsertTransaction, type InternalChat, type InsertInternalChat, type Faq, type InsertFaq, type UpdateFaq, type PasswordResetOtp, type InsertPasswordResetOtp, type VatSettings, type InsertVatSettings, type UpdateVatSettings, type ContentSection, type InsertContentSection, type LoginLog, type InsertLoginLog, type GuestChatSession, type InsertGuestChatSession, type GuestChatMessage, type InsertGuestChatMessage, type ProjectOrderRequest, type InsertProjectOrderRequest, type Plugin, type InsertPlugin, type SeoSettings, type InsertSeoSettings, type UpdateSeoSettings, type SeoIndexingLog, type InsertSeoIndexingLog, type SslCertificate, type InsertSslCertificate, type UpdateSslCertificate, type SslLog, type InsertSslLog, type BlupalGateway, type InsertBlupalGateway, type BlupalTransaction, type InsertBlupalTransaction, type Announcement, type InsertAnnouncement, type AnnouncementRead } from "@shared/schema";
import { type IStorage } from "./storage";
import bcrypt from "bcryptjs";

function createMockDb(): any {
  const createChain = (defaultValue: any = []): any => {
    const fn = (..._args: any[]) => fn;
    const promise = Promise.resolve(defaultValue);
    return new Proxy(fn, {
      get(_target, prop) {
        if (prop === "then") return promise.then.bind(promise);
        if (prop === "catch") return promise.catch.bind(promise);
        if (prop === "finally") return promise.finally.bind(promise);
        if (prop === "findFirst") return () => Promise.resolve(null);
        if (prop === "findMany") return () => Promise.resolve([]);
        return createChain(defaultValue);
      },
      apply(_target, _thisArg, _argArray) {
        return createChain(defaultValue);
      }
    });
  };
  return createChain();
}

let pool: Pool | null = null;
let db: any;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    db = drizzle(pool, {
      schema: { users, tickets, subscriptions, products, sentMessages, receivedMessages, userSubscriptions, categories, carts, cartItems, addresses, orders, orderItems, transactions, internalChats, faqs, passwordResetOtps, vatSettings, contentSections, loginLogs, guestChatSessions, guestChatMessages, projectOrderRequests, plugins, seoSettings, seoIndexingLogs, sslCertificates, sslLogs }
    });
  } catch (err) {
    console.warn("⚠️ Failed to initialize PostgreSQL pool:", err);
    db = createMockDb();
  }
} else {
  console.warn("⚠️ DATABASE_URL is not set — using in-memory mock storage");
  db = createMockDb();
}

// Export db instance for use in routes
export { db, eq };

export class DbStorage implements IStorage {
  constructor() {
    // Initialize default admin user on startup
    this.initializeAdminUser();
    
    // Initialize default free subscription
    this.initializeDefaultSubscription();
    
    // Initialize landing page content
    this.initializeLandingPageContent();
    
    // Initialize default plugins
    this.initializeDefaultPlugins();
    
    // Initialize test data only in development environment
    if (process.env.NODE_ENV === 'development') {
      this.initializeTestData().catch(console.error);
    }
  }

  public async initializeAdminUser() {
    try {
      // Check if admin user exists by username "ehsan" or role "admin"
      const existingAdmin = await db
        .select()
        .from(users)
        .where(or(eq(users.username, "ehsan"), eq(users.role, "admin")))
        .limit(1);

      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      if (existingAdmin.length === 0) {
        console.log("🔑 کاربر ادمین ایجاد شد - نام کاربری: ehsan");
        console.log(`🔑 رمز عبور: ${adminPassword}`);
        
        await db.insert(users).values({
          username: "ehsan",
          firstName: "احسان",
          lastName: "مدیر",
          email: "ehsan@admin.com",
          phone: "09135621232",
          password: hashedPassword,
          role: "admin",
        });
      } else {
        // Force update password to match environment variable or default
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, existingAdmin[0].id));
        console.log(`✅ رمز عبور کاربر مدیر به "${adminPassword}" تغییر و بروزرسانی یافت.`);
      }
    } catch (error) {
      console.error("Error initializing admin user:", error);
    }
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
    try {
      // Check if default free subscription exists
      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.name, "اشتراک رایگان"))
        .limit(1);

      if (existingSubscription.length === 0) {
        await db.insert(subscriptions).values({
          name: "اشتراک رایگان",
          description: "اشتراک پیش‌فرض رایگان 7 روزه",
          userLevel: "user_level_1",
          priceBeforeDiscount: "0",
          duration: "monthly",
          features: [
            "دسترسی پایه به سیستم",
            "پشتیبانی محدود",
            "7 روز استفاده رایگان"
          ],
          isActive: true,
          isDefault: true,
        });
      }
    } catch (error) {
      console.error("Error initializing default subscription:", error);
    }
  }

  private async initializeLandingPageContent() {
    try {
      // بررسی اینکه آیا محتوای لندینگ پیج از قبل وجود دارد
      const existing = await db.select().from(contentSections).limit(1);
      
      if (existing.length === 0) {
        // داده‌های ویژگی‌ها (Features)
        const features = [
          { icon: 'fa-regular fa-comments', title: 'استفاده آسان', description: 'برنامه ما با در نظر گرفتن سادگی طراحی شده است. کنترل‌های بصری و رابط کاربری تمیز.' },
          { icon: 'fa-solid fa-mobile-screen-button', title: 'کاملاً واکنش‌گرا', description: 'در هر اندازه صفحه‌نمایشی، از دسکتاپ تا تلفن‌های همراه، عالی به نظر می‌رسد.' },
          { icon: 'fa-regular fa-lightbulb', title: 'طراحی خلاقانه', description: 'طراحی جذاب بصری که تجربه کاربری و تعامل را افزایش می‌دهد.' },
          { icon: 'fa-solid fa-shield-halved', title: 'امنیت بالا', description: 'حفاظت از داده‌های شما با امنیت پیشرفته، اولویت اصلی ماست.' },
          { icon: 'fa-solid fa-headset', title: 'پشتیبانی ۲۴/۷', description: 'تیم پشتیبانی اختصاصی ما برای کمک به شما به صورت شبانه‌روزی آماده است.' },
          { icon: 'fa-solid fa-cloud-arrow-up', title: 'به‌روزرسانی رایگان', description: 'جدیدترین ویژگی‌ها و بهبودها را با به‌روزرسانی‌های منظم و رایگان دریافت کنید.' },
        ];

        // داده‌های چگونه کار می‌کند (How It Works)
        const howItWorksSteps = [
          { icon: 'fa-solid fa-download', title: 'برنامه را دانلود کنید', description: 'با دانلود رایگان برنامه ما از اپ استور یا گوگل پلی شروع کنید.' },
          { icon: 'fa-solid fa-user-plus', title: 'حساب کاربری بسازید', description: 'برای شروع، تنها در چند مرحله ساده برای یک حساب کاربری جدید ثبت نام کنید.' },
          { icon: 'fa-solid fa-rocket', title: 'از برنامه لذت ببرید', description: 'همه چیز آماده است! تمام ویژگی‌ها را کاوش کنید و از تجربه خود لذت ببرید.' },
        ];

        // داده‌های اسکرین‌شات‌ها (Screenshots)
        const screenshots = [
          "https://atiyehahmadi.ir/apper-demo/all-demo/03-app-landing-page-wave-animation/images/screenshots/1.jpg",
          "https://atiyehahmadi.ir/apper-demo/all-demo/03-app-landing-page-wave-animation/images/screenshots/2.jpg",
          "https://atiyehahmadi.ir/apper-demo/all-demo/03-app-landing-page-wave-animation/images/screenshots/3.jpg",
          "https://atiyehahmadi.ir/apper-demo/all-demo/03-app-landing-page-wave-animation/images/screenshots/4.jpg",
          "https://atiyehahmadi.ir/apper-demo/all-demo/03-app-landing-page-wave-animation/images/screenshots/5.jpg",
        ];

        // داده‌های قیمت‌گذاری (Pricing)
        const pricingPlans = [
          {
            name: 'رایگان',
            monthly: 0,
            yearly: 0,
            features: [
              { text: '۱۰۰ مگابایت فضای دیسک', available: true },
              { text: '۲ زیر دامنه', available: true },
              { text: '۵ حساب ایمیل', available: true },
              { text: 'پشتیبانی مشتری', available: false },
              { text: 'به‌روزرسانی رایگان', available: false },
            ],
            popular: false,
          },
          {
            name: 'استاندارد',
            monthly: 19,
            yearly: 199,
            features: [
              { text: '۱ گیگابایت فضای دیسک', available: true },
              { text: '۱۰ زیر دامنه', available: true },
              { text: '۲۰ حساب ایمیل', available: true },
              { text: 'پشتیبانی مشتری', available: true },
              { text: 'به‌روزرسانی رایگان', available: false },
            ],
            popular: true,
          },
          {
            name: 'تجاری',
            monthly: 49,
            yearly: 499,
            features: [
              { text: '۱۰ گیگابایت فضای دیسک', available: true },
              { text: '۵۰ زیر دامنه', available: true },
              { text: 'حساب ایمیل نامحدود', available: true },
              { text: 'پشتیبانی مشتری', available: true },
              { text: 'به‌روزرسانی رایگان', available: true },
            ],
            popular: false,
          },
        ];

        // داده‌های نظرات مشتریان (Testimonials)
        const testimonials = [
          {
            quote: "این بهترین برنامه‌ای است که تا به حال استفاده کرده‌ام. طراحی تمیز و ویژگی‌ها فوق‌العاده کاربردی هستند. به شدت توصیه می‌شود!",
            name: "سارا رضایی",
            title: "مدیرعامل، شرکت",
            image: "https://picsum.photos/id/1011/100/100"
          },
          {
            quote: "یک تغییر دهنده بازی برای بهره‌وری تیم ما. ویژگی‌های همکاری یکپارچه و بصری هستند. یک ابزار ضروری.",
            name: "علی احمدی",
            title: "مدیر پروژه، راهکارهای فنی",
            image: "https://picsum.photos/id/1005/100/100"
          },
          {
            quote: "در ابتدا شک داشتم، اما این برنامه از تمام انتظارات من فراتر رفت. پشتیبانی مشتری نیز درجه یک است!",
            name: "مریم محمدی",
            title: "طراح فریلنسر",
            image: "https://picsum.photos/id/1027/100/100"
          },
        ];

        // اضافه کردن بخش‌های محتوا به دیتابیس
        await db.insert(contentSections).values([
          {
            sectionKey: 'features',
            title: 'ویژگی‌های فوق‌العاده',
            subtitle: 'ویژگی‌های شگفت‌انگیزی را که برنامه ما را به بهترین انتخاب برای شما تبدیل می‌کند، کشف کنید.',
            content: JSON.stringify(features),
            isActive: true,
          },
          {
            sectionKey: 'how-it-works',
            title: 'چگونه کار می‌کند',
            subtitle: 'یک فرآیند ساده سه مرحله‌ای برای شروع کار با برنامه ما.',
            content: JSON.stringify(howItWorksSteps),
            imageUrl: 'https://atiyehahmadi.ir/apper-demo/all-demo/03-app-landing-page-wave-animation/images/how-it-works-mobile.png',
            isActive: true,
          },
          {
            sectionKey: 'screenshots',
            title: 'اسکرین‌شات‌های برنامه',
            subtitle: 'نگاهی به رابط کاربری زیبا و بصری برنامه ما بیندازید.',
            content: JSON.stringify(screenshots),
            isActive: true,
          },
          {
            sectionKey: 'pricing',
            title: 'پلن‌های قیمت‌گذاری',
            subtitle: 'پلنی را انتخاب کنید که برای شما مناسب باشد. تمام پلن‌ها با ضمانت ۳۰ روزه بازگشت وجه ارائه می‌شوند.',
            content: JSON.stringify(pricingPlans),
            isActive: true,
          },
          {
            sectionKey: 'testimonials',
            title: 'مشتریان ما چه می‌گویند',
            subtitle: 'از مشتریان راضی ما بشنوید و ببینید چگونه برنامه ما به آنها کمک کرده است.',
            content: JSON.stringify(testimonials),
            isActive: true,
          },
        ]);

        console.log("✅ محتوای لندینگ پیج با موفقیت ایجاد شد");
      }
    } catch (error) {
      console.error("Error initializing landing page content:", error);
    }
  }

  private async initializeTestData() {
    try {
      // بررسی وجود کاربر تستی سطح 1
      const existingTestUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test_seller"))
        .limit(1);

      let testUser: User;
      
      if (existingTestUser.length === 0) {
        // ایجاد کاربر سطح 1 تستی
        const testUserPassword = await bcrypt.hash("test123", 10);
        const [createdUser] = await db.insert(users).values({
          username: "test_seller",
          firstName: "علی",
          lastName: "فروشنده تستی",
          email: "test@seller.com",
          phone: "09111234567",
          password: testUserPassword,
          role: "user_level_1",
        }).returning();
        testUser = createdUser;
        console.log("🔑 کاربر سطح 1 تستی ایجاد شد - نام کاربری: test_seller، رمز عبور: test123");
      } else {
        testUser = existingTestUser[0];
      }

      // بررسی و ایجاد دسته‌بندی‌های تستی
      const existingCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.createdBy, testUser.id));

      let categoryIds: {smartphones: string, accessories: string, tablets: string} | null = null;

      if (existingCategories.length === 0) {
        // ایجاد 3 دسته‌بندی موبایل
        const mobileCategories = [
          {
            name: "گوشی‌های هوشمند",
            description: "انواع گوشی‌های هوشمند اندروید و آیفون",
            createdBy: testUser.id,
            order: 0,
          },
          {
            name: "لوازم جانبی موبایل",
            description: "کیف، کاور، محافظ صفحه و سایر لوازم جانبی",
            createdBy: testUser.id,
            order: 1,
          },
          {
            name: "تبلت و آیپد",
            description: "انواع تبلت‌های اندروید و آیپد اپل",
            createdBy: testUser.id,
            order: 2,
          }
        ];

        const createdCategories = await db.insert(categories).values(mobileCategories).returning();
        console.log("📱 3 دسته‌بندی موبایل تستی ایجاد شد");
        
        categoryIds = {
          smartphones: createdCategories[0].id,
          accessories: createdCategories[1].id,
          tablets: createdCategories[2].id,
        };
      } else {
        // استفاده از دسته‌بندی‌های موجود
        const smartphonesCategory = existingCategories.find((cat: any) => cat.name === "گوشی‌های هوشمند");
        const accessoriesCategory = existingCategories.find((cat: any) => cat.name === "لوازم جانبی موبایل");
        const tabletsCategory = existingCategories.find((cat: any) => cat.name === "تبلت و آیپد");
        
        if (smartphonesCategory && accessoriesCategory && tabletsCategory) {
          categoryIds = {
            smartphones: smartphonesCategory.id,
            accessories: accessoriesCategory.id,
            tablets: tabletsCategory.id,
          };
        }
      }

      // بررسی و ایجاد محصولات تستی (مستقل از وضعیت دسته‌بندی‌ها)
      if (categoryIds) {
        const existingProducts = await db
          .select()
          .from(products)
          .where(eq(products.userId, testUser.id));

        if (existingProducts.length === 0) {
          // ایجاد 6 محصول تستی
          const testProducts = [
            {
              userId: testUser.id,
              name: "آیفون 15 پرو مکس",
              description: "گوشی آیفون 15 پرو مکس با ظرفیت 256 گیگابایت، رنگ طلایی",
              categoryId: categoryIds.smartphones,
              priceBeforeDiscount: "45000000",
              priceAfterDiscount: "43000000",
              quantity: 5,
              image: "/uploads/iphone15-pro-max.png"
            },
            {
              userId: testUser.id,
              name: "سامسونگ گلکسی S24 اولترا",
              description: "گوشی سامسونگ گلکسی S24 اولترا با ظرفیت 512 گیگابایت",
              categoryId: categoryIds.smartphones,
              priceBeforeDiscount: "35000000",
              priceAfterDiscount: "33500000",
              quantity: 8,
              image: "/uploads/samsung-s24-ultra.png"
            },
            {
              userId: testUser.id,
              name: "کاور چرمی آیفون",
              description: "کاور چرمی اصل برای آیفون 15 سری، رنگ قهوه‌ای",
              categoryId: categoryIds.accessories,
              priceBeforeDiscount: "350000",
              priceAfterDiscount: "299000",
              quantity: 20,
              image: "/uploads/iphone-case.png"
            },
            {
              userId: testUser.id,
              name: "محافظ صفحه شیشه‌ای",
              description: "محافظ صفحه شیشه‌ای ضد ضربه برای انواع گوشی",
              categoryId: categoryIds.accessories,
              priceBeforeDiscount: "120000",
              priceAfterDiscount: "95000",
              quantity: 50,
              image: "/uploads/screen-protector.png"
            },
            {
              userId: testUser.id,
              name: "آیپد پرو 12.9 اینچ",
              description: "تبلت آیپد پرو 12.9 اینچ نسل پنجم با چیپ M2",
              categoryId: categoryIds.tablets,
              priceBeforeDiscount: "28000000",
              priceAfterDiscount: "26500000",
              quantity: 3,
              image: "/uploads/ipad-pro.png"
            },
            {
              userId: testUser.id,
              name: "تبلت سامسونگ گلکسی Tab S9",
              description: "تبلت سامسونگ گلکسی Tab S9 با صفحه 11 اینچ",
              categoryId: categoryIds.tablets,
              priceBeforeDiscount: "18000000",
              priceAfterDiscount: "17200000",
              quantity: 6,
              image: "/uploads/samsung-tab-s9.png"
            }
          ];

          await db.insert(products).values(testProducts);
          console.log("🛍️ 6 محصول تستی ایجاد شد");
        }
      }
      
      console.log("✅ تمام داده‌های تستی با موفقیت بررسی و ایجاد شدند");
    } catch (error) {
      console.error("Error initializing test data:", error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const cleanEmail = email.trim();
    const result = await db.select().from(users).where(or(eq(users.email, cleanEmail), ilike(users.email, cleanEmail))).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username) return undefined;
    const cleanUsername = username.trim();
    let result = await db.select().from(users).where(or(eq(users.username, cleanUsername), ilike(users.username, cleanUsername))).limit(1);
    if (!result[0] && (cleanUsername.toLowerCase() === "ehsan" || cleanUsername.toLowerCase() === "admin")) {
      await this.initializeAdminUser();
      result = await db.select().from(users).where(or(eq(users.username, cleanUsername), ilike(users.username, cleanUsername), eq(users.role, "admin"))).limit(1);
    }
    return result[0];
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    const raw = (emailOrUsername || '').trim();
    if (!raw) return undefined;
    const normalized = raw.toLowerCase();
    
    // Check for 'admin' or 'ehsan' username alias
    if (normalized === "admin" || normalized === "ehsan" || normalized === "مدیر" || normalized === "administrator") {
      try {
        let adminUsers = await db.select().from(users).where(or(eq(users.role, "admin"), eq(users.username, "ehsan"))).limit(1);
        if (adminUsers.length === 0) {
          await this.initializeAdminUser();
          adminUsers = await db.select().from(users).where(or(eq(users.role, "admin"), eq(users.username, "ehsan"))).limit(1);
        }
        if (adminUsers.length > 0) return adminUsers[0];
      } catch (err) {
        console.error("Error finding admin user:", err);
      }
    }

    // Try email first (case-insensitive)
    const userByEmail = await this.getUserByEmail(raw);
    if (userByEmail) return userByEmail;
    
    // Try username (case-insensitive)
    const userByUsername = await this.getUserByUsername(raw);
    if (userByUsername) return userByUsername;

    // Try phone number lookup
    const cleanDigits = raw.replace(/\D/g, '').replace(/^(98|0098)/, '').replace(/^0/, '');
    if (cleanDigits.length >= 9) {
      try {
        const allUsers = await db.select().from(users);
        const userByPhone = allUsers.find((u: any) => {
          if (!u.phone) return false;
          const userCleanDigits = u.phone.replace(/\D/g, '').replace(/^(98|0098)/, '').replace(/^0/, '');
          return userCleanDigits === cleanDigits;
        });
        if (userByPhone) return userByPhone;
      } catch (err) {
        console.error("Error finding user by phone:", err);
      }
    }

    return undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error: any) {
      console.error("❌ Error in createUser database operation:", error);
      if (error.code === '23505' || error.message?.includes('unique')) {
        throw new Error("نام کاربری یا شماره تلفن تکراری است");
      }
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const result = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    // حذف cascade دستی - ابتدا همه داده‌های مرتبط با کاربر را حذف می‌کنیم
    
    // 1. حذف آیتم‌های سبد خرید (که به سبدهای خرید وابسته است)
    const userCarts = await db.select().from(carts).where(eq(carts.userId, id));
    if (userCarts.length > 0) {
      const cartIds = userCarts.map((cart: any) => cart.id);
      await db.delete(cartItems).where(inArray(cartItems.cartId, cartIds));
    }
    
    // 2. حذف سبدهای خرید
    await db.delete(carts).where(eq(carts.userId, id));
    
    // 3. حذف آیتم‌های سفارش (که به سفارش‌ها وابسته است)
    const userOrders = await db.select().from(orders).where(
      or(eq(orders.userId, id), eq(orders.sellerId, id))
    );
    if (userOrders.length > 0) {
      const orderIds = userOrders.map((order: any) => order.id);
      await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
    }
    
    // 4. حذف تراکنش‌ها (قبل از سفارش‌ها چون به سفارش‌ها وابسته است)
    await db.delete(transactions).where(
      or(
        eq(transactions.userId, id),
        eq(transactions.initiatorUserId, id),
        eq(transactions.parentUserId, id),
        eq(transactions.approvedByUserId, id)
      )
    );
    
    // 5. حذف سفارش‌ها
    await db.delete(orders).where(
      or(eq(orders.userId, id), eq(orders.sellerId, id))
    );
    
    // 6. حذف آدرس‌ها
    await db.delete(addresses).where(eq(addresses.userId, id));
    
    // 7. حذف چت‌های داخلی
    await db.delete(internalChats).where(
      or(eq(internalChats.senderId, id), eq(internalChats.receiverId, id))
    );
    
    // 8. حذف پیام‌های ارسالی
    await db.delete(sentMessages).where(eq(sentMessages.userId, id));
    
    // 9. حذف پیام‌های دریافتی
    await db.delete(receivedMessages).where(eq(receivedMessages.userId, id));
    
    // 10. حذف اشتراک‌های کاربر
    await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, id));
    
    // 11. حذف تیکت‌ها
    await db.delete(tickets).where(eq(tickets.userId, id));
    
    // 12. حذف محصولات
    await db.delete(products).where(eq(products.userId, id));
    
    // 13. حذف دسته‌بندی‌های ایجاد شده توسط کاربر
    await db.delete(categories).where(eq(categories.createdBy, id));
    
    // 14. در نهایت حذف کاربر
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount! > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Tickets
  async getTicket(id: string): Promise<Ticket | undefined> {
    const result = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    return result[0];
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.userId, userId));
  }

  async getAllTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets);
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const result = await db.insert(tickets).values(insertTicket).returning();
    return result[0];
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const result = await db.update(tickets).set(updates).where(eq(tickets.id, id)).returning();
    return result[0];
  }

  async deleteTicket(id: string): Promise<boolean> {
    const result = await db.delete(tickets).where(eq(tickets.id, id));
    return result.rowCount! > 0;
  }

  async markTicketAsRead(id: string): Promise<Ticket | undefined> {
    const result = await db.update(tickets)
      .set({ status: "read" })
      .where(eq(tickets.id, id))
      .returning();
    return result[0];
  }

  // Subscriptions
  async getSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result[0];
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions);
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(insertSubscription).returning();
    return result[0];
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions).set(updates).where(eq(subscriptions.id, id)).returning();
    return result[0];
  }

  async deleteSubscription(id: string): Promise<boolean> {
    const result = await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return result.rowCount! > 0;
  }

  // Products
  async getProduct(id: string, currentUserId: string, userRole: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    const product = result[0];
    
    if (!product) return undefined;
    
    // Apply role-based access control
    if (userRole === 'admin' || userRole === 'user_level_1') {
      // Admin and level 1 can only access their own products
      return product.userId === currentUserId ? product : undefined;
    }
    return undefined;
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.userId, userId));
  }

  async getAllProducts(currentUserId: string, userRole: string): Promise<Product[]> {
    if (!currentUserId || !userRole) {
      throw new Error('User context required for getAllProducts');
    }

    // Filter based on user role
    if (userRole === 'admin') {
      // Admin sees only their own products
      return await db.select().from(products).where(eq(products.userId, currentUserId));
    } else if (userRole === 'user_level_1') {
      // Level 1 sees only their own products  
      return await db.select().from(products).where(eq(products.userId, currentUserId));
    } else if (userRole === 'user_level_2') {
      // Level 2 sees products from their parent user
      const currentUser = await db.select({ parentUserId: users.parentUserId })
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);
      
      if (currentUser.length === 0 || !currentUser[0].parentUserId) {
        // If no parent user found, return empty array
        return [];
      }
      
      // Return products from parent user
      return await db.select().from(products).where(eq(products.userId, currentUser[0].parentUserId));
    }
    
    return [];
  }

  async getAdminProducts(): Promise<Product[]> {
    const adminUser = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
    if (!adminUser.length) return [];
    return await db.select().from(products).where(
      and(eq(products.userId, adminUser[0].id), eq(products.isActive, true))
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async updateProduct(id: string, updates: Partial<Product>, currentUserId: string, userRole: string): Promise<Product | undefined> {
    const product = await this.getProduct(id, currentUserId, userRole);
    if (!product) return undefined;
    
    const result = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string, currentUserId: string, userRole: string): Promise<boolean> {
    const product = await this.getProduct(id, currentUserId, userRole);
    if (!product) return false;
    
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount! > 0;
  }

  // Messages
  async getSentMessagesByUser(userId: string): Promise<SentMessage[]> {
    return await db.select().from(sentMessages)
      .where(eq(sentMessages.userId, userId))
      .orderBy(desc(sentMessages.timestamp), desc(sentMessages.id));
  }

  async createSentMessage(insertMessage: InsertSentMessage): Promise<SentMessage> {
    const result = await db.insert(sentMessages).values(insertMessage).returning();
    return result[0];
  }

  async getReceivedMessagesByUser(userId: string): Promise<ReceivedMessage[]> {
    return await db.select().from(receivedMessages)
      .where(eq(receivedMessages.userId, userId))
      .orderBy(desc(receivedMessages.timestamp), desc(receivedMessages.id));
  }

  async getReceivedMessagesByUserPaginated(userId: string, page: number, limit: number): Promise<{ messages: ReceivedMessage[], total: number, totalPages: number }> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(receivedMessages)
      .where(eq(receivedMessages.userId, userId));
    const total = countResult[0].count;
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated messages ordered by timestamp desc (newest first)
    const messages = await db.select()
      .from(receivedMessages)
      .where(eq(receivedMessages.userId, userId))
      .orderBy(desc(receivedMessages.timestamp), desc(receivedMessages.id))
      .limit(limit)
      .offset(offset);
    
    return { messages, total, totalPages };
  }

  async getReceivedMessageByWhatsiPlusId(whatsiPlusId: string): Promise<ReceivedMessage | undefined> {
    const result = await db.select().from(receivedMessages).where(eq(receivedMessages.whatsiPlusId, whatsiPlusId)).limit(1);
    return result[0];
  }

  async getReceivedMessageByWhatsiPlusIdAndUser(whatsiPlusId: string, userId: string): Promise<ReceivedMessage | undefined> {
    const result = await db.select()
      .from(receivedMessages)
      .where(and(eq(receivedMessages.whatsiPlusId, whatsiPlusId), eq(receivedMessages.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createReceivedMessage(insertMessage: InsertReceivedMessage): Promise<ReceivedMessage> {
    const result = await db.insert(receivedMessages).values(insertMessage).returning();
    return result[0];
  }

  async updateReceivedMessageStatus(id: string, status: string): Promise<ReceivedMessage | undefined> {
    const result = await db.update(receivedMessages).set({ status }).where(eq(receivedMessages.id, id)).returning();
    return result[0];
  }

  // User Subscriptions
  private normalizeUserSubscription(userSub: UserSubscription): UserSubscription {
    let endDate = userSub.endDate ? new Date(userSub.endDate) : null;
    const startDate = userSub.startDate ? new Date(userSub.startDate) : (userSub.createdAt ? new Date(userSub.createdAt) : new Date());

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

    return {
      ...userSub,
      startDate,
      endDate: endDate || userSub.endDate,
      remainingDays,
      status,
    };
  }

  async getUserSubscription(userId: string): Promise<UserSubscription & { subscriptionName?: string | null; subscriptionDescription?: string | null } | undefined> {
    const rawList = await db.select({
      id: userSubscriptions.id,
      userId: userSubscriptions.userId,
      subscriptionId: userSubscriptions.subscriptionId,
      status: userSubscriptions.status,
      startDate: userSubscriptions.startDate,
      endDate: userSubscriptions.endDate,
      remainingDays: userSubscriptions.remainingDays,
      isTrialPeriod: userSubscriptions.isTrialPeriod,
      createdAt: userSubscriptions.createdAt,
      updatedAt: userSubscriptions.updatedAt,
      subscriptionName: subscriptions.name,
      subscriptionDescription: subscriptions.description,
    })
    .from(userSubscriptions)
    .innerJoin(subscriptions, eq(userSubscriptions.subscriptionId, subscriptions.id))
    .where(eq(userSubscriptions.userId, userId));

    if (rawList.length === 0) return undefined;

    const list = rawList.map((item: typeof rawList[0]) => {
      const normalized = this.normalizeUserSubscription(item as UserSubscription);
      return {
        ...normalized,
        subscriptionName: item.subscriptionName,
        subscriptionDescription: item.subscriptionDescription,
      };
    });

    list.sort((a: UserSubscription, b: UserSubscription) => {
      const aActive = (a.status === 'active' && a.remainingDays > 0) ? 1 : 0;
      const bActive = (b.status === 'active' && b.remainingDays > 0) ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      if (a.remainingDays !== b.remainingDays) return b.remainingDays - a.remainingDays;
      const aTime = new Date(a.updatedAt || a.createdAt || a.startDate || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || b.startDate || 0).getTime();
      return bTime - aTime;
    });

    const userSubscription = list[0];
    if (!userSubscription) return undefined;

    const rawMatch = rawList.find((r: typeof rawList[0]) => r.id === userSubscription.id);
    if (rawMatch && (rawMatch.remainingDays !== userSubscription.remainingDays || rawMatch.status !== userSubscription.status)) {
      await db.update(userSubscriptions)
        .set({ 
          remainingDays: userSubscription.remainingDays, 
          status: userSubscription.status, 
          endDate: userSubscription.endDate,
          updatedAt: new Date() 
        })
        .where(eq(userSubscriptions.id, userSubscription.id));
    }

    return userSubscription;
  }

  async getUserSubscriptionsByUserId(userId: string): Promise<UserSubscription[]> {
    const rawList = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));
    return rawList.map((item: UserSubscription) => this.normalizeUserSubscription(item));
  }

  async getUserSubscriptionById(id: string): Promise<UserSubscription | undefined> {
    const result = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id)).limit(1);
    if (!result[0]) return undefined;
    return this.normalizeUserSubscription(result[0]);
  }

  async getAllUserSubscriptions(): Promise<UserSubscription[]> {
    const rawList = await db.select().from(userSubscriptions).orderBy(desc(userSubscriptions.createdAt));
    return rawList.map((item: UserSubscription) => this.normalizeUserSubscription(item));
  }

  async createUserSubscription(insertUserSubscription: InsertUserSubscription): Promise<UserSubscription> {
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

    const result = await db.insert(userSubscriptions).values({
      ...insertUserSubscription,
      startDate,
      endDate: endDate || new Date(),
      remainingDays,
      status,
    }).returning();
    return result[0];
  }

  async updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const existing = await this.getUserSubscriptionById(id);
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

    const result = await db.update(userSubscriptions)
      .set({ 
        ...updates, 
        endDate: endDate || existing.endDate,
        remainingDays,
        status,
        updatedAt: new Date() 
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return result[0];
  }

  async deleteUserSubscription(id: string): Promise<boolean> {
    const result = await db.delete(userSubscriptions).where(eq(userSubscriptions.id, id));
    return result.rowCount! > 0;
  }

  async updateRemainingDays(id: string, remainingDays: number): Promise<UserSubscription | undefined> {
    const normalizedDays = Math.max(0, Math.floor(remainingDays));
    const status = normalizedDays <= 0 ? 'expired' : 'active';
    const endDate = normalizedDays > 0
      ? new Date(Date.now() + normalizedDays * 24 * 60 * 60 * 1000)
      : new Date();

    const result = await db.update(userSubscriptions)
      .set({ 
        remainingDays: normalizedDays,
        endDate,
        status,
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return result[0];
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
    if (userRole === 'admin' || userRole === 'user_level_1') {
      // Admin and level 1 can only access their own categories
      const result = await db.select().from(categories)
        .where(and(eq(categories.id, id), eq(categories.createdBy, currentUserId)))
        .limit(1);
      return result[0];
    }
    return undefined;
  }

  async getAllCategories(currentUserId: string, userRole: string): Promise<Category[]> {
    if (!currentUserId || !userRole) {
      throw new Error('User context required for getAllCategories');
    }

    // Filter based on user role
    return await db.select().from(categories)
      .where(eq(categories.createdBy, currentUserId))
      .orderBy(categories.order);
  }

  async getCategoriesByParent(parentId: string | null, currentUserId: string, userRole: string): Promise<Category[]> {
    const allCategories = await this.getAllCategories(currentUserId, userRole);
    return allCategories.filter(category => category.parentId === parentId);
  }

  async getCategoryTree(currentUserId: string, userRole: string): Promise<Category[]> {
    const allCategories = await this.getAllCategories(currentUserId, userRole);
    // Get root categories (those with null parentId)
    return allCategories.filter(cat => cat.parentId === null);
  }

  async createCategory(insertCategory: InsertCategory, createdBy: string): Promise<Category> {
    const result = await db.insert(categories).values({ ...insertCategory, createdBy }).returning();
    return result[0];
  }

  async updateCategory(id: string, updates: Partial<Category>, currentUserId: string, userRole: string): Promise<Category | undefined> {
    const category = await this.getCategory(id, currentUserId, userRole);
    if (!category) return undefined;
    
    const result = await db.update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: string, currentUserId: string, userRole: string): Promise<boolean> {
    const category = await this.getCategory(id, currentUserId, userRole);
    if (!category) return false;
    
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount! > 0;
  }

  async reorderCategories(updates: { id: string; order: number; parentId?: string | null }[]): Promise<boolean> {
    try {
      // Use a transaction to ensure all updates succeed or fail together
      for (const update of updates) {
        await db.update(categories)
          .set({
            order: update.order,
            parentId: update.parentId !== undefined ? update.parentId : undefined,
            updatedAt: new Date()
          })
          .where(eq(categories.id, update.id));
      }
      return true;
    } catch (error) {
      console.error('Error reordering categories:', error);
      return false;
    }
  }

  async getSubUsers(parentUserId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.parentUserId, parentUserId));
  }

  async getUsersVisibleToUser(userId: string, userRole: string): Promise<User[]> {
    if (userRole === 'admin') {
      // Admin can see only admin and user_level_1 users, NOT user_level_2
      return await db.select().from(users).where(
        or(
          eq(users.role, 'admin'),
          eq(users.role, 'user_level_1')
        )
      );
    } else if (userRole === 'user_level_1') {
      // Level 1 users can see their sub-users (level 2)
      return await db.select().from(users).where(eq(users.parentUserId, userId));
    } else {
      // Level 2 users cannot see other users
      return [];
    }
  }

  // Cart
  async getCart(userId: string): Promise<Cart | undefined> {
    const result = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    return result[0];
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    const cart = await this.getCart(userId);
    if (!cart) return [];
    
    return await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
  }

  async getCartItemsWithProducts(userId: string): Promise<(CartItem & { productName: string; productDescription?: string; productImage?: string })[]> {
    const cart = await this.getCart(userId);
    if (!cart) return [];
    
    const result = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        totalPrice: cartItems.totalPrice,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        productName: products.name,
        productDescription: products.description,
        productImage: products.image,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    return result.map((row: any) => ({
      id: row.id,
      cartId: row.cartId,
      productId: row.productId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      totalPrice: row.totalPrice,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      productName: row.productName,
      productDescription: row.productDescription || undefined,
      productImage: row.productImage || undefined,
    }));
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (product.length === 0) {
      throw new Error('محصول یافت نشد');
    }

    // Get or create cart for user
    let cart = await this.getCart(userId);
    if (!cart) {
      const cartResult = await db.insert(carts).values({
        userId,
        totalAmount: "0",
        itemCount: 0,
      }).returning();
      cart = cartResult[0];
    }

    if (!cart) {
      throw new Error('خطا در ایجاد یا یافتن سبد خرید');
    }

    // Check if item already exists in cart
    const existingItem = await db.select().from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
      .limit(1);

    const unitPrice = product[0].priceAfterDiscount || product[0].priceBeforeDiscount;
    const totalPrice = (parseFloat(unitPrice) * quantity).toString();

    if (existingItem.length > 0) {
      // Update existing item
      const newQuantity = existingItem[0].quantity + quantity;
      const newTotalPrice = (parseFloat(unitPrice) * newQuantity).toString();
      
      const result = await db.update(cartItems)
        .set({
          quantity: newQuantity,
          totalPrice: newTotalPrice,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      
      return result[0];
    } else {
      // Create new item
      const result = await db.insert(cartItems).values({
        cartId: cart.id,
        productId,
        quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
      }).returning();
      
      return result[0];
    }
  }

  async updateCartItemQuantity(itemId: string, quantity: number, userId: string): Promise<CartItem | undefined> {
    const cart = await this.getCart(userId);
    if (!cart) return undefined;

    const item = await db.select().from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
      .limit(1);
    
    if (item.length === 0) return undefined;

    const newTotalPrice = (parseFloat(item[0].unitPrice) * quantity).toString();
    
    const result = await db.update(cartItems)
      .set({
        quantity,
        totalPrice: newTotalPrice,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, itemId))
      .returning();
    
    return result[0];
  }

  async removeFromCart(itemId: string, userId: string): Promise<boolean> {
    const cart = await this.getCart(userId);
    if (!cart) return false;

    const result = await db.delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
    
    return result.rowCount! > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const cart = await this.getCart(userId);
    if (!cart) return false;

    const result = await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    return result.rowCount! >= 0;
  }

  // Addresses
  async getAddress(id: string): Promise<Address | undefined> {
    const result = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
    return result[0];
  }

  async getAddressesByUser(userId: string): Promise<Address[]> {
    return await db.select().from(addresses).where(eq(addresses.userId, userId));
  }

  async createAddress(insertAddress: InsertAddress): Promise<Address> {
    const result = await db.insert(addresses).values(insertAddress).returning();
    return result[0];
  }

  async updateAddress(id: string, updates: Partial<Address>, userId: string): Promise<Address | undefined> {
    const result = await db.update(addresses)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
    return result.rowCount! > 0;
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<boolean> {
    // First, remove default from all user addresses
    await db.update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, userId));
    
    // Then set the specified address as default
    const result = await db.update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));
    
    return result.rowCount! > 0;
  }

  // Orders
  async getOrder(id: string): Promise<(Order & { addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string; sellerFirstName?: string; sellerLastName?: string }) | undefined> {
    const sellerUsers = alias(users, 'seller_users');
    
    const result = await db.select({
      id: orders.id,
      userId: orders.userId,
      sellerId: orders.sellerId,
      addressId: orders.addressId,
      totalAmount: orders.totalAmount,
      status: orders.status,
      statusHistory: orders.statusHistory,
      orderNumber: orders.orderNumber,
      shippingMethod: orders.shippingMethod,
      notes: orders.notes,
      paymentStartedAt: orders.paymentStartedAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      addressTitle: addresses.title,
      fullAddress: addresses.fullAddress,
      postalCode: addresses.postalCode,
      buyerFirstName: users.firstName,
      buyerLastName: users.lastName,
      buyerPhone: users.phone,
      sellerFirstName: sellerUsers.firstName,
      sellerLastName: sellerUsers.lastName,
    })
    .from(orders)
    .leftJoin(addresses, eq(orders.addressId, addresses.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(sellerUsers, eq(orders.sellerId, sellerUsers.id))
    .where(eq(orders.id, id))
    .limit(1);
    
    return result[0] as (Order & { addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string; sellerFirstName?: string; sellerLastName?: string }) | undefined;
  }

  async getOrdersByUser(userId: string): Promise<(Order & { addressTitle?: string; fullAddress?: string; postalCode?: string })[]> {
    const result = await db.select({
      id: orders.id,
      userId: orders.userId,
      sellerId: orders.sellerId,
      addressId: orders.addressId,
      totalAmount: orders.totalAmount,
      status: orders.status,
      statusHistory: orders.statusHistory,
      orderNumber: orders.orderNumber,
      shippingMethod: orders.shippingMethod,
      notes: orders.notes,
      paymentStartedAt: orders.paymentStartedAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      addressTitle: addresses.title,
      fullAddress: addresses.fullAddress,
      postalCode: addresses.postalCode,
    })
    .from(orders)
    .leftJoin(addresses, eq(orders.addressId, addresses.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
    
    return result as (Order & { addressTitle?: string; fullAddress?: string; postalCode?: string })[];
  }

  async getOrdersBySeller(sellerId: string): Promise<(Order & { addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string })[]> {
    const result = await db.select({
      id: orders.id,
      userId: orders.userId,
      sellerId: orders.sellerId,
      addressId: orders.addressId,
      totalAmount: orders.totalAmount,
      status: orders.status,
      statusHistory: orders.statusHistory,
      orderNumber: orders.orderNumber,
      shippingMethod: orders.shippingMethod,
      notes: orders.notes,
      paymentStartedAt: orders.paymentStartedAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      addressTitle: addresses.title,
      fullAddress: addresses.fullAddress,
      postalCode: addresses.postalCode,
      buyerFirstName: users.firstName,
      buyerLastName: users.lastName,
      buyerPhone: users.phone,
    })
    .from(orders)
    .leftJoin(addresses, eq(orders.addressId, addresses.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.sellerId, sellerId))
    .orderBy(desc(orders.createdAt));
    
    return result as (Order & { addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string })[];
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderNumber = this.generateOrderNumber();
    const orderData = {
      ...insertOrder,
      orderNumber,
    };
    const result = await db.insert(orders).values(orderData).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string, sellerId: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ 
        status, 
        updatedAt: new Date(),
        statusHistory: sql`array_append(status_history, ${status}::text)`
      })
      .where(and(eq(orders.id, id), eq(orders.sellerId, sellerId)))
      .returning();
    return result[0];
  }

  generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  async getNewOrdersCount(sellerId: string): Promise<number> {
    // Count orders that are "pending" status (new orders)
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.sellerId, sellerId),
        eq(orders.status, 'pending')
      ));
    
    return result[0]?.count || 0;
  }

  async getUnshippedOrdersCount(sellerId: string): Promise<number> {
    // Count orders that are unshipped (pending, confirmed, preparing)
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.sellerId, sellerId),
        inArray(orders.status, ['pending', 'confirmed', 'preparing'])
      ));
    
    return result[0]?.count || 0;
  }

  async getPaidOrdersCount(sellerId: string): Promise<number> {
    // Count orders that are paid (status other than awaiting_payment)
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.sellerId, sellerId),
        ne(orders.status, 'awaiting_payment')
      ));
    
    return result[0]?.count || 0;
  }

  async getPendingOrdersCount(sellerId: string): Promise<number> {
    // Count orders that are pending (در حال تایید)
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.sellerId, sellerId),
        eq(orders.status, 'pending')
      ));
    
    return result[0]?.count || 0;
  }

  async getPendingPaymentOrdersCount(userId: string): Promise<number> {
    // Count orders that are awaiting payment for user
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.status, 'awaiting_payment')
      ));
    
    return result[0]?.count || 0;
  }

  async getAwaitingPaymentOrdersByUser(userId: string): Promise<Order[]> {
    // Get orders that are awaiting payment for user, ordered by creation date (oldest first)
    return await db.select()
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.status, 'awaiting_payment')
      ))
      .orderBy(orders.createdAt); // oldest first for priority processing
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getOrderItemsWithProducts(orderId: string): Promise<(OrderItem & { productName: string; productDescription?: string; productImage?: string })[]> {
    const result = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      createdAt: orderItems.createdAt,
      productName: products.name,
      productDescription: products.description,
      productImage: products.image,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
    
    return result as (OrderItem & { productName: string; productDescription?: string; productImage?: string })[];
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values(insertOrderItem).returning();
    return result[0];
  }

  // Transactions
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByUserAndType(userId: string, type: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, type)))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(insertTransaction).returning();
    return result[0];
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction | undefined> {
    const result = await db.update(transactions)
      .set({ status })
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  async getUserBalance(userId: string): Promise<number> {
    const result = await db.select({
      balance: sql<number>`COALESCE(SUM(CASE 
        WHEN type IN ('deposit', 'commission') THEN amount::numeric
        WHEN type IN ('withdraw', 'order_payment') THEN -amount::numeric
        ELSE 0
      END), 0)::numeric`
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.status, 'completed')));
    
    return Number(result[0].balance);
  }

  async getPendingTransactionsCount(sellerId: string): Promise<number> {
    // Count transactions that are pending and belong to sub-users of this seller
    const subUsers = await db.select()
      .from(users)
      .where(eq(users.parentUserId, sellerId));
    
    const subUserIds = subUsers.map((user: any) => user.id);
    
    if (subUserIds.length === 0) {
      return 0;
    }
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(
        eq(transactions.status, 'pending'),
        inArray(transactions.userId, subUserIds)
      ));
    
    return result[0]?.count || 0;
  }

  async getSuccessfulTransactionsBySellers(sellerIds: string[]): Promise<Transaction[]> {
    if (sellerIds.length === 0) return [];
    
    return await db.select().from(transactions)
      .where(and(
        sql`user_id = ANY(${sellerIds})`,
        eq(transactions.status, 'completed'),
        eq(transactions.type, 'commission')
      ))
      .orderBy(desc(transactions.createdAt));
  }

  // Deposit approval methods
  async getDepositsByParent(parentUserId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(and(
        eq(transactions.type, 'deposit'),
        eq(transactions.parentUserId, parentUserId)
      ))
      .orderBy(desc(transactions.createdAt));
  }

  async approveDeposit(transactionId: string, approvedByUserId: string): Promise<Transaction | undefined> {
    const result = await db.update(transactions)
      .set({ 
        status: 'completed',
        approvedByUserId,
        approvedAt: new Date()
      })
      .where(eq(transactions.id, transactionId))
      .returning();
    return result[0];
  }

  async getApprovedDepositsTotalByParent(parentUserId: string): Promise<number> {
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(amount::numeric), 0)::numeric`
    })
    .from(transactions)
    .where(and(
      eq(transactions.type, 'deposit'),
      eq(transactions.parentUserId, parentUserId),
      eq(transactions.status, 'completed'),
      sql`approved_by_user_id IS NOT NULL`
    ));
    
    return Number(result[0].total);
  }

  async getTransactionByReferenceId(referenceId: string, userId: string): Promise<Transaction | undefined> {
    const result = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.referenceId, referenceId),
        eq(transactions.userId, userId)
      ))
      .limit(1);
    return result[0];
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    } catch (error) {
      console.error("Error getting all transactions:", error);
      return [];
    }
  }

  async getUserDepositsToAdmin(userId: string, limit = 50): Promise<any[]> {
    try {
      const list: any[] = [];
      const user = await this.getUser(userId);

      // 1. Blupal transactions where this user is the payer (e.g. subscription purchases or payments to admin)
      const blupalList = await db.select().from(blupalTransactions).orderBy(desc(blupalTransactions.createdAt));
      for (const tx of blupalList) {
        const isPayerSub = tx.orderId?.includes(userId) || tx.orderId?.startsWith(`SUB:`) || tx.orderId?.startsWith(`USER_UPGRADE:`);
        const isPayerPhone = user?.phone && tx.payerPhone === user.phone;
        const isPayerDesc = user?.username && (tx.description?.includes(user.username) || tx.description?.includes(user.phone || ''));

        if (isPayerSub || isPayerPhone || isPayerDesc) {
          list.push({
            id: tx.id,
            invoiceId: tx.invoiceId,
            amount: tx.amount,
            finalAmount: tx.finalAmount,
            payerName: tx.payerName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username,
            payerPhone: tx.payerPhone || user?.phone,
            destCardNumber: tx.destCardNumber,
            destCardHolder: tx.destCardHolder || "مدیریت سامانه",
            destBankName: (tx as any).destBankName || tx.payerBankName || null,
            cardLastFour: tx.cardLastFour,
            trackingCode: tx.trackingCode || tx.invoiceId,
            status: tx.status,
            description: tx.description || "خرید اشتراک / واریز به مدیریت",
            orderId: tx.orderId,
            paymentMethod: "کارت به کارت شتاب",
            paidAt: tx.paidAt,
            createdAt: tx.createdAt,
          });
        }
      }

      // 2. Standard deposits
      const stdList = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
      for (const t of stdList) {
        if (t.type === "deposit" || t.type === "subscription" || t.orderId?.startsWith("SUB:")) {
          const exists = list.some(item => item.trackingCode === t.referenceId || item.invoiceId === t.referenceId || item.id === t.id);
          if (!exists) {
            list.push({
              id: t.id,
              invoiceId: t.referenceId || `TX-${t.id}`,
              amount: t.amount,
              finalAmount: t.amount,
              payerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username,
              payerPhone: user?.phone,
              destCardNumber: null,
              destCardHolder: "مدیریت سامانه",
              destBankName: null,
              cardLastFour: null,
              trackingCode: t.referenceId,
              status: t.status === "completed" ? "paid" : t.status,
              description: t.accountSource || (t.type === "subscription" ? "خرید اشتراک" : "واریز به حساب مدیریت"),
              orderId: t.orderId,
              paymentMethod: t.paymentMethod || "کارت به کارت شتاب",
              paidAt: t.approvedAt || t.createdAt,
              createdAt: t.createdAt,
            });
          }
        }
      }

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return list.slice(0, limit);
    } catch (error) {
      console.error("Error getting user deposits to admin:", error);
      return [];
    }
  }

  // Internal Chat methods
  async getInternalChatById(id: string): Promise<InternalChat | undefined> {
    const result = await db.select().from(internalChats).where(eq(internalChats.id, id)).limit(1);
    return result[0];
  }

  async getInternalChatsBetweenUsers(user1Id: string, user2Id: string): Promise<InternalChat[]> {
    return await db.select().from(internalChats)
      .where(or(
        and(eq(internalChats.senderId, user1Id), eq(internalChats.receiverId, user2Id)),
        and(eq(internalChats.senderId, user2Id), eq(internalChats.receiverId, user1Id))
      ))
      .orderBy(internalChats.createdAt);
  }

  async getInternalChatsForSeller(sellerId: string): Promise<(InternalChat & { senderName?: string; receiverName?: string })[]> {
    const senderAlias = alias(users, 'sender');
    const receiverAlias = alias(users, 'receiver');

    const result = await db.select({
      id: internalChats.id,
      senderId: internalChats.senderId,
      receiverId: internalChats.receiverId,
      message: internalChats.message,
      isRead: internalChats.isRead,
      createdAt: internalChats.createdAt,
      senderName: sql<string>`${senderAlias.firstName} || ' ' || ${senderAlias.lastName}`,
      receiverName: sql<string>`${receiverAlias.firstName} || ' ' || ${receiverAlias.lastName}`
    })
    .from(internalChats)
    .leftJoin(senderAlias, eq(internalChats.senderId, senderAlias.id))
    .leftJoin(receiverAlias, eq(internalChats.receiverId, receiverAlias.id))
    .where(or(eq(internalChats.senderId, sellerId), eq(internalChats.receiverId, sellerId)))
    .orderBy(desc(internalChats.createdAt));

    return result;
  }

  async createInternalChat(chat: InsertInternalChat): Promise<InternalChat> {
    const result = await db.insert(internalChats).values(chat).returning();
    return result[0];
  }

  async markInternalChatAsRead(id: string): Promise<InternalChat | undefined> {
    const result = await db.update(internalChats)
      .set({ isRead: true })
      .where(eq(internalChats.id, id))
      .returning();
    return result[0];
  }

  async markAllMessagesAsReadForUser(userId: string, userRole: string): Promise<boolean> {
    try {
      if (userRole === "admin") {
        await db.update(internalChats)
          .set({ isRead: true })
          .where(
            and(
              eq(internalChats.receiverId, userId),
              eq(internalChats.isRead, false)
            )
          );
      } else if (userRole === "user_level_2") {
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user[0] || !user[0].parentUserId) return true;
        
        await db.update(internalChats)
          .set({ isRead: true })
          .where(
            and(
              eq(internalChats.senderId, user[0].parentUserId),
              eq(internalChats.receiverId, userId),
              eq(internalChats.isRead, false)
            )
          );
      } else if (userRole === "user_level_1") {
        const subUsers = await db.select({ id: users.id })
          .from(users)
          .where(eq(users.parentUserId, userId));
        
        if (subUsers.length === 0) return true;
        
        const subUserIds = subUsers.map((user: any) => user.id);
        
        await db.update(internalChats)
          .set({ isRead: true })
          .where(
            and(
              inArray(internalChats.senderId, subUserIds),
              eq(internalChats.receiverId, userId),
              eq(internalChats.isRead, false)
            )
          );
      }
      
      return true;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return false;
    }
  }

  async markMessagesFromSenderAsRead(senderId: string, receiverId: string): Promise<boolean> {
    try {
      await db.update(internalChats)
        .set({ isRead: true })
        .where(
          and(
            eq(internalChats.senderId, senderId),
            eq(internalChats.receiverId, receiverId),
            eq(internalChats.isRead, false)
          )
        );
      return true;
    } catch (error) {
      console.error("Error marking messages from sender as read:", error);
      return false;
    }
  }

  async getUnreadMessagesCountForUser(userId: string, userRole: string): Promise<number> {
    try {
      let whereClause;
      if (userRole === "admin") {
        whereClause = and(
          eq(internalChats.receiverId, userId),
          eq(internalChats.isRead, false)
        );
      } else if (userRole === "user_level_1") {
        // Find admin user id
        const adminUsers = await db.select({ id: users.id })
          .from(users)
          .where(eq(users.role, "admin"))
          .limit(1);
        const adminId = adminUsers[0]?.id;

        const subUsers = await db.select({ id: users.id })
          .from(users)
          .where(eq(users.parentUserId, userId));
        const subUserIds = subUsers.map((u: { id: string }) => u.id);

        const senderIds = [...subUserIds];
        if (adminId) {
          senderIds.push(adminId);
        }

        if (senderIds.length === 0) return 0;

        whereClause = and(
          inArray(internalChats.senderId, senderIds),
          eq(internalChats.receiverId, userId),
          eq(internalChats.isRead, false)
        );
      } else {
        return 0;
      }
      
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(internalChats)
        .where(whereClause);
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error getting unread messages count:", error);
      return 0;
    }
  }

  // FAQ methods
  async getFaq(id: string): Promise<Faq | undefined> {
    try {
      const result = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting FAQ:", error);
      return undefined;
    }
  }

  async getAllFaqs(includeInactive: boolean = false): Promise<Faq[]> {
    try {
      const query = db.select().from(faqs);
      
      if (!includeInactive) {
        query.where(eq(faqs.isActive, true));
      }
      
      const result = await query.orderBy(faqs.order);
      return result;
    } catch (error) {
      console.error("Error getting all FAQs:", error);
      return [];
    }
  }

  async getActiveFaqs(): Promise<Faq[]> {
    try {
      const result = await db.select()
        .from(faqs)
        .where(eq(faqs.isActive, true))
        .orderBy(faqs.order);
      return result;
    } catch (error) {
      console.error("Error getting active FAQs:", error);
      return [];
    }
  }

  async getFaqsByCreator(creatorId: string): Promise<Faq[]> {
    try {
      const result = await db.select()
        .from(faqs)
        .where(and(eq(faqs.isActive, true), eq(faqs.createdBy, creatorId)))
        .orderBy(faqs.order);
      return result;
    } catch (error) {
      console.error("Error getting FAQs by creator:", error);
      return [];
    }
  }

  async createFaq(faq: InsertFaq, createdBy: string): Promise<Faq> {
    try {
      const result = await db.insert(faqs).values({
        ...faq,
        createdBy,
        isActive: faq.isActive ?? true,
        order: faq.order ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating FAQ:", error);
      throw error;
    }
  }

  async updateFaq(id: string, faq: UpdateFaq): Promise<Faq | undefined> {
    try {
      const result = await db.update(faqs)
        .set({
          ...faq,
          updatedAt: new Date(),
        })
        .where(eq(faqs.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error("Error updating FAQ:", error);
      return undefined;
    }
  }

  async deleteFaq(id: string): Promise<boolean> {
    try {
      const result = await db.delete(faqs).where(eq(faqs.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return false;
    }
  }

  async updateFaqOrder(id: string, newOrder: number): Promise<Faq | undefined> {
    try {
      const result = await db.update(faqs)
        .set({
          order: newOrder,
          updatedAt: new Date(),
        })
        .where(eq(faqs.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error("Error updating FAQ order:", error);
      return undefined;
    }
  }

  // Password Reset OTP methods
  async createPasswordResetOtp(userId: string, otp: string, expiresAt: Date): Promise<PasswordResetOtp> {
    try {
      const result = await db.insert(passwordResetOtps)
        .values({
          userId,
          otp,
          expiresAt,
          isUsed: false,
          createdAt: new Date(),
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating password reset OTP:", error);
      throw error;
    }
  }

  async getValidPasswordResetOtp(userId: string, otp: string): Promise<PasswordResetOtp | undefined> {
    try {
      const result = await db.select()
        .from(passwordResetOtps)
        .where(
          and(
            eq(passwordResetOtps.userId, userId),
            eq(passwordResetOtps.otp, otp),
            eq(passwordResetOtps.isUsed, false),
            gte(passwordResetOtps.expiresAt, new Date())
          )
        )
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Error getting valid password reset OTP:", error);
      return undefined;
    }
  }

  async markOtpAsUsed(id: string): Promise<boolean> {
    try {
      const result = await db.update(passwordResetOtps)
        .set({ isUsed: true })
        .where(eq(passwordResetOtps.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error marking OTP as used:", error);
      return false;
    }
  }

  async deleteExpiredOtps(): Promise<void> {
    try {
      await db.delete(passwordResetOtps)
        .where(
          or(
            eq(passwordResetOtps.isUsed, true),
            sql`${passwordResetOtps.expiresAt} < NOW()`
          )
        );
    } catch (error) {
      console.error("Error deleting expired OTPs:", error);
    }
  }

  // VAT Settings
  async getVatSettings(userId: string): Promise<VatSettings | undefined> {
    try {
      const result = await db
        .select()
        .from(vatSettings)
        .where(eq(vatSettings.userId, userId))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Error getting VAT settings:", error);
      return undefined;
    }
  }

  async updateVatSettings(userId: string, settings: UpdateVatSettings): Promise<VatSettings> {
    try {
      // بررسی وجود تنظیمات قبلی
      const existing = await this.getVatSettings(userId);
      
      if (existing) {
        // بروزرسانی تنظیمات موجود
        const result = await db.update(vatSettings)
          .set({
            ...settings,
            updatedAt: new Date(),
          })
          .where(eq(vatSettings.userId, userId))
          .returning();
        
        return result[0];
      } else {
        // ایجاد تنظیمات جدید
        const result = await db.insert(vatSettings)
          .values({
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
          })
          .returning();
        
        return result[0];
      }
    } catch (error) {
      console.error("Error updating VAT settings:", error);
      throw error;
    }
  }

  // Login Logs
  async createLoginLog(log: InsertLoginLog): Promise<LoginLog> {
    try {
      const result = await db.insert(loginLogs)
        .values(log)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating login log:", error);
      throw error;
    }
  }

  async getLoginLogs(page: number = 1, limit: number = 50): Promise<{ logs: any[], total: number, totalPages: number }> {
    try {
      // دریافت تعداد کل
      const countResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(loginLogs);
      const total = countResult[0].count;
      const totalPages = Math.ceil(total / limit);
      
      // دریافت لاگ‌ها با صفحه‌بندی و join با جدول users برای دریافت نقش کاربر
      const logs = await db
        .select({
          id: loginLogs.id,
          userId: loginLogs.userId,
          username: loginLogs.username,
          ipAddress: loginLogs.ipAddress,
          userAgent: loginLogs.userAgent,
          loginAt: loginLogs.loginAt,
          role: users.role,
        })
        .from(loginLogs)
        .leftJoin(users, eq(loginLogs.userId, users.id))
        .orderBy(desc(loginLogs.loginAt))
        .limit(limit)
        .offset((page - 1) * limit);
      
      return { logs, total, totalPages };
    } catch (error) {
      console.error("Error getting login logs:", error);
      return { logs: [], total: 0, totalPages: 0 };
    }
  }

  async getLoginLogsByUser(userId: string): Promise<LoginLog[]> {
    try {
      return await db
        .select()
        .from(loginLogs)
        .where(eq(loginLogs.userId, userId))
        .orderBy(desc(loginLogs.loginAt));
    } catch (error) {
      console.error("Error getting login logs by user:", error);
      return [];
    }
  }

  // Guest Chat Session Methods
  async createGuestChatSession(sessionToken: string, guestName?: string, guestPhone?: string, guestIpAddress?: string): Promise<GuestChatSession> {
    try {
      const result = await db.insert(guestChatSessions)
        .values({
          sessionToken,
          guestName,
          guestPhone,
          guestIpAddress,
          isActive: true,
          unreadByAdmin: 0,
          unreadByGuest: 0,
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating guest chat session:", error);
      throw error;
    }
  }

  async getGuestChatSessionByToken(sessionToken: string): Promise<GuestChatSession | undefined> {
    try {
      const result = await db
        .select()
        .from(guestChatSessions)
        .where(eq(guestChatSessions.sessionToken, sessionToken))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error("Error getting guest chat session:", error);
      throw error;
    }
  }

  async getAllGuestChatSessions(): Promise<GuestChatSession[]> {
    try {
      return await db
        .select()
        .from(guestChatSessions)
        .where(sql`exists (
          select 1
          from ${guestChatMessages}
          where ${guestChatMessages.sessionId} = ${guestChatSessions.id}
            and ${guestChatMessages.sender} = 'guest'
        )`)
        .orderBy(desc(guestChatSessions.lastMessageAt));
    } catch (error) {
      console.error("Error getting all guest chat sessions:", error);
      return [];
    }
  }

  async getActiveGuestChatSessions(): Promise<GuestChatSession[]> {
    try {
      return await db
        .select()
        .from(guestChatSessions)
        .where(and(
          eq(guestChatSessions.isActive, true),
          sql`exists (
            select 1
            from ${guestChatMessages}
            where ${guestChatMessages.sessionId} = ${guestChatSessions.id}
              and ${guestChatMessages.sender} = 'guest'
          )`
        ))
        .orderBy(desc(guestChatSessions.lastMessageAt));
    } catch (error) {
      console.error("Error getting active guest chat sessions:", error);
      return [];
    }
  }

  async updateGuestChatSession(sessionId: string, updates: Partial<GuestChatSession>): Promise<GuestChatSession | undefined> {
    try {
      const result = await db
        .update(guestChatSessions)
        .set(updates)
        .where(eq(guestChatSessions.id, sessionId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating guest chat session:", error);
      throw error;
    }
  }

  // Guest Chat Message Methods
  async createGuestChatMessage(sessionId: string, message: string, sender: 'guest' | 'admin'): Promise<GuestChatMessage> {
    try {
      const result = await db.insert(guestChatMessages)
        .values({
          sessionId,
          message,
          sender,
          isRead: false,
        })
        .returning();
      
      // Update session's lastMessageAt and unread count
      if (sender === 'guest') {
        await db
          .update(guestChatSessions)
          .set({
            lastMessageAt: new Date(),
            unreadByAdmin: sql`${guestChatSessions.unreadByAdmin} + 1`,
          })
          .where(eq(guestChatSessions.id, sessionId));
      } else {
        await db
          .update(guestChatSessions)
          .set({
            lastMessageAt: new Date(),
            unreadByGuest: sql`${guestChatSessions.unreadByGuest} + 1`,
          })
          .where(eq(guestChatSessions.id, sessionId));
      }
      
      return result[0];
    } catch (error) {
      console.error("Error creating guest chat message:", error);
      throw error;
    }
  }

  async getGuestChatMessages(sessionId: string): Promise<GuestChatMessage[]> {
    try {
      return await db
        .select()
        .from(guestChatMessages)
        .where(eq(guestChatMessages.sessionId, sessionId))
        .orderBy(guestChatMessages.createdAt);
    } catch (error) {
      console.error("Error getting guest chat messages:", error);
      return [];
    }
  }

  async markGuestChatMessagesAsRead(sessionId: string, sender: 'guest' | 'admin'): Promise<void> {
    try {
      // Mark messages as read where sender is the opposite (admin reads guest messages, guest reads admin messages)
      const messageSender = sender === 'admin' ? 'guest' : 'admin';
      
      await db
        .update(guestChatMessages)
        .set({ isRead: true })
        .where(and(
          eq(guestChatMessages.sessionId, sessionId),
          eq(guestChatMessages.sender, messageSender),
          eq(guestChatMessages.isRead, false)
        ));
      
      // Reset unread count
      if (sender === 'admin') {
        await db
          .update(guestChatSessions)
          .set({ unreadByAdmin: 0 })
          .where(eq(guestChatSessions.id, sessionId));
      } else {
        await db
          .update(guestChatSessions)
          .set({ unreadByGuest: 0 })
          .where(eq(guestChatSessions.id, sessionId));
      }
    } catch (error) {
      console.error("Error marking guest chat messages as read:", error);
      throw error;
    }
  }

  async getTotalUnreadGuestChats(): Promise<number> {
    try {
      const result = await db
        .select({ total: sql<number>`cast(sum(${guestChatSessions.unreadByAdmin}) as integer)` })
        .from(guestChatSessions)
        .where(and(
          eq(guestChatSessions.isActive, true),
          sql`exists (
            select 1
            from ${guestChatMessages}
            where ${guestChatMessages.sessionId} = ${guestChatSessions.id}
              and ${guestChatMessages.sender} = 'guest'
          )`
        ));
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error("Error getting total unread guest chats:", error);
      return 0;
    }
  }

  async closeGuestChatSession(sessionId: string): Promise<void> {
    try {
      await db
        .update(guestChatSessions)
        .set({ isActive: false })
        .where(eq(guestChatSessions.id, sessionId));
    } catch (error) {
      console.error("Error closing guest chat session:", error);
      throw error;
    }
  }

  // Project Order Request methods
  async createProjectOrderRequest(data: InsertProjectOrderRequest): Promise<ProjectOrderRequest> {
    try {
      const result = await db.insert(projectOrderRequests)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating project order request:", error);
      throw error;
    }
  }

  async getProjectOrderRequests(): Promise<ProjectOrderRequest[]> {
    try {
      return await db
        .select()
        .from(projectOrderRequests)
        .orderBy(desc(projectOrderRequests.createdAt));
    } catch (error) {
      console.error("Error getting project order requests:", error);
      return [];
    }
  }

  async getProjectOrderRequestById(id: string): Promise<ProjectOrderRequest | undefined> {
    try {
      const result = await db
        .select()
        .from(projectOrderRequests)
        .where(eq(projectOrderRequests.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting project order request:", error);
      return undefined;
    }
  }

  async updateProjectOrderRequestStatus(id: string, status: string): Promise<ProjectOrderRequest | undefined> {
    try {
      const result = await db
        .update(projectOrderRequests)
        .set({ status })
        .where(eq(projectOrderRequests.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating project order request status:", error);
      throw error;
    }
  }

  async deleteProjectOrderRequest(id: string): Promise<void> {
    try {
      await db
        .delete(projectOrderRequests)
        .where(eq(projectOrderRequests.id, id));
    } catch (error) {
      console.error("Error deleting project order request:", error);
      throw error;
    }
  }

  // Plugin methods
  async getPlugin(id: string): Promise<Plugin | undefined> {
    try {
      const result = await db.select().from(plugins).where(eq(plugins.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting plugin:", error);
      return undefined;
    }
  }

  async getPluginByName(name: string): Promise<Plugin | undefined> {
    try {
      const result = await db.select().from(plugins).where(eq(plugins.name, name)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting plugin by name:", error);
      return undefined;
    }
  }

  async getAllPlugins(): Promise<Plugin[]> {
    try {
      let list = await db.select().from(plugins).orderBy(plugins.createdAt);
      if (!list || list.length === 0) {
        await this.initializeDefaultPlugins();
        list = await db.select().from(plugins).orderBy(plugins.createdAt);
      }
      return list || [];
    } catch (error) {
      console.error("Error getting all plugins:", error);
      return [];
    }
  }

  async createPlugin(plugin: InsertPlugin): Promise<Plugin> {
    try {
      const result = await db.insert(plugins).values(plugin).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating plugin:", error);
      throw error;
    }
  }

  async updatePlugin(id: string, plugin: Partial<Plugin>): Promise<Plugin | undefined> {
    try {
      const result = await db
        .update(plugins)
        .set({ ...plugin, updatedAt: new Date() })
        .where(eq(plugins.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating plugin:", error);
      throw error;
    }
  }

  async deletePlugin(id: string): Promise<boolean> {
    try {
      const plugin = await this.getPlugin(id);
      if (plugin?.isBuiltIn) {
        throw new Error("Cannot delete built-in plugins");
      }
      await db.delete(plugins).where(eq(plugins.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting plugin:", error);
      return false;
    }
  }

  async togglePluginStatus(id: string): Promise<Plugin | undefined> {
    try {
      const plugin = await this.getPlugin(id);
      if (!plugin) return undefined;
      
      const result = await db
        .update(plugins)
        .set({ isEnabled: !plugin.isEnabled, updatedAt: new Date() })
        .where(eq(plugins.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error toggling plugin status:", error);
      throw error;
    }
  }

  async initializeDefaultPlugins(): Promise<void> {
    try {
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
          description: "مدیریت پلن‌های اشتراک و کاربران",
          icon: "Crown",
        },
        {
          name: "internal-chats",
          displayName: "چت داخلی",
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

      // حذف پلاگین‌های منسوخ از دیتابیس در صورت وجود
      await db.delete(plugins).where(eq(plugins.name, "ai"));
      await db.delete(plugins).where(eq(plugins.name, "shipping"));
      await db.delete(plugins).where(eq(plugins.name, "email"));
      await db.delete(plugins).where(eq(plugins.name, "inventory"));
      await db.delete(plugins).where(eq(plugins.name, "anbardari"));
      await db.delete(plugins).where(eq(plugins.name, "business"));
      await db.delete(plugins).where(eq(plugins.name, "commercial"));
      await db.delete(plugins).where(eq(plugins.name, "tejari"));
      await db.delete(plugins).where(eq(plugins.name, "posts"));
      await db.delete(plugins).where(eq(plugins.name, "blog"));
      await db.delete(plugins).where(eq(plugins.name, "articles"));
      await db.delete(plugins).where(eq(plugins.name, "nevishteh"));

      for (const pluginData of pluginsToInitialize) {
        const existing = await this.getPluginByName(pluginData.name);
        if (!existing) {
          await db.insert(plugins).values({
            ...pluginData,
            isEnabled: true,
            isBuiltIn: true,
          });
          console.log(`✅ Default ${pluginData.displayName} plugin initialized`);
        }
      }
    } catch (error) {
      console.error("Error initializing default plugins:", error);
    }
  }

  // SEO & Google Indexing Methods
  async getSeoSettings(): Promise<SeoSettings> {
    try {
      const [existing] = await db.select().from(seoSettings).limit(1);
      if (existing) {
        return existing;
      }
      // Create initial default SEO record
      const [created] = await db.insert(seoSettings).values({
        siteTitle: "سایت ساز رخش | طراحی و ساخت سایت حرفه‌ای",
        siteDescription: "پلتفرم جامع راه‌اندازی، مدیریت و رشد کسب‌وکارهای آنلاین و وب‌سایت‌های مدرن",
        siteKeywords: "طراحی سایت, سایت ساز, فروشگاه اینترنتی, سئو, وردپرس, رخش",
        enableAutoIndexPosts: true,
        enableSitemap: true,
        enableRobotsTxt: true,
        robotsTxtContent: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: /sitemap.xml",
        schemaType: "Organization",
        schemaOrganizationName: "سایت ساز رخش",
      }).returning();
      return created;
    } catch (error) {
      console.error("Error fetching SEO settings from DB:", error);
      return {
        id: "default-seo-id",
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
    }
  }

  async updateSeoSettings(settings: UpdateSeoSettings): Promise<SeoSettings> {
    try {
      const current = await this.getSeoSettings();
      const [updated] = await db.update(seoSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(seoSettings.id, current.id))
        .returning();
      return updated || current;
    } catch (error) {
      console.error("Error updating SEO settings:", error);
      return (await this.getSeoSettings());
    }
  }

  async getSeoIndexingLogs(limit = 50): Promise<SeoIndexingLog[]> {
    try {
      return await db.select().from(seoIndexingLogs).orderBy(desc(seoIndexingLogs.createdAt)).limit(limit);
    } catch (error) {
      console.error("Error fetching SEO indexing logs:", error);
      return [];
    }
  }

  async createSeoIndexingLog(log: InsertSeoIndexingLog): Promise<SeoIndexingLog> {
    try {
      const [created] = await db.insert(seoIndexingLogs).values(log).returning();
      return created;
    } catch (error) {
      console.error("Error inserting SEO indexing log:", error);
      return {
        id: "mock-log-" + Date.now(),
        ...log,
        createdAt: new Date(),
      } as SeoIndexingLog;
    }
  }

  // SSL Certificates
  async getSslCertificates(userId?: string): Promise<SslCertificate[]> {
    try {
      if (userId) {
        return await db.select().from(sslCertificates).where(or(eq(sslCertificates.userId, userId), sql`${sslCertificates.userId} IS NULL`)).orderBy(desc(sslCertificates.createdAt));
      }
      return await db.select().from(sslCertificates).orderBy(desc(sslCertificates.createdAt));
    } catch (error) {
      console.error("Error getting SSL certificates:", error);
      return [];
    }
  }

  async getSslCertificateById(id: string): Promise<SslCertificate | undefined> {
    try {
      const [cert] = await db.select().from(sslCertificates).where(eq(sslCertificates.id, id)).limit(1);
      return cert;
    } catch (error) {
      console.error("Error getting SSL certificate by id:", error);
      return undefined;
    }
  }

  async getSslCertificateByDomain(domain: string): Promise<SslCertificate | undefined> {
    try {
      const normalized = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const [cert] = await db.select().from(sslCertificates).where(eq(sslCertificates.domain, normalized)).limit(1);
      return cert;
    } catch (error) {
      console.error("Error getting SSL certificate by domain:", error);
      return undefined;
    }
  }

  async createSslCertificate(cert: InsertSslCertificate): Promise<SslCertificate> {
    try {
      const [created] = await db.insert(sslCertificates).values(cert).returning();
      return created;
    } catch (error) {
      console.error("Error creating SSL certificate:", error);
      return {
        id: "ssl-" + Date.now(),
        ...cert,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SslCertificate;
    }
  }

  async updateSslCertificate(id: string, cert: UpdateSslCertificate): Promise<SslCertificate | undefined> {
    try {
      const [updated] = await db.update(sslCertificates)
        .set({
          ...cert,
          updatedAt: new Date(),
        })
        .where(eq(sslCertificates.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating SSL certificate:", error);
      return undefined;
    }
  }

  async deleteSslCertificate(id: string): Promise<boolean> {
    try {
      await db.delete(sslCertificates).where(eq(sslCertificates.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting SSL certificate:", error);
      return false;
    }
  }

  async getSslLogs(certificateId?: string, limit = 50): Promise<SslLog[]> {
    try {
      if (certificateId) {
        return await db.select().from(sslLogs).where(eq(sslLogs.certificateId, certificateId)).orderBy(desc(sslLogs.createdAt)).limit(limit);
      }
      return await db.select().from(sslLogs).orderBy(desc(sslLogs.createdAt)).limit(limit);
    } catch (error) {
      console.error("Error getting SSL logs:", error);
      return [];
    }
  }

  async createSslLog(log: InsertSslLog): Promise<SslLog> {
    try {
      const [created] = await db.insert(sslLogs).values(log).returning();
      return created;
    } catch (error) {
      console.error("Error creating SSL log:", error);
      return {
        id: "ssl-log-" + Date.now(),
        ...log,
        createdAt: new Date(),
      } as SslLog;
    }
  }

  // Blupal Gateway & Transactions
  async getBlupalGateway(userId: string): Promise<BlupalGateway | undefined> {
    try {
      const [result] = await db.select().from(blupalGateways).where(eq(blupalGateways.userId, userId)).limit(1);
      return result;
    } catch (error) {
      console.error("Error getting Blupal gateway:", error);
      return undefined;
    }
  }

  async getAllBlupalGateways(): Promise<{ gateway: BlupalGateway; user: User }[]> {
    try {
      const allGateways = await db.select().from(blupalGateways);
      const allUsers = (await db.select().from(users)) as User[];
      const userMap = new Map<string, User>();
      for (const u of allUsers) {
        userMap.set(u.id, u);
      }

      const list: { gateway: BlupalGateway; user: User }[] = [];
      const seenUserIds = new Set<string>();

      for (const gw of allGateways) {
        const u = userMap.get(gw.userId);
        if (u) {
          list.push({ gateway: gw, user: u });
          seenUserIds.add(u.id);
        }
      }

      // Include any level 1 user who hasn't configured a gateway row yet
      for (const u of allUsers) {
        if (u.role === "user_level_1" && !seenUserIds.has(u.id)) {
          const gw = await this.getBlupalGateway(u.id);
          if (gw) {
            list.push({ gateway: gw, user: u });
            seenUserIds.add(u.id);
          }
        }
      }

      return list;
    } catch (error) {
      console.error("Error getting all Blupal gateways:", error);
      return [];
    }
  }

  async getBlupalGatewayBySlugOrUsername(slugOrUsername: string): Promise<{ gateway: BlupalGateway; user: User } | undefined> {
    try {
      const lower = slugOrUsername.toLowerCase().trim();
      // 1. Check user by username or id
      const [foundUser] = await db.select().from(users).where(or(ilike(users.username, lower), eq(users.id, slugOrUsername))).limit(1);
      if (foundUser) {
        let gw = await this.getBlupalGateway(foundUser.id);
        if (!gw) {
          gw = await this.saveBlupalGateway(foundUser.id, {
            title: `درگاه پرداخت ${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || "درگاه پرداخت کارت به کارت",
            slug: foundUser.username || undefined,
            cardHolderName: `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || undefined,
            supportPhone: foundUser.phone || undefined,
          });
        }
        return { gateway: gw, user: foundUser };
      }

      // 2. Check by slug
      const [foundGw] = await db.select().from(blupalGateways).where(ilike(blupalGateways.slug, lower)).limit(1);
      if (foundGw) {
        const [u] = await db.select().from(users).where(eq(users.id, foundGw.userId)).limit(1);
        if (u) return { gateway: foundGw, user: u };
      }

      return undefined;
    } catch (error) {
      console.error("Error getting Blupal gateway by slug:", error);
      return undefined;
    }
  }

  async getBlupalGatewayByWpApiKey(wpApiKey: string): Promise<BlupalGateway | undefined> {
    try {
      const cleanKey = wpApiKey?.trim();
      if (!cleanKey) return undefined;
      const [result] = await db.select()
        .from(blupalGateways)
        .where(eq(blupalGateways.wpApiKey, cleanKey))
        .limit(1);
      return result;
    } catch (error) {
      console.error("Error getting Blupal gateway by wpApiKey:", error);
      return undefined;
    }
  }

  async generateWpApiKey(userId: string): Promise<string> {
    const crypto = await import("crypto");
    const newKey = "Rakhsh_Pay_" + crypto.randomBytes(16).toString("hex");
    await this.saveBlupalGateway(userId, { wpApiKey: newKey });
    return newKey;
  }

  async saveBlupalGateway(userId: string, data: Partial<InsertBlupalGateway>): Promise<BlupalGateway> {
    try {
      const existing = await this.getBlupalGateway(userId);
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
        const [updated] = await db.update(blupalGateways)
          .set({
            ...data,
            isActive: computedActive,
            updatedAt: new Date(),
          })
          .where(eq(blupalGateways.id, existing.id))
          .returning();
        return updated || { ...existing, ...data, isActive: computedActive, updatedAt: new Date() };
      } else {
        const [created] = await db.insert(blupalGateways)
          .values({
            userId,
            ...data,
            isActive: hasApiKey,
          })
          .returning();
        return created;
      }
    } catch (error) {
      console.error("Error saving Blupal gateway:", error);
      return {
        id: "gw-" + Date.now(),
        userId,
        apiKey: data.apiKey ?? null,
        isActive: Boolean(data.apiKey?.trim()),
        title: data.title ?? "درگاه پرداخت کارت به کارت",
        description: data.description ?? "جهت پرداخت، اطلاعات خود را وارد کرده و پس از واریز کارت به کارت، وضعیت به صورت آنی تایید می‌گردد.",
        defaultAmount: data.defaultAmount ?? null,
        minAmount: data.minAmount ?? "10000",
        maxAmount: data.maxAmount ?? "50000000",
        cardNumber: data.cardNumber ?? null,
        cardHolderName: data.cardHolderName ?? null,
        bankName: data.bankName ?? null,
        supportPhone: data.supportPhone ?? null,
        slug: data.slug ?? null,
        webhookSecret: data.webhookSecret ?? null,
        successMessage: data.successMessage ?? "پرداخت شما با موفقیت تایید شد. از اعتماد شما متشکریم.",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BlupalGateway;
    }
  }

  async expireOldBlupalTransactions(userId?: string): Promise<void> {
    try {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      const conditions = [
        or(
          eq(blupalTransactions.status, "pending"),
          eq(blupalTransactions.status, "verifying")
        ),
        lt(blupalTransactions.createdAt, twentyMinutesAgo)
      ];
      if (userId) {
        conditions.push(eq(blupalTransactions.userId, userId));
      }
      await db.update(blupalTransactions)
        .set({ status: "failed" })
        .where(and(...conditions));
    } catch (error) {
      console.error("Error expiring old Blupal transactions:", error);
    }
  }

  async getBlupalTransactions(userId: string, limit = 50, status?: string): Promise<BlupalTransaction[]> {
    try {
      await this.expireOldBlupalTransactions(userId);
      const conditions = [eq(blupalTransactions.userId, userId)];
      if (status) {
        conditions.push(eq(blupalTransactions.status, status));
      }
      return await db.select()
        .from(blupalTransactions)
        .where(and(...conditions))
        .orderBy(desc(blupalTransactions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error getting Blupal transactions:", error);
      return [];
    }
  }

  async getBlupalTransactionByInvoiceId(invoiceId: string): Promise<BlupalTransaction | undefined> {
    try {
      const invStr = String(invoiceId).trim();
      const [result] = await db.select()
        .from(blupalTransactions)
        .where(
          or(
            eq(blupalTransactions.invoiceId, invStr),
            eq(blupalTransactions.blupalInvoiceId, invStr)
          )
        )
        .limit(1);
      return result;
    } catch (error) {
      console.error("Error getting Blupal transaction by invoiceId:", error);
      return undefined;
    }
  }

  async createBlupalTransaction(tx: InsertBlupalTransaction): Promise<BlupalTransaction> {
    try {
      const [created] = await db.insert(blupalTransactions).values(tx).returning();
      return created;
    } catch (error) {
      console.error("Error creating Blupal transaction:", error);
      return {
        id: "tx-" + Date.now(),
        ...tx,
        blupalInvoiceId: tx.blupalInvoiceId ?? null,
        paymentLink: tx.paymentLink ?? null,
        finalAmount: tx.finalAmount ?? null,
        payerCard: tx.payerCard ?? null,
        payerBankName: tx.payerBankName ?? null,
        mode: tx.mode ?? "live",
        status: tx.status ?? "pending",
        destCardNumber: tx.destCardNumber ?? null,
        destCardHolder: tx.destCardHolder ?? null,
        trackingCode: tx.trackingCode ?? null,
        cardLastFour: tx.cardLastFour ?? null,
        description: tx.description ?? null,
        paidAt: tx.paidAt ?? null,
        expiresAt: tx.expiresAt ?? null,
        createdAt: new Date(),
      } as BlupalTransaction;
    }
  }

  async updateBlupalTransaction(invoiceId: string, updates: Partial<BlupalTransaction>): Promise<BlupalTransaction | undefined> {
    try {
      const invStr = String(invoiceId).trim();
      // First try matching invoiceId
      let [updated] = await db.update(blupalTransactions)
        .set(updates)
        .where(eq(blupalTransactions.invoiceId, invStr))
        .returning();
      
      // If not found, try matching blupalInvoiceId
      if (!updated) {
        [updated] = await db.update(blupalTransactions)
          .set(updates)
          .where(eq(blupalTransactions.blupalInvoiceId, invStr))
          .returning();
      }
      return updated;
    } catch (error) {
      console.error("Error updating Blupal transaction:", error);
      return undefined;
    }
  }

  async getBlupalStats(userId: string): Promise<{ totalAmount: number; todayAmount: number; successCount: number; pendingCount: number; failedCount: number }> {
    try {
      await this.expireOldBlupalTransactions(userId);
      const allTx = await this.getBlupalTransactions(userId, 1000);
      let totalAmount = 0;
      let todayAmount = 0;
      let successCount = 0;
      let pendingCount = 0;
      let failedCount = 0;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      for (const tx of allTx) {
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
    } catch (error) {
      console.error("Error getting Blupal stats:", error);
      return { totalAmount: 0, todayAmount: 0, successCount: 0, pendingCount: 0, failedCount: 0 };
    }
  }

  // Announcements Implementation
  async getAllAnnouncements(): Promise<Announcement[]> {
    try {
      return await db.select()
        .from(announcements)
        .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
    } catch (error) {
      console.error("Error fetching all announcements:", error);
      return [];
    }
  }

  async getAnnouncementsForUser(userId: string, role: string): Promise<(Announcement & { isRead: boolean })[]> {
    try {
      let conditions;
      if (role === "admin") {
        conditions = eq(announcements.isPublished, true);
      } else {
        conditions = and(
          eq(announcements.isPublished, true),
          or(
            eq(announcements.targetAudience, "all"),
            eq(announcements.targetAudience, role)
          )
        );
      }

      const all = await db.select()
        .from(announcements)
        .where(conditions)
        .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));

      const reads = await db.select({ announcementId: announcementReads.announcementId })
        .from(announcementReads)
        .where(eq(announcementReads.userId, userId));

      const readIds = new Set(reads.map((r: { announcementId: string }) => r.announcementId));

      return all.map((a: Announcement) => ({
        ...a,
        isRead: readIds.has(a.id)
      }));
    } catch (error) {
      console.error("Error fetching announcements for user:", error);
      return [];
    }
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    try {
      const [announcement] = await db.select()
        .from(announcements)
        .where(eq(announcements.id, id))
        .limit(1);
      return announcement;
    } catch (error) {
      console.error("Error fetching announcement:", error);
      return undefined;
    }
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    try {
      const [created] = await db.insert(announcements)
        .values({
          ...announcement,
          targetAudience: announcement.targetAudience || "user_level_1",
          priority: announcement.priority || "normal",
          isPinned: announcement.isPinned ?? false,
          isPublished: announcement.isPublished ?? true,
        })
        .returning();
      return created;
    } catch (error) {
      console.error("Error creating announcement:", error);
      throw error;
    }
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    try {
      const [updated] = await db.update(announcements)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(announcements.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating announcement:", error);
      return undefined;
    }
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      await db.delete(announcementReads)
        .where(eq(announcementReads.announcementId, id));
      const result = await db.delete(announcements)
        .where(eq(announcements.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting announcement:", error);
      return false;
    }
  }

  async markAnnouncementAsRead(announcementId: string, userId: string): Promise<boolean> {
    try {
      await db.insert(announcementReads)
        .values({
          announcementId,
          userId,
        })
        .onConflictDoNothing();
      return true;
    } catch (error) {
      console.error("Error marking announcement as read:", error);
      return false;
    }
  }

  async getUnreadAnnouncementsCount(userId: string, role: string): Promise<number> {
    try {
      const items = await this.getAnnouncementsForUser(userId, role);
      return items.filter((a: any) => !a.isRead).length;
    } catch (error) {
      console.error("Error counting unread announcements:", error);
      return 0;
    }
  }
}