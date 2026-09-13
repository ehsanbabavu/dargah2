# 🚀 راهنمای نصب اتوماتیک و سریع سامانه رخشان (Dargah)

برای نصب خودکار و کامل سامانه روی سرور مجازی (VPS لینوکس / Ubuntu)، می‌توانید یکی از روش‌های زیر را استفاده کنید:

---

## ⚡ روش ۱: نصب تک‌خطی اتوماتیک (One-Line Auto Install)

کافی است دستور زیر را در ترمینال سرور خود کپی و اجرا کنید تا پروژه خودکار از گیت‌هاب دریافت شده و تمامی مراحل نصب انجام گردد:

```bash
git clone https://github.com/ehsanbabavu/dargah2.git && cd dargah2 && chmod +x install.sh && sudo ./install.sh
```

---

## 📝 روش ۲: نصب مرحله‌به‌مرحله

### ۱. دریافت پروژه از گیت‌هاب
```bash
git clone https://github.com/ehsanbabavu/dargah2.git
cd dargah2
```

### ۲. اجرا و نصب خودکار
```bash
chmod +x install.sh
sudo ./install.sh
```

---

### ⚙️ اسکریپت `install.sh` تمام اقدامات زیر را خودکار انجام می‌دهد:
- 🔄 ایجاد حافظه کمکی Swap (در صورت کمبود رم سرور)
- 🐳 نصب خودکار Docker و Docker Compose
- 📦 بیلد بهینه ایمیج‌های پروژه بدون کش
- 🗄️ راه‌اندازی و اتصال خودکار دیتابیس PostgreSQL و ساخت جدول‌ها
- 🌐 پیکربندی Nginx و دریافت گواهینامه رایگان SSL (HTTPS) برای دامنه
