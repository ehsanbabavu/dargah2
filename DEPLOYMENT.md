# راهنمای جامع استقرار و انتقال به سرور واقعی (Production Deployment Guide)

## 🚀 نصب سریع مستقیم از گیت‌هاب (Quick Installation from GitHub)

برای نصب سریع سامانه روی سرور مجازی (VPS لینوکس - اوبونتو)، دستورات زیر را در ترمینال سرور اجرا کنید:

```bash
# ۱. دریافت کد پروژه از مخزن گیت‌هاب
git clone https://github.com/ehsanbabavu/dargah2.git
cd dargah2

# ۲. اعطای دسترسی و اجرای اسکریپت نصب اتوماتیک
chmod +x install.sh
sudo ./install.sh
```

*اسکریپت `install.sh` تمامی پیش‌نیازها (داکر، دیتابیس PostgreSQL، بیلد پروژه، جدول‌ها، Nginx و SSL رایگان HTTPS) را به صورت خودکار نصب و پیکربندی می‌کند.*

---

این راهنما شامل مراحل کامل برای آماده‌سازی، انتقال و اجرای وب‌سایت شما روی سرور واقعی (VPS یا سرور اختصاصی ابری) است. پروژه شما یک برنامه **Full-Stack (Node.js Express + React SPA + Postgres + Drizzle ORM)** است.

فایل‌های زیر جهت انتقال راحت و استاندارد برای شما آماده و کانفیگ شده‌اند:
1. **`Dockerfile`**: برای ساخت ایمیج مستقل و بهینه از برنامه شما.
2. **`docker-compose.yml`**: برای اجرای همزمان اپلیکیشن و دیتابیس PostgreSQL با یک دستور.
3. **`ecosystem.config.cjs`**: برای مدیریت فرآیندها و اجرای کلاستربندی‌شده با PM2 روی سرورهای لینوکس بدون داکر.
4. **`.env.example`**: فایل نمونه متغیرهای محیطی دیتابیس، کلیدهای امنیتی و وب‌سرویس‌ها.

---

## فهرست راهنما
- [پیش‌نیازهای سرور واقعی](#پیش‌نیازهای-سرور-واقعی)
- [آماده‌سازی دیتابیس و اسکیما](#۱-آماده‌سازی-دیتابیس-و-اسکیما)
- [روش اول: استقرار سریع با Docker & Docker Compose (توصیه شده)](#روش-اول-استقرار-سریع-با-docker--docker-compose-توصیه-شده)
- [روش دوم: استقرار روی VPS لینوکس با PM2 & Nginx (روش سنتی)](#روش-دوم-استقرار-روی-vps-لینوکس-با-pm2--nginx-روش-سنتی)
- [تنظیم دامنه و گواهی SSL رایگان با Let's Encrypt](#تنظیم-دامنه-و-گواهی-ssl-رایگان-با-lets-encrypt)
- [نکات مهم امنیتی و نگهداری](#نکات-مهم-امنیتی-و-نگهداری)

---

## پیش‌نیازهای سرور واقعی
برای استقرار، شما به یک سرور لینوکس (ترجیحاً **Ubuntu 22.04 LTS** یا بالاتر) نیاز دارید. 

---

## ۱. آماده‌سازی دیتابیس و اسکیما
برنامه شما از **Drizzle ORM** استفاده می‌کند. قبل از شروع کار برنامه، ساختار جدول‌ها باید در دیتابیس ساخته شود.
اگر از روش داکر استفاده می‌کنید، اسکیما را قبل از بیلد یا پس از ران شدن کانتینر دیتابیس از روی سیستم خودتان یا داخل سرور با دستور زیر به دیتابیس پوش کنید:

```bash
# اجرای پوش اسکیما به دیتابیس واقعی
npm run db:push
```
*نکته:* مطمئن شوید متغیر محیطی `DATABASE_URL` در فایلی که دستور فوق را در آن اجرا می‌کنید، به دیتابیس واقعی اشاره دارد.

---

## روش اول: استقرار سریع با Docker & Docker Compose (توصیه شده)
این روش امن‌ترین، تمیزترین و سریع‌ترین راه برای استقرار است، زیرا تمام پیش‌نیازها (پایتون، نود، دیتابیس و آیکون‌ها) در قالب کانتینرهای مجزا و ایزوله نصب می‌شوند.

### مراحل استقرار با Docker:

1. **نصب Docker روی سرور:**
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose -y
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

2. **انتقال فایل‌ها به سرور:**
   تمام پوشه‌ها و فایل‌های پروژه (به جز `node_modules` و `dist`) را فشرده (Zip) کرده و به سرور منتقل کنید (مثلا در آدرس `/var/www/rakhsh`).

3. **تنظیم فایل `.env`:**
   فایل `.env.example` را کپی کرده و به نام `.env` تغییر نام دهید:
   ```bash
   cp .env.example .env
   ```
   مقادیر پسورد دیتابیس و کلیدهای امنیتی مانند `SESSION_SECRET` و `JWT_SECRET` را با مقادیر امن خود جایگزین کنید. همچنین پسورد مشخص شده در `DATABASE_URL` را با پسورد دیتابیس در بخش خدمات `db` در فایل `docker-compose.yml` یکسان کنید.

4. **اجرای سرویس‌ها با Docker Compose:**
   دستور زیر را در مسیر پروژه اجرا کنید تا دیتابیس و برنامه خودکار ساخته شده و در پس‌زمینه اجرا شوند:
   ```bash
   docker-compose up -d --build
   ```

5. **پوش کردن ساختار دیتابیس (اسکیما):**
   برای ساخت جدول‌ها در دیتابیس داکر، این دستور را در سرور اجرا کنید:
   ```bash
   docker exec -it rakhsh-express-app npm run db:push
   ```

*تبریک! برنامه شما اکنون روی پورت `3000` سرور واقعی آماده کار است.*

---

## روش دوم: استقرار روی VPS لینوکس با PM2 & Nginx (روش سنتی)
اگر مایلید برنامه را مستقیماً روی سرور بدون داکر اجرا کنید، این روش مناسب شماست.

### مراحل استقرار سنتی:

1. **نصب Node.js (نسخه 20) و PostgreSQL:**
   ```bash
   # نصب Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # نصب دیتابیس PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **ساخت دیتابیس و یوزر در PostgreSQL:**
   وارد محیط postgres شوید:
   ```bash
   sudo -i -u postgres psql
   ```
   دستورات زیر را برای ساخت دیتابیس و یوزر بنویسید (بجای `your_password` رمز عبور خود را بگذارید):
   ```sql
   CREATE DATABASE rakhsh_db;
   CREATE USER rakhsh_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE rakhsh_db TO rakhsh_user;
   ALTER DATABASE rakhsh_db OWNER TO rakhsh_user;
   \q
   ```

3. **انتقال پروژه و نصب پکیج‌ها:**
   پروژه را به سرور منتقل کرده و وارد پوشه پروژه شوید. سپس وابستگی‌ها را نصب کرده و پروژه را بیلد کنید:
   ```bash
   npm install
   npm run build
   ```

4. **ایجاد فایل `.env` واقعی:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   آدرس دیتابیس را به صورت زیر تنظیم کنید:
   `DATABASE_URL=postgresql://rakhsh_user:your_password@localhost:5432/rakhsh_db`

5. **اجرای ساخت جدول‌های دیتابیس:**
   ```bash
   npm run db:push
   ```

6. **مدیریت فرآیند با PM2:**
   برای نصب سراسری PM2 و اجرای برنامه در قالب کلاستر (با پایداری بالا و ریستارت خودکار در صورت کراش):
   ```bash
   sudo npm install -g pm2
   pm2 start ecosystem.config.cjs
   
   # ذخیره فرآیند برای بالا آمدن خودکار پس از ریستارت سرور
   pm2 save
   pm2 startup
   ```

---

## تنظیم دامنه و گواهی SSL رایگان با Let's Encrypt
برای اینکه کاربران بتوانند با دامنه شما (مثلاً `domain.com`) به سایت متصل شوند و ارتباط امن (HTTPS) داشته باشند:

1. **نصب Nginx و Certbot:**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```

2. **تنظیم کانفیگ Nginx به عنوان Reverse Proxy:**
   یک فایل کانفیگ جدید برای سایت ایجاد کنید:
   ```bash
   sudo nano /etc/nginx/sites-available/rakhsh
   ```
   محتوای زیر را درون آن قرار دهید (بجای `yourdomain.com` دامنه خود را بگذارید):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       # افزایش محدودیت حجم فایل آپلودی به ۵۰ مگابایت
       client_max_body_size 50M;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   فایل را ذخیره کرده و آن را فعال کنید:
   ```bash
   sudo ln -s /etc/nginx/sites-available/rakhsh /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **دریافت گواهی SSL رایگان HTTPS:**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
   مراحل را دنبال کرده و گزینه redirect خودکار HTTP به HTTPS را انتخاب کنید.

---

## نکات مهم امنیتی و نگهداری

### ۱. ماندگاری فایل‌های آپلودی (Persistence)
پروژه شما فایل‌های زیر را دریافت و تولید می‌کند:
- فاکتورهای ساخته شده در `public/invoices`
- فایل‌های آپلود شده توسط کاربران در `uploads`
- مهر و امضای کاربران در `stamppic`

در صورتی که از **Docker** استفاده می‌کنید، این آدرس‌ها به عنوان Volumeهای دائمی تعریف شده‌اند تا با آپدیت کانتینرها، اطلاعات کاربران شما حذف نشوند. در صورتی که از استقرار مستقیم (PM2) استفاده می‌کنید، مطمئن شوید دسترسی خواندن و نوشتن مناسب (مثلاً مالکیت کاربر لینوکس جاری یا دسترسی `755`) روی این پوشه‌ها اعمال شده باشد.

### ۲. رمز عبور ادمین ارشد
نام کاربری پیش‌فرض ادمین در کدها `ehsan` تعریف شده است. رمز عبور آن از متغیر محیطی `ADMIN_PASSWORD` در فایل `.env` خوانده می‌شود. در اولین لود برنامه، این کاربر با رمز پیش‌فرض (یا مشخص شده شما) ساخته شده و رمز آن هش‌شده در دیتابیس قرار می‌گیرد. حتماً رمز عبور پیچیده‌ای را برای آن انتخاب کنید.

### ۳. پشتیبان‌گیری مرتب از دیتابیس (Backup)
پیشنهاد می‌شود یک اسکریپت ساده برای پشتیبان‌گیری روزانه دیتابیس در Crontab سرور تنظیم کنید:
```bash
pg_dump -U postgres rakhsh_db > /backups/db_backup_$(date +%F).sql
```
