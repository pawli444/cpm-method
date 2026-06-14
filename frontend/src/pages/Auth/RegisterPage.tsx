import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const RegisterPage = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Uzupelnij wszystkie pola.'); return }
    if (password.length < 6) { setError('Haslo musi miec co najmniej 6 znakow.'); return }
    if (password !== confirm) { setError('Hasla nie sa zgodne.'); return }
    setLoading(true)
    setError(null)
    const { error } = await signUp(email, password)
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="auth-shell">
        <div className="app-shell auth-card">
          <header className="hero-header">
            <p className="kicker">Metoda CPM</p>
            <h1>Sprawdź email</h1>
            <p className="lead">
              Wysłaliśmy link potwierdzający na <strong>{email}</strong>. Kliknij go, aby aktywować konto.
            </p>
          </header>
          <div className="auth-form">
            <button type="button" className="ghost-btn" onClick={() => navigate('/logowanie')}>
              Przejdź do logowania
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <div className="app-shell auth-card">
        <header className="hero-header">
          <p className="kicker">Metoda CPM</p>
          <h1>Zarejestruj się</h1>
          <p className="lead">Twórz i zapisuj projekty CPM w chmurze.</p>
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
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              placeholder="min. 6 znaków"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm">Powtórz hasło</label>
            <input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            type="button"
            className="primary-btn auth-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </button>

          <p className="auth-switch">
            Masz już konto?{' '}
            <Link to="/logowanie" className="auth-link">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
