#!/bin/bash
# Восстановление бэкапа на Selectel
# Использование: bash scripts/restore-selectel.sh ~/radiodetali-backup-YYYYMMDD-HHMMSS.tar.gz
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Использование: $0 <путь-к-архиву-бэкапа.tar.gz>"
  exit 1
fi

ARCHIVE="$1"
APP_DIR="${APP_DIR:-$HOME/app}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESTORE_DIR="/tmp/radiodetali-restore-${TIMESTAMP}"

if [ ! -f "${ARCHIVE}" ]; then
  echo "ОШИБКА: архив не найден: ${ARCHIVE}"
  exit 1
fi

echo "=== Восстановление radiodetali на Selectel ==="
echo "Архив: ${ARCHIVE}"
echo "Папка приложения: ${APP_DIR}"

# Распаковка
echo "[1/6] Распаковка архива..."
mkdir -p "${RESTORE_DIR}"
tar xzf "${ARCHIVE}" -C "${RESTORE_DIR}" --strip-components=1

if [ ! -f "${RESTORE_DIR}/database.sql" ]; then
  echo "ОШИБКА: database.sql не найден в архиве"
  exit 1
fi

# Подготовка директории приложения
echo "[2/6] Подготовка ${APP_DIR}..."
mkdir -p "${APP_DIR}/public"

# docker-compose и .env
if [ -f "${RESTORE_DIR}/docker-compose.yml" ]; then
  cp "${RESTORE_DIR}/docker-compose.yml" "${APP_DIR}/docker-compose.yml"
elif [ -f "$(dirname "$0")/../deploy/selectel/docker-compose.yml" ]; then
  cp "$(dirname "$0")/../deploy/selectel/docker-compose.yml" "${APP_DIR}/docker-compose.yml"
fi

if [ -f "${RESTORE_DIR}/.env" ]; then
  cp "${RESTORE_DIR}/.env" "${APP_DIR}/.env"
  echo "      .env восстановлен из бэкапа"
elif [ ! -f "${APP_DIR}/.env" ]; then
  echo "ОШИБКА: .env не найден. Создайте ${APP_DIR}/.env из deploy/selectel/.env.example"
  exit 1
fi

# Uploads
echo "[3/6] Восстановление uploads..."
if [ -f "${RESTORE_DIR}/uploads.tar.gz" ] && [ ! -f "${RESTORE_DIR}/uploads.tar.gz.empty" ]; then
  tar xzf "${RESTORE_DIR}/uploads.tar.gz" -C "${APP_DIR}/public"
  echo "      uploads восстановлены"
else
  mkdir -p "${APP_DIR}/public/uploads"
  echo "      uploads пустые или отсутствуют в бэкапе"
fi

cd "${APP_DIR}"

# Остановка старого стека (если был)
echo "[4/6] Остановка текущих контейнеров..."
docker compose down 2>/dev/null || true

# Запуск только БД
echo "[5/6] Запуск PostgreSQL и восстановление дампа..."
docker compose up -d db

echo "      Ожидание готовности БД..."
for i in $(seq 1 30); do
  if docker exec radiodetali_db pg_isready -U radiodetali -d radiodetali >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! docker exec radiodetali_db pg_isready -U radiodetali -d radiodetali >/dev/null 2>&1; then
  echo "ОШИБКА: PostgreSQL не запустился"
  exit 1
fi

# Пересоздание БД и импорт
docker exec radiodetali_db psql -U radiodetali -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='radiodetali' AND pid <> pg_backend_pid();" \
  2>/dev/null || true
docker exec radiodetali_db psql -U radiodetali -d postgres -c "DROP DATABASE IF EXISTS radiodetali;"
docker exec radiodetali_db psql -U radiodetali -d postgres -c "CREATE DATABASE radiodetali;"
docker exec -i radiodetali_db psql -U radiodetali -d radiodetali < "${RESTORE_DIR}/database.sql"
echo "      База данных восстановлена"

# Запуск полного стека
echo "[6/6] Запуск приложения..."
docker compose pull app
docker compose up -d

echo ""
echo "=== Восстановление завершено ==="
echo "Проверка:"
echo "  curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3050"
echo "  docker compose ps"
echo "  docker compose logs -f app --tail 50"
echo ""
echo "Не забудьте обновить nginx (прокси на 127.0.0.1:3050, не на Timeweb):"
echo "  bash deploy/selectel/setup-nginx.sh"

rm -rf "${RESTORE_DIR}"
