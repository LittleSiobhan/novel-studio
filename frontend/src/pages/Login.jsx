import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [focused, setFocused] = useState(null)

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
    <div style={{ background: '#0a0a0f', minHeight: '100vh', width: '100%', position: 'absolute', top: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>

      {/* 背景光效 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 600, height: 500, top: '-15%', right: '-8%', background: 'radial-gradient(ellipse, rgba(124,92,252,0.18) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, bottom: '-10%', left: '-5%', background: 'radial-gradient(ellipse, rgba(92,124,252,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', width: 280, height: 280, top: '35%', left: '35%', background: 'radial-gradient(ellipse, rgba(188,124,252,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* 网格纹理 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)' }} />

      {/* 登录卡片 */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'rgba(18, 18, 26, 0.9)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '40px', boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(124,92,252,0.08)' }}>

        {/* 图标 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)', boxShadow: '0 4px 24px rgba(124,92,252,0.3)', fontSize: 28, marginBottom: 12 }}>
            📖
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#e8e8ed', marginBottom: 4 }}>小说工作站</div>
          <div style={{ fontSize: 13, color: '#6b6b7a' }}>欢迎回来，请登录您的账号</div>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 用户名 */}
          <div>
            <div style={{ fontSize: 11, color: '#6b6b7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>账号</div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                onFocus={() => setFocused('user')}
                onBlur={() => setFocused(null)}
                style={{
                  width: '100%', padding: '14px 14px 14px 40px',
                  background: focused === 'user' ? 'rgba(26,26,38,0.95)' : 'rgba(26,26,38,0.8)',
                  border: `1.5px solid ${focused === 'user' ? '#7c5cfc' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12, color: '#e8e8ed', fontSize: 14, outline: 'none',
                  boxShadow: focused === 'user' ? '0 0 0 3px rgba(124,92,252,0.15)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>👤</span>
            </div>
          </div>

          {/* 密码 */}
          <div>
            <div style={{ fontSize: 11, color: '#6b6b7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>密码</div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                onFocus={() => setFocused('pwd')}
                onBlur={() => setFocused(null)}
                style={{
                  width: '100%', padding: '14px 40px 14px 40px',
                  background: focused === 'pwd' ? 'rgba(26,26,38,0.95)' : 'rgba(26,26,38,0.8)',
                  border: `1.5px solid ${focused === 'pwd' ? '#7c5cfc' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12, color: '#e8e8ed', fontSize: 14, outline: 'none',
                  boxShadow: focused === 'pwd' ? '0 0 0 3px rgba(124,92,252,0.15)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔒</span>
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.4 }}
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* 记住 + 忘记 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b7a', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: '#7c5cfc' }} />
              <span>记住我</span>
            </label>
            <a href="#" style={{ color: '#7c5cfc', textDecoration: 'none' }}>忘记密码？</a>
          </div>

          {/* 错误 */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(252,92,92,0.08)', color: '#fc5c5c', fontSize: 13, textAlign: 'center', border: '1px solid rgba(252,92,92,0.2)' }}>
              ⚠ {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,92,252,0.35)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,92,252,0.25)' }}
            style={{
              width: '100%', padding: '14px', marginTop: 4,
              background: loading ? '#7c5cfc' : 'linear-gradient(135deg, #7c5cfc, #9b7cfc)',
              border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 24px rgba(124,92,252,0.25)',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        {/* 分割线 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0', color: '#6b6b7a', fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span>或</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* 底部 */}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#6b6b7a' }}>
          把故事变成影像 · 从文字到分镜
        </p>
      </div>
    </div>
  )
}
