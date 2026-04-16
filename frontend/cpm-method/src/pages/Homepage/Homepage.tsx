import { useState } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import SectionCard from '../../components/layout/SectionCard'
import MetricBadge from '../../components/molecules/MetricBadge'
import ActivityInputPanel from '../../components/organisms/ActivityInputPanel'
import CriticalPathPanel from '../../components/organisms/CriticalPathPanel'
import GanttChart from '../../components/organisms/GanttChart'
import NetworkGraph from '../../components/organisms/NetworkGraph'
import ResultsTable from '../../components/organisms/ResultsTable'
import { mockActivities } from '../../data/mockCpmData'
import { useCpm } from '../../hooks/useCpm'
import type { ActivityInput } from '../../types/cpm'

const Homepage = () => {
  const [activities, setActivities] = useState<ActivityInput[]>(mockActivities)
  const result = useCpm(activities)

  return (
    <MainLayout
      title="Aplikacja do metody CPM"
      subtitle="Przykladowa wersja webowa z mock data, interfejsem wejscia i wizualizacja wynikow: graf, tabela, sciezka krytyczna oraz harmonogram Gantta ASAP/ALAP."
    >
      <section className="metrics-row">
        <MetricBadge label="Liczba czynnosci" value={result.activities.length} />
        <MetricBadge label="Czas projektu" value={result.projectDuration} emphasized />
        <MetricBadge label="Sciezka krytyczna" value={result.criticalPath.join(' -> ') || '-'} />
      </section>

      <SectionCard
        title="Dane wejsciowe"
        description="Graficzny interfejs do wpisywania i edycji czynnosci projektu."
      >
        <ActivityInputPanel
          activities={activities}
          onChange={setActivities}
          onResetToMock={() => setActivities(mockActivities)}
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
