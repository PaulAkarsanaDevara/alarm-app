import { useEffect, useRef, useState, useCallback } from 'react'
import { Plus, AlarmCheck, Bell, BellOff, Palette } from 'lucide-react'
import { useAppDispatch, useAppSelector } from './hooks'
import { openModal, tickTime, triggerAlarm, undoDelete, clearRecentlyDeleted } from './store/alarmSlice'
import { getCurrentTime, shouldAlarmRing, getMinutesUntil, formatMinutes } from './utils'
import { requestNotificationPermission, showAlarmNotification, getNotificationPermission } from './utils/notifications'
import loadable from '@loadable/component'

const AnalogClock    = loadable(() => import('./components/AnalogClock'))
const DigitalClock   = loadable(() => import('./components/DigitalClock'))
const AlarmCard      = loadable(() => import('./components/AlarmCard'))
const AlarmModal     = loadable(() => import('./components/AlarmModal'))
const RingingOverlay = loadable(() => import('./components/RingingOverlay'))
const ThemePanel     = loadable(() => import('./components/ThemePanel'))

export default function App() {
  const dispatch = useAppDispatch()
  const { alarms, recentlyDeleted } = useAppSelector(s => s.alarm)
  const hasRinging = alarms.some(a => a.ringing)
  const toastTimerRef = useRef<number | null>(null)
  const alarmsRef = useRef(alarms)
  alarmsRef.current = alarms

  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(
    () => getNotificationPermission()
  )
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [themePanelOpen, setThemePanelOpen] = useState(false)

  const [clockView, setClockView] = useState<'analog' | 'digital'>(
    () => (localStorage.getItem('alarm-clock-view') as 'analog' | 'digital') ?? 'analog'
  )

  const toggleClock = useCallback((view: 'analog' | 'digital') => {
    setClockView(view)
    localStorage.setItem('alarm-clock-view', view)
  }, [])

  async function handleAllowNotifications() {
    const result = await requestNotificationPermission()
    setNotifPermission(result)
  }

  function checkAlarms() {
    const now = getCurrentTime()
    dispatch(tickTime(now))
    alarmsRef.current.forEach(alarm => {
      if (!alarm.enabled || alarm.ringing) return
      if (shouldAlarmRing(alarm.time, alarm.repeat, alarm.snoozedUntil)) {
        dispatch(triggerAlarm(alarm.id))
        showAlarmNotification(alarm.id, alarm.label, alarm.time)
      }
    })
  }

  useEffect(() => {
    const t = setInterval(checkAlarms, 5000)
    checkAlarms()
    return () => clearInterval(t)
  }, [dispatch])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') checkAlarms()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [dispatch])

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

  const showNotifBanner = !bannerDismissed && notifPermission !== null && notifPermission !== 'granted'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <RingingOverlay />
      <AlarmModal />

      {/* Click-outside backdrop for theme panel */}
      {themePanelOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setThemePanelOpen(false)} />
      )}

      <div className="max-w-lg mx-auto px-4 pb-28">
        {/* Top bar: theme toggle */}
        <div className="relative flex justify-end pt-4">
          <button
            onClick={() => setThemePanelOpen(p => !p)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: themePanelOpen ? 'var(--accent)' : 'var(--muted)' }}
            aria-label="Tema"
          >
            <Palette size={18} />
          </button>
          {themePanelOpen && <ThemePanel />}
        </div>

        {/* Notification permission banner */}
        {showNotifBanner && (
          <div
            className="mt-2 flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {notifPermission === 'denied'
              ? <BellOff size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              : <Bell size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            }
            <p className="text-sm flex-1" style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
              {notifPermission === 'denied'
                ? 'Notifikasi diblokir. Aktifkan melalui pengaturan browser.'
                : 'Izinkan notifikasi agar alarm berbunyi di background.'}
            </p>
            {notifPermission === 'default' && (
              <button
                onClick={handleAllowNotifications}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl flex-shrink-0"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent-soft)', fontFamily: 'Inter, sans-serif' }}
              >
                Izinkan
              </button>
            )}
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
              style={{ color: 'var(--muted-3)', fontFamily: 'Inter, sans-serif' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Clock */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {clockView === 'analog' ? <AnalogClock ringing={hasRinging} /> : <DigitalClock />}

          {/* Clock view toggle */}
          <div
            className="flex items-center p-1 rounded-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {(['analog', 'digital'] as const).map(view => (
              <button
                key={view}
                onClick={() => toggleClock(view)}
                className="px-5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: clockView === view ? 'var(--accent-bg)' : 'transparent',
                  color: clockView === view ? 'var(--accent-soft)' : 'var(--muted-2)',
                }}
              >
                {view === 'analog' ? 'Analog' : 'Digital'}
              </button>
            ))}
          </div>
        </div>

        {/* Next alarm banner */}
        {nextAlarmEntry && !hasRinging && (
          <div
            className="mt-5 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
              Alarm berikutnya
              {nextAlarmEntry.alarm.label ? ` "${nextAlarmEntry.alarm.label}"` : ''} dalam
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent-soft)', fontFamily: 'Inter, sans-serif' }}>
              {formatMinutes(nextAlarmEntry.mins)}
            </span>
          </div>
        )}

        {/* Alarms */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}
            >
              {alarms.length > 0 ? `${alarms.length} Alarm` : 'Tidak Ada Alarm'}
            </h2>
          </div>

          {alarms.length === 0 ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
              style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
            >
              <AlarmCheck size={32} style={{ color: 'var(--muted-3)' }} />
              <p className="text-sm" style={{ color: 'var(--muted-3)', fontFamily: 'Inter, sans-serif' }}>
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
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)' }}
                >
                  <AlarmCheck size={16} style={{ color: 'var(--muted-3)', flexShrink: 0 }} />
                  <p className="text-sm" style={{ color: 'var(--muted-3)', fontFamily: 'Inter, sans-serif' }}>
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
              background: 'var(--surface-2)',
              border: '1px solid var(--accent-bg)',
              pointerEvents: 'auto',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <span className="text-sm" style={{ color: 'var(--text-2)' }}>
              Alarm{recentlyDeleted.label ? ` "${recentlyDeleted.label}"` : ''} dihapus
            </span>
            <button
              onClick={() => {
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
                dispatch(undoDelete())
              }}
              className="text-sm font-semibold px-3 py-1 rounded-xl transition-colors"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent-soft)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
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
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 32px rgba(var(--accent-rgb),0.45)',
          }}
        >
          <Plus size={20} />
          Alarm Baru
        </button>
      </div>
    </div>
  )
}
