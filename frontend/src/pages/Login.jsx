import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) { setError('请输入用户名'); return }
    if (!password.trim()) { setError('请输入密码'); return }
    setLoading(true)
    try {
      await login(username, password)
    } catch {
      setError('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#0c0a09' }}
    >
      {/* 背景光斑 */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background: `
            radial-gradient(ellipse 600px 500px at 80% 10%, rgba(124, 92, 252, 0.12) 0%, transparent 70%),
            radial-gradient(ellipse 400px 400px at 10% 90%, rgba(192, 149, 108, 0.08) 0%, transparent 70%),
            radial-gradient(ellipse 300px 300px at 50% 50%, rgba(124, 92, 252, 0.04) 0%, transparent 70%)
          `,
        }}
      />

      {/* 背景网格 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      {/* 中央卡片 */}
      <div
        className={`relative z-10 w-full max-w-[400px] transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div
          className="rounded-2xl p-10"
          style={{
            background: 'rgba(18, 18, 26, 0.85)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.5), 0 0 80px rgba(124, 92, 252, 0.08)',
          }}
        >
          {/* 图标 + 标题 */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl mb-4"
              style={{
                background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)',
                boxShadow: '0 4px 20px rgba(124, 92, 252, 0.3)',
              }}
            >
              📖
            </div>
            <h1
              className="text-xl font-semibold mb-1"
              style={{ color: '#e8e8ed', letterSpacing: '0.02em' }}
            >
              小说工作站
            </h1>
            <p style={{ color: '#6b6b7a', fontSize: '13px' }}>
              欢迎回来，请登录您的账号
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label
                className="block text-xs mb-2 uppercase tracking-widest"
                style={{ color: '#6b6b7a' }}
              >
                账号
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 pl-10 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(26, 26, 38, 0.8)',
                    border: '1.5px solid rgba(255,255,255,0.06)',
                    color: '#e8e8ed',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#7c5cfc'
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 92, 252, 0.15)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="请输入用户名"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                />
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-40 pointer-events-none"
                >
                  👤
                </span>
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label
                className="block text-xs mb-2 uppercase tracking-widest"
                style={{ color: '#6b6b7a' }}
              >
                密码
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(26, 26, 38, 0.8)',
                    border: '1.5px solid rgba(255,255,255,0.06)',
                    color: '#e8e8ed',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#7c5cfc'
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 92, 252, 0.15)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="请输入密码"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-40 pointer-events-none"
                >
                  🔒
                </span>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-40 hover:opacity-80 transition-opacity"
                  onClick={() => setShowPwd(v => !v)}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* 错误 */}
            {error && (
              <div
                className="px-4 py-2.5 rounded-xl text-sm text-center"
                style={{
                  background: 'rgba(252, 92, 92, 0.1)',
                  color: '#fc5c5c',
                  border: '1px solid rgba(252, 92, 92, 0.2)',
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #7c5cfc, #9b7cfc)',
                boxShadow: '0 4px 20px rgba(124, 92, 252, 0.25)',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 6px 28px rgba(124, 92, 252, 0.35)'
                }
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 20px rgba(124, 92, 252, 0.25)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  登录中...
                </span>
              ) : '登 录'}
            </button>
          </form>

          {/* 分割线 */}
          <div
            className="flex items-center gap-4 my-6"
            style={{ color: '#6b6b7a', fontSize: '12px' }}
          >
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span>或</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* 底部 */}
          <p className="text-center text-sm" style={{ color: '#6b6b7a' }}>
            把故事变成影像 · 从文字到分镜
          </p>
        </div>
      </div>
    </div>
  )
}
