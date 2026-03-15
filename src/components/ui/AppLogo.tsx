export function AppLogo({ size = 36 }: { size?: number }) {
  return <AppLogoLayers size={size} />;
}

// Isometrische 3D-Ebenen – oberste Schicht rot mit Glow, Innen-Details, Verbindungspfeile.
function AppLogoLayers({ size = 36 }: { size?: number }) {
  // Work in a 100×100 viewBox for clean math, scale via width/height
  // Layer geometry (isometric: offset shifts top-face to the right)
  const ox = 10;   // left x of front face
  const fw = 74;   // front face width
  const sk = 14;   // horizontal skew for top face (isometric offset)
  const th = 9;    // top-face height (parallelogram)
  const fh = 14;   // front-face height
  const gap = 9;   // gap between layers

  const layer = (y: number) => ({
    // top face (parallelogram): 4 points
    top: `${ox + sk},${y} ${ox + sk + fw},${y} ${ox + fw},${y + th} ${ox},${y + th}`,
    // front face top-left, top-right, bottom-right, bottom-left
    fx: ox, fy: y + th, fw, fh,
  });

  const L1 = layer(6);
  const L2 = layer(6 + th + fh + gap);
  const L3 = layer(6 + (th + fh + gap) * 2);

  // Inner detail dots for front faces (3 rows of 4 small squares)
  const dots = (fy: number) =>
    [0.18, 0.45, 0.72].map(dx =>
      [0.28, 0.55].map(dy => ({
        x: ox + fw * dx,
        y: fy + fh * dy,
      }))
    ).flat();

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 100 100"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-label="Architekturplaner Logo"
    >
      <defs>
        {/* Red gradient for top layer */}
        <linearGradient id="ll-topface" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff1a1a" />
          <stop offset="100%" stopColor="#ff5050" />
        </linearGradient>
        <linearGradient id="ll-topfront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cc0000" />
          <stop offset="100%" stopColor="#8a0000" />
        </linearGradient>
        {/* White gradient middle */}
        <linearGradient id="ll-midface" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
        </linearGradient>
        <linearGradient id="ll-midfront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        {/* Bottom – most transparent */}
        <linearGradient id="ll-botface" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        {/* Glow filter for top layer */}
        <filter id="ll-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Layer 3 (bottom) ── */}
      <polygon points={L3.top} fill="url(#ll-botface)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <rect x={L3.fx} y={L3.fy} width={L3.fw} height={L3.fh}
        fill="url(#ll-midfront)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      {dots(L3.fy).map((d, i) => (
        <rect key={i} x={d.x - 1.2} y={d.y - 1.2} width={2.4} height={2.4} rx="0.6"
          fill="rgba(255,255,255,0.2)" />
      ))}

      {/* ── Layer 2 (middle) ── */}
      <polygon points={L2.top} fill="url(#ll-midface)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <rect x={L2.fx} y={L2.fy} width={L2.fw} height={L2.fh}
        fill="url(#ll-midfront)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      {dots(L2.fy).map((d, i) => (
        <rect key={i} x={d.x - 1.2} y={d.y - 1.2} width={2.4} height={2.4} rx="0.6"
          fill="rgba(255,255,255,0.3)" />
      ))}
      {/* Right-side connection arrow down */}
      <polyline points={`${ox + fw + 4},${L2.fy + fh / 2} ${ox + fw + 4},${L3.fy - 1} ${ox + fw + 2},${L3.fy + 2} ${ox + fw + 6},${L3.fy + 2}`}
        stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* ── Layer 1 (top, red) – with glow ── */}
      <g filter="url(#ll-glow)">
        <polygon points={L1.top} fill="url(#ll-topface)" stroke="rgba(255,100,100,0.6)" strokeWidth="1" />
        <rect x={L1.fx} y={L1.fy} width={L1.fw} height={L1.fh}
          fill="url(#ll-topfront)" stroke="rgba(255,80,80,0.4)" strokeWidth="0.8" />
      </g>
      {/* Inner highlight line on top layer front */}
      <line x1={ox + 4} y1={L1.fy + 3} x2={ox + fw - 4} y2={L1.fy + 3}
        stroke="rgba(255,180,180,0.35)" strokeWidth="1" strokeLinecap="round" />
      {/* Dots on top layer – brighter */}
      {dots(L1.fy).map((d, i) => (
        <rect key={i} x={d.x - 1.2} y={d.y - 1.2} width={2.4} height={2.4} rx="0.6"
          fill="rgba(255,200,200,0.55)" />
      ))}
      {/* Right-side connection arrow down to layer 2 */}
      <polyline points={`${ox + fw + 4},${L1.fy + fh / 2} ${ox + fw + 4},${L2.fy - 1} ${ox + fw + 2},${L2.fy + 2} ${ox + fw + 6},${L2.fy + 2}`}
        stroke="rgba(255,80,80,0.45)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
