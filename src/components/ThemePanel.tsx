import { Moon, Sun } from 'lucide-react'
import { useTheme, ACCENT_PRESETS, type AccentKey } from '../context/ThemeContext'

const ACCENT_KEYS: AccentKey[] = ['violet', 'blue', 'teal', 'rose', 'amber']

export default function ThemePanel() {
  const { colorScheme, accentKey, setColorScheme, setAccentKey } = useTheme()

  return (
    <div
      className="absolute right-0 top-10 z-40 w-60 rounded-2xl p-4 flex flex-col gap-4 shadow-2xl"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      {/* Mode */}
      <div className="flex flex-col gap-2">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}
        >
          Mode
        </span>
        <div
          className="flex p-1 rounded-xl gap-1"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          {(['dark', 'light'] as const).map(scheme => (
            <button
              key={scheme}
              onClick={() => setColorScheme(scheme)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: colorScheme === scheme ? 'var(--accent-bg)' : 'transparent',
                color: colorScheme === scheme ? 'var(--accent-soft)' : 'var(--muted)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {scheme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
              {scheme === 'dark' ? 'Gelap' : 'Terang'}
            </button>
          ))}
        </div>
      </div>

      {/* Accent */}
      <div className="flex flex-col gap-2">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}
        >
          Warna Aksen
        </span>
        <div className="flex gap-2">
          {ACCENT_KEYS.map(key => (
            <button
              key={key}
              onClick={() => setAccentKey(key)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: ACCENT_PRESETS[key].hex,
                boxShadow: accentKey === key
                  ? `0 0 0 2px var(--bg), 0 0 0 4px ${ACCENT_PRESETS[key].hex}`
                  : 'none',
                transform: accentKey === key ? 'scale(1.18)' : 'scale(1)',
              }}
              title={key}
            >
              {accentKey === key && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
