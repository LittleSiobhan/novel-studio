import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

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
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F7F3EE' }}
    >
      {/* 背景装饰 - 简洁圆点 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4C4B0 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.4,
        }}
      />

      {/* 中央卡片 */}
      <div
        className={`relative w-full max-w-[380px] transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        {/* 顶部图标 */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #C8956C, #B07D55)',
              boxShadow: '0 8px 32px rgba(192, 149, 108, 0.3)',
            }}
          >
            <span className="text-3xl">📖</span>
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: '#3D2B1F', letterSpacing: '0.1em' }}
          >
            小说工作站
          </h1>
          <p className="text-sm" style={{ color: '#9C8B7A' }}>
            Novel Studio
          </p>
        </div>

        {/* 登录卡片 */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 2px 40px rgba(93, 64, 55, 0.08)',
          }}
        >
          <h2
            className="text-base font-medium text-center mb-6"
            style={{ color: '#5C4033' }}
          >
            欢迎回来
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: '#F7F3EE',
                  border: '1.5px solid transparent',
                  color: '#3D2B1F',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#C8956C'
                  e.target.style.background = '#FFFFFF'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'transparent'
                  e.target.style.background = '#F7F3EE'
                }}
                placeholder="用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            {/* 密码 */}
            <div>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: '#F7F3EE',
                  border: '1.5px solid transparent',
                  color: '#3D2B1F',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#C8956C'
                  e.target.style.background = '#FFFFFF'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'transparent'
                  e.target.style.background = '#F7F3EE'
                }}
                placeholder="密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {/* 错误 */}
            {error && (
              <div
                className="px-4 py-2.5 rounded-xl text-sm text-center"
                style={{ background: '#FEF2F2', color: '#B45309' }}
              >
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all duration-200 disabled:opacity-50"
              style={{
                background: '#C8956C',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#B07D55' }}
              onMouseLeave={e => { e.target.style.background = '#C8956C' }}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>

        {/* 底部 */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: '#C4B5A5' }}
        >
          把故事变成影像 · 从文字到分镜
        </p>
      </div>
    </div>
  )
}
