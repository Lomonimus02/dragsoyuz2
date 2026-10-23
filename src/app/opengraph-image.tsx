import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_BRAND } from "@/lib/site";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_BRAND} — Скупка радиодеталей в СПб`;
export default async function Image() {
  const font = await readFile(path.join(process.cwd(), "public/fonts/radioklad-og.ttf"));
  const latinFont = await readFile(path.join(process.cwd(), "public/fonts/radioklad-og-latin.ttf"));
  return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",background:"#f2f1e8",color:"#214c3c",fontFamily:"RadioKlad, RadioKladLatin",border:"24px solid #dde5d2"}}>
    <div style={{fontSize:100,fontWeight:700,letterSpacing:-5}}>{SITE_BRAND}</div>
    <div style={{fontSize:32,marginTop:35,color:"#66735c"}}>Скупка радиодеталей · Санкт-Петербург</div>
    <div style={{fontSize:23,marginTop:24,color:"#7b856f"}}>Честная оценка. Оплата сразу.</div>
  </div>, { ...size, fonts: [
    { name: "RadioKlad", data: font, weight: 700, style: "normal" },
    { name: "RadioKladLatin", data: latinFont, weight: 700, style: "normal" },
  ] });
}
