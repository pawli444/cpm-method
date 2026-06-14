import type { ActivityResult } from '../../types/cpm'

interface GanttChartProps {
  activities: ActivityResult[]
  projectDuration: number
}

const GanttChart = ({ activities, projectDuration }: GanttChartProps) => {
  const scale = Array.from({ length: projectDuration + 1 }, (_, index) => index)

  return (
    <div className="gantt-wrap">
      <div
        className="gantt-grid gantt-scale"
        style={{ gridTemplateColumns: `220px repeat(${projectDuration + 1}, minmax(24px, 1fr))` }}
      >
        <div className="gantt-label">Czas</div>
        {scale.map((tick) => (
          <div key={`tick-${tick}`} className="tick">
            {tick}
          </div>
        ))}
      </div>

      {activities.map((activity) => (
        <div key={activity.id} className="gantt-row-wrap">
          <div
            className="gantt-grid"
            style={{
              gridTemplateColumns: `220px repeat(${projectDuration + 1}, minmax(24px, 1fr))`,
            }}
          >
            <div className="gantt-label">
              {activity.id} - {activity.name}
            </div>
            {scale.map((tick) => {
              const isAsap = tick >= activity.es && tick < activity.ef
              const isAlap = tick >= activity.ls && tick < activity.lf

              return (
                <div key={`${activity.id}-${tick}`} className="slot">
                  {isAsap ? <div className="bar bar-asap" title="ASAP" /> : null}
                  {isAlap ? <div className="bar bar-alap" title="ALAP" /> : null}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default GanttChart
