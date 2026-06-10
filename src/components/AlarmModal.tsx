import { useState, useEffect, useRef } from 'react'
import { X, Upload, Play, Square } from 'lucide-react'
import type { RepeatDay, AlarmSound } from '../types'
import { useAppDispatch, useAppSelector } from '../hooks'
import { addAlarm, updateAlarm, closeModal } from '../store/alarmSlice'
import { getSoundLabel } from '../utils'
import { playSound, SOUND_PREVIEW_DURATION } from '../utils/audio'

const DAYS: RepeatDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BUILT_IN_SOUNDS: AlarmSound[] = ['gentle', 'classic', 'digital', 'birds']
const SNOOZE_OPTIONS = [1, 5, 10, 15, 20, 30]
const MAX_FILE_BYTES = 2 * 1024 * 1024

export default function AlarmModal() {
  const dispatch = useAppDispatch()
  const { modalOpen, editingAlarm } = useAppSelector(s => s.alarm)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [time, setTime] = useState('07:00')
  const [label, setLabel] = useState('')
  const [repeat, setRepeat] = useState<RepeatDay[]>([])
  const [sound, setSound] = useState<AlarmSound>('gentle')
  const [customSoundDataUrl, setCustomSoundDataUrl] = useState<string | null>(null)
  const [customSoundName, setCustomSoundName] = useState<string | null>(null)
  const [snoozeDuration, setSnoozeDuration] = useState(5)

  const [previewingSound, setPreviewingSound] = useState<AlarmSound | null>(null)
  const previewCtxRef   = useRef<AudioContext | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const previewTimerRef = useRef<number | null>(null)

  function stopPreview() {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    if (previewCtxRef.current)   { previewCtxRef.current.close(); previewCtxRef.current = null }
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null }
    setPreviewingSound(null)
  }

  function handlePreview(s: AlarmSound) {
    if (previewingSound === s) { stopPreview(); return }
    stopPreview()
    if (s === 'custom') {
      if (!customSoundDataUrl) return
      const audio = new Audio(customSoundDataUrl)
      audio.volume = 0.5
      previewAudioRef.current = audio
      audio.play()
      setPreviewingSound('custom')
      previewTimerRef.current = window.setTimeout(stopPreview, SOUND_PREVIEW_DURATION.custom)
    } else {
      const ctx = new AudioContext()
      previewCtxRef.current = ctx
      playSound(ctx, s, ctx.destination)
      setPreviewingSound(s)
      previewTimerRef.current = window.setTimeout(() => {
        ctx.close()
        previewCtxRef.current = null
        setPreviewingSound(null)
      }, SOUND_PREVIEW_DURATION[s])
    }
  }

  useEffect(() => { if (!modalOpen) stopPreview() }, [modalOpen])

  useEffect(() => {
    if (editingAlarm) {
      setTime(editingAlarm.time)
      setLabel(editingAlarm.label)
      setRepeat(editingAlarm.repeat)
      setSound(editingAlarm.sound)
      setCustomSoundDataUrl(editingAlarm.customSoundDataUrl ?? null)
      setCustomSoundName(editingAlarm.customSoundName ?? null)
      setSnoozeDuration(editingAlarm.snoozeDuration ?? 5)
    } else {
      setTime('07:00')
      setLabel('')
      setRepeat([])
      setSound('gentle')
      setCustomSoundDataUrl(null)
      setCustomSoundName(null)
      setSnoozeDuration(5)
    }
  }, [editingAlarm, modalOpen])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      alert('File terlalu besar. Harap upload audio di bawah 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      setCustomSoundDataUrl(ev.target?.result as string)
      setCustomSoundName(file.name)
      setSound('custom')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function clearCustomSound() {
    setCustomSoundDataUrl(null)
    setCustomSoundName(null)
    setSound('gentle')
  }

  function toggleDay(day: RepeatDay) {
    setRepeat(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  function handleSave() {
    if (!time) return
    const soundData = sound === 'custom'
      ? { customSoundDataUrl, customSoundName }
      : { customSoundDataUrl: null, customSoundName: null }
    if (editingAlarm) {
      dispatch(updateAlarm({ ...editingAlarm, time, label, repeat, sound, snoozeDuration, ...soundData }))
    } else {
      dispatch(addAlarm({ time, label, repeat, sound, snoozeDuration, enabled: true, ...soundData }))
    }
    dispatch(closeModal())
  }

  if (!modalOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) dispatch(closeModal()) }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 md:p-7 flex flex-col gap-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
            {editingAlarm ? 'Edit Alarm' : 'Alarm Baru'}
          </h2>
          <button
            onClick={() => dispatch(closeModal())}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Time */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Waktu
          </label>
          <div
            className="flex items-center justify-center rounded-2xl px-4 py-4 gap-1"
            style={{ background: 'var(--bg)' }}
          >
            <input
              type="number" min={0} max={23}
              value={time.split(':')[0]}
              onChange={e => {
                const h = Math.min(23, Math.max(0, parseInt(e.target.value) || 0))
                setTime(`${String(h).padStart(2, '0')}:${time.split(':')[1]}`)
              }}
              onFocus={e => e.target.select()}
              className="w-20 text-4xl text-center font-bold bg-transparent border-none outline-none"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}
            />
            <span
              className="text-4xl font-bold select-none"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}
            >
              :
            </span>
            <input
              type="number" min={0} max={59}
              value={time.split(':')[1]}
              onChange={e => {
                const m = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                setTime(`${time.split(':')[0]}:${String(m).padStart(2, '0')}`)
              }}
              onFocus={e => e.target.select()}
              className="w-20 text-4xl text-center font-bold bg-transparent border-none outline-none"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* Label */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Label
          </label>
          <input
            type="text"
            placeholder="mis. Bangun, Lari pagi…"
            value={label}
            onChange={e => setLabel(e.target.value)}
            maxLength={40}
            className="w-full rounded-xl px-4 py-3 outline-none border"
            style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              borderColor: 'var(--border)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Repeat */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Ulangi
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: repeat.includes(day) ? 'var(--accent-bg)' : 'var(--bg)',
                  color: repeat.includes(day) ? 'var(--accent-soft)' : 'var(--muted)',
                  border: `1px solid ${repeat.includes(day) ? 'var(--accent)' : 'var(--border)'}`,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {day}
              </button>
            ))}
            {repeat.length > 0 && (
              <button
                onClick={() => setRepeat([])}
                className="px-3 py-1.5 rounded-xl text-sm transition-colors"
                style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}
              >
                Hapus
              </button>
            )}
          </div>
          {repeat.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--muted-3)' }}>Tidak berulang — berbunyi sekali</p>
          )}
        </div>

        {/* Snooze */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Durasi Tunda
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {SNOOZE_OPTIONS.map(min => (
              <button
                key={min}
                onClick={() => setSnoozeDuration(min)}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: snoozeDuration === min ? 'var(--accent-bg)' : 'var(--bg)',
                  color: snoozeDuration === min ? 'var(--accent-soft)' : 'var(--muted)',
                  border: `1px solid ${snoozeDuration === min ? 'var(--accent)' : 'var(--border)'}`,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {min}m
              </button>
            ))}
          </div>
        </div>

        {/* Sound */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Suara
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BUILT_IN_SOUNDS.map(s => (
              <div
                key={s}
                className="flex items-stretch rounded-xl overflow-hidden"
                style={{ border: `1px solid ${sound === s ? 'var(--accent)' : 'var(--border)'}` }}
              >
                <button
                  onClick={() => setSound(s)}
                  className="flex-1 px-3 py-2.5 text-sm font-medium text-left transition-all duration-200"
                  style={{
                    background: sound === s ? 'var(--accent-bg)' : 'var(--bg)',
                    color: sound === s ? 'var(--accent-soft)' : 'var(--muted)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {getSoundLabel(s)}
                </button>
                <button
                  onClick={() => handlePreview(s)}
                  className="flex items-center justify-center px-2.5 transition-all duration-200"
                  style={{
                    background: sound === s ? 'var(--accent-bg)' : 'var(--bg)',
                    borderLeft: `1px solid ${sound === s ? 'var(--accent-bg)' : 'var(--border)'}`,
                    color: previewingSound === s ? 'var(--accent)' : 'var(--muted-2)',
                  }}
                  title={previewingSound === s ? 'Stop' : 'Preview'}
                >
                  {previewingSound === s ? <Square size={11} /> : <Play size={11} />}
                </button>
              </div>
            ))}
          </div>

          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
          {sound === 'custom' && customSoundName ? (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)' }}
            >
              <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--accent-soft)', fontFamily: 'Inter, sans-serif' }}>
                📁 {customSoundName}
              </span>
              <button
                onClick={() => handlePreview('custom')}
                className="shrink-0 p-1 rounded-lg transition-colors"
                style={{ color: previewingSound === 'custom' ? 'var(--accent)' : 'var(--muted)' }}
                title={previewingSound === 'custom' ? 'Stop' : 'Preview'}
              >
                {previewingSound === 'custom' ? <Square size={12} /> : <Play size={12} />}
              </button>
              <button
                onClick={clearCustomSound}
                className="shrink-0 p-1 rounded-lg transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                background: 'var(--bg)',
                color: 'var(--muted)',
                border: '1px dashed var(--border)',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent-soft)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--muted)'
              }}
            >
              <Upload size={14} />
              Upload suara kustom (maks 2 MB)
            </button>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {editingAlarm ? 'Simpan Perubahan' : 'Buat Alarm'}
        </button>
      </div>
    </div>
  )
}
