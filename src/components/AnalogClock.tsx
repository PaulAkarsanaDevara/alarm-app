import { useEffect, useState } from 'react'

interface ClockProps {
  ringing?: boolean
}

export default function AnalogClock({ ringing = false }: ClockProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const s = time.getSeconds()
  const m = time.getMinutes()
  const h = time.getHours() % 12

  const secDeg = s * 6
  const minDeg = m * 6 + s * 0.1
  const hourDeg = h * 30 + m * 0.5

  const cx = 100
  const cy = 100
  const r = 88

  function handEnd(deg: number, len: number) {
    const rad = ((deg - 90) * Math.PI) / 180
    return {
      x: cx + len * Math.cos(rad),
      y: cy + len * Math.sin(rad),
    }
  }

  const hourEnd = handEnd(hourDeg, 52)
  const minEnd = handEnd(minDeg, 68)
  const secEnd = handEnd(secDeg, 74)

  return (
    <div className={`relative flex items-center justify-center ${ringing ? 'animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}`}>
      {/* Outer ring glow */}
      {ringing && (
        <div className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124,111,247,0.25) 0%, transparent 70%)',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}
      <svg
        viewBox="0 0 200 200"
        className="w-52 h-52 md:w-64 md:h-64"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circles */}
        <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="#7C6FF720" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#7C6FF730" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r} fill="#16161F" stroke="#7C6FF7" strokeWidth="1.5" />

        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180)
          const outer = 82
          const inner = i % 3 === 0 ? 72 : 77
          return (
            <line
              key={i}
              x1={cx + inner * Math.cos(angle)}
              y1={cy + inner * Math.sin(angle)}
              x2={cx + outer * Math.cos(angle)}
              y2={cy + outer * Math.sin(angle)}
              stroke={i % 3 === 0 ? '#7C6FF7' : '#3D3A6B'}
              strokeWidth={i % 3 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          )
        })}

        {/* Hour numbers */}
        {[12, 3, 6, 9].map((num, i) => {
          const angle = (i * 90 - 90) * (Math.PI / 180)
          const dist = 62
          return (
            <text
              key={num}
              x={cx + dist * Math.cos(angle)}
              y={cy + dist * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#7C6FF7"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              {num}
            </text>
          )
        })}

        {/* Hour hand */}
        <line
          x1={cx} y1={cy}
          x2={hourEnd.x} y2={hourEnd.y}
          stroke="#F0EFF8"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Minute hand */}
        <line
          x1={cx} y1={cy}
          x2={minEnd.x} y2={minEnd.y}
          stroke="#F0EFF8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Second hand */}
        <line
          x1={cx - secEnd.x * 0.15 + cx * 0.15}
          y1={cy - secEnd.y * 0.15 + cy * 0.15}
          x2={secEnd.x} y2={secEnd.y}
          stroke="#7C6FF7"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill="#7C6FF7" />
        <circle cx={cx} cy={cy} r="2" fill="#F0EFF8" />
      </svg>
    </div>
  )
}
