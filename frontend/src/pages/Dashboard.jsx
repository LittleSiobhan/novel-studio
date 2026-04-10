import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:8001/api'

const STEPS = [
  { id: 'input',   label: '输入小说', icon: '✍️' },
  { id: 'scene',   label: '提取场景', icon: '🎬' },
  { id: 'script',  label: '生成剧本', icon: '📄' },
  { id: 'storyboard', label: '生成分镜', icon: '🎞️' },
]

const S = {
  bg: '#0a0a0f',
  card: 'rgba(18, 18, 26, 0.9)',
  cardBorder: 'rgba(255,255,255,0.07)',
  inputBg: 'rgba(26, 26, 38, 0.8)',
  accent: '#7c5cfc',
  accentLight: '#a78bfa',
  accentGlow: 'rgba(124, 92, 252, 0.15)',
  text: '#e8e8ed',
  textMuted: '#6b6b7a',
  error: '#fc5c5c',
  success: '#5cffb1',
}

function StepBar({ step }) {
  const order = ['input', 'scene', 'script', 'storyboard']
  const cur = order.indexOf(step)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 0' }}>
      {STEPS.map((s, i) => {
        const done = order.indexOf(step) > i
        const active = step === s.id
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
              background: active ? S.accent : done ? '#22c55e' : 'rgba(255,255,255,0.04)',
              color: active || done ? '#fff' : S.textMuted,
              border: active ? `1.5px solid ${S.accent}` : '1.5px solid transparent',
              boxShadow: active ? `0 0 12px ${S.accentGlow}` : 'none',
              transition: 'all 0.3s',
            }}>
              {s.icon}
            </div>
            <span style={{
              fontSize: 12,
              color: active ? S.accent : done ? '#22c55e' : S.textMuted,
              fontWeight: active ? 600 : 400,
              display: 'none',
            }} className="sm:block">{s.label}</span>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 32, height: 1.5,
                background: done ? '#22c55e' : 'rgba(255,255,255,0.06)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: S.card,
      backdropFilter: 'blur(24px)',
      border: `1px solid ${S.cardBorder}`,
      borderRadius: 16,
      padding: 24,
      ...style,
    }}>
      {children}
    </div>
  )
}

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
  const [inputFocus, setInputFocus] = useState(false)

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API}/projects`)
      if (res.ok) setProjects(await res.json())
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
      setTitle('')
      setStep('input')
    } catch {
      setError('创建失败')
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
    <div style={{ background: S.bg, minHeight: '100vh', color: S.text }}>
      {/* 顶栏 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${S.cardBorder}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${S.accent}, ${S.accentLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>📖</div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>小说工作站</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: S.textMuted }}>
              你好，<span style={{ color: S.accentLight, fontWeight: 500 }}>{user?.displayName}</span>
            </span>
            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6 }}
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>

          {/* 左侧项目栏 */}
          <div style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: S.text }}>我的项目</div>

              {/* 新建 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onFocus={() => setInputFocus(true)}
                  onBlur={() => setInputFocus(false)}
                  placeholder="项目名称..."
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: inputFocus ? 'rgba(26,26,38,0.95)' : S.inputBg,
                    border: `1.5px solid ${inputFocus ? S.accent : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 10, color: S.text, fontSize: 13, outline: 'none',
                    boxShadow: inputFocus ? `0 0 0 3px ${S.accentGlow}` : 'none',
                    transition: 'all 0.2s',
                  }}
                />
                <button
                  onClick={createProject}
                  disabled={loading || !title.trim()}
                  style={{
                    width: '100%', padding: '9px',
                    background: S.accent, border: 'none', borderRadius: 10,
                    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    opacity: loading || !title.trim() ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  + 新建项目
                </button>
              </div>

              {/* 列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                {projects.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: S.textMuted, fontSize: 13 }}>
                    暂无项目 ✨
                  </div>
                )}
                {projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProject(p); setResult(null); setStep('input') }}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: selectedProject?.id === p.id ? 'rgba(124,92,252,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${selectedProject?.id === p.id ? S.accent : 'transparent'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>
                          {new Date(p.updated_at).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteProject(p.id) }}
                        style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                        fontSize: 10, fontWeight: 500,
                        background: p.status === 'done' ? 'rgba(34,197,94,0.1)' : 'rgba(124,92,252,0.1)',
                        color: p.status === 'done' ? '#22c55e' : S.accent,
                      }}>
                        {p.status === 'done' ? '✓ 已完成' : '📝 草稿'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 右侧工作区 */}
          <div>
            {!selectedProject ? (
              <Card style={{ textAlign: 'center', padding: '80px 40px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: S.text }}>选择或创建一个项目</div>
                <div style={{ fontSize: 13, color: S.textMuted }}>在左侧选择项目，或创建新项目开始创作</div>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 步骤条 */}
                <Card><StepBar step={step} /></Card>

                {/* 输入区 */}
                <Card>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✍️</span> 输入小说文本
                  </div>
                  <textarea
                    value={novelText}
                    onChange={e => setNovelText(e.target.value)}
                    placeholder="在这里粘贴你的小说文本..."
                    style={{
                      width: '100%', height: 240, padding: '12px',
                      background: S.inputBg, border: `1.5px solid rgba(255,255,255,0.06)`,
                      borderRadius: 10, color: S.text, fontSize: 13,
                      fontFamily: 'monospace', lineHeight: 1.7, resize: 'none', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <span style={{ fontSize: 12, color: S.textMuted }}>{novelText.length} 字</span>
                    <button
                      onClick={runPipeline}
                      disabled={loading || !novelText.trim()}
                      style={{
                        padding: '10px 24px',
                        background: loading ? S.textMuted : `linear-gradient(135deg, ${S.accent}, ${S.accentLight})`,
                        border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: `0 4px 16px ${S.accentGlow}`,
                        transition: 'all 0.2s',
                      }}
                    >
                      {loading ? 'AI 创作中...' : '🚀 开始创作'}
                    </button>
                  </div>
                </Card>

                {error && (
                  <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(252,92,92,0.08)', color: S.error, fontSize: 13, border: '1px solid rgba(252,92,92,0.2)' }}>
                    ⚠ {error}
                  </div>
                )}

                {/* 结果 */}
                {result && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* 统计 */}
                    <Card>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[
                          { label: `${result.total_chars} 字`, icon: '📝' },
                          { label: `${result.characters?.length || 0} 角色`, icon: '👥' },
                          { label: `${result.scenes?.length || 0} 场景`, icon: '🎬' },
                          { label: `${result.script_scene_count || 0} 剧本场景`, icon: '📄' },
                        ].map((t, i) => (
                          <span key={i} style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                            background: 'rgba(124,92,252,0.08)', color: S.accentLight,
                            border: '1px solid rgba(124,92,252,0.15)',
                          }}>
                            {t.icon} {t.label}
                          </span>
                        ))}
                      </div>
                    </Card>

                    {/* 剧本 */}
                    <Card>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>📄</span> 生成的剧本
                      </div>
                      <pre style={{
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        background: S.inputBg, borderRadius: 10, padding: 16,
                        fontSize: 13, lineHeight: 1.7, color: S.text,
                        fontFamily: 'monospace', maxHeight: 300, overflowY: 'auto',
                        margin: 0,
                      }}>
                        {result.script}
                      </pre>
                    </Card>

                    {/* 分镜 */}
                    <Card>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>🎞️</span> 分镜提示词
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(result.storyboards || []).map((sb, i) => (
                          <div key={i} style={{
                            background: S.inputBg, borderRadius: 10, padding: 14,
                            border: '1px solid rgba(255,255,255,0.04)',
                          }}>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <span style={{ fontSize: 18, flexShrink: 0 }}>🎬</span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: S.text, marginBottom: 4 }}>
                                  场景 {sb.scene_id || i + 1}：{sb.visual_description?.slice(0, 80)}
                                </div>
                                <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 8 }}>
                                  镜头：{sb.camera_angle} · 氛围：{sb.mood}
                                </div>
                                <div style={{
                                  background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                                  padding: '8px 12px', fontSize: 12, fontFamily: 'monospace',
                                  color: S.accentLight, wordBreak: 'break-all',
                                }}>
                                  {sb.jimeng_prompt}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
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
