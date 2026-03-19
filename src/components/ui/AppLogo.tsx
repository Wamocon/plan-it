// ──────────────────────────────────────────────────────────────────────────────
// LOGO-AUSWAHL: Setze ACTIVE_LOGO auf 'A' | 'B' | 'C' | 'D' | 'LEGACY'
//
//  A  Hexagon Blueprint  – Sechseck mit 3 verbundenen Knoten (Architektur-Netz)
//  B  Chip / CPU         – Quadrat mit 8 Pins, roter Kern (IT-Hardware-Metapher)
//  C  Flow Chevrons      – 3 gestaffelte Pfeile (Analyse → Plan → Umsetzung)
//  D  Node Graph         – Kreis mit 6 Orbitlinien (Netzwerk / Systemkarte)
//  LEGACY  Isometrische 3D-Schichten (bisheriges Logo)
// ──────────────────────────────────────────────────────────────────────────────
const ACTIVE_LOGO: 'A' | 'B' | 'C' | 'D' | 'LEGACY' = 'A';

export function AppLogo({ size = 36 }: { size?: number }) {
  if (ACTIVE_LOGO === 'A') return <LogoA size={size} />;
  if (ACTIVE_LOGO === 'B') return <LogoB size={size} />;
  if (ACTIVE_LOGO === 'C') return <LogoC size={size} />;
  if (ACTIVE_LOGO === 'D') return <LogoD size={size} />;
  return <AppLogoLayers size={size} />;
}

// Wordmark: Icon + "plan-IT" + optionale Tagline in einem SVG
export function AppLogoWordmark({ height = 48, showTagline = true }: { height?: number; showTagline?: boolean }) {
  // ViewBox 230 × 60; Icon nimmt linke 60px ein, Text rechts davon
  const vw = 400, vh = 66;
  const scale = height / vh;

  // Hex-Geometrie (zentriert auf 30,30, r=26) – identisch zu LogoA aber kleiner
  const r = 26, cx = 30, cy = 30;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
  const hexPoints = hex.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const nodes: [number, number][] = [[30, 12], [18, 40], [42, 40]];

  return (
    <svg
      width={vw * scale} height={vh * scale}
      viewBox={`0 0 ${vw} ${vh}`}
      fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-label="plan-IT"
    >
      <defs>
        <linearGradient id="wm-hex" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a0303" />
          <stop offset="100%" stopColor="#2d0808" />
        </linearGradient>
        <filter id="wm-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Hexagon ── */}
      <polygon points={hexPoints} fill="url(#wm-hex)" stroke="rgba(255,26,26,0.5)" strokeWidth="1.8" />

      {/* Verbindungslinien */}
      {nodes.map((from, i) =>
        nodes.slice(i + 1).map((to, j) => (
          <line key={`${i}-${j}`}
            x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
        ))
      )}

      {/* Knoten unten */}
      {nodes.slice(1).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4"
          fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      ))}

      {/* Knoten oben – rot */}
      <g filter="url(#wm-glow)">
        <circle cx={nodes[0][0]} cy={nodes[0][1]} r="5.5"
          fill="#ff2020" stroke="rgba(255,100,100,0.6)" strokeWidth="1.2" />
        <circle cx={nodes[0][0]} cy={nodes[0][1]} r="2.2" fill="rgba(255,200,200,0.85)" />
      </g>

      {/* Tick-Marks */}
      {hex.map(([x, y], i) => {
        const nx = cx + (r + 4) * Math.cos((Math.PI / 3) * i - Math.PI / 6);
        const ny = cy + (r + 4) * Math.sin((Math.PI / 3) * i - Math.PI / 6);
        return <line key={i} x1={x.toFixed(1)} y1={y.toFixed(1)}
          x2={nx.toFixed(1)} y2={ny.toFixed(1)}
          stroke="rgba(255,26,26,0.4)" strokeWidth="1.2" strokeLinecap="round" />;
      })}

      {/* ── Textbereich ── */}
      {/* Trennlinie */}
      <line x1="68" y1="12" x2="68" y2="48" stroke="rgba(255,26,26,0.25)" strokeWidth="1" />

      {/* „plan-" weiß, „IT" rot – gleiche Baseline via tspan */}
      <text x="78" y={showTagline ? 28 : 36}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="24" letterSpacing="-0.5">
        <tspan fontWeight="600" fill="rgba(255,255,255,0.95)">plan-</tspan>
        <tspan fontWeight="800" fill="#ff2020">IT</tspan>
      </text>

      {/* Tagline */}
      {showTagline && (
        <text x="78" y="54"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="12" fontWeight="400" letterSpacing="0.3"
          fill="rgba(255,255,255,0.55)">
          IT-Architektur analysieren · planen · umsetzen
        </text>
      )}
    </svg>
  );
}

// ── Konzept A: Hexagon Blueprint ───────────────────────────────────────────────
// Sechseck-Rahmen (Blueprint-Ästhetik) mit 3 Knoten + Verbindungslinien innen.
// Inspiriert von EA-Tools wie Ardoq: "Visibility through connection".
function LogoA({ size = 36 }: { size?: number }) {
  // Hexagon-Punkte (flach-top, zentriert auf 50,50, r=44)
  const r = 44;
  const cx = 50, cy = 50;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
  const hexPoints = hex.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // 3 innere Knoten (Dreieck)
  const nodes: [number, number][] = [
    [50, 22],   // oben
    [32, 64],   // links-unten
    [68, 64],   // rechts-unten
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-label="plan-IT Logo">
      <defs>
        <linearGradient id="a-hex" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a0303" />
          <stop offset="100%" stopColor="#2d0808" />
        </linearGradient>
        <filter id="a-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Hexagon Hintergrund */}
      <polygon points={hexPoints} fill="url(#a-hex)" stroke="rgba(255,26,26,0.5)" strokeWidth="2.5" />

      {/* Verbindungslinien zwischen den Knoten */}
      {nodes.map((from, i) =>
        nodes.slice(i + 1).map((to, j) => (
          <line key={`${i}-${j}`}
            x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
        ))
      )}

      {/* Knoten unten (grau) */}
      {nodes.slice(1).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5.5" fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
      ))}

      {/* Knoten oben (rot + Glow) */}
      <g filter="url(#a-glow)">
        <circle cx={nodes[0][0]} cy={nodes[0][1]} r="7" fill="#ff2020"
          stroke="rgba(255,100,100,0.6)" strokeWidth="1.5" />
        <circle cx={nodes[0][0]} cy={nodes[0][1]} r="3" fill="rgba(255,200,200,0.8)" />
      </g>

      {/* Outer tick marks on hex edges */}
      {hex.map(([x, y], i) => {
        const nx = cx + (r + 5) * Math.cos((Math.PI / 3) * i - Math.PI / 6);
        const ny = cy + (r + 5) * Math.sin((Math.PI / 3) * i - Math.PI / 6);
        return <line key={i} x1={x.toFixed(1)} y1={y.toFixed(1)}
          x2={nx.toFixed(1)} y2={ny.toFixed(1)}
          stroke="rgba(255,26,26,0.4)" strokeWidth="1.5" strokeLinecap="round" />;
      })}
    </svg>
  );
}

// ── Konzept B: Chip / CPU Icon ─────────────────────────────────────────────────
// Quadratischer Chip mit 8 Pins (je 2 pro Seite) und rotem Kern-Quadrat.
// Steht für „IT-Infrastruktur" und „Kontrolle über Technologie".
function LogoB({ size = 36 }: { size?: number }) {
  const chip = { x: 20, y: 20, w: 60, h: 60 };
  // Pins: [x1,y1,x2,y2]
  const pins: [number, number, number, number][] = [
    // top
    [34, 20, 34, 10], [56, 20, 56, 10],
    // bottom
    [34, 80, 34, 90], [56, 80, 56, 90],
    // left
    [20, 34, 10, 34], [20, 56, 10, 56],
    // right
    [80, 34, 90, 34], [80, 56, 90, 56],
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-label="plan-IT Logo">
      <defs>
        <linearGradient id="b-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a0606" />
          <stop offset="100%" stopColor="#1a0303" />
        </linearGradient>
        <linearGradient id="b-core" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2020" />
          <stop offset="100%" stopColor="#cc0000" />
        </linearGradient>
        <filter id="b-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Chip-Gehäuse */}
      <rect x={chip.x} y={chip.y} width={chip.w} height={chip.h} rx="6"
        fill="url(#b-body)" stroke="rgba(255,26,26,0.55)" strokeWidth="2" />

      {/* Pins */}
      {pins.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
      ))}
      {/* Pin-Endpunkte */}
      {pins.map(([, , x2, y2], i) => (
        <circle key={i} cx={x2} cy={y2} r="2.5" fill="rgba(255,255,255,0.4)" />
      ))}

      {/* Inneres Grid */}
      <line x1="32" y1="28" x2="68" y2="28" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <line x1="32" y1="72" x2="68" y2="72" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <line x1="28" y1="32" x2="28" y2="68" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <line x1="72" y1="32" x2="72" y2="68" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Roter Kern */}
      <g filter="url(#b-glow)">
        <rect x="36" y="36" width="28" height="28" rx="4"
          fill="url(#b-core)" stroke="rgba(255,80,80,0.5)" strokeWidth="1.5" />
        {/* ">" Symbol im Kern */}
        <polyline points="44,43 56,50 44,57"
          stroke="rgba(255,220,220,0.9)" strokeWidth="2.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// ── Konzept C: Flow Chevrons ───────────────────────────────────────────────────
// 3 gestaffelte Pfeil-Chevrons (links→rechts), roter Akzent oben.
// Symbolisiert den 3-Phasen-Prozess: Analysieren → Planen → Umsetzen.
// Inspiriert vom Linear/Vercel-Stil: bold, minimal, ikonfähig.
function LogoC({ size = 36 }: { size?: number }) {
  // Jeder Chevron: Spitze rechts, Basis links. Versetzt nach unten-rechts.
  const chevron = (ox: number, oy: number, w: number, h: number, hw: number) => {
    // hw = half-height of the V
    const x0 = ox, x1 = ox + w - hw, x2 = ox + w;
    const yTop = oy, yMid = oy + h / 2, yBot = oy + h;
    return `${x0},${yTop} ${x1},${yTop} ${x2},${yMid} ${x1},${yBot} ${x0},${yBot} ${x1 - hw * 0.6},${yMid}`;
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-label="plan-IT Logo">
      <defs>
        <linearGradient id="c-red" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff2020" />
          <stop offset="100%" stopColor="#ff5050" />
        </linearGradient>
        <filter id="c-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Chevron 3 (unten, am transparentesten) */}
      <polygon points={chevron(12, 60, 52, 18, 12)}
        fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2"
        strokeLinejoin="round" />
      {/* Chevron 2 (mitte) */}
      <polygon points={chevron(20, 40, 52, 18, 12)}
        fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"
        strokeLinejoin="round" />
      {/* Chevron 1 (oben, rot + Glow) */}
      <g filter="url(#c-glow)">
        <polygon points={chevron(28, 20, 52, 18, 12)}
          fill="url(#c-red)" stroke="rgba(255,80,80,0.5)" strokeWidth="1.2"
          strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// ── Konzept D: Node Graph / Orbit ──────────────────────────────────────────────
// Zentraler Knoten mit 6 Orbitlinien zu Randknoten. Evoziert ein Systemarchitektur-
// Diagramm oder Netzwerktopologie. Moderner "Platform"-Look wie Datadog / Snowflake.
function LogoD({ size = 36 }: { size?: number }) {
  const cx = 50, cy = 50;
  const orbits = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return { x: cx + 34 * Math.cos(a), y: cy + 34 * Math.sin(a) };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-label="plan-IT Logo">
      <defs>
        <radialGradient id="d-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff3030" />
          <stop offset="100%" stopColor="#aa0000" />
        </radialGradient>
        <filter id="d-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Orbit-Ring (gestrichelt) */}
      <circle cx={cx} cy={cy} r="34"
        stroke="rgba(255,26,26,0.2)" strokeWidth="1" strokeDasharray="3 5" />

      {/* Verbindungslinien */}
      {orbits.map((o, i) => (
        <line key={i} x1={cx} y1={cy} x2={o.x.toFixed(1)} y2={o.y.toFixed(1)}
          stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      ))}

      {/* Orbit-Knoten */}
      {orbits.map((o, i) => (
        <circle key={i} cx={o.x.toFixed(1)} cy={o.y.toFixed(1)} r="5"
          fill={i === 0 ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.12)'}
          stroke={i === 0 ? 'rgba(255,100,100,0.7)' : 'rgba(255,255,255,0.3)'}
          strokeWidth="1.2" />
      ))}

      {/* Zentrum (roter Kern + Glow) */}
      <g filter="url(#d-glow)">
        <circle cx={cx} cy={cy} r="13" fill="url(#d-center)"
          stroke="rgba(255,80,80,0.5)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="5" fill="rgba(255,200,200,0.7)" />
      </g>
    </svg>
  );
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
      aria-label="plan-IT Logo"
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
