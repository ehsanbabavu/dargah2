# سامانه رخشان (Dargah)

سامانه مدیریت فاکتور، درگاه پرداخت و خدمات کاربردی نسخه **Full-Stack (Node.js Express + React SPA + PostgreSQL)**.

---

## 🚀 راهنمای نصب سریع از مخزن گیت‌هاب (Quick Setup from GitHub)

برای راه‌اندازی و نصب اتوماتیک روی سرور مجازی (VPS):

```bash
# ۱. کلون کردن مخزن از گیت‌هاب
git clone https://github.com/ehsanbabavu/Dargah.git

# ۲. ورود به پوشه پروژه
cd Dargah

# ۳. اجرای اسکریپت نصب خودکار
chmod +x install.sh
sudo ./install.sh
```

---

### 📋 مراحل نصب خودکار شامل:
1. ایجاد حافظه Swap (در صورت نیاز سرور)
2. نصب و کانفیگ Docker و Docker Compose
3. ساخت ایمیج‌های بهینه و اجرای کانتینرها
4. اتصال و ساخت جدول‌های دیتابیس PostgreSQL
5. تنظیم Nginx و دریافت SSL رایگان HTTPS برای دامنه شما

برای جزئیات بیشتر فایل [DEPLOYMENT.md](DEPLOYMENT.md) را مطالعه کنید.
