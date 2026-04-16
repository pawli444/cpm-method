import type { PropsWithChildren } from 'react'

interface MainLayoutProps extends PropsWithChildren {
  title: string
  subtitle: string
}

const MainLayout = ({ title, subtitle, children }: MainLayoutProps) => {
  return (
    <div className="app-shell">
      <header className="hero-header">
        <p className="kicker">Metoda CPM</p>
        <h1>{title}</h1>
        <p className="lead">{subtitle}</p>
      </header>

      <main className="content-grid">{children}</main>
    </div>
  )
}

export default MainLayout
