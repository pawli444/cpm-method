import { useMemo, useState } from 'react'
import type { ActivityInput } from '../../types/cpm'

interface ActivityInputPanelProps {
  activities: ActivityInput[]
  onChange: (next: ActivityInput[]) => void
  onResetToMock: () => void
  onExportCSV: () => void
  onImportCSV: () => void
}

const emptyActivity: ActivityInput = {
  id: '',
  name: '',
  duration: 1,
  predecessors: [],
}

const ActivityInputPanel = ({
  activities,
  onChange,
  onResetToMock,
  onExportCSV,
  onImportCSV,
}: ActivityInputPanelProps) => {
  const [draft, setDraft] = useState<ActivityInput>(emptyActivity)

  const idSet = useMemo(() => new Set(activities.map((item) => item.id)), [activities])

  const updateActivity = (id: string, key: keyof ActivityInput, value: string | number) => {
    const next = activities.map((activity) => {
      if (activity.id !== id) return activity
      if (key === 'duration') return { ...activity, duration: Number(value) || 1 }
      if (key === 'name') return { ...activity, name: String(value) }
      if (key === 'predecessors') {
        const predecessors = String(value).split(',').map((item) => item.trim()).filter(Boolean)
        return { ...activity, predecessors }
      }
      return activity
    })
    onChange(next)
  }

  const removeActivity = (id: string) => {
    const next = activities
      .filter((activity) => activity.id !== id)
      .map((activity) => ({
        ...activity,
        predecessors: activity.predecessors.filter((predecessor) => predecessor !== id),
      }))
    onChange(next)
  }

  const addActivity = () => {
    const normalizedId = draft.id.trim().toUpperCase()
    if (!normalizedId || idSet.has(normalizedId)) return
    const next: ActivityInput = {
      id: normalizedId,
      name: draft.name.trim() || `Czynnosc ${normalizedId}`,
      duration: Math.max(1, Number(draft.duration) || 1),
      predecessors: draft.predecessors,
    }
    onChange([...activities, next])
    setDraft(emptyActivity)
  }

  return (
    <div className="stack-lg">
      <p className="hint">
        Wpisz czynnosci i zaleznosci. Poprzednikow podawaj jako ID rozdzielone przecinkiem.
      </p>

      <div className="table-wrap" role="region" aria-label="Edycja danych wejsciowych">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nazwa czynnosci</th>
              <th>Czas trwania</th>
              <th>Poprzednicy</th>
              <th>Akcja</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id}>
                <td>{activity.id}</td>
                <td>
                  <input
                    value={activity.name}
                    onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={activity.duration}
                    onChange={(e) => updateActivity(activity.id, 'duration', Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    value={activity.predecessors.join(', ')}
                    onChange={(e) => updateActivity(activity.id, 'predecessors', e.target.value)}
                  />
                </td>
                <td>
                  <button type="button" className="ghost-btn" onClick={() => removeActivity(activity.id)}>
                   
                 Usun
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="inline-form">
        <input
          placeholder="ID"
          value={draft.id}
          maxLength={5}
          onChange={(e) => setDraft((prev) => ({ ...prev, id: e.target.value }))}
        />
        <input
          placeholder="Nazwa"
          value={draft.name}
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="number"
          min={1}
          placeholder="Czas"
          value={draft.duration}
          onChange={(e) => setDraft((prev) => ({ ...prev, duration: Number(e.target.value) || 1 }))}
        />
        <input
          placeholder="Poprzednicy: np. A,B"
          value={draft.predecessors.join(',')}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              predecessors: e.target.value.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean),
            }))
          }
        />
        <button type="button" className="primary-btn" onClick={addActivity}>
          Dodaj czynnosc
        </button>
        <button type="button" className="ghost-btn" onClick={onResetToMock}>
          Wczytaj mock
        </button>
        <button type="button" className="ghost-btn" onClick={onImportCSV}>
          Importuj CSV
        </button>
        <button type="button" className="ghost-btn" onClick={() => { console.log('EKSPORT KLIK'); onExportCSV(); }}>
          Eksportuj CSV
        </button>
      </div>
    </div>
  )
}

export default ActivityInputPanel
