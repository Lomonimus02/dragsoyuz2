import lettering from "./catalog-watermark-lettering.json";

/** Approved grey pattern; bundled Roboto Condensed outlines avoid server font differences. */
export function catalogWatermarkSvg(width: number, height: number) {
  const fontSize = Math.max(1, Math.round(Math.min(width, height) * 0.072));
  const scale = fontSize / lettering.units;
  const cellWidth = Math.max(1, Math.round(lettering.width * scale + fontSize * 1.2));
  const cellHeight = Math.max(1, Math.round(fontSize * 2.65));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><pattern id="mark" patternUnits="userSpaceOnUse" width="${cellWidth}" height="${cellHeight}" patternTransform="rotate(-24)">
      <path d="${lettering.path}" transform="translate(${fontSize * 0.3},${fontSize * 1.35}) scale(${scale},${-scale})" fill="#989898" fill-opacity="0.14"/>
    </pattern></defs><rect width="100%" height="100%" fill="url(#mark)"/>
  </svg>`;
}
