export interface ActivityInput {
  id: string
  name: string
  duration: number
  predecessors: string[]
}

export interface ActivityResult extends ActivityInput {
  es: number
  ef: number
  ls: number
  lf: number
  slack: number
  isCritical: boolean
}

export interface CpmResult {
  activities: ActivityResult[]
  projectDuration: number
  criticalPath: string[]
  topologicalOrder: string[]
  errors: string[]
}
