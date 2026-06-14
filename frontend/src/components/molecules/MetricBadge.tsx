interface MetricBadgeProps {
  label: string
  value: string | number
  emphasized?: boolean
}

const MetricBadge = ({ label, value, emphasized = false }: MetricBadgeProps) => {
  return (
    <div className={`metric-badge ${emphasized ? 'is-emphasized' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default MetricBadge
