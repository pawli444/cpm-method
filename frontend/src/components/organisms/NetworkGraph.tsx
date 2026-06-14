import { useMemo } from 'react'
import type { ActivityResult } from '../../types/cpm'

interface NetworkGraphProps {
  activities: ActivityResult[]
}

interface NodePlacement {
  id: string
  x: number
  y: number
  activity: ActivityResult
}

const colWidth = 220
const rowHeight = 110

const NetworkGraph = ({ activities }: NetworkGraphProps) => {
  const { nodes, edges, width, height } = useMemo(() => {
    const byId = new Map(activities.map((activity) => [activity.id, activity]))
    const levelMap = new Map<string, number>()

    for (const activity of activities) {
      const level = activity.predecessors.reduce((maxLevel, predecessor) => {
        return Math.max(maxLevel, (levelMap.get(predecessor) ?? 0) + 1)
      }, 0)

      levelMap.set(activity.id, level)
    }

    const groupedByLevel = new Map<number, ActivityResult[]>()

    for (const activity of activities) {
      const level = levelMap.get(activity.id) ?? 0
      const levelList = groupedByLevel.get(level) ?? []
      levelList.push(activity)
      groupedByLevel.set(level, levelList)
    }

    const placements: NodePlacement[] = []

    for (const [level, list] of groupedByLevel.entries()) {
      list.sort((a, b) => a.es - b.es || a.id.localeCompare(b.id))
      list.forEach((activity, index) => {
        placements.push({
          id: activity.id,
          x: level * colWidth + 80,
          y: index * rowHeight + 50,
          activity,
        })
      })
    }

    const nodeMap = new Map(placements.map((node) => [node.id, node]))
    const connectors = activities.flatMap((activity) =>
      activity.predecessors
        .map((predecessor) => {
          const from = nodeMap.get(predecessor)
          const to = nodeMap.get(activity.id)
          if (!from || !to) {
            return null
          }

          return {
            key: `${predecessor}-${activity.id}`,
            x1: from.x + 90,
            y1: from.y + 30,
            x2: to.x,
            y2: to.y + 30,
          }
        })
        .filter(Boolean),
    ) as Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>

    const maxX = Math.max(...placements.map((node) => node.x), 0)
    const maxY = Math.max(...placements.map((node) => node.y), 0)

    return {
      nodes: placements,
      edges: connectors,
      width: maxX + 240,
      height: maxY + 120,
      byId,
    }
  }, [activities])

  if (activities.length === 0) {
    return <p className="hint">Brak danych do wyswietlenia grafu.</p>
  }

  return (
    <div className="graph-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="graph-canvas" role="img" aria-label="Graf sieci CPM">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="12"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" className="arrow-head" />
          </marker>
        </defs>

        {edges.map((edge) => (
          <line
            key={edge.key}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            markerEnd="url(#arrowhead)"
            className="graph-edge"
          />
        ))}

        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <rect
              width="90"
              height="60"
              rx="10"
              className={node.activity.isCritical ? 'graph-node critical' : 'graph-node'}
            />
            <text x="8" y="22" className="node-id">
              {node.activity.id}
            </text>
            <text x="8" y="40" className="node-time">
              {node.activity.es}/{node.activity.ef}
            </text>
          </g>
        ))}
      </svg>
      <p className="hint">Kazdy wezel pokazuje: ID oraz ES/EF. Czerwone wezly naleza do sciezki krytycznej.</p>
    </div>
  )
}

export default NetworkGraph
