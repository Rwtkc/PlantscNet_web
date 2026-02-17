import type { ModuleId } from '@/types/module'

export interface NavigationItem {
  id: ModuleId
  label: string
  path: `/${ModuleId}`
}

export const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'Home', path: '/home' },
  { id: 'browse', label: 'Browse', path: '/browse' },
  { id: 'search', label: 'Search', path: '/search' },
  { id: 'download', label: 'Download', path: '/download' },
  { id: 'contact', label: 'Contact', path: '/contact' },
  { id: 'help', label: 'Help', path: '/help' },
]
