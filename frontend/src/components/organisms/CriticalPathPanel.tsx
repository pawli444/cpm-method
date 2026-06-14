interface CriticalPathPanelProps {
  path: string[]
  projectDuration: number
}

const CriticalPathPanel = ({ path, projectDuration }: CriticalPathPanelProps) => {
  return (
    <div className="critical-panel">
      <div className="critical-path">
        {path.length > 0 ? path.join(' -> ') : 'Brak sciezki krytycznej'}
      </div>
      <p className="hint">Czas realizacji projektu: {projectDuration} jednostek czasu</p>
    </div>
  )
}

export default CriticalPathPanel
