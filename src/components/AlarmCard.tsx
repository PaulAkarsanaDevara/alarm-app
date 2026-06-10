import { useState } from 'react'
import { Trash2, Edit2 } from 'lucide-react'
import type { Alarm } from '../types'
import { useAppDispatch, useAppSelector } from '../hooks'
import { toggleAlarm, deleteAlarm, openModal } from '../store/alarmSlice'
import { formatTime, getCountdown, getSoundLabel } from '../utils'

interface AlarmCardProps {
  alarm: Alarm
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function AlarmCard({ alarm }: AlarmCardProps) {
  const dispatch = useAppDispatch()
  const [confirming, setConfirming] = useState(false)
  const [exiting, setExiting] = useState(false)
  useAppSelector(s => s.alarm.currentTime)

  function handleDelete() {
    setExiting(true)
    setTimeout(() => dispatch(deleteAlarm(alarm.id)), 260)
  }
  const { hours, minutes } = formatTime(alarm.time)
  const countdown = getCountdown(alarm.time, alarm.repeat)

  return (
    <div
      className={`rounded-2xl p-4 md:p-5 transition-all duration-300 border ${exiting ? 'alarm-exit' : 'alarm-enter'}`}
      style={{
        background: alarm.enabled ? 'var(--surface)' : 'var(--surface-dim)',
        borderColor: alarm.ringing ? 'var(--accent)' : alarm.enabled ? 'var(--border)' : 'var(--border-muted)',
        opacity: alarm.enabled ? 1 : 0.6,
        boxShadow: alarm.ringing ? '0 0 24px rgba(var(--accent-rgb),0.35)' : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-1">
            <span
              className="text-3xl md:text-4xl font-bold leading-none"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: alarm.enabled ? 'var(--text)' : 'var(--muted)',
              }}
            >
              {hours}:{minutes}
            </span>
          </div>

          <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-2)' }}>
            {alarm.label || 'Tanpa label'}
          </p>

          <div className="flex gap-1 mt-2 flex-wrap">
            {DAY_LABELS.map(day => {
              const active = alarm.repeat.includes(day as Alarm['repeat'][number])
              return (
                <span
                  key={day}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: active ? 'var(--accent-bg)' : 'var(--border-muted)',
                    color: active ? 'var(--accent-soft)' : 'var(--muted-3)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {day}
                </span>
              )
            })}
          </div>

          {alarm.enabled && (
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
              {countdown ? `Berbunyi dalam ${countdown}` : ''} · {getSoundLabel(alarm.sound)}
            </p>
          )}

          {alarm.snoozedUntil && alarm.snoozedUntil > Date.now() && (
            <span
              className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent-soft)' }}
            >
              Ditunda · {Math.ceil((alarm.snoozedUntil - Date.now()) / 60000)}m lagi
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-end gap-3">
          <button
            onClick={() => dispatch(toggleAlarm(alarm.id))}
            className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
            style={{ background: alarm.enabled ? 'var(--accent)' : 'var(--border)' }}
            aria-label={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
              style={{ background: 'var(--text)', left: alarm.enabled ? '26px' : '2px' }}
            />
          </button>

          {confirming ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setConfirming(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--border-muted)', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: '#3B1F1F', color: '#f87171', fontFamily: 'Inter, sans-serif' }}
              >
                Hapus
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => dispatch(openModal(alarm))}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-soft)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                aria-label="Edit alarm"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                aria-label="Delete alarm"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
