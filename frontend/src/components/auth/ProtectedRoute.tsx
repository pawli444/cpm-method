import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="app-shell auth-card">
          <header className="hero-header">
            <p className="kicker">Metoda CPM</p>
            <h1>Ładowanie...</h1>
          </header>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/logowanie" replace />

  return <>{children}</>
}

export default ProtectedRoute
