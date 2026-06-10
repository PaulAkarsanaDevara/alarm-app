import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ColorScheme = 'dark' | 'light'
export type AccentKey = 'violet' | 'blue' | 'teal' | 'rose' | 'amber'

interface AccentPreset {
  hex: string
  dark: string
  soft: string
  bgDark: string
  bgLight: string
  rgb: string
}

export const ACCENT_PRESETS: Record<AccentKey, AccentPreset> = {
  violet: { hex: '#7C6FF7', dark: '#5B52C4', soft: '#A89FF7', bgDark: '#3D3A6B', bgLight: '#ECEAFF', rgb: '124,111,247' },
  blue:   { hex: '#5B8FF7', dark: '#3A6BD4', soft: '#8AABF7', bgDark: '#1E3154', bgLight: '#E8EEFF', rgb: '91,143,247'  },
  teal:   { hex: '#4ECDC4', dark: '#35A49C', soft: '#80DDD8', bgDark: '#1A3D3B', bgLight: '#E0FAF8', rgb: '78,205,196'  },
  rose:   { hex: '#F765A3', dark: '#D44280', soft: '#FA9AC5', bgDark: '#3D1A2D', bgLight: '#FFE8F3', rgb: '247,101,163' },
  amber:  { hex: '#F59E0B', dark: '#D97706', soft: '#FBD07A', bgDark: '#3D2E0D', bgLight: '#FEF3C7', rgb: '245,158,11'  },
}

interface ThemeContextType {
  colorScheme: ColorScheme
  accentKey: AccentKey
  setColorScheme: (s: ColorScheme) => void
  setAccentKey: (k: AccentKey) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

function applyTheme(scheme: ColorScheme, key: AccentKey) {
  const root = document.documentElement
  const p = ACCENT_PRESETS[key]
  root.setAttribute('data-theme', scheme)
  root.style.setProperty('--accent',      p.hex)
  root.style.setProperty('--accent-dark', p.dark)
  root.style.setProperty('--accent-soft', p.soft)
  root.style.setProperty('--accent-bg',   scheme === 'dark' ? p.bgDark : p.bgLight)
  root.style.setProperty('--accent-rgb',  p.rgb)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setSchemeState] = useState<ColorScheme>(
    () => (localStorage.getItem('theme-scheme') as ColorScheme) ?? 'dark'
  )
  const [accentKey, setAccentState] = useState<AccentKey>(
    () => (localStorage.getItem('theme-accent') as AccentKey) ?? 'violet'
  )

  useEffect(() => { applyTheme(colorScheme, accentKey) }, [colorScheme, accentKey])

  function setColorScheme(s: ColorScheme) {
    localStorage.setItem('theme-scheme', s)
    setSchemeState(s)
  }

  function setAccentKey(k: AccentKey) {
    localStorage.setItem('theme-accent', k)
    setAccentState(k)
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, accentKey, setColorScheme, setAccentKey }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
