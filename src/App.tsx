import { useEffect } from 'react'
import { Plus, AlarmCheck } from 'lucide-react'
import { useAppDispatch, useAppSelector } from './hooks'
import { openModal, tickTime, triggerAlarm } from './store/alarmSlice'
import { getCurrentTime, shouldAlarmRing } from './utils'
import AnalogClock from './components/AnalogClock'
import DigitalClock from './components/DigitalClock'
import AlarmCard from './components/AlarmCard'
import AlarmModal from './components/AlarmModal'
import RingingOverlay from './components/RingingOverlay'

export default function App() {
  const dispatch = useAppDispatch()
  const { alarms } = useAppSelector(s => s.alarm)
  const hasRinging = alarms.some(a => a.ringing)

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

  const enabledCount = alarms.filter(a => a.enabled).length
  const sortedAlarms = [...alarms].sort((a, b) => a.time.localeCompare(b.time))

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
            <div className="flex flex-col gap-3">
              {sortedAlarms.map(alarm => (
                <AlarmCard key={alarm.id} alarm={alarm} />
              ))}
            </div>
          )}
        </div>
      </div>

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
