export type ThemePreference = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'helpup-theme'
const FAVICON_LIGHT = '/favicon_light.svg'
const FAVICON_DARK = '/favicon_dark.svg'

export function getThemePreference(): ThemePreference {
  const preference = localStorage.getItem(STORAGE_KEY)
  return preference === 'light' || preference === 'dark' ? preference : 'auto'
}

function updateFavicon(preference: ThemePreference): void {
  const isDark =
    preference === 'dark' ||
    (preference === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (favicon) favicon.href = isDark ? FAVICON_DARK : FAVICON_LIGHT
}

export function applyThemePreference(preference: ThemePreference): void {
  if (preference === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', preference)
  }
  updateFavicon(preference)
}

export function saveThemePreference(preference: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, preference)
  applyThemePreference(preference)
}
