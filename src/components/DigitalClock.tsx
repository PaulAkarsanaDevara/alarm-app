import { useEffect, useState } from 'react'

export default function DigitalClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const h = time.getHours()
  const m = String(time.getMinutes()).padStart(2, '0')
  const s = String(time.getSeconds()).padStart(2, '0')
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = String(h % 12 || 12).padStart(2, '0')

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dateStr = `${days[time.getDay()]}, ${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`

  return (
    <div className="text-center select-none">
      <div className="flex items-end justify-center gap-1">
        <span
          className="text-6xl md:text-8xl font-bold tracking-tight leading-none"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: '#F0EFF8',
          }}
        >
          {hour12}:{m}
        </span>
        <div className="flex flex-col items-start mb-1 ml-1">
          <span
            className="text-lg md:text-2xl font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: '#7C6FF7' }}
          >
            {period}
          </span>
          <span
            className="text-xs md:text-sm font-mono"
            style={{ color: '#6B6A7D' }}
          >
            :{s}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm md:text-base" style={{ color: '#6B6A7D', fontFamily: 'Inter, sans-serif' }}>
        {dateStr}
      </p>
    </div>
  )
}
