import { useEffect, useRef } from 'react'
import { Plus, AlarmCheck } from 'lucide-react'
import { useAppDispatch, useAppSelector } from './hooks'
import { openModal, tickTime, triggerAlarm, undoDelete, clearRecentlyDeleted } from './store/alarmSlice'
import { getCurrentTime, shouldAlarmRing, getMinutesUntil, formatMinutes } from './utils'
import AnalogClock from './components/AnalogClock'
import DigitalClock from './components/DigitalClock'
import AlarmCard from './components/AlarmCard'
import AlarmModal from './components/AlarmModal'
import RingingOverlay from './components/RingingOverlay'

export default function App() {
  const dispatch = useAppDispatch()
  const { alarms, recentlyDeleted } = useAppSelector(s => s.alarm)
  const hasRinging = alarms.some(a => a.ringing)
  const toastTimerRef = useRef<number | null>(null)

  useEffect(() => {
    function check() {
      const now = getCurrentTime()
      dispatch(tickTime(now))
      alarms.forEach(alarm => {
        if (!alarm.enabled || alarm.ringing) return
        if (shouldAlarmRing(alarm.time, alarm.repeat, alarm.snoozedUntil)) {
          dispatch(triggerAlarm(alarm.id))
        }
      })
    }

    const t = setInterval(check, 5000)
    check()
    return () => clearInterval(t)
  }, [alarms, dispatch])

  useEffect(() => {
    if (!recentlyDeleted) return
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      dispatch(clearRecentlyDeleted())
    }, 5000)
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }
  }, [recentlyDeleted, dispatch])

  const enabledCount = alarms.filter(a => a.enabled).length
  const sortedAlarms = [...alarms].sort((a, b) => a.time.localeCompare(b.time))

  const nextAlarmEntry = alarms
    .filter(a => a.enabled && !a.ringing)
    .map(a => ({ alarm: a, mins: getMinutesUntil(a.time, a.repeat, a.snoozedUntil) }))
    .filter((x): x is { alarm: typeof x.alarm; mins: number } => x.mins !== null)
    .sort((a, b) => a.mins - b.mins)[0] ?? null

  return (
    <div className="min-h-screen" style={{ background: '#0D0D14' }}>
      <RingingOverlay />
      <AlarmModal />

      <div className="max-w-lg mx-auto px-4 pb-28">
        {/* Header */}
        <div className="pt-8 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlarmCheck size={22} style={{ color: '#7C6FF7' }} />
            <span
              className="text-base font-bold tracking-tight"
              style={{ color: '#F0EFF8', fontFamily: 'Inter, sans-serif' }}
            >
              Alarm
            </span>
          </div>
          {enabledCount > 0 && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: '#3D3A6B', color: '#A89FF7', fontFamily: 'Inter, sans-serif' }}
            >
              {enabledCount} aktif
            </span>
          )}
        </div>

        {/* Clock */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <AnalogClock ringing={hasRinging} />
          <DigitalClock />
        </div>

        {/* Next alarm banner */}
        {nextAlarmEntry && !hasRinging && (
          <div
            className="mt-5 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: '#16161F', border: '1px solid #2A2A3A' }}
          >
            <span className="text-sm" style={{ color: '#6B6A7D', fontFamily: 'Inter, sans-serif' }}>
              Alarm berikutnya
              {nextAlarmEntry.alarm.label ? ` "${nextAlarmEntry.alarm.label}"` : ''} dalam
            </span>
            <span className="text-sm font-semibold" style={{ color: '#A89FF7', fontFamily: 'Inter, sans-serif' }}>
              {formatMinutes(nextAlarmEntry.mins)}
            </span>
          </div>
        )}

        {/* Alarms */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: '#6B6A7D', fontFamily: 'Inter, sans-serif' }}
            >
              {alarms.length > 0 ? `${alarms.length} Alarm` : 'Tidak Ada Alarm'}
            </h2>
          </div>

          {alarms.length === 0 ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
              style={{ background: '#16161F', border: '1px dashed #2A2A3A' }}
            >
              <AlarmCheck size={32} style={{ color: '#3D3A6B' }} />
              <p className="text-sm" style={{ color: '#3D3A6B', fontFamily: 'Inter, sans-serif' }}>
                Belum ada alarm.<br />
                Ketuk + untuk membuat satu.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {sortedAlarms.map(alarm => (
                  <AlarmCard key={alarm.id} alarm={alarm} />
                ))}
              </div>
              {enabledCount === 0 && (
                <div
                  className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: '#16161F', border: '1px solid #1A1A28' }}
                >
                  <AlarmCheck size={16} style={{ color: '#3D3A6B', flexShrink: 0 }} />
                  <p className="text-sm" style={{ color: '#3D3A6B', fontFamily: 'Inter, sans-serif' }}>
                    Semua alarm dimatikan. Aktifkan salah satu untuk mulai.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Undo toast */}
      {recentlyDeleted && (
        <div
          className="fixed bottom-24 left-0 right-0 flex justify-center px-4 z-40"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
            style={{
              background: '#1E1D2E',
              border: '1px solid #3D3A6B',
              pointerEvents: 'auto',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <span className="text-sm" style={{ color: '#9896A8' }}>
              Alarm{recentlyDeleted.label ? ` "${recentlyDeleted.label}"` : ''} dihapus
            </span>
            <button
              onClick={() => {
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
                dispatch(undoDelete())
              }}
              className="text-sm font-semibold px-3 py-1 rounded-xl transition-colors"
              style={{ background: '#3D3A6B', color: '#A89FF7' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4D4A8B')}
              onMouseLeave={e => (e.currentTarget.style.background = '#3D3A6B')}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center sm:left-auto sm:right-8 sm:justify-end px-4">
        <button
          onClick={() => dispatch(openModal(null))}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #7C6FF7 0%, #5B52C4 100%)',
            color: '#F0EFF8',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 32px rgba(124,111,247,0.45)',
          }}
        >
          <Plus size={20} />
          Alarm Baru
        </button>
      </div>
    </div>
  )
}
