interface GaugeProps {
  value: number
  max?: number
  label?: string
  size?: number
}

export function RiskGauge({ value, max = 100, label, size = 160 }: GaugeProps) {
  const pct = Math.min(value / max, 1)
  const angle = pct * 180
  const r = (size - 20) / 2
  const cx = size / 2
  const cy = size / 2 + 10

  const getColor = (v: number) => {
    if (v >= 75) return '#EF4444'
    if (v >= 50) return '#F59E0B'
    if (v >= 25) return '#F59E0B'
    return '#22C55E'
  }

  const needleX = cx + r * 0.75 * Math.cos((Math.PI * (180 - angle)) / 180)
  const needleY = cy - r * 0.75 * Math.sin((Math.PI * (180 - angle)) / 180)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#1F2937" strokeWidth="12" strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={getColor(value)} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${pct * Math.PI * r} ${Math.PI * r}`}
        />
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#FFFFFF" />
        <text x={cx} y={cy - r * 0.45} textAnchor="middle" fill="#FFFFFF" fontSize="28" fontWeight="600">
          {value}
        </text>
        {label && (
          <text x={cx} y={cy - r * 0.2} textAnchor="middle" fill="#94A3B8" fontSize="11">
            {label}
          </text>
        )}
      </svg>
    </div>
  )
}
