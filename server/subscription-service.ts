import { storage } from "./storage";

class SubscriptionSyncService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 60 * 60 * 1000; // هر 1 ساعت بررسی دوره‌ای

  start() {
    console.log("⏱️ سرویس همگام‌سازی و شمارش معکوس روزهای اشتراک شروع شد");
    
    // اجرای اولیه همگام‌سازی
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

  async syncAllSubscriptions() {
    try {
      const allSubs = await storage.getAllUserSubscriptions();
      let activeCount = 0;
      let expiredCount = 0;

      for (const sub of allSubs) {
        if (sub.status === "active" && sub.remainingDays > 0) {
          activeCount++;
        } else {
          expiredCount++;
        }
      }

      console.log(`📊 همگام‌سازی وضعیت اشتراک‌ها انجام شد: ${activeCount} فعال، ${expiredCount} منقضی شده`);
    } catch (error) {
      console.error("خطا در همگام‌سازی دوره‌ای اشتراک‌ها:", error);
    }
  }
}

export const subscriptionSyncService = new SubscriptionSyncService();
