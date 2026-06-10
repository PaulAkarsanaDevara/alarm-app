import type { AlarmSound } from '../types'

export function playSound(ctx: AudioContext, sound: AlarmSound, output: AudioNode): void {
  switch (sound) {
    case 'gentle': {
      ;[523, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(output)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.3)
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3)
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.3 + 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.7)
        osc.start(ctx.currentTime + i * 0.3)
        osc.stop(ctx.currentTime + i * 0.3 + 0.7)
      })
      break
    }
    case 'classic': {
      ;[0, 0.18].forEach(offset => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(output)
        osc.type = 'square'
        osc.frequency.setValueAtTime(880, ctx.currentTime + offset)
        gain.gain.setValueAtTime(0.12, ctx.currentTime + offset)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.14)
        osc.start(ctx.currentTime + offset)
        osc.stop(ctx.currentTime + offset + 0.14)
      })
      break
    }
    case 'digital': {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(output)
      osc.type = 'square'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.09)
      break
    }
    case 'birds': {
      ;[0, 0.2, 0.4].forEach((offset, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(output)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1500 + i * 200, ctx.currentTime + offset)
        osc.frequency.exponentialRampToValueAtTime(2200 + i * 100, ctx.currentTime + offset + 0.14)
        gain.gain.setValueAtTime(0.14, ctx.currentTime + offset)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.16)
        osc.start(ctx.currentTime + offset)
        osc.stop(ctx.currentTime + offset + 0.16)
      })
      break
    }
    case 'custom':
      break
  }
}

export const SOUND_PREVIEW_DURATION: Record<AlarmSound, number> = {
  gentle: 1500,
  classic: 600,
  digital: 400,
  birds: 900,
  custom: 3000,
}
