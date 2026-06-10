import { useEffect, useRef } from 'react'
import { AlarmClock, BellOff, Moon } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { dismissAlarm, snoozeAlarm } from '../store/alarmSlice'
import { formatTime } from '../utils'
import { playSound } from '../utils/audio'
import type { AlarmSound } from '../types'

const SOUND_INTERVAL: Record<AlarmSound, number> = {
  gentle: 2000,
  classic: 700,
  digital: 500,
  birds: 1600,
  custom: 2000,
}

export default function RingingOverlay() {
  const dispatch = useAppDispatch()
  const { alarms, activeAlarmId } = useAppSelector(s => s.alarm)
  const audioRef      = useRef<AudioContext | null>(null)
  const intervalRef   = useRef<number | null>(null)
  const audioElRef    = useRef<HTMLAudioElement | null>(null)
  const rampRef       = useRef<number | null>(null)

  const activeAlarm = alarms.find(a => a.id === activeAlarmId && a.ringing)

  useEffect(() => {
    if (!activeAlarm) {
      clearInterval(intervalRef.current ?? undefined)
      clearInterval(rampRef.current ?? undefined)
      if (audioRef.current)   { audioRef.current.close();     audioRef.current = null }
      if (audioElRef.current) { audioElRef.current.pause();   audioElRef.current = null }
      return
    }

    if (activeAlarm.sound === 'custom' && activeAlarm.customSoundDataUrl) {
      const audio = new Audio(activeAlarm.customSoundDataUrl)
      audio.loop = true
      audio.volume = 0.05
      audioElRef.current = audio
      audio.play()
      const start = Date.now()
      rampRef.current = window.setInterval(() => {
        const t = (Date.now() - start) / 30000
        audio.volume = Math.min(1.0, 0.05 + 0.95 * t)
        if (audio.volume >= 1.0) clearInterval(rampRef.current ?? undefined)
      }, 500)
    } else {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      audioRef.current = ctx
      const master = ctx.createGain()
      master.connect(ctx.destination)
      master.gain.setValueAtTime(0.05, ctx.currentTime)
      master.gain.exponentialRampToValueAtTime(1.0, ctx.currentTime + 30)
      const sound = activeAlarm.sound
      playSound(ctx, sound, master)
      intervalRef.current = window.setInterval(() => playSound(ctx, sound, master), SOUND_INTERVAL[sound])
    }

    return () => {
      clearInterval(intervalRef.current ?? undefined)
      clearInterval(rampRef.current ?? undefined)
      if (audioRef.current)   { audioRef.current.close();   audioRef.current = null }
      if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null }
    }
  }, [activeAlarm?.id])

  if (!activeAlarm) return null

  const { hours, minutes } = formatTime(activeAlarm.time)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{
        background: 'radial-gradient(ellipse at center, var(--surface-2) 0%, var(--bg) 60%)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Pulsing rings */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full"
          style={{
            width: 200, height: 200,
            background: 'rgba(var(--accent-rgb),0.15)',
            animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 160, height: 160,
            background: 'rgba(var(--accent-rgb),0.2)',
            animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite 0.4s',
          }}
        />
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 110, height: 110,
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
            boxShadow: '0 0 40px rgba(var(--accent-rgb),0.6)',
          }}
        >
          <AlarmClock size={48} color="white" />
        </div>
      </div>

      {/* Time */}
      <div className="text-center">
        <div
          className="text-7xl font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}
        >
          {hours}:{minutes}
        </div>
        {activeAlarm.label && (
          <p className="mt-2 text-lg" style={{ color: 'var(--text-2)', fontFamily: 'Inter, sans-serif' }}>
            {activeAlarm.label}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <button
          onClick={() => dispatch(snoozeAlarm({ id: activeAlarm.id, minutes: activeAlarm.snoozeDuration ?? 5 }))}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold transition-all active:scale-95"
          style={{
            background: 'var(--surface)',
            color: 'var(--accent-soft)',
            border: '1px solid var(--accent-bg)',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--accent-bg)')}
        >
          <Moon size={16} />
          Tunda {activeAlarm.snoozeDuration ?? 5} menit
        </button>

        <button
          onClick={() => dispatch(dismissAlarm(activeAlarm.id))}
          className="flex items-center gap-2 px-10 py-3.5 rounded-2xl font-semibold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 20px rgba(var(--accent-rgb),0.4)',
          }}
        >
          <BellOff size={18} />
          Matikan
        </button>
      </div>
    </div>
  )
}
