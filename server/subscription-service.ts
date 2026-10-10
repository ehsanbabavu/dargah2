import { storage } from "./storage";

class SubscriptionSyncService {
  private intervalId: NodeJS.Timeout | null = null;
  // بررسی دوره‌ای هر ۳۰ دقیقه برای محاسبه دقیق روزهای باقیمانده و انقضای اشتراک‌ها
  private readonly SYNC_INTERVAL = 30 * 60 * 1000;

  start() {
    console.log("⏱️ سرویس همگام‌سازی و شمارش معکوس روزهای اشتراک شروع شد");
    
    // اجرای اولیه همگام‌سازی
    this.syncAllSubscriptions().catch((err) => {
      console.error("خطا در همگام‌سازی اولیه اشتراک‌ها:", err);
    });
    
    // اجرای دوره‌ای
    this.intervalId = setInterval(() => {
      this.syncAllSubscriptions().catch((err) => {
        console.error("خطا در همگام‌سازی دوره‌ای اشتراک‌ها:", err);
      });
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
   * همگام‌سازی وضعیت اشتراک‌ها با بررسی تاریخ پایان (endDate)
   * و به‌روزرسانی تعداد روزهای باقیمانده و وضعیت فعال/منقضی در پایگاه داده
   */
  async syncAllSubscriptions(): Promise<{
    totalChecked: number;
    updatedCount: number;
    activeCount: number;
    expiredCount: number;
  }> {
    try {
      const allSubs = await storage.getAllUserSubscriptions();
      const now = Date.now();
      let updatedCount = 0;
      let activeCount = 0;
      let expiredCount = 0;

      for (const sub of allSubs) {
        let endDate = sub.endDate ? new Date(sub.endDate) : null;
        let calculatedDays = 0;

        if (!endDate || isNaN(endDate.getTime())) {
          // اگر تاریخ انقضا ثبت نشده بود، بر اساس روزهای باقیمانده فعلی تنظیم و ذخیره می‌شود
          if (typeof sub.remainingDays === "number" && sub.remainingDays > 0) {
            endDate = new Date(now + sub.remainingDays * 24 * 60 * 60 * 1000);
            calculatedDays = sub.remainingDays;
          } else {
            endDate = new Date(now);
            calculatedDays = 0;
          }
        } else {
          const diffMs = endDate.getTime() - now;
          calculatedDays = diffMs > 0 ? Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000))) : 0;
        }

        const targetStatus = calculatedDays > 0
          ? (sub.status === "suspended" ? "suspended" : "active")
          : "expired";

        // بررسی اینکه آیا تغییری در داده‌ها ایجاد شده است
        const needsUpdate =
          sub.remainingDays !== calculatedDays ||
          sub.status !== targetStatus ||
          !sub.endDate;

        if (needsUpdate) {
          await storage.updateUserSubscription(sub.id, {
            remainingDays: calculatedDays,
            status: targetStatus,
            endDate,
          });
          updatedCount++;
        }

        if (targetStatus === "active") {
          activeCount++;
        } else {
          expiredCount++;
        }
      }

      console.log(`📊 همگام‌سازی وضعیت اشتراک‌ها انجام شد: ${activeCount} فعال، ${expiredCount} منقضی شده (${updatedCount} اشتراک در دیتابیس بروزرسانی شد)`);
      return {
        totalChecked: allSubs.length,
        updatedCount,
        activeCount,
        expiredCount,
      };
    } catch (error) {
      console.error("خطا در همگام‌سازی دوره‌ای اشتراک‌ها:", error);
      throw error;
    }
  }

  /**
   * کسر دستی یا دوره‌ای ۱ روز از کلیه اشتراک‌های فعال
   */
  async decrementDaily(): Promise<{
    message: string;
    updatedCount: number;
    updatedSubscriptions: any[];
  }> {
    try {
      const activeSubscriptions = await storage.getActiveUserSubscriptions();
      const updatedSubscriptions = [];

      for (const subscription of activeSubscriptions) {
        if (subscription.remainingDays > 0) {
          const newRemainingDays = subscription.remainingDays - 1;
          const updated = await storage.updateRemainingDays(subscription.id, newRemainingDays);
          if (updated) {
            updatedSubscriptions.push(updated);
          }
        }
      }

      console.log(`📉 کسر روزانه اشتراک‌ها انجام شد: ${updatedSubscriptions.length} اشتراک بروزرسانی شد`);
      return {
        message: `${updatedSubscriptions.length} اشتراک بروزرسانی شد`,
        updatedCount: updatedSubscriptions.length,
        updatedSubscriptions,
      };
    } catch (error) {
      console.error("خطا در کاهش روزانه اشتراک‌ها:", error);
      throw error;
    }
  }
}

export const subscriptionSyncService = new SubscriptionSyncService();
