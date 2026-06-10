import { useState, useEffect, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import type { RepeatDay, AlarmSound } from '../types'
import { useAppDispatch, useAppSelector } from '../hooks'
import { addAlarm, updateAlarm, closeModal } from '../store/alarmSlice'
import { getSoundLabel } from '../utils'

const DAYS: RepeatDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BUILT_IN_SOUNDS: AlarmSound[] = ['gentle', 'classic', 'digital', 'birds']
const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB

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

  useEffect(() => {
    if (editingAlarm) {
      setTime(editingAlarm.time)
      setLabel(editingAlarm.label)
      setRepeat(editingAlarm.repeat)
      setSound(editingAlarm.sound)
      setCustomSoundDataUrl(editingAlarm.customSoundDataUrl ?? null)
      setCustomSoundName(editingAlarm.customSoundName ?? null)
    } else {
      setTime('07:00')
      setLabel('')
      setRepeat([])
      setSound('gentle')
      setCustomSoundDataUrl(null)
      setCustomSoundName(null)
    }
  }, [editingAlarm, modalOpen])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      alert('File too large. Please upload an audio file under 2 MB.')
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
    setRepeat(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function handleSave() {
    if (!time) return
    const soundData = sound === 'custom'
      ? { customSoundDataUrl, customSoundName }
      : { customSoundDataUrl: null, customSoundName: null }
    if (editingAlarm) {
      dispatch(updateAlarm({ ...editingAlarm, time, label, repeat, sound, ...soundData }))
    } else {
      dispatch(addAlarm({ time, label, repeat, sound, enabled: true, ...soundData }))
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
        style={{ background: '#16161F', border: '1px solid #2A2A3A' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: '#F0EFF8', fontFamily: 'Inter, sans-serif' }}>
            {editingAlarm ? 'Edit Alarm' : 'New Alarm'}
          </h2>
          <button
            onClick={() => dispatch(closeModal())}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: '#6B6A7D' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F0EFF8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B6A7D')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Time Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6A7D' }}>
            Time
          </label>
          <div
            className="flex items-center justify-center rounded-2xl px-4 py-4 gap-1"
            style={{ background: '#0D0D14' }}
          >
            <input
              type="number"
              min={0}
              max={23}
              value={time.split(':')[0]}
              onChange={e => {
                const h = Math.min(23, Math.max(0, parseInt(e.target.value) || 0))
                setTime(`${String(h).padStart(2, '0')}:${time.split(':')[1]}`)
              }}
              onFocus={e => e.target.select()}
              className="w-20 text-4xl text-center font-bold bg-transparent border-none outline-none"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: '#F0EFF8' }}
            />
            <span
              className="text-4xl font-bold select-none"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: '#7C6FF7' }}
            >
              :
            </span>
            <input
              type="number"
              min={0}
              max={59}
              value={time.split(':')[1]}
              onChange={e => {
                const m = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                setTime(`${time.split(':')[0]}:${String(m).padStart(2, '0')}`)
              }}
              onFocus={e => e.target.select()}
              className="w-20 text-4xl text-center font-bold bg-transparent border-none outline-none"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: '#F0EFF8' }}
            />
          </div>
        </div>

        {/* Label */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6A7D' }}>
            Label
          </label>
          <input
            type="text"
            placeholder="e.g. Wake up, Morning run…"
            value={label}
            onChange={e => setLabel(e.target.value)}
            maxLength={40}
            className="w-full rounded-xl px-4 py-3 outline-none border"
            style={{
              background: '#0D0D14',
              color: '#F0EFF8',
              borderColor: '#2A2A3A',
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#7C6FF7')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2A2A3A')}
          />
        </div>

        {/* Repeat */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6A7D' }}>
            Repeat
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: repeat.includes(day) ? '#3D3A6B' : '#0D0D14',
                  color: repeat.includes(day) ? '#A89FF7' : '#6B6A7D',
                  border: `1px solid ${repeat.includes(day) ? '#7C6FF7' : '#2A2A3A'}`,
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
                style={{ color: '#6B6A7D', fontFamily: 'Inter, sans-serif' }}
              >
                Clear
              </button>
            )}
          </div>
          {repeat.length === 0 && (
            <p className="text-xs" style={{ color: '#3D3A6B' }}>No repeat — rings once</p>
          )}
        </div>

        {/* Sound */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6A7D' }}>
            Sound
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BUILT_IN_SOUNDS.map(s => (
              <button
                key={s}
                onClick={() => setSound(s)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200"
                style={{
                  background: sound === s ? '#3D3A6B' : '#0D0D14',
                  color: sound === s ? '#A89FF7' : '#6B6A7D',
                  border: `1px solid ${sound === s ? '#7C6FF7' : '#2A2A3A'}`,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {getSoundLabel(s)}
              </button>
            ))}
          </div>

          {/* Custom upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          {sound === 'custom' && customSoundName ? (
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{ background: '#3D3A6B', border: '1px solid #7C6FF7' }}
            >
              <span className="text-sm font-medium truncate" style={{ color: '#A89FF7', fontFamily: 'Inter, sans-serif' }}>
                📁 {customSoundName}
              </span>
              <button
                onClick={clearCustomSound}
                className="ml-2 shrink-0"
                style={{ color: '#6B6A7D' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6B6A7D')}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                background: '#0D0D14',
                color: '#6B6A7D',
                border: '1px dashed #2A2A3A',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#7C6FF7'
                e.currentTarget.style.color = '#A89FF7'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#2A2A3A'
                e.currentTarget.style.color = '#6B6A7D'
              }}
            >
              <Upload size={14} />
              Upload custom sound (max 2 MB)
            </button>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #7C6FF7 0%, #5B52C4 100%)',
            color: '#F0EFF8',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {editingAlarm ? 'Save Changes' : 'Set Alarm'}
        </button>
      </div>
    </div>
  )
}
