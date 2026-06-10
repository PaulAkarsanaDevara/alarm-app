export type RepeatDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export interface Alarm {
  id: string
  label: string
  time: string // "HH:MM"
  enabled: boolean
  repeat: RepeatDay[]
  sound: AlarmSound
  customSoundDataUrl?: string | null
  customSoundName?: string | null
  snoozeDuration: number // minutes
  createdAt: number
  ringing?: boolean
  snoozedUntil?: number | null
}

export type AlarmSound = 'gentle' | 'classic' | 'digital' | 'birds' | 'custom'

export interface AlarmState {
  alarms: Alarm[]
  activeAlarmId: string | null
  currentTime: string
  modalOpen: boolean
  editingAlarm: Alarm | null
  recentlyDeleted: Alarm | null
}
