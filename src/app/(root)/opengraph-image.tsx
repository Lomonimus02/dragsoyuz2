import { ImageResponse } from "next/og";
import { SITE_BRAND } from "@/lib/site";

// Размеры OG изображения (рекомендуемые для социальных сетей)
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = `${SITE_BRAND} — Скупка радиодеталей в СПб`;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Gold accent gradient */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(ellipse at 30% 20%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(ellipse at 70% 80%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              background: "linear-gradient(90deg, #fde68a, #fbbf24, #fde68a)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: 24,
              letterSpacing: "-2px",
            }}
          >
            {SITE_BRAND}
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 36,
              color: "rgba(255, 255, 255, 0.9)",
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            Скупка радиодеталей в СПб
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 24,
              color: "rgba(255, 255, 255, 0.6)",
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            Честные цены • Оплата сразу • Работаем с 2014 года
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
