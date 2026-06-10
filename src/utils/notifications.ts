export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function showAlarmNotification(id: string, label: string, time: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const n = new Notification(label || 'Alarm', {
    body: `Waktu: ${time} — ketuk untuk membuka app`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: `alarm-${id}`,
    requireInteraction: true,
    silent: false,
  })
  n.onclick = () => {
    window.focus()
    n.close()
  }
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!('Notification' in window)) return null
  return Notification.permission
}
