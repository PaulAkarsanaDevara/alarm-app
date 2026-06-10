import type { RepeatDay } from '../types'

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function getCurrentTime(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function getCurrentSeconds(): number {
  return new Date().getSeconds()
}

export function formatTime(time: string): { hours: string; minutes: string } {
  const [h, m] = time.split(':').map(Number)
  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
  }
}

export function getNextAlarmTime(time: string, repeat: RepeatDay[]): string {
  const now = new Date()
  const [h, m] = time.split(':').map(Number)

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
  const todayIdx = now.getDay()

  // Check today first
  if (repeat.length === 0) {
    const alarmToday = new Date()
    alarmToday.setHours(h, m, 0, 0)
    if (alarmToday > now) return 'Today'
    return 'Tomorrow'
  }

  for (let i = 0; i < 7; i++) {
    const dayIdx = (todayIdx + i) % 7
    const dayName = days[dayIdx] as RepeatDay
    if (repeat.includes(dayName)) {
      if (i === 0) {
        const alarmToday = new Date()
        alarmToday.setHours(h, m, 0, 0)
        if (alarmToday > now) return 'Today'
      } else if (i === 1) {
        return 'Tomorrow'
      } else {
        return dayName
      }
    }
  }
  return ''
}

export function shouldAlarmRing(time: string, repeat: RepeatDay[], snoozedUntil?: number | null): boolean {
  const now = new Date()
  const currentTime = getCurrentTime()

  if (snoozedUntil && Date.now() < snoozedUntil) return false

  if (time !== currentTime) return false

  if (repeat.length === 0) return true

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
  const todayDay = days[now.getDay()] as RepeatDay
  return repeat.includes(todayDay)
}

export function getCountdown(time: string, repeat: RepeatDay[]): string {
  const now = new Date()
  const [h, m] = time.split(':').map(Number)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

  for (let i = 0; i < 7; i++) {
    const candidate = new Date(now)
    candidate.setDate(now.getDate() + i)
    candidate.setHours(h, m, 0, 0)

    if (candidate <= now) continue

    if (repeat.length > 0) {
      const dayName = days[candidate.getDay()] as RepeatDay
      if (!repeat.includes(dayName)) continue
    }

    const totalMins = Math.round((candidate.getTime() - now.getTime()) / 60000)
    const hrs = Math.floor(totalMins / 60)
    const mins = totalMins % 60

    if (hrs === 0) return `${mins}m`
    if (mins === 0) return `${hrs}h`
    return `${hrs}h ${mins}m`
  }

  return ''
}

export function getSoundLabel(sound: string): string {
  const labels: Record<string, string> = {
    gentle: '🔔 Gentle',
    classic: '⏰ Classic',
    digital: '📱 Digital',
    birds: '🐦 Birds',
    custom: '📁 Custom',
  }
  return labels[sound] ?? sound
}
