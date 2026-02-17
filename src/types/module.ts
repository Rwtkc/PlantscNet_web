export type ModuleId = 'home' | 'browse' | 'search' | 'download' | 'contact' | 'help'

export interface ModuleStat {
  label: string
  value: string
}

export interface ModuleHighlight {
  title: string
  description: string
}

export interface ModuleAction {
  label: string
  to: string
}

export interface ModuleContent {
  id: ModuleId
  title: string
  subtitle: string
  description: string
  stats: ModuleStat[]
  highlights: ModuleHighlight[]
  actions: ModuleAction[]
}
