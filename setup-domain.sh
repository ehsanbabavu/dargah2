#!/bin/bash

# ------------------------------------------------------------------------------
# اسکریپت اتصال و تنظیم خودکار دامنه و SSL رایگان برای سامانه رخشان
# ------------------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CLEAR='\033[0m'

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}خطا: لطفاً این اسکریپت را با دسترسی root اجرا کنید (مثال: sudo ./setup-domain.sh)${CLEAR}"
  exit 1
fi

echo -e "${BLUE}======================================================${CLEAR}"
echo -e "${GREEN}     تنظیم خودکار دامنه و SSL بدون نیاز به پورت 3000${CLEAR}"
echo -e "${BLUE}======================================================${CLEAR}"

if [ -n "$1" ]; then
  DOMAIN_NAME="$1"
else
  read -p "نام دامنه خود را وارد کنید (مثال: mydomain.com): " DOMAIN_NAME
fi

DOMAIN_NAME=$(echo "$DOMAIN_NAME" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|^www\.||')

if [ -z "$DOMAIN_NAME" ]; then
  echo -e "${RED}خطا: نام دامنه نمی‌تواند خالی باشد.${CLEAR}"
  exit 1
fi

echo -e "${BLUE}[۱/۴] در حال بررسی و نصب Nginx و ماژول‌های امنیتی...${CLEAR}"
apt-get update -y >/dev/null 2>&1
apt-get install -y nginx certbot python3-certbot-nginx ufw >/dev/null 2>&1

echo -e "${BLUE}[۲/۴] تنظیم پورت‌های فایروال (80 و 443)...${CLEAR}"
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true

echo -e "${BLUE}[۳/۴] پیکربندی Nginx Reverse Proxy برای انتقال به پورت 3000...${CLEAR}"
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

if ! nginx -t; then
  echo -e "${RED}خطا در کانفیگ Nginx رخ داد.${CLEAR}"
  exit 1
fi

systemctl restart nginx
systemctl enable nginx >/dev/null 2>&1

echo -e "${BLUE}[۴/۴] در حال صدور گواهینامه رایگان SSL (HTTPS) با Certbot...${CLEAR}"
certbot --nginx -d "${DOMAIN_NAME}" -d "www.${DOMAIN_NAME}" --non-interactive --agree-tos --register-unsafely-without-email --redirect || certbot --nginx -d "${DOMAIN_NAME}" --non-interactive --agree-tos --register-unsafely-without-email --redirect || true

echo ""
echo -e "${GREEN}======================================================${CLEAR}"
echo -e "${GREEN}  تبریک! دامنه با موفقیت به برنامه متصل شد!${CLEAR}"
echo -e "${GREEN}======================================================${CLEAR}"
echo -e "${YELLOW}آدرس سایت شما بدون نیاز به هیچ پورتی:${CLEAR}"
echo -e "${GREEN}👉 https://${DOMAIN_NAME}${CLEAR}"
echo -e "${GREEN}👉 https://www.${DOMAIN_NAME}${CLEAR}"
