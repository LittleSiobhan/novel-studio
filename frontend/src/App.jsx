import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen paper-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📖</div>
          <p className="text-[var(--text-muted)]">加载中...</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}
