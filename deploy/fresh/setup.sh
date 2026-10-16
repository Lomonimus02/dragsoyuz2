#!/bin/bash
# Развёртывание на чистый сервер (HTTP, без домена)
# Запуск: bash setup.sh ВАШ_IP
set -euo pipefail

SERVER_IP="${1:-}"
if [ -z "${SERVER_IP}" ]; then
  SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${APP_DIR:-$HOME/app}"

echo "=== Развёртывание radiodetali ==="
echo "IP сервера: ${SERVER_IP}"

# Docker
if ! command -v docker &>/dev/null; then
  echo "Установка Docker..."
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "${VERSION_CODENAME:-$VERSION}") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
fi

mkdir -p "${APP_DIR}/public/uploads"
cp "${SCRIPT_DIR}/docker-compose.yml" "${APP_DIR}/docker-compose.yml"

# .env
if [ ! -f "${APP_DIR}/.env" ]; then
  ADMIN_PASS=$(openssl rand -base64 12 2>/dev/null || echo "admin$(date +%s)")
  cat > "${APP_DIR}/.env" << EOF
POSTGRES_USER=radiodetali
POSTGRES_PASSWORD=$(openssl rand -base64 16 2>/dev/null || echo "radiodetali_secret")
POSTGRES_DB=radiodetali
ADMIN_PASSWORD=${ADMIN_PASS}
NEXT_PUBLIC_BASE_URL=http://${SERVER_IP}
EOF
  echo ""
  echo "Создан ${APP_DIR}/.env"
  echo "Пароль админки: ${ADMIN_PASS}  (сохраните!)"
fi

cd "${APP_DIR}"
echo "Скачивание образа..."
docker compose pull
echo "Запуск..."
docker compose up -d

echo ""
echo "=== Готово ==="
echo "Сайт:  http://${SERVER_IP}"
echo "Админ: http://${SERVER_IP}/admin"
echo ""
echo "Проверка: curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1"
docker compose ps
