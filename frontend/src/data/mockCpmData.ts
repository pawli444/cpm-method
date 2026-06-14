import type { ActivityInput } from '../types/cpm'

export const mockActivities: ActivityInput[] = [
  { id: 'A', name: 'Analiza wymagan', duration: 4, predecessors: [] },
  { id: 'B', name: 'Projekt techniczny', duration: 3, predecessors: ['A'] },
  { id: 'C', name: 'Zakup materialow', duration: 2, predecessors: ['A'] },
  { id: 'D', name: 'Implementacja modulu 1', duration: 5, predecessors: ['B'] },
  { id: 'E', name: 'Implementacja modulu 2', duration: 4, predecessors: ['B', 'C'] },
  { id: 'F', name: 'Testy integracyjne', duration: 3, predecessors: ['D', 'E'] },
  { id: 'G', name: 'Dokumentacja i odbior', duration: 2, predecessors: ['F'] },
]
