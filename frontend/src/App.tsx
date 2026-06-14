import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import Homepage from './pages/Homepage/Homepage'
import ProjectsPage from './pages/Projects/ProjectsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/logowanie" element={<LoginPage />} />
        <Route path="/rejestracja" element={<RegisterPage />} />
        <Route
          path="/projekty"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projekt/:projectId"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/logowanie" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
