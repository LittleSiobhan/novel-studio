import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      setError('用户名或密码错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fdf6ee] via-[#faf5ef] to-[#f5ebe0]" />

      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 圆形装饰 */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#e8c9a0] opacity-20 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-[#d4a853] opacity-10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-[#c8956c] opacity-15 blur-3xl" />

        {/* 网格装饰 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #3d2e1e 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* 主内容区 */}
      <div className="relative min-h-screen flex">
        {/* 左侧品牌区 */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
          <div className="max-w-md">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c8956c] to-[#a0714f] flex items-center justify-center shadow-lg shadow-[#c8956c]/20">
                <span className="text-3xl">📖</span>
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-[#3d2e1e] tracking-wide">
                  小说工作站
                </h1>
                <p className="text-sm text-[#8b7355] tracking-widest uppercase mt-0.5">
                  Novel Studio
                </p>
              </div>
            </div>

            {/* 标语 */}
            <div className="space-y-6">
              <h2 className="font-serif text-4xl xl:text-5xl font-bold text-[#3d2e1e] leading-tight">
                把故事
                <br />
                <span className="text-[#c8956c]">变成影像</span>
              </h2>
              <p className="text-[#8b7355] text-lg leading-relaxed max-w-sm">
                从文字到剧本，从剧本到分镜。
                <br />
                一站式 AI 创作工具，让想象触手可及。
              </p>
            </div>

            {/* 装饰线 */}
            <div className="mt-16 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-[#d4a853] to-transparent" />
              <span className="text-[#d4a853] text-xl">✦</span>
              <div className="h-px flex-1 bg-gradient-to-l from-[#d4a853] to-transparent" />
            </div>

            {/* 特性列表 */}
            <div className="mt-12 grid grid-cols-2 gap-4">
              {[
                { icon: '✍️', text: '智能场景提取' },
                { icon: '🎬', text: '专业剧本生成' },
                { icon: '🎞️', text: 'AI 分镜提示词' },
                { icon: '💾', text: '项目云端保存' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm text-[#8b7355]"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧登录区 */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* 移动端 Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c8956c] to-[#a0714f] flex items-center justify-center shadow-lg shadow-[#c8956c]/20">
                <span className="text-2xl">📖</span>
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-[#3d2e1e]">小说工作站</h1>
                <p className="text-xs text-[#8b7355] tracking-widest">NOVEL STUDIO</p>
              </div>
            </div>

            {/* 登录卡片 */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 lg:p-10 shadow-xl shadow-[#c8956c]/5 border border-[#e8ddd4]/50">

              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl font-bold text-[#3d2e1e]">
                  欢迎回来
                </h2>
                <p className="text-[#8b7355] text-sm mt-2">
                  输入账号信息以继续创作
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 用户名 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#3d2e1e]">
                    用户名
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c8956c]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#fdf6ee] border-2 border-transparent text-[#3d2e1e] placeholder-[#b8a990] transition-all duration-200 outline-none"
                      style={{
                        borderColor: focused === 'username' ? '#c8956c' : 'transparent',
                        backgroundColor: focused === 'username' ? '#fff' : '#fdf6ee',
                      }}
                      placeholder="请输入用户名"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onFocus={() => setFocused('username')}
                      onBlur={() => setFocused(null)}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* 密码 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#3d2e1e]">
                    密码
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c8956c]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#fdf6ee] border-2 border-transparent text-[#3d2e1e] placeholder-[#b8a990] transition-all duration-200 outline-none"
                      style={{
                        borderColor: focused === 'password' ? '#c8956c' : 'transparent',
                        backgroundColor: focused === 'password' ? '#fff' : '#fdf6ee',
                      }}
                      placeholder="请输入密码"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-500 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* 登录按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 rounded-xl text-white font-medium text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: loading
                      ? '#c8956c'
                      : 'linear-gradient(135deg, #c8956c 0%, #a0714f 100%)',
                    boxShadow: loading
                      ? 'none'
                      : '0 4px 16px rgba(200, 149, 108, 0.35)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      登录中...
                    </span>
                  ) : (
                    '开始创作'
                  )}
                </button>
              </form>
            </div>

            {/* 底部信息 */}
            <p className="text-center text-xs text-[#b8a990] mt-8">
              把故事变成影像 · 从文字到分镜
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
