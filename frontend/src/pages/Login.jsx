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
    setMounted(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      setError('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0c0a09' }}>
      {/* 左侧插画区 */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1c1917 0%, #0c0a09 100%)' }}
      >
        {/* 背景纹理 */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
              <feColorMatrix type="saturate" values="0"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)"/>
          </svg>
        </div>

        {/* 大号装饰文字 */}
        <div className="absolute -left-8 top-1/4 font-serif text-[20rem] text-white/5 select-none leading-none pointer-events-none font-bold">
          墨
        </div>
        <div className="absolute -right-8 bottom-1/4 font-serif text-[16rem] text-white/5 select-none leading-none pointer-events-none font-bold">
          韵
        </div>

        {/* 内容 */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-20">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #d4a853, #c8956c)' }}
            >
              📖
            </div>
            <div>
              <div className="text-white/90 font-serif text-xl font-semibold tracking-wide">
                小说工作站
              </div>
              <div className="text-white/40 text-xs tracking-widest uppercase mt-0.5">
                Novel Studio
              </div>
            </div>
          </div>

          <div className="max-w-sm">
            <p className="text-white/80 font-light leading-relaxed text-lg mb-4">
              一站式 AI 创作平台
            </p>
            <p className="text-white/40 text-sm leading-relaxed">
              将小说文本转化为专业剧本，
              <br />
              再生成精美的视觉分镜。
            </p>
          </div>
        </div>

        {/* 底部 */}
        <div className="relative z-10">
          <div className="flex items-center gap-8">
            {[
              { label: '场景提取', icon: '✦' },
              { label: '剧本生成', icon: '✦' },
              { label: '分镜制作', icon: '✦' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[#d4a853] text-xs">{item.icon}</span>
                <span className="text-white/50 text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧登录区 */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{ background: '#faf9f7' }}
      >
        <div
          className={`w-full max-w-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #d4a853, #c8956c)' }}
            >
              📖
            </div>
            <span className="font-serif text-lg font-semibold text-[#1c1917]">
              小说工作站
            </span>
          </div>

          {/* 标题 */}
          <div className="mb-10">
            <h2 className="text-3xl font-serif font-bold text-[#1c1917] mb-2">
              登录
            </h2>
            <p className="text-[#78716c] text-sm">
              输入你的账号以继续
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名 */}
            <div>
              <input
                type="text"
                className="w-full px-0 py-3 text-[#1c1917] bg-transparent border-b-2 border-[#e7e5e4] focus:border-[#d4a853] outline-none transition-colors text-base"
                style={{ borderColor: '#e7e5e4' }}
                onFocus={e => e.target.style.borderColor = '#d4a853'}
                onBlur={e => e.target.style.borderColor = '#e7e5e4'}
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
                className="w-full px-0 py-3 text-[#1c1917] bg-transparent border-b-2 border-[#e7e5e4] focus:border-[#d4a853] outline-none transition-colors text-base"
                onFocus={e => e.target.style.borderColor = '#d4a853'}
                onBlur={e => e.target.style.borderColor = '#e7e5e4'}
                placeholder="密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {/* 错误 */}
            {error && (
              <div className="text-red-500 text-sm py-2">
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-6 rounded-lg text-white text-sm font-medium transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  登录中...
                </span>
              ) : '登录'}
            </button>
          </form>

          {/* 底部 */}
          <div className="mt-16 text-center">
            <p className="text-[#a8a29e] text-xs tracking-wide">
              把故事变成影像 · 从文字到分镜
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
