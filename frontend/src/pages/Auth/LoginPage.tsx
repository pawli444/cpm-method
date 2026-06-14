import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const LoginPage = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Uzupelnij email i haslo.'); return }
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) { setError('Nieprawidlowy email lub haslo.'); setLoading(false); return }
    navigate('/projekty')
  }

  return (
    <div className="auth-shell">
      <div className="app-shell auth-card">
        <header className="hero-header">
          <p className="kicker">Metoda CPM</p>
          <h1>Zaloguj się</h1>
          <p className="lead">Wróć do swoich projektów i kontynuuj pracę.</p>
        </header>

        <div className="auth-form">
          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="twoj@email.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            type="button"
            className="primary-btn auth-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>

          <p className="auth-switch">
            Nie masz konta?{' '}
            <Link to="/rejestracja" className="auth-link">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
