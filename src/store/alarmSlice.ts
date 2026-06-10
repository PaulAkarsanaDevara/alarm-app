import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Alarm, AlarmState } from '../types'
import { generateId, getCurrentTime } from '../utils'

const STORAGE_KEY = 'alarm-app-alarms'

function loadAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Alarm[]) : []
  } catch {
    return []
  }
}

function saveAlarms(alarms: Alarm[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms))
}

const initialState: AlarmState = {
  alarms: loadAlarms(),
  activeAlarmId: null,
  currentTime: getCurrentTime(),
  modalOpen: false,
  editingAlarm: null,
}

const alarmSlice = createSlice({
  name: 'alarm',
  initialState,
  reducers: {
    addAlarm(state, action: PayloadAction<Omit<Alarm, 'id' | 'createdAt' | 'ringing'>>) {
      const newAlarm: Alarm = {
        ...action.payload,
        id: generateId(),
        createdAt: Date.now(),
        ringing: false,
        snoozedUntil: null,
      }
      state.alarms.push(newAlarm)
      saveAlarms(state.alarms)
    },
    updateAlarm(state, action: PayloadAction<Alarm>) {
      const idx = state.alarms.findIndex(a => a.id === action.payload.id)
      if (idx !== -1) {
        state.alarms[idx] = { ...action.payload, ringing: false, snoozedUntil: null }
        saveAlarms(state.alarms)
      }
    },
    deleteAlarm(state, action: PayloadAction<string>) {
      state.alarms = state.alarms.filter(a => a.id !== action.payload)
      if (state.activeAlarmId === action.payload) state.activeAlarmId = null
      saveAlarms(state.alarms)
    },
    toggleAlarm(state, action: PayloadAction<string>) {
      const alarm = state.alarms.find(a => a.id === action.payload)
      if (alarm) {
        alarm.enabled = !alarm.enabled
        alarm.ringing = false
        alarm.snoozedUntil = null
        saveAlarms(state.alarms)
      }
    },
    tickTime(state, action: PayloadAction<string>) {
      state.currentTime = action.payload
    },
    triggerAlarm(state, action: PayloadAction<string>) {
      const alarm = state.alarms.find(a => a.id === action.payload)
      if (alarm) {
        alarm.ringing = true
        state.activeAlarmId = action.payload
      }
    },
    dismissAlarm(state, action: PayloadAction<string>) {
      const alarm = state.alarms.find(a => a.id === action.payload)
      if (alarm) {
        alarm.ringing = false
        alarm.snoozedUntil = null
        // If no repeat, disable after ringing
        if (alarm.repeat.length === 0) alarm.enabled = false
      }
      if (state.activeAlarmId === action.payload) state.activeAlarmId = null
      saveAlarms(state.alarms)
    },
    snoozeAlarm(state, action: PayloadAction<{ id: string; minutes: number }>) {
      const { id, minutes } = action.payload
      const alarm = state.alarms.find(a => a.id === id)
      if (alarm) {
        alarm.ringing = false
        alarm.snoozedUntil = Date.now() + minutes * 60 * 1000
      }
      if (state.activeAlarmId === id) state.activeAlarmId = null
      saveAlarms(state.alarms)
    },
    openModal(state, action: PayloadAction<Alarm | null>) {
      state.modalOpen = true
      state.editingAlarm = action.payload
    },
    closeModal(state) {
      state.modalOpen = false
      state.editingAlarm = null
    },
  },
})

export const {
  addAlarm, updateAlarm, deleteAlarm, toggleAlarm,
  tickTime, triggerAlarm, dismissAlarm, snoozeAlarm,
  openModal, closeModal,
} = alarmSlice.actions

export default alarmSlice.reducer
