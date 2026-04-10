import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen paper-bg flex items-center justify-center px-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 warm-glow pointer-events-none" />

      {/* 装饰元素 */}
      <div className="fixed top-12 left-12 text-6xl opacity-5 font-serif select-none">✦</div>
      <div className="fixed bottom-12 right-12 text-6xl opacity-5 font-serif select-none">✦</div>

      <div className="relative w-full max-w-md">
        {/* Logo / 标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="text-4xl">📖</span>
            <div className="w-px h-10 bg-[var(--border)]" />
            <span className="font-serif text-2xl font-semibold text-[var(--text)] tracking-wide">
              小说工作站
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-sm tracking-widest uppercase">
            Novel Studio
          </p>
          <div className="divider-warm mt-6 mx-auto max-w-xs" />
        </div>

        {/* 登录卡片 */}
        <div className="card-warm">
          <h2 className="font-serif text-xl font-semibold text-center mb-2 text-[var(--text)]">
            欢迎回来
          </h2>
          <p className="text-[var(--text-muted)] text-sm text-center mb-8">
            登录以开始你的创作之旅
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text)]">
                用户名
              </label>
              <input
                type="text"
                className="input-warm"
                placeholder="请输入用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--text)]">
                密码
              </label>
              <input
                type="password"
                className="input-warm"
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  登录中...
                </span>
              ) : '登录'}
            </button>
          </form>


        </div>

        {/* 底部 */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          把故事变成影像 · 从文字到分镜
        </p>
      </div>
    </div>
  )
}
