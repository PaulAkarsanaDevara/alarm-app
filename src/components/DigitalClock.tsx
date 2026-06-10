import { useEffect, useState } from 'react'

export default function DigitalClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hour24 = String(time.getHours()).padStart(2, '0')
  const m = String(time.getMinutes()).padStart(2, '0')
  const s = String(time.getSeconds()).padStart(2, '0')

  const days   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const dateStr = `${days[time.getDay()]}, ${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`

  return (
    <div className="text-center select-none">
      <div className="flex items-end justify-center gap-1">
        <span
          className="text-6xl md:text-8xl font-bold tracking-tight leading-none"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}
        >
          {hour24}:{m}
        </span>
        <span
          className="text-xs md:text-sm font-mono mb-1 ml-1"
          style={{ color: 'var(--muted)' }}
        >
          :{s}
        </span>
      </div>
      <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
        {dateStr}
      </p>
    </div>
  )
}
