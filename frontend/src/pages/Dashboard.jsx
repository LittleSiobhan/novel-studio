import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:8001/api'

// 小流程步骤
const STEPS = [
  { id: 'input',   label: '输入小说', icon: '✍️' },
  { id: 'scene',   label: '提取场景', icon: '🎬' },
  { id: 'script',  label: '生成剧本', icon: '📄' },
  { id: 'storyboard', label: '生成分镜', icon: '🎞️' },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [novelText, setNovelText] = useState('')
  const [title, setTitle] = useState('')
  const [step, setStep] = useState('input')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API}/projects`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch {}
  }

  const createProject = async () => {
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: title, description: '' }),
      })
      const p = await res.json()
      setProjects([p, ...projects])
      setSelectedProject(p)
      setStep('input')
    } catch (err) {
      setError('创建项目失败')
    } finally {
      setLoading(false)
    }
  }

  const runPipeline = async () => {
    if (!novelText.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setStep('scene')
    try {
      const res = await fetch(`${API}/full-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text: novelText }),
      })
      if (!res.ok) throw new Error('AI 处理失败')
      const data = await res.json()
      setResult(data)
      setStep('storyboard')

      // 更新项目
      if (selectedProject) {
        await fetch(`${API}/projects/${selectedProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novel_text: novelText,
            script: data.script,
            storyboards: data.storyboards,
            status: 'done',
          }),
        })
      }
      await loadProjects()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id) => {
    await fetch(`${API}/projects/${id}`, { method: 'DELETE' })
    setProjects(projects.filter(p => p.id !== id))
    if (selectedProject?.id === id) setSelectedProject(null)
  }

  return (
    <div className="min-h-screen paper-bg">
      {/* 顶栏 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <span className="font-serif text-lg font-semibold">小说工作站</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--text-muted)]">
              你好，<span className="text-[var(--accent-dark)] font-medium">{user?.displayName}</span>
            </span>
            <button onClick={logout} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 左侧：项目列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="card-warm sticky top-24">
              <h3 className="font-serif font-semibold mb-4 text-[var(--text)]">我的项目</h3>

              {/* 新建项目 */}
              <div className="space-y-2 mb-6">
                <input
                  type="text"
                  className="input-warm text-sm"
                  placeholder="项目名称..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <button onClick={createProject} disabled={loading || !title.trim()} className="btn-primary text-sm py-2.5">
                  + 新建项目
                </button>
              </div>

              {/* 项目列表 */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {projects.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)] text-center py-8">
                    暂无项目，创建你的第一个吧 ✨
                  </p>
                )}
                {projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setResult(null); setStep('input') }}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedProject?.id === p.id
                        ? 'bg-[var(--surface-warm)] border border-[var(--accent-light)]'
                        : 'hover:bg-[var(--surface-warm)] border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {new Date(p.updated_at).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteProject(p.id) }}
                        className="text-xs text-[var(--text-muted)] hover:text-red-500 transition flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-2">
                      <span className={`tag-warm text-xs`}>
                        {p.status === 'done' ? '✓ 已完成' : '📝 草稿'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：工作区 */}
          <div className="lg:col-span-2">
            {!selectedProject ? (
              <div className="card-warm text-center py-20">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="font-serif text-lg font-semibold mb-2">选择或创建一个项目</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  在左侧选择项目，或创建新项目开始创作
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 步骤指示器 */}
                <div className="flex items-center justify-center gap-2 py-4">
                  {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
                        ${step === s.id ? 'bg-[var(--accent)] text-white scale-110'
                          : ['input','scene','script','storyboard'].indexOf(step) > ['input','scene','script','storyboard'].indexOf(s.id)
                          ? 'bg-green-100 text-green-600' : 'bg-[var(--surface-warm)] text-[var(--text-muted)]'}`}>
                        {s.icon}
                      </div>
                      <span className={`text-sm hidden sm:block ${step === s.id ? 'text-[var(--accent-dark)] font-medium' : 'text-[var(--text-muted)]'}`}>
                        {s.label}
                      </span>
                      {i < STEPS.length - 1 && (
                        <div className={`w-8 h-px ${['input','scene','script','storyboard'].indexOf(step) > i ? 'bg-green-400' : 'bg-[var(--border)]'}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* 输入区 */}
                <div className="card-warm">
                  <h3 className="font-serif font-semibold mb-4 flex items-center gap-2">
                    <span>✍️</span> 输入小说文本
                  </h3>
                  <textarea
                    className="input-warm resize-none h-64 font-mono text-sm leading-relaxed"
                    placeholder="在这里粘贴你的小说文本..."
                    value={novelText}
                    onChange={e => setNovelText(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-[var(--text-muted)]">
                      {novelText.length} 字
                    </span>
                    <button
                      onClick={runPipeline}
                      disabled={loading || !novelText.trim()}
                      className="btn-primary max-w-xs text-sm py-2.5"
                    >
                      {loading ? 'AI 创作中...' : '🚀 开始创作'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* 结果展示 */}
                {result && (
                  <div className="space-y-6">
                    {/* 基本信息 */}
                    <div className="card-warm">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="tag-warm">📝 {result.total_chars} 字</span>
                        <span className="tag-warm">👥 {result.characters?.length || 0} 角色</span>
                        <span className="tag-warm">🎬 {result.scenes?.length || 0} 场景</span>
                        <span className="tag-warm">📄 {result.script_scene_count || 0} 剧本场景</span>
                      </div>
                    </div>

                    {/* 剧本 */}
                    <div className="card-warm">
                      <h3 className="font-serif font-semibold mb-4 flex items-center gap-2">
                        <span>📄</span> 生成的剧本
                      </h3>
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)] font-mono bg-[var(--surface-warm)] rounded-xl p-4 max-h-96 overflow-y-auto">
                        {result.script}
                      </pre>
                    </div>

                    {/* 分镜 */}
                    <div className="card-warm">
                      <h3 className="font-serif font-semibold mb-4 flex items-center gap-2">
                        <span>🎞️</span> 分镜提示词
                      </h3>
                      <div className="space-y-3">
                        {(result.storyboards || []).map((sb, i) => (
                          <div key={i} className="bg-[var(--surface-warm)] rounded-xl p-4 border border-[var(--border)]">
                            <div className="flex items-start gap-3">
                              <span className="text-lg flex-shrink-0">🎬</span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium mb-1">
                                  场景 {sb.scene_id || i + 1}：{sb.visual_description?.slice(0, 60)}...
                                </p>
                                <p className="text-xs text-[var(--text-muted)] mb-2">
                                  镜头：{sb.camera_angle} · 氛围：{sb.mood}
                                </p>
                                <div className="bg-[var(--surface)] rounded-lg px-3 py-2">
                                  <p className="text-xs font-mono text-[var(--accent-dark)] break-all">
                                    {sb.jimeng_prompt}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
