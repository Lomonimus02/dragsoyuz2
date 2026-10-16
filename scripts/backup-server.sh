#!/bin/bash
# Бэкап сайта с сервера Timeweb (запускать в ~/app на старом сервере)
# Использование: bash scripts/backup-server.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/app}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="radiodetali-backup-${TIMESTAMP}"
WORK_DIR="/tmp/${BACKUP_NAME}"
ARCHIVE="${HOME}/${BACKUP_NAME}.tar.gz"

echo "=== Бэкап radiodetali ==="
echo "Папка приложения: ${APP_DIR}"

mkdir -p "${WORK_DIR}"

# 1. Дамп PostgreSQL
echo "[1/4] Дамп базы данных..."
if ! docker ps --format '{{.Names}}' | grep -q '^radiodetali_db$'; then
  echo "ОШИБКА: контейнер radiodetali_db не запущен"
  exit 1
fi
docker exec radiodetali_db pg_dump -U radiodetali -d radiodetali --no-owner --no-acl \
  > "${WORK_DIR}/database.sql"
echo "      Размер дампа: $(du -h "${WORK_DIR}/database.sql" | cut -f1)"

# 2. Загруженные файлы
echo "[2/4] Архив uploads..."
if [ -d "${APP_DIR}/public/uploads" ]; then
  tar czf "${WORK_DIR}/uploads.tar.gz" -C "${APP_DIR}/public" uploads
  echo "      Размер uploads: $(du -h "${WORK_DIR}/uploads.tar.gz" | cut -f1)"
else
  echo "      uploads не найдены, пропускаем"
  touch "${WORK_DIR}/uploads.tar.gz.empty"
fi

# 3. Конфигурация
echo "[3/4] Копирование .env и docker-compose.yml..."
[ -f "${APP_DIR}/.env" ] && cp "${APP_DIR}/.env" "${WORK_DIR}/.env"
[ -f "${APP_DIR}/docker-compose.yml" ] && cp "${APP_DIR}/docker-compose.yml" "${WORK_DIR}/docker-compose.yml"

# 4. Метаданные
cat > "${WORK_DIR}/backup-info.txt" << EOF
backup_date=${TIMESTAMP}
source_host=$(hostname)
source_ip=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo unknown)
postgres_version=$(docker exec radiodetali_db postgres --version 2>/dev/null || echo unknown)
app_image=$(docker inspect radiodetali_app --format='{{.Config.Image}}' 2>/dev/null || echo unknown)
EOF

# 5. Итоговый архив
echo "[4/4] Создание архива ${ARCHIVE}..."
tar czf "${ARCHIVE}" -C /tmp "${BACKUP_NAME}"
rm -rf "${WORK_DIR}"

echo ""
echo "=== Готово ==="
echo "Архив: ${ARCHIVE}"
echo "Размер: $(du -h "${ARCHIVE}" | cut -f1)"
echo ""
echo "Скачать на локальный компьютер:"
echo "  scp root@212.60.21.10:${ARCHIVE} ."
echo ""
echo "Загрузить на Selectel:"
echo "  scp ${ARCHIVE} root@139.100.216.41:~/"
