# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_ переменные должны быть доступны во время билда
ARG NEXT_PUBLIC_BASE_URL=https://драгсоюз.рф
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ARG NEXT_PUBLIC_SITE_BRAND=ДРАГСОЮЗ
ENV NEXT_PUBLIC_SITE_BRAND=${NEXT_PUBLIC_SITE_BRAND}
ARG NEXT_PUBLIC_SITE_THEME=dragsoyuz
ENV NEXT_PUBLIC_SITE_THEME=${NEXT_PUBLIC_SITE_THEME}
ARG NEXT_PUBLIC_YANDEX_METRIKA_ID=108599989
ENV NEXT_PUBLIC_YANDEX_METRIKA_ID=${NEXT_PUBLIC_YANDEX_METRIKA_ID}
ARG NEXT_PUBLIC_JIVO_WIDGET_ID=mL1h2xDSrD
ENV NEXT_PUBLIC_JIVO_WIDGET_ID=${NEXT_PUBLIC_JIVO_WIDGET_ID}

# Копируем зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем приложение
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем публичные файлы
COPY --from=builder /app/public ./public

# Создаем папку для загрузок и даем права
RUN mkdir -p ./public/uploads
RUN chown -R nextjs:nodejs ./public/uploads

# Копируем standalone сборку
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Копируем все node_modules (включая Prisma CLI и все его зависимости)
COPY --from=deps /app/node_modules ./node_modules
# Поверх кладём сгенерированный Prisma Client из builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Копируем Prisma schema и миграции
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Копируем скрипты (seed и др.)
COPY --from=builder /app/scripts ./scripts

# Справочники категорий (content/category-guides/*.md)
COPY --from=builder /app/content ./content

# Копируем entrypoint скрипт
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
