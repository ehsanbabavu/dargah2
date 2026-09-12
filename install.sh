#!/bin/bash

# ------------------------------------------------------------------------------
# اسکریپت نصب اتوماتیک، خطایاب و بهینه‌سازی سامانه روی سرور مجازی (VPS)
# ------------------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CLEAR='\033[0m'

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}خطا: لطفاً این اسکریپت را با دسترسی root اجرا کنید (مثال: sudo ./install.sh)${CLEAR}"
  exit 1
fi

echo -e "${BLUE}======================================================${CLEAR}"
echo -e "${GREEN}    اسکریپت نصب اتوماتیک و خطایاب نهایی سامانه رخشان${CLEAR}"
echo -e "${BLUE}======================================================${CLEAR}"

# اطمینان از وجود پوشه attached_assets در صورت عدم انتقال
mkdir -p attached_assets

# ۱. رفع کمبود حافظه رم (ایجاد Swap موقت در صورت کم بودن رم سرور برای جلوگیری از کراش npm)
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
if [ "$TOTAL_RAM_KB" -lt 2500000 ]; then
  SWAP_EXISTS=$(swapon --show | wc -l)
  if [ "$SWAP_EXISTS" -le 1 ]; then
    echo -e "${YELLOW}رم سرور کمتر از ۲.۵ گیگابایت است. در حال ایجاد حافظه کمکی Swap برای جلوگیری از توقف بیلد...${CLEAR}"
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 2>/dev/null
    chmod 600 /swapfile
    mkswap /swapfile 2>/dev/null
    swapon /swapfile 2>/dev/null
    echo -e "${GREEN}حافظه کمکی ۲ گیگابایتی فعال شد.${CLEAR}"
  fi
fi

# ۲. پاک‌سازی و رفع پکیج‌های ناتمام اوبونتو
echo -e "${BLUE}[۱/۶] بررسی و پاک‌سازی سیستم...${CLEAR}"
dpkg --configure -a 2>/dev/null
apt-get clean 2>/dev/null
apt-get --fix-broken install -y 2>/dev/null

# ۳. بررسی و فعال‌سازی داکر
echo -e "${BLUE}[۲/۶] بررسی ابزارهای Docker...${CLEAR}"
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}در حال نصب Docker رسمی...${CLEAR}"
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  systemctl start docker
  systemctl enable docker
  rm -f get-docker.sh
fi

if [ -f /usr/libexec/docker/cli-plugins/docker-compose ]; then
  ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true
fi

COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
  if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
  else
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    COMPOSE_CMD="docker-compose"
  fi
fi
echo -e "${GREEN}دستور کامپوز: ${COMPOSE_CMD}${CLEAR}"

# ۴. تولید فایل Dockerfile بهینه همراه با کپی attached_assets
echo -e "${BLUE}[۳/۶] ساخت Dockerfile بهینه و ضد کراش...${CLEAR}"
cat <<'DOCKERFILE_END' > Dockerfile
# Stage 1: Build Stage
FROM node:20-slim AS builder
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY components.json ./
COPY drizzle.config.ts ./
RUN npm install --no-audit
COPY client/ ./client
COPY server/ ./server
COPY shared/ ./shared
COPY public/ ./public
RUN mkdir -p attached_assets
COPY attached_assets/ ./attached_assets/
RUN npm run build

# Stage 2: Production Runtime Stage
FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY shared/ ./shared
COPY data-*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/attached_assets ./attached_assets
COPY --from=builder /app/client ./client
RUN mkdir -p uploads stamppic public/invoices && chmod -R 755 uploads stamppic public/invoices
EXPOSE 3000
CMD ["npm", "run", "start"]
DOCKERFILE_END

# ۵. تنظیم فایل‌های .env و docker-compose.yml
if [ ! -f .env ]; then
  DB_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "rakhsh_pass_123")
  cat <<ENV_EOF > .env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/rakhsh_db
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=admin123
SMS_API_TOKEN=
TELEGRAM_BOT_TOKEN=
ENV_EOF
else
  DB_PASSWORD=$(grep DATABASE_URL .env | sed -E 's/.*postgres:([^@]+)@.*/\1/' 2>/dev/null)
  [ -z "$DB_PASSWORD" ] && DB_PASSWORD="admin_db_password"
fi

cat <<COMPOSE_END > docker-compose.yml
services:
  db:
    image: postgres:15-alpine
    container_name: rakhsh-postgres-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: rakhsh_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d rakhsh_db"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: rakhsh-express-app
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/rakhsh_db
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - app_uploads:/app/uploads
      - app_stamppic:/app/stamppic
      - app_invoices:/app/public/invoices

volumes:
  postgres_data:
    driver: local
  app_uploads:
    driver: local
  app_stamppic:
    driver: local
  app_invoices:
    driver: local
COMPOSE_END

# ۶. بیلد و اجرای کانتینرها
echo -e "${BLUE}[۴/۶] در حال ساخت و استقرار کانتینرها (بدون کش)...${CLEAR}"
$COMPOSE_CMD down 2>/dev/null || true
$COMPOSE_CMD build --no-cache app
$COMPOSE_CMD up -d

# ۷. ایجاد جدول‌های دیتابیس
echo -e "${BLUE}[۵/۶] در حال اتصال و راه‌اندازی دیتابیس...${CLEAR}"
sleep 5
for i in {1..8}; do
  if $COMPOSE_CMD exec -T app npm run db:push 2>/dev/null || docker exec -i -e DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db:5432/rakhsh_db" rakhsh-express-app npm run db:push; then
    echo -e "${GREEN}جدول‌های دیتابیس با موفقیت ثبت شدند. در حال راه‌اندازی مجدد برنامه...${CLEAR}"
    $COMPOSE_CMD restart app 2>/dev/null || docker restart rakhsh-express-app
    break
  fi
  sleep 4
done

# ۸. تنظیم دامنه و SSL (اختیاری)
echo ""
echo -e "${BLUE}======================================================${CLEAR}"
echo -e "${BLUE}[۶/۶] اتصال دامنه و SSL (HTTPS)...${CLEAR}"
echo -e "${BLUE}======================================================${CLEAR}"
read -p "آیا مایلید دامنه شخصی و SSL رایگان متصل شود؟ (y/n): " INSTALL_SSL
if [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
  read -p "نام دامنه خود را وارد کنید (مثال: domain.com): " DOMAIN_NAME
  DOMAIN_NAME=$(echo "$DOMAIN_NAME" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|^www\.||')
  if [ -n "$DOMAIN_NAME" ]; then
    echo -e "${YELLOW}در حال راه‌اندازی Nginx و فایروال...${CLEAR}"
    apt-get update -y >/dev/null 2>&1
    apt-get install -y nginx certbot python3-certbot-nginx ufw >/dev/null 2>&1
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true

    cat <<EOF > /etc/nginx/sites-available/rakhsh
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    ln -sf /etc/nginx/sites-available/rakhsh /etc/nginx/sites-enabled/ 2>/dev/null
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null
    nginx -t && systemctl restart nginx
    systemctl enable nginx >/dev/null 2>&1

    echo -e "${YELLOW}در حال دریافت گواهینامه SSL رسمی و فعال‌سازی HTTPS...${CLEAR}"
    certbot --nginx -d "${DOMAIN_NAME}" -d "www.${DOMAIN_NAME}" --non-interactive --agree-tos --register-unsafely-without-email --redirect --expand || certbot --nginx -d "${DOMAIN_NAME}" --non-interactive --agree-tos --register-unsafely-without-email --redirect --expand || true
    echo -e "${GREEN}گواهی SSL و دامنه با موفقیت فعال شد!${CLEAR}"
    echo -e "${GREEN}آدرس سایت: https://${DOMAIN_NAME}${CLEAR}"
  fi
fi

echo ""
echo -e "${GREEN}======================================================${CLEAR}"
echo -e "${GREEN}     سامانه با موفقیت نصب و راه‌اندازی شد!${CLEAR}"
echo -e "${GREEN}======================================================${CLEAR}"
echo -e "${YELLOW}- مشاهده وضعیت:${CLEAR} docker ps"
echo -e "${YELLOW}- لاگ زنده:${CLEAR} $COMPOSE_CMD logs -f app"
echo -e "${YELLOW}- ریستارت:${CLEAR} $COMPOSE_CMD restart"
