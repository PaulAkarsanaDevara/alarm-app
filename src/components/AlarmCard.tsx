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
  useAppSelector(s => s.alarm.currentTime) // re-render on tick so countdown stays fresh
  const { hours, minutes } = formatTime(alarm.time)
  const countdown = getCountdown(alarm.time, alarm.repeat)

  return (
    <div
      className="rounded-2xl p-4 md:p-5 transition-all duration-300 border"
      style={{
        background: alarm.enabled ? '#16161F' : '#111119',
        borderColor: alarm.ringing ? '#7C6FF7' : alarm.enabled ? '#2A2A3A' : '#1A1A28',
        opacity: alarm.enabled ? 1 : 0.6,
        boxShadow: alarm.ringing ? '0 0 24px rgba(124,111,247,0.35)' : 'none',
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
                color: alarm.enabled ? '#F0EFF8' : '#6B6A7D',
              }}
            >
              {hours}:{minutes}
            </span>
          </div>

          {/* Label */}
          <p className="text-sm mt-1 truncate" style={{ color: '#9896A8' }}>
            {alarm.label || 'No label'}
          </p>

          {/* Repeat days */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {DAY_LABELS.map(day => {
              const active = alarm.repeat.includes(day as Alarm['repeat'][number])
              return (
                <span
                  key={day}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: active ? '#3D3A6B' : '#1A1A28',
                    color: active ? '#A89FF7' : '#3D3A6B',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {day}
                </span>
              )
            })}
          </div>

          {/* Next alarm & sound */}
          {alarm.enabled && (
            <p className="text-xs mt-2" style={{ color: '#6B6A7D' }}>
              {countdown ? `Rings in ${countdown}` : ''} · {getSoundLabel(alarm.sound)}
            </p>
          )}

          {/* Snoozed badge */}
          {alarm.snoozedUntil && alarm.snoozedUntil > Date.now() && (
            <span
              className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full"
              style={{ background: '#2A2040', color: '#A89FF7' }}
            >
              Snoozed · {Math.ceil((alarm.snoozedUntil - Date.now()) / 60000)}m left
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-end gap-3">
          {/* Toggle */}
          <button
            onClick={() => dispatch(toggleAlarm(alarm.id))}
            className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
            style={{
              background: alarm.enabled ? '#7C6FF7' : '#2A2A3A',
            }}
            aria-label={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
              style={{
                background: '#F0EFF8',
                left: alarm.enabled ? '26px' : '2px',
              }}
            />
          </button>

          {/* Edit & Delete */}
          <div className="flex gap-2">
            <button
              onClick={() => dispatch(openModal(alarm))}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#6B6A7D' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A89FF7')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B6A7D')}
              aria-label="Edit alarm"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => dispatch(deleteAlarm(alarm.id))}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#6B6A7D' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B6A7D')}
              aria-label="Delete alarm"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
