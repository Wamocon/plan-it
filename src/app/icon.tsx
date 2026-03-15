import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  // Isometrische Layer-Geometrie (analog AppLogo, 100×100 viewBox → skaliert auf 32px)
  const ox = 10, fw = 74, sk = 14, th = 9, fh = 14, gap = 9;
  const y1 = 6;
  const y2 = y1 + th + fh + gap;
  const y3 = y2 + th + fh + gap;

  // top-face parallelogram als inline-style Polygon (via absolute position + clip)
  // Einfacher: wir rendern ein stilisiertes Rechteck-Stack als div-Blöcke
  const scale = 32 / 100;
  const block = (y: number, color: string, opacity: number, widthFactor = 1) => ({
    position: 'absolute' as const,
    left: `${ox * scale}px`,
    top: `${(y + th) * scale}px`,
    width: `${fw * widthFactor * scale}px`,
    height: `${fh * scale}px`,
    background: color,
    opacity,
    borderRadius: '1px',
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#1a0303',
          borderRadius: 6,
          position: 'relative',
          display: 'flex',
        }}
      >
        {/* Layer 3 – bottom, most transparent */}
        <div style={block(y3, 'rgba(255,255,255,0.25)', 1, 0.78)} />
        {/* Layer 2 – middle */}
        <div style={block(y2, 'rgba(255,255,255,0.45)', 1, 0.89)} />
        {/* Layer 1 – top, red */}
        <div style={{
          ...block(y1, '#ff1a1a', 1, 1),
          boxShadow: '0 0 6px rgba(255,26,26,0.8)',
        }} />
      </div>
    ),
    { ...size },
  );
}
