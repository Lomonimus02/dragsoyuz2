#!/bin/bash
# Переключение nginx с прокси на Timeweb → локальное приложение
# Запускать от root: bash deploy/selectel/setup-nginx.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NGINX_CONF="/etc/nginx/sites-available/dragsoyuz"

echo "=== Настройка nginx на Selectel ==="

# Удаляем старые конфиги прокси на Timeweb
for f in /etc/nginx/sites-enabled/dragsoyuz-ru /etc/nginx/sites-enabled/timeweb-proxy; do
  if [ -f "$f" ] || [ -L "$f" ]; then
    rm -f "$f"
    echo "Удалён старый конфиг: $f"
  fi
done

cp "${SCRIPT_DIR}/nginx-dragsoyuz.conf" "${NGINX_CONF}"
ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/dragsoyuz

# Убираем дефолтный welcome, если мешает
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t

# SSL: основной домен (если сертификат ещё не выпущен)
if [ ! -d /etc/letsencrypt/live/xn--80agbo8ajj9h.xn--p1ai ]; then
  echo "Выпуск SSL для драгсоюз.рф..."
  certbot certonly --nginx -d xn--80agbo8ajj9h.xn--p1ai \
    --non-interactive --agree-tos -m admin@dragsoyuz.ru || true
fi

# SSL: dragsoyuz.ru
if [ ! -d /etc/letsencrypt/live/dragsoyuz.ru ]; then
  echo "Выпуск SSL для dragsoyuz.ru..."
  certbot certonly --nginx -d dragsoyuz.ru -d www.dragsoyuz.ru \
    --non-interactive --agree-tos -m admin@dragsoyuz.ru || true
fi

systemctl reload nginx

echo ""
echo "=== nginx настроен ==="
echo "Прокси: 127.0.0.1:3050 (локальный Docker)"
echo ""
echo "Проверка:"
echo "  curl -I http://127.0.0.1:3050"
echo "  curl -I https://драгсоюз.рф"
echo "  curl -I https://dragsoyuz.ru"
