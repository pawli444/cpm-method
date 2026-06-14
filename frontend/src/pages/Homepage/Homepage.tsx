import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../../components/layout/MainLayout'
import SectionCard from '../../components/layout/SectionCard'
import MetricBadge from '../../components/molecules/MetricBadge'
import ActivityInputPanel from '../../components/organisms/ActivityInputPanel'
import CriticalPathPanel from '../../components/organisms/CriticalPathPanel'
import GanttChart from '../../components/organisms/GanttChart'
import NetworkGraph from '../../components/organisms/NetworkGraph'
import ResultsTable from '../../components/organisms/ResultsTable'
import { mockActivities } from '../../data/mockCpmData'
import { useAuth } from '../../hooks/useAuth'
import { useCpm } from '../../hooks/useCpm'
import { useProjects } from '../../hooks/useProjects'
import type { ActivityInput } from '../../types/cpm'

const Homepage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { user, signOut } = useAuth()
  const { saveActivities, loadActivities } = useProjects(user?.id)
  const navigate = useNavigate()
  const csvInputRef = useRef<HTMLInputElement>(null)

  const [activities, setActivities] = useState<ActivityInput[]>(mockActivities)
  const [projectName, setProjectName] = useState<string>('Projekt CPM')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const result = useCpm(activities)

  useEffect(() => {
    if (!projectId) return
    loadActivities(projectId).then((loaded) => {
      if (loaded.length > 0) setActivities(loaded)
    })
  }, [projectId])

  const handleSave = async () => {
    if (!projectId) return
    setSaveStatus('saving')
    try {
      await saveActivities(projectId, activities)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveStatus('error')
    }
  }

  const handleExportCSV = () => {
    let csv = 'ID,Nazwa,Czas,Poprzednicy\n'
    activities.forEach((a) => {
      csv += `${a.id},${a.name},${a.duration},${a.predecessors.join(';')}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'projekt_cpm.csv'
    link.click()
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim())
      const imported: ActivityInput[] = []
      lines.forEach((line, i) => {
        if (i === 0 && line.toLowerCase().includes('id')) return
        const [id, name, duration, depsStr] = line.split(',')
        if (id && duration) {
          imported.push({
            id: id.trim().toUpperCase(),
            name: name?.trim() || `Czynnosc ${id.trim().toUpperCase()}`,
            duration: Number(duration) || 1,
            predecessors: depsStr ? depsStr.split(';').map((d) => d.trim()).filter(Boolean) : [],
          })
        }
      })
      setActivities(imported)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const saveLabel = {
    idle: 'Zapisz projekt',
    saving: 'Zapisywanie...',
    saved: '✓ Zapisano',
    error: 'Błąd zapisu',
  }[saveStatus]

  return (
    <MainLayout
      title={projectName}
      subtitle="Metoda ścieżki krytycznej — edytuj czynności i analizuj harmonogram projektu."
      actions={
        <div className="layout-actions">
          {projectId && (
            <button
              type="button"
              className={saveStatus === 'saved' ? 'ghost-btn saved-btn' : 'primary-btn'}
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              {saveLabel}
            </button>
          )}
          <button type="button" className="ghost-btn" onClick={() => navigate('/projekty')}>
            ← Moje projekty
          </button>
          <button type="button" className="ghost-btn" onClick={signOut}>
            Wyloguj
          </button>
        </div>
      }
    >
      <section className="metrics-row">
        <MetricBadge label="Liczba czynnosci" value={result.activities.length} />
        <MetricBadge label="Czas projektu" value={result.projectDuration} emphasized />
        <MetricBadge label="Sciezka krytyczna" value={result.criticalPath.join(' → ') || '-'} />
      </section>

      <SectionCard
        title="Dane wejsciowe"
        description="Graficzny interfejs do wpisywania i edycji czynnosci projektu."
      >
        <ActivityInputPanel
          activities={activities}
          onChange={setActivities}
          onResetToMock={() => setActivities(mockActivities)}
          onExportCSV={handleExportCSV}
          onImportCSV={() => csvInputRef.current?.click()}
        />
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleImportCSV}
        />
      </SectionCard>

      {result.errors.length > 0 ? (
        <SectionCard title="Bledy danych" description="Popraw dane, aby uruchomic obliczenia CPM.">
          <ul className="error-list">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Graf sieci CPM"
            description="Wizualizacja zaleznosci pomiedzy czynnosciami (w formie grafu)."
          >
            <NetworkGraph activities={result.activities} />
          </SectionCard>

          <SectionCard
            title="Tabela wynikow CPM"
            description="Najwczesniejsze/najpozniejsze terminy, rezerwy i identyfikacja czynnosci krytycznych."
          >
            <ResultsTable activities={result.activities} />
          </SectionCard>

          <SectionCard
            title="Sciezka krytyczna"
            description="Sekwencja czynnosci bez rezerwy czasu i calkowity czas realizacji projektu."
          >
            <CriticalPathPanel path={result.criticalPath} projectDuration={result.projectDuration} />
          </SectionCard>

          <SectionCard
            title="Harmonogram Gantta"
            description="Porownanie ulozenia zadan w trybie ASAP i ALAP."
          >
            <GanttChart activities={result.activities} projectDuration={result.projectDuration} />
          </SectionCard>
        </>
      )}
    </MainLayout>
  )
}

export default Homepage
