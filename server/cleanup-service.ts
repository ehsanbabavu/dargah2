import fs from "fs";
import path from "path";

class CleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // هر 1 ساعت
  private readonly FILE_MAX_AGE = 60 * 60 * 1000; // 1 ساعت

  start() {
    console.log("🧹 سرویس پاکسازی فایل‌های موقت شروع شد");
    
    // اجرای اولیه
    this.cleanup();
    
    // اجرای دوره‌ای
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🛑 سرویس پاکسازی متوقف شد");
    }
  }

  private cleanDir(targetDir: string, now: number): number {
    if (!fs.existsSync(targetDir)) {
      return 0;
    }

    let deletedCount = 0;
    try {
      const entries = fs.readdirSync(targetDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(targetDir, entry.name);

        try {
          if (entry.isDirectory()) {
            // Recursively clean files inside subdirectories (like landing-temp, notfound-temp, etc.)
            deletedCount += this.cleanDir(fullPath, now);

            // If it's a dynamic temporary directory (not the permanent root temp holders) and it's empty, we can clean it up
            const isRootTempDir = ["landing-temp", "notfound-temp"].includes(entry.name) && path.dirname(fullPath) === path.join(process.cwd(), "uploads");
            if (!isRootTempDir) {
              const remaining = fs.readdirSync(fullPath);
              if (remaining.length === 0) {
                const stats = fs.statSync(fullPath);
                if (now - stats.mtimeMs > this.FILE_MAX_AGE) {
                  fs.rmSync(fullPath, { recursive: true, force: true });
                }
              }
            }
          } else {
            const stats = fs.statSync(fullPath);
            const fileAge = now - stats.mtimeMs;

            if (fileAge > this.FILE_MAX_AGE) {
              fs.unlinkSync(fullPath);
              deletedCount++;
              console.log(`🗑️  فایل موقت قدیمی حذف شد: ${entry.name}`);
            }
          }
        } catch (error) {
          console.error(`خطا در بررسی فایل یا پوشه ${entry.name}:`, error);
        }
      }
    } catch (error) {
      console.error(`خطا در خواندن مسیر ${targetDir}:`, error);
    }

    return deletedCount;
  }

  private cleanup() {
    const uploadDirs = [
      path.join(process.cwd(), "uploads"),
      path.join(process.cwd(), "UploadsPicClienet")
    ];
    
    const now = Date.now();

    uploadDirs.forEach((uploadsDir) => {
      if (!fs.existsSync(uploadsDir)) {
        return;
      }

      try {
        const deletedCount = this.cleanDir(uploadsDir, now);
        if (deletedCount > 0) {
          console.log(`✅ ${deletedCount} فایل قدیمی از ${path.basename(uploadsDir)} پاکسازی شد`);
        }
      } catch (error) {
        console.error(`خطا در پاکسازی مسیر ${path.basename(uploadsDir)}:`, error);
      }
    });
  }
}

export const cleanupService = new CleanupService();
