export type ThemePreference = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'helpup-theme'

export function getThemePreference(): ThemePreference {
  const preference = localStorage.getItem(STORAGE_KEY)
  return preference === 'light' || preference === 'dark' ? preference : 'auto'
}

export function applyThemePreference(preference: ThemePreference): void {
  if (preference === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', preference)
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, preference)
  applyThemePreference(preference)
}
