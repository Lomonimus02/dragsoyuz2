#!/bin/bash
# Первичная установка Docker и подготовка сервера Selectel
# Запускать от root: bash deploy/selectel/setup-server.sh
set -euo pipefail

echo "=== Установка Docker на Selectel ==="

if ! command -v docker &>/dev/null; then
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
  systemctl enable docker
  systemctl start docker
  echo "Docker установлен"
else
  echo "Docker уже установлен: $(docker --version)"
fi

# Проверка ресурсов
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
DISK_FREE=$(df -BG / | awk 'NR==2{print $4}' | tr -d 'G')

echo ""
echo "=== Проверка ресурсов сервера ==="
echo "RAM: ${TOTAL_RAM} MB"
echo "Свободно на диске: ${DISK_FREE} GB"

if [ "${TOTAL_RAM}" -lt 1800 ]; then
  echo ""
  echo "ВНИМАНИЕ: на сервере меньше 2 GB RAM."
  echo "PostgreSQL + Next.js могут работать нестабильно на 1 GB."
  echo "Рекомендуется увеличить тариф Selectel до 2 GB RAM."
fi

if [ "${DISK_FREE}" -lt 3 ]; then
  echo ""
  echo "ВНИМАНИЕ: мало свободного места на диске (< 3 GB)."
  echo "Увеличьте диск в панели Selectel перед переносом uploads."
fi

# Папка приложения
APP_DIR="${APP_DIR:-$HOME/app}"
mkdir -p "${APP_DIR}/public/uploads"

if [ ! -f "${APP_DIR}/docker-compose.yml" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  cp "${SCRIPT_DIR}/docker-compose.yml" "${APP_DIR}/docker-compose.yml"
  echo "docker-compose.yml скопирован в ${APP_DIR}"
fi

if [ ! -f "${APP_DIR}/.env" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  cp "${SCRIPT_DIR}/.env.example" "${APP_DIR}/.env"
  echo ""
  echo "Создан ${APP_DIR}/.env — ОБЯЗАТЕЛЬНО заполните ADMIN_PASSWORD и пароли!"
fi

# Swap для серверов с 1 GB (снижает риск OOM)
if [ "${TOTAL_RAM}" -lt 1800 ] && [ ! -f /swapfile ]; then
  echo ""
  echo "Создание swap 1 GB (для серверов с 1 GB RAM)..."
  fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap включён"
fi

echo ""
echo "=== Сервер готов ==="
echo "Следующие шаги:"
echo "  1. Загрузите бэкап: scp radiodetali-backup-*.tar.gz root@139.100.216.41:~/"
echo "  2. Восстановите:     bash scripts/restore-selectel.sh ~/radiodetali-backup-*.tar.gz"
echo "  3. Настройте nginx:  bash deploy/selectel/setup-nginx.sh"
