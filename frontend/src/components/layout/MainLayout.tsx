import type { PropsWithChildren, ReactNode } from 'react'

interface MainLayoutProps extends PropsWithChildren {
  title: string
  subtitle: string
  actions?: ReactNode
}

const MainLayout = ({ title, subtitle, children, actions }: MainLayoutProps) => {
  return (
    <div className="app-shell">
      <header className="hero-header">
        <div className="hero-header-row">
          <div>
            <p className="kicker">Metoda CPM</p>
            <h1>{title}</h1>
            <p className="lead">{subtitle}</p>
          </div>
          {actions && <div className="hero-actions">{actions}</div>}
        </div>
      </header>

      <main className="content-grid">{children}</main>
    </div>
  )
}

export default MainLayout
