import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  // Hexagon (Logo A) als Favicon – 6 Punkte, flat-top, r=13, zentriert auf 16,16
  const r = 13, cx = 16, cy = 16;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const hexPath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ') + ' Z';

  // 3 innere Knoten
  const nodes = [[16, 6], [10, 22], [22, 22]];
  // Verbindungslinien
  const lines: [number,number,number,number][] = [
    [nodes[0][0], nodes[0][1], nodes[1][0], nodes[1][1]],
    [nodes[0][0], nodes[0][1], nodes[2][0], nodes[2][1]],
    [nodes[1][0], nodes[1][1], nodes[2][0], nodes[2][1]],
  ];

  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, position: 'relative', display: 'flex' }}>
        <svg width="32" height="32" viewBox="0 0 32 32">
          {/* Hintergrund-Hexagon */}
          <path d={hexPath} fill="#1a0303" stroke="rgba(255,26,26,0.7)" strokeWidth="1.2" />
          {/* Verbindungslinien */}
          {lines.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.25)" strokeWidth="0.9" strokeLinecap="round" />
          ))}
          {/* Untere Knoten */}
          <circle cx={nodes[1][0]} cy={nodes[1][1]} r="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
          <circle cx={nodes[2][0]} cy={nodes[2][1]} r="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
          {/* Oberer Knoten – rot */}
          <circle cx={nodes[0][0]} cy={nodes[0][1]} r="3" fill="#ff1a1a" />
          <circle cx={nodes[0][0]} cy={nodes[0][1]} r="1.2" fill="rgba(255,200,200,0.9)" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
