import type { PropsWithChildren } from 'react'

interface SectionCardProps extends PropsWithChildren {
  title: string
  description?: string
}

const SectionCard = ({ title, description, children }: SectionCardProps) => {
  return (
    <section className="section-card">
      <div className="section-header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default SectionCard
