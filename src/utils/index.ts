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

export function formatTime(time: string): { hours: string; minutes: string; period: string } {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hours = String(h % 12 || 12).padStart(2, '0')
  const minutes = String(m).padStart(2, '0')
  return { hours, minutes, period }
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

export function getSoundLabel(sound: string): string {
  const labels: Record<string, string> = {
    gentle: '🔔 Gentle',
    classic: '⏰ Classic',
    digital: '📱 Digital',
    birds: '🐦 Birds',
  }
  return labels[sound] ?? sound
}
