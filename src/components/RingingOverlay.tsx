import { useEffect, useRef } from 'react'
import { AlarmClock, BellOff, Moon } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { dismissAlarm, snoozeAlarm } from '../store/alarmSlice'
import { formatTime } from '../utils'
import type { AlarmSound } from '../types'

function playSound(ctx: AudioContext, sound: AlarmSound, output: AudioNode) {
  switch (sound) {
    case 'gentle': {
      // Two soft sine tones ascending (C5 → E5)
      ;[523, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(output)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.3)
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3)
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.3 + 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.7)
        osc.start(ctx.currentTime + i * 0.3)
        osc.stop(ctx.currentTime + i * 0.3 + 0.7)
      })
      break
    }
    case 'classic': {
      // Double beep like a traditional alarm clock
      ;[0, 0.18].forEach(offset => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(output)
        osc.type = 'square'
        osc.frequency.setValueAtTime(880, ctx.currentTime + offset)
        gain.gain.setValueAtTime(0.12, ctx.currentTime + offset)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.14)
        osc.start(ctx.currentTime + offset)
        osc.stop(ctx.currentTime + offset + 0.14)
      })
      break
    }
    case 'digital': {
      // Short sharp electronic beep
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(output)
      osc.type = 'square'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.09)
      break
    }
    case 'birds': {
      // Three ascending frequency sweeps mimicking chirps
      ;[0, 0.2, 0.4].forEach((offset, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(output)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1500 + i * 200, ctx.currentTime + offset)
        osc.frequency.exponentialRampToValueAtTime(2200 + i * 100, ctx.currentTime + offset + 0.14)
        gain.gain.setValueAtTime(0.14, ctx.currentTime + offset)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.16)
        osc.start(ctx.currentTime + offset)
        osc.stop(ctx.currentTime + offset + 0.16)
      })
      break
    }
  }
}

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
  const audioRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const rampRef = useRef<number | null>(null)

  const activeAlarm = alarms.find(a => a.id === activeAlarmId && a.ringing)

  useEffect(() => {
    if (!activeAlarm) {
      clearInterval(intervalRef.current ?? undefined)
      clearInterval(rampRef.current ?? undefined)
      if (audioRef.current) { audioRef.current.close(); audioRef.current = null }
      if (audioElementRef.current) { audioElementRef.current.pause(); audioElementRef.current = null }
      return
    }

    if (activeAlarm.sound === 'custom' && activeAlarm.customSoundDataUrl) {
      // HTML5 Audio path for user-uploaded sounds
      const audio = new Audio(activeAlarm.customSoundDataUrl)
      audio.loop = true
      audio.volume = 0.05
      audioElementRef.current = audio
      audio.play()

      const start = Date.now()
      rampRef.current = window.setInterval(() => {
        const t = (Date.now() - start) / 30000
        audio.volume = Math.min(1.0, 0.05 + 0.95 * t)
        if (audio.volume >= 1.0) clearInterval(rampRef.current ?? undefined)
      }, 500)
    } else {
      // Web Audio API path for built-in sounds
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      audioRef.current = ctx

      const masterGain = ctx.createGain()
      masterGain.connect(ctx.destination)
      masterGain.gain.setValueAtTime(0.05, ctx.currentTime)
      masterGain.gain.exponentialRampToValueAtTime(1.0, ctx.currentTime + 30)

      const sound = activeAlarm.sound
      playSound(ctx, sound, masterGain)
      intervalRef.current = window.setInterval(() => playSound(ctx, sound, masterGain), SOUND_INTERVAL[sound])
    }

    return () => {
      clearInterval(intervalRef.current ?? undefined)
      clearInterval(rampRef.current ?? undefined)
      if (audioRef.current) { audioRef.current.close(); audioRef.current = null }
      if (audioElementRef.current) { audioElementRef.current.pause(); audioElementRef.current = null }
    }
  }, [activeAlarm?.id])

  if (!activeAlarm) return null

  const { hours, minutes } = formatTime(activeAlarm.time)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{
        background: 'radial-gradient(ellipse at center, #1A1530 0%, #0D0D14 60%)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Pulsing ring */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full"
          style={{
            width: 200, height: 200,
            background: 'rgba(124,111,247,0.15)',
            animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 160, height: 160,
            background: 'rgba(124,111,247,0.2)',
            animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite 0.4s',
          }}
        />
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 110, height: 110,
            background: 'linear-gradient(135deg, #7C6FF7 0%, #5B52C4 100%)',
            boxShadow: '0 0 40px rgba(124,111,247,0.6)',
          }}
        >
          <AlarmClock size={48} color="#F0EFF8" />
        </div>
      </div>

      {/* Time */}
      <div className="text-center">
        <div
          className="text-7xl font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: '#F0EFF8' }}
        >
          {hours}:{minutes}
        </div>
        {activeAlarm.label && (
          <p className="mt-2 text-lg" style={{ color: '#9896A8', fontFamily: 'Inter, sans-serif' }}>
            {activeAlarm.label}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 mt-4">
        {/* Snooze */}
        <button
          onClick={() => dispatch(snoozeAlarm({ id: activeAlarm.id, minutes: activeAlarm.snoozeDuration ?? 5 }))}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold transition-all active:scale-95"
          style={{
            background: '#1E1D2E',
            color: '#A89FF7',
            border: '1px solid #3D3A6B',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#7C6FF7')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#3D3A6B')}
        >
          <Moon size={16} />
          Tunda {activeAlarm.snoozeDuration ?? 5} menit
        </button>

        {/* Dismiss */}
        <button
          onClick={() => dispatch(dismissAlarm(activeAlarm.id))}
          className="flex items-center gap-2 px-10 py-3.5 rounded-2xl font-semibold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #7C6FF7 0%, #5B52C4 100%)',
            color: '#F0EFF8',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 20px rgba(124,111,247,0.4)',
          }}
        >
          <BellOff size={18} />
          Matikan
        </button>
      </div>
    </div>
  )
}
