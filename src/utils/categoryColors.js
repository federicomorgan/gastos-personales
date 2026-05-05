const DEFAULTS = {
  Comida: '#E63946',
  Alquiler: '#d97706',
  Transporte: '#2563eb',
  Salud: '#7c3aed',
  'Educación': '#0891b2',
  Entretenimiento: '#c2410c',
  Ropa: '#65a30d',
  Servicios: '#16a34a',
  Otro: '#6b7280',
  Sueldo: '#22c55e',
  Freelance: '#3b82f6',
  Inversiones: '#f59e0b',
}

const STORAGE_KEY = 'categoryColors'

export function getCategoryColors() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return { ...DEFAULTS, ...stored }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setCategoryColor(category, color) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    stored[category] = color
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {}
}

export function getColor(category) {
  return getCategoryColors()[category] || '#6b7280'
}

export const FALLBACK_COLORS = Object.values(DEFAULTS)
