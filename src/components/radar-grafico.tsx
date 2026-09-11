import type { EixoRadar } from "@/lib/reporte";

export function RadarChart({
  eixos,
  cor = "#38bdf8",
  rotulo = "Gráfico radar do jogador",
}: {
  eixos: EixoRadar[];
  cor?: string;
  rotulo?: string;
}) {
  const cx = 130;
  const cy = 120;
  const R = 88;
  const n = eixos.length;
  if (!n) return null;
  const ang = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const pt = (i: number, valor: number) => {
    const r = (Math.max(0, Math.min(100, valor)) / 100) * R;
    return [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))] as const;
  };
  const ringPts = (pct: number) =>
    Array.from({ length: n }, (_, i) => pt(i, pct).join(",")).join(" ");
  const eixosComValor = eixos.map((e) => ({ ...e, valor: e.valor ?? 0 }));
  const dataPts = eixosComValor.map((e, i) => pt(i, e.valor).join(",")).join(" ");

  return (
    <svg
      viewBox="0 0 260 256"
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label={rotulo}
    >
      <g fill="none" stroke="currentColor" strokeOpacity="0.15">
        {[20, 40, 60, 80, 100].map((p) => (
          <polygon key={p} points={ringPts(p)} />
        ))}
        {eixos.map((_, i) => {
          const [x, y] = pt(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} />;
        })}
      </g>
      <polygon
        points={dataPts}
        fill={`${cor}26`}
        stroke={cor}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {eixosComValor.map((e, i) => {
        const [x, y] = pt(i, e.valor);
        return <circle key={i} cx={x} cy={y} r={3.5} fill={e.valor === 0 ? "#a1a1aa" : cor} />;
      })}
      {eixos.map((e, i) => {
        const lx = cx + (R + 26) * Math.cos(ang(i));
        const ly = cy + (R + 26) * Math.sin(ang(i));
        const cos = Math.cos(ang(i));
        const anchor = Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <g key={`${e.rotulo}-label`}>
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={600}
              fill="currentColor"
            >
              {e.rotulo}
            </text>
            <text
              x={lx}
              y={ly + 13}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={10}
              fill="#71717a"
            >
              {e.valor === null ? "sem dados" : String(e.valor)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}