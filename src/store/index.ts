import { configureStore } from '@reduxjs/toolkit'
import alarmReducer from './alarmSlice'

export const store = configureStore({
  reducer: {
    alarm: alarmReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
