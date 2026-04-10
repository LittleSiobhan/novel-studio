import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

// 设计系统变量
const tokens = {
  bg: '#0a0a0f',
  card: 'rgba(18, 18, 26, 0.9)',
  cardBorder: 'rgba(255,255,255,0.07)',
  inputBg: 'rgba(26, 26, 38, 0.8)',
  inputBorder: 'rgba(255,255,255,0.06)',
  accent: '#7c5cfc',
  accentLight: '#a78bfa',
  accentGlow: 'rgba(124, 92, 252, 0.2)',
  text: '#e8e8ed',
  textMuted: '#6b6b7a',
  error: '#fc5c5c',
  success: '#5cffb1',
  radius: '14px',
}

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [inputFocus, setInputFocus] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
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
      style={{ background: tokens.bg }}
    >
      {/* 背景光斑 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 主光斑 - 右上 */}
        <div
          className="absolute"
          style={{
            width: 600, height: 500,
            top: '-15%', right: '-8%',
            background: 'radial-gradient(ellipse, rgba(124,92,252,0.18) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* 次光斑 - 左下 */}
        <div
          className="absolute"
          style={{
            width: 400, height: 400,
            bottom: '-10%', left: '-5%',
            background: 'radial-gradient(ellipse, rgba(92,124,252,0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* 中光斑 */}
        <div
          className="absolute"
          style={{
            width: 280, height: 280,
            top: '35%', left: '35%',
            background: 'radial-gradient(ellipse, rgba(188,124,252,0.07) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* 背景网格 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
        }}
      />

      {/* 登录卡片 */}
      <div
        className="relative z-10 w-full max-w-[400px]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <div
          className="rounded-[20px] p-10"
          style={{
            background: tokens.card,
            backdropFilter: 'blur(28px)',
            border: `1px solid ${tokens.cardBorder}`,
            boxShadow: `
              0 8px 40px rgba(0,0,0,0.5),
              0 0 80px ${tokens.accentGlow}
            `,
          }}
        >
          {/* 品牌区 */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{
                background: `linear-gradient(135deg, ${tokens.accent}, ${tokens.accentLight})`,
                boxShadow: `0 4px 24px ${tokens.accentGlow}`,
              }}
            >
              <span className="text-2xl">📖</span>
            </div>
            <h1
              className="text-xl font-semibold mb-1"
              style={{ color: tokens.text, letterSpacing: '0.02em' }}
            >
              小说工作站
            </h1>
            <p style={{ color: tokens.textMuted, fontSize: 13 }}>
              欢迎回来，请登录您的账号
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名 */}
            <div>
              <label
                className="block text-xs mb-2"
                style={{ color: tokens.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                账号
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: tokens.inputBg,
                    border: `1.5px solid ${inputFocus === 'user' ? tokens.accent : tokens.inputBorder}`,
                    color: tokens.text,
                    boxShadow: inputFocus === 'user' ? `0 0 0 3px ${tokens.accentGlow}` : 'none',
                  }}
                  onFocus={() => setInputFocus('user')}
                  onBlur={() => setInputFocus(null)}
                  placeholder="请输入用户名"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ opacity: 0.4 }}>
                  👤
                </span>
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label
                className="block text-xs mb-2"
                style={{ color: tokens.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                密码
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: tokens.inputBg,
                    border: `1.5px solid ${inputFocus === 'pwd' ? tokens.accent : tokens.inputBorder}`,
                    color: tokens.text,
                    boxShadow: inputFocus === 'pwd' ? `0 0 0 3px ${tokens.accentGlow}` : 'none',
                  }}
                  onFocus={() => setInputFocus('pwd')}
                  onBlur={() => setInputFocus(null)}
                  placeholder="请输入密码"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ opacity: 0.4 }}>
                  🔒
                </span>
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm transition-opacity"
                  style={{ opacity: 0.4 }}
                  onClick={() => setShowPwd(v => !v)}
                  onMouseEnter={e => e.target.style.opacity = '0.8'}
                  onMouseLeave={e => e.target.style.opacity = '0.4'}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* 记住 + 忘记密码 */}
            <div className="flex items-center justify-between" style={{ fontSize: 13 }}>
              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                style={{ color: tokens.textMuted }}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  style={{ accentColor: tokens.accent }}
                />
                <span>记住我</span>
              </label>
              <a
                href="#"
                className="transition-opacity"
                style={{ color: tokens.accent, textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.opacity = '0.7'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                忘记密码？
              </a>
            </div>

            {/* 错误提示 */}
            {error && (
              <div
                className="px-4 py-2.5 rounded-xl text-sm text-center"
                style={{
                  background: 'rgba(252,92,92,0.08)',
                  color: tokens.error,
                  border: '1px solid rgba(252,92,92,0.2)',
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50"
              style={{
                background: loading
                  ? tokens.accent
                  : `linear-gradient(135deg, ${tokens.accent}, ${tokens.accentLight})`,
                boxShadow: `0 4px 24px ${tokens.accentGlow}`,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = `0 8px 32px ${tokens.accentGlow}`
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = `0 4px 24px ${tokens.accentGlow}`
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
            style={{ color: tokens.textMuted, fontSize: 12 }}
          >
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span>或</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* 底部文案 */}
          <p className="text-center" style={{ color: tokens.textMuted, fontSize: 13 }}>
            把故事变成影像 · 从文字到分镜
          </p>
        </div>
      </div>
    </div>
  )
}
