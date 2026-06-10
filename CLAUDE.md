# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check then build for production (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test suite is configured.

## Architecture

React 19 + TypeScript SPA using Vite, TailwindCSS v4, and Redux Toolkit. No backend — all state is client-side with localStorage persistence.

### State

All state lives in a single Redux slice: `src/store/alarmSlice.ts`. Every mutation calls `saveAlarms()` to sync to `localStorage` before returning. The slice manages:
- `alarms[]` — the list, loaded from localStorage on startup
- `activeAlarmId` — the currently ringing alarm (drives `RingingOverlay`)
- `currentTime` — HH:MM string updated by the polling interval
- `modalOpen` / `editingAlarm` — create/edit modal state

Typed Redux hooks are in `src/hooks/index.ts` (`useAppDispatch`, `useAppSelector`). Always use these instead of raw `useDispatch`/`useSelector`.

### Alarm polling

`App.tsx` runs a `setInterval` every 5 seconds that calls `shouldAlarmRing()` (in `src/utils/index.ts`) for each enabled, non-ringing alarm. When it returns true, it dispatches `triggerAlarm(id)`, which sets `alarm.ringing = true` and `activeAlarmId`. `RingingOverlay` reads `activeAlarmId` to show the ringing UI.

### Alarm lifecycle

- **Dismiss**: clears `ringing`/`snoozedUntil`; disables the alarm if it has no repeat days.
- **Snooze**: sets `snoozedUntil = Date.now() + 5 minutes`; `shouldAlarmRing` skips it until that timestamp passes.
- **One-time alarm** (empty `repeat[]`): fires once then auto-disables on dismiss.

### Types

`src/types/index.ts` is the single source of truth for `Alarm`, `AlarmState`, `AlarmSound`, and `RepeatDay`. `AlarmSound` is `'gentle' | 'classic' | 'digital' | 'birds'` — no actual audio files are wired up yet.

### Styling

Inline `style` props are used alongside Tailwind for the dark color palette. The design uses a fixed color set (`#0D0D14` background, `#7C6FF7` accent, `#F0EFF8` text) — prefer keeping new UI consistent with these rather than adding new Tailwind color classes.
