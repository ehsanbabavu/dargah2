import { storage } from "./storage";

class SubscriptionSyncService {
  private intervalId: NodeJS.Timeout | null = null;
  // بررسی دوره‌ای هر ۱۵ دقیقه برای کسر روزهای منقضی شده با گذشت زمان واقعی
  private readonly SYNC_INTERVAL = 15 * 60 * 1000;

  start() {
    console.log("⏱️ سرویس هوشمند همگام‌سازی و شمارش معکوس روزهای اعتبار اشتراک فعال شد");
    
    // اجرای اولیه همگام‌سازی هنگام بالا آمدن سرور
    this.syncAllSubscriptions();
    
    // اجرای دوره‌ای
    this.intervalId = setInterval(() => {
      this.syncAllSubscriptions();
    }, this.SYNC_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🛑 سرویس همگام‌سازی اشتراک متوقف شد");
    }
  }

  /**
   * بررسی و کسر اعتبار زمانی تمام کاربران سیستم با گذشت زمان واقعی
   */
  async syncAllSubscriptions() {
    try {
      const allSubs = await storage.getAllUserSubscriptions();
      let activeCount = 0;
      let expiredCount = 0;
      let updatedCount = 0;
      const now = Date.now();

      for (const sub of allSubs) {
        const startDate = sub.startDate ? new Date(sub.startDate) : (sub.createdAt ? new Date(sub.createdAt) : new Date());
        let endDate = sub.endDate ? new Date(sub.endDate) : null;

        if (!endDate || isNaN(endDate.getTime())) {
          // در صورت نبود تاریخ پایان، محاسبه تاریخ پایان بر اساس تاریخ شروع و روزهای اعتبار اولیه
          endDate = new Date(startDate.getTime() + (sub.remainingDays || 0) * 24 * 60 * 60 * 1000);
        }

        const diffMs = endDate.getTime() - now;
        const newRemainingDays = diffMs > 0 ? Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000))) : 0;
        const newStatus = newRemainingDays > 0 
          ? (sub.status === 'suspended' ? 'suspended' : 'active') 
          : 'expired';

        // اگر تعداد روزهای باقیمانده یا وضعیت اشتراک تغییر کرده، در دیتابیس ثبت شود
        if (sub.remainingDays !== newRemainingDays || sub.status !== newStatus || sub.endDate?.toString() !== endDate.toString()) {
          await storage.updateUserSubscription(sub.id, {
            remainingDays: newRemainingDays,
            status: newStatus,
            endDate,
          });
          updatedCount++;
        }

        if (newStatus === "active" && newRemainingDays > 0) {
          activeCount++;
        } else {
          expiredCount++;
        }
      }

      console.log(`📊 همگام‌سازی اعتبار زمانی اشتراک‌ها انجام شد: ${activeCount} فعال، ${expiredCount} منقضی شده (${updatedCount} مورد بروزرسانی شد)`);
    } catch (error) {
      console.error("خطا در همگام‌سازی دوره‌ای اشتراک‌ها:", error);
    }
  }

  /**
   * همگام‌سازی سریع اعتبار زمانی یک کاربر خاص
   */
  async syncUserSubscription(userId: string) {
    try {
      const sub = await storage.getUserSubscription(userId);
      return sub;
    } catch (error) {
      console.error(`خطا در همگام‌سازی اشتراک کاربر ${userId}:`, error);
      return undefined;
    }
  }
}

export const subscriptionSyncService = new SubscriptionSyncService();

