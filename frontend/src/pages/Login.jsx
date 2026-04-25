import { useState } from 'react'
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
    <div style={{ background: '#050810', minHeight: '100vh', width: '100%', position: 'absolute', top: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>

      {/* 背景科技光效 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* 顶部青色光 */}
        <div style={{ position: 'absolute', width: 700, height: 500, top: '-20%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        {/* 右下蓝紫光 */}
        <div style={{ position: 'absolute', width: 500, height: 500, bottom: '-15%', right: '-10%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        {/* 网格线 */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />
        {/* 扫描线动画 */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(56,189,248,0.01) 2px, rgba(56,189,248,0.01) 4px)', animation: 'scan 8s linear infinite' }} />
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      {/* 登录卡片 */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'rgba(8, 16, 40, 0.9)', backdropFilter: 'blur(28px)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 20, padding: '40px', boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(56,189,248,0.06), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

        {/* 顶部线条装饰 */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.4), transparent)' }} />

        {/* 图标 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', boxShadow: '0 4px 24px rgba(56,189,248,0.3), 0 0 40px rgba(56,189,248,0.1)', fontSize: 28, marginBottom: 12 }}>
            🎬
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 4, letterSpacing: '0.05em' }}>小说工作站</div>
          <div style={{ fontSize: 12, color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '0.1em' }}>NOVEL STUDIO v1.0</div>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 用户名 */}
          <div>
            <div style={{ fontSize: 11, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, fontFamily: 'monospace' }}>USERNAME</div>
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
                  background: focused === 'user' ? 'rgba(8,16,40,0.95)' : 'rgba(8,16,40,0.8)',
                  border: `1.5px solid ${focused === 'user' ? '#38bdf8' : 'rgba(56,189,248,0.15)'}`,
                  borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none',
                  boxShadow: focused === 'user' ? '0 0 0 3px rgba(56,189,248,0.12), 0 0 20px rgba(56,189,248,0.05)' : 'none',
                  transition: 'all 0.25s ease',
                  fontFamily: 'inherit',
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>▸</span>
            </div>
          </div>

          {/* 密码 */}
          <div>
            <div style={{ fontSize: 11, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, fontFamily: 'monospace' }}>PASSWORD</div>
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
                  background: focused === 'pwd' ? 'rgba(8,16,40,0.95)' : 'rgba(8,16,40,0.8)',
                  border: `1.5px solid ${focused === 'pwd' ? '#38bdf8' : 'rgba(56,189,248,0.15)'}`,
                  borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none',
                  boxShadow: focused === 'pwd' ? '0 0 0 3px rgba(56,189,248,0.12), 0 0 20px rgba(56,189,248,0.05)' : 'none',
                  transition: 'all 0.25s ease',
                  fontFamily: 'inherit',
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>◇</span>
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.4 }}
              >
                {showPwd ? '▣' : '◻'}
              </button>
            </div>
          </div>

          {/* 记住 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11 }}>
              <input type="checkbox" style={{ accentColor: '#38bdf8' }} />
              <span style={{ color: '#38bdf8' }}>[ ]</span> REMEMBER
            </label>
            <a href="#" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: 11, fontFamily: 'monospace' }}>FORGOT?</a>
          </div>

          {/* 错误 */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', color: '#f87171', fontSize: 12, textAlign: 'center', border: '1px solid rgba(248,113,113,0.2)', fontFamily: 'monospace' }}>
              █ ERROR: {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(56,189,248,0.3)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(56,189,248,0.2)' }}
            style={{
              width: '100%', padding: '14px', marginTop: 4,
              background: loading ? '#38bdf8' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
              border: 'none', borderRadius: 10, color: '#050810', fontSize: 13, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 24px rgba(56,189,248,0.2)',
              transition: 'all 0.25s ease',
              opacity: loading ? 0.6 : 1,
              letterSpacing: '0.1em',
              fontFamily: 'monospace',
            }}
          >
            {loading ? '[ PROCESSING... ]' : '[ ACCESS SYSTEM ]'}
          </button>
        </form>

        {/* 底部 */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
          TEXT → SCRIPT → STORYBOARD
        </div>
      </div>
    </div>
  )
}
