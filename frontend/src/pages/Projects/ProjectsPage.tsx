import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProjects } from '../../hooks/useProjects'

const ProjectsPage = () => {
  const { user, signOut } = useAuth()
  const { projects, loading, error, createProject, deleteProject } = useProjects(user?.id)
  const navigate = useNavigate()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleCreate = async () => {
    const name = newName.trim() || 'Nowy projekt CPM'
    setCreating(true)
    const id = await createProject(name)
    setCreating(false)
    setNewName('')
    if (id) navigate(`/projekt/${id}`)
  }

  const handleDelete = async (id: string) => {
    await deleteProject(id)
    setConfirmDelete(null)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="app-shell">
      <header className="hero-header">
        <div className="hero-header-row">
          <div>
            <p className="kicker">Metoda CPM</p>
            <h1>Moje projekty</h1>
            <p className="lead">Wybierz projekt, aby go edytować, lub utwórz nowy.</p>
          </div>
          <div className="hero-actions">
            <span className="user-email">{user?.email}</span>
            <button type="button" className="ghost-btn" onClick={signOut}>
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <main className="content-grid">
        {error && (
          <div className="auth-error">
            <span>{error}</span>
          </div>
        )}

        <section className="section-card">
          <div className="section-header">
            <h2>Nowy projekt</h2>
          </div>
          <div className="inline-form new-project-form">
            <input
              placeholder="Nazwa projektu"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              type="button"
              className="primary-btn"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Tworzenie...' : '+ Utwórz projekt'}
            </button>
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <h2>Zapisane projekty</h2>
          </div>

          {loading ? (
            <p className="hint">Ładowanie projektów...</p>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p>Nie masz jeszcze żadnych projektów.</p>
              <p className="hint">Utwórz pierwszy projekt powyżej.</p>
            </div>
          ) : (
            <div className="projects-list">
              {projects.map((project) => (
                <div key={project.id} className="project-row">
                  <div className="project-info">
                    <strong className="project-name">{project.name}</strong>
                    <span className="project-date">
                      Ostatnia edycja: {formatDate(project.updated_at)}
                    </span>
                  </div>
                  <div className="project-actions">
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => navigate(`/projekt/${project.id}`)}
                    >
                      Otwórz
                    </button>
                    {confirmDelete === project.id ? (
                      <>
                        <span className="hint">Na pewno?</span>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => handleDelete(project.id)}
                        >
                          Usuń
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Anuluj
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => setConfirmDelete(project.id)}
                      >
                        Usuń
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default ProjectsPage
