import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

// 墨滴飘落动画组件
function InkDrop({ style }) {
  return (
    <div
      className="absolute rounded-full opacity-10 animate-float-slow"
      style={{
        ...style,
        background: 'radial-gradient(circle, #8B7355 0%, transparent 70%)',
      }}
    />
  )
}

// 墨迹装饰组件
function InkStroke({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 20 C40 5, 80 35, 120 18 C150 5, 170 30, 190 20"
        stroke="#C8956C"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  )
}

// 背景网格/纹理装饰
function BackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 水平墨线装饰 */}
      {[15, 35, 55, 75, 90].map((top, i) => (
        <div
          key={i}
          className="absolute w-full opacity-[0.03]"
          style={{
            top: `${top}%`,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, #5C4033 20%, #5C4033 80%, transparent 100%)',
          }}
        />
      ))}
      {/* 垂直墨线 */}
      {[10, 30, 70, 90].map((left, i) => (
        <div
          key={i}
          className="absolute h-full opacity-[0.02]"
          style={{
            left: `${left}%`,
            width: '1px',
            background: 'linear-gradient(180deg, transparent 0%, #5C4033 20%, #5C4033 80%, transparent 100%)',
          }}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [floatDrops] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: 20 + Math.random() * 80,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 6,
    }))
  )

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!password.trim()) {
      setError('请输入密码')
      return
    }
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
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #F5EFE6 0%, #EAE0D5 40%, #DFD3C3 100%)',
        fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif',
      }}
    >
      {/* 全局背景装饰 */}
      <BackgroundPattern />

      {/* 浮动墨滴 */}
      {floatDrops.map((drop) => (
        <InkDrop
          key={drop.id}
          style={{
            width: drop.size,
            height: drop.size,
            left: `${drop.x}%`,
            top: `${drop.y}%`,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
          }}
        />
      ))}

      {/* 左侧装饰区 (桌面端) */}
      <div className="hidden lg:flex lg:w-[46%] h-full absolute left-0 top-0 flex-col justify-between p-16 pointer-events-none">
        {/* 左上角装饰 */}
        <div className="relative">
          <div
            className="absolute -top-8 -left-12 font-serif text-[22rem] text-[#8B7355]/[0.06] leading-none select-none font-bold"
            style={{ fontFamily: '"KaiTi", "STKaiti", serif' }}
          >
            墨
          </div>
          <div className="relative z-10 pt-4">
            <div className="flex items-center gap-4 mb-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(145deg, #C8956C 0%, #A0785A 100%)',
                  boxShadow: '0 8px 32px rgba(166, 120, 90, 0.3)',
                }}
              >
                <span className="text-2xl">📖</span>
              </div>
              <div>
                <div className="text-[#3D2B1F] font-bold text-xl tracking-wide">
                  小说工作站
                </div>
                <div className="text-[#8B7355] text-xs tracking-[0.25em] mt-0.5 uppercase font-light">
                  Novel Studio
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 中间大字装饰 */}
        <div className="flex-1 flex items-center">
          <div className="relative">
            <div
              className="font-serif text-[11rem] text-[#8B7355]/[0.08] leading-none font-bold"
              style={{ fontFamily: '"KaiTi", "STKaiti", serif' }}
            >
              韵
            </div>
            <div className="absolute top-full mt-4 left-2">
              <InkStroke className="w-64 h-8" />
            </div>
          </div>
        </div>

        {/* 底部文案 */}
        <div className="space-y-4">
          <p className="text-[#5C4033]/70 text-base leading-relaxed max-w-xs font-light">
            让文字化为影像<br />
            让故事跃然眼前
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: '智能场景提取', color: '#C8956C' },
              { label: '专业剧本生成', color: '#B8846A' },
              { label: '精美分镜制作', color: '#A0785A' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-[#8B7355]/60 text-xs tracking-wide">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中央登录卡片 */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-6">
        <div
          className={`
            relative rounded-3xl p-10 shadow-2xl transition-all duration-700 ease-out
            ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.97]'}
          `}
          style={{
            background: 'linear-gradient(160deg, #FFFBF5 0%, #F7F0E8 100%)',
            boxShadow: '0 25px 80px rgba(93, 64, 55, 0.12), 0 8px 24px rgba(93, 64, 55, 0.08)',
          }}
        >
          {/* 卡片顶部装饰线 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 top-4">
            <InkStroke className="w-32 h-5" />
          </div>

          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              style={{
                background: 'linear-gradient(145deg, #C8956C, #A0785A)',
                boxShadow: '0 4px 16px rgba(166, 120, 90, 0.3)',
              }}
            >
              <span className="text-xl">📖</span>
            </div>
            <div>
              <div className="text-[#3D2B1F] font-bold text-lg">小说工作站</div>
              <div className="text-[#8B7355] text-[10px] tracking-[0.2em] uppercase">Novel Studio</div>
            </div>
          </div>

          {/* 标题区 */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#3D2B1F] mb-3 tracking-wide">
              欢迎回来
            </h2>
            <p className="text-[#8B7355] text-sm">
              登录你的创作空间
            </p>
            {/* 小装饰 */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#C8956C]/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C8956C]/50" />
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#C8956C]/40" />
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名字段 */}
            <div className="space-y-2">
              <label className="text-[#8B7355] text-xs tracking-widest uppercase font-light">
                用户名
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8956C]/60 text-sm">✦</span>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-[#3D2B1F] text-sm transition-all duration-200 outline-none"
                  style={{
                    background: '#F5EFE6',
                    border: '1.5px solid #E8DFD0',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#C8956C'
                    e.target.style.boxShadow = '0 0 0 3px rgba(200, 149, 108, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8DFD0'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="输入你的用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* 密码字段 */}
            <div className="space-y-2">
              <label className="text-[#8B7355] text-xs tracking-widest uppercase font-light">
                密码
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8956C]/60 text-sm">✦</span>
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-[#3D2B1F] text-sm transition-all duration-200 outline-none"
                  style={{
                    background: '#F5EFE6',
                    border: '1.5px solid #E8DFD0',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#C8956C'
                    e.target.style.boxShadow = '0 0 0 3px rgba(200, 149, 108, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8DFD0'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="输入你的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm"
                style={{
                  background: '#FEF2F2',
                  color: '#B45309',
                  border: '1px solid #FDE68A',
                }}
              >
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-xl text-white text-sm font-semibold tracking-widest uppercase transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
              style={{
                background: loading
                  ? '#A0785A'
                  : 'linear-gradient(135deg, #8B7355 0%, #C8956C 50%, #A0785A 100%)',
                boxShadow: loading
                  ? 'none'
                  : '0 8px 24px rgba(139, 115, 85, 0.25)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 115, 85, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 115, 85, 0.25)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>创作空间中...</span>
                </span>
              ) : (
                <span className="group-hover:tracking-wider transition-all duration-300">登 录</span>
              )}
            </button>
          </form>

          {/* 底部 */}
          <div className="mt-10 text-center">
            <p className="text-[#A0785A]/50 text-xs tracking-wide">
              把故事变成影像 · 从文字到分镜
            </p>
          </div>

          {/* 底部装饰 */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#E8DFD0]" />
            <div className="w-1 h-1 rounded-full bg-[#C8956C]/30" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#E8DFD0]" />
          </div>
        </div>
      </div>

      {/* 右侧桌面装饰文字 */}
      <div className="hidden lg:block lg:w-[46%] h-full absolute right-0 top-0 pointer-events-none overflow-hidden">
        <div
          className="absolute bottom-20 -right-16 font-serif text-[20rem] text-[#8B7355]/[0.05] leading-none font-bold select-none"
          style={{ fontFamily: '"KaiTi", "STKaiti", serif' }}
        >
          韵
        </div>
      </div>

      {/* 全局 CSS 动画 */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.06; }
          33% { transform: translateY(-30px) rotate(5deg); opacity: 0.1; }
          66% { transform: translateY(15px) rotate(-3deg); opacity: 0.05; }
        }
        .animate-float-slow {
          animation: float-slow linear infinite;
        }
      `}</style>
    </div>
  )
}
