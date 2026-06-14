import DataTable from '../molecules/DataTable'
import type { ActivityResult } from '../../types/cpm'

interface ResultsTableProps {
  activities: ActivityResult[]
}

const ResultsTable = ({ activities }: ResultsTableProps) => {
  const rows = activities.map((activity) => [
    activity.id,
    activity.name,
    activity.duration,
    activity.predecessors.join(', ') || '-',
    activity.es,
    activity.ef,
    activity.ls,
    activity.lf,
    activity.slack,
    activity.isCritical ? 'TAK' : 'NIE',
  ])

  return (
    <DataTable
      headers={[
        'ID',
        'Czynnosc',
        'Czas',
        'Poprzednicy',
        'ES',
        'EF',
        'LS',
        'LF',
        'Rezerwa',
        'Krytyczna',
      ]}
      rows={rows}
    />
  )
}

export default ResultsTable
