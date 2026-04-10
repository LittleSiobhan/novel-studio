import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = '/api'

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
  success: '#22c55e',
}

function Card({ children, style }) {
  return (
    <div style={{ background: S.card, backdropFilter: 'blur(24px)', border: `1px solid ${S.cardBorder}`, borderRadius: 16, padding: 24, ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ icon, children }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: S.text }}>
      <span>{icon}</span> {children}
    </div>
  )
}

function ActionBtn({ children, onClick, loading, disabled, variant = 'primary', style }) {
  const isPrimary = variant === 'primary'
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '10px 24px',
        background: loading ? S.textMuted : isPrimary ? `linear-gradient(135deg, ${S.accent}, ${S.accentLight})` : 'rgba(255,255,255,0.04)',
        border: isPrimary ? 'none' : `1px solid ${S.cardBorder}`,
        borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        opacity: disabled && !loading ? 0.5 : 1,
        transition: 'all 0.2s',
        boxShadow: isPrimary ? `0 4px 16px ${S.accentGlow}` : 'none',
        ...style,
      }}
    >
      {loading ? '处理中...' : children}
    </button>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [novelText, setNovelText] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)

  // 工作流状态
  const [step, setStep] = useState('idle') // idle | scenes | characters | script | storyboard
  const [scenes, setScenes] = useState([])
  const [characters, setCharacters] = useState([])
  const [script, setScript] = useState('')
  const [storyboards, setStoryboards] = useState([])
  const [totalChars, setTotalChars] = useState(0)

  // 加载状态
  const [loadingScenes, setLoadingScenes] = useState(false)
  const [loadingChars, setLoadingChars] = useState(false)
  const [loadingScript, setLoadingScript] = useState(false)
  const [loadingBoard, setLoadingBoard] = useState(false)

  // 错误
  const [error, setError] = useState('')

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API}/projects`)
      if (res.ok) setProjects(await res.json())
    } catch {}
  }

  const createProject = async () => {
    if (!projectName.trim()) return
    setCreatingProject(true)
    setError('')
    try {
      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, description: '' }),
      })
      const p = await res.json()
      setProjects([p, ...projects])
      setSelectedProject(p)
      setProjectName('')
      resetWorkflow()
    } catch {
      setError('创建失败')
    } finally {
      setCreatingProject(false)
    }
  }

  const resetWorkflow = () => {
    setStep('idle')
    setScenes([])
    setCharacters([])
    setScript('')
    setStoryboards([])
    setTotalChars(0)
    setNovelText('')
  }

  const selectProject = (p) => {
    setSelectedProject(p)
    setNovelText(p.novel_text || '')
    setScenes(p.scenes || [])
    setCharacters(p.characters || [])
    setScript(p.script || '')
    setStoryboards(p.storyboards || [])
    setTotalChars(p.novel_text?.length || 0)
    if (p.scenes?.length) setStep('scenes')
    else if (p.characters?.length) setStep('characters')
    else if (p.script) setStep('script')
    else if (p.storyboards?.length) setStep('storyboard')
    else setStep('idle')
  }

  const deleteProject = async (id, e) => {
    e.stopPropagation()
    await fetch(`${API}/projects/${id}`, { method: 'DELETE' })
    setProjects(projects.filter(p => p.id !== id))
    if (selectedProject?.id === id) { setSelectedProject(null); resetWorkflow() }
  }

  // ① 提取场景
  const handleExtractScenes = async () => {
    if (!novelText.trim()) { setError('请先输入小说文本'); return }
    setLoadingScenes(true)
    setError('')
    try {
      const res = await fetch(`${API}/extract-scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: novelText, title: selectedProject?.name }),
      })
      const data = await res.json()
      setScenes(data.scenes || [])
      setCharacters(data.characters?.map(n => ({ name: n })) || [])
      setTotalChars(data.total_chars || novelText.length)
      setStep('scenes')
      await saveProject({ scenes: data.scenes, characters: data.characters?.map(n => ({ name: n })), status: 'scenes_done' })
    } catch {
      setError('场景提取失败')
    } finally {
      setLoadingScenes(false)
    }
  }

  // ② 生成角色详情
  const handleGenerateCharacters = async () => {
    if (!characters.length) { setError('请先提取场景'); return }
    setLoadingChars(true)
    setError('')
    try {
      const res = await fetch(`${API}/generate-characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characters: characters.map(c => c.name) }),
      })
      const data = await res.json()
      setCharacters(data.characters || [])
      setStep('characters')
      await saveProject({ characters: data.characters, status: 'characters_done' })
    } catch {
      setError('角色生成失败')
    } finally {
      setLoadingChars(false)
    }
  }

  // ③ 生成剧本
  const handleGenerateScript = async () => {
    setLoadingScript(true)
    setError('')
    try {
      const res = await fetch(`${API}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: novelText, title: selectedProject?.name }),
      })
      const data = await res.json()
      setScript(data.script || '')
      setStep('script')
      await saveProject({ script: data.script, status: 'script_done' })
    } catch {
      setError('剧本生成失败')
    } finally {
      setLoadingScript(false)
    }
  }

  // ④ 生成分镜
  const handleGenerateStoryboard = async () => {
    if (!scenes.length) { setError('请先提取场景'); return }
    setLoadingBoard(true)
    setError('')
    try {
      const res = await fetch(`${API}/generate-storyboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenes),
      })
      const data = await res.json()
      setStoryboards(data.storyboards || [])
      setStep('storyboard')
      await saveProject({ storyboards: data.storyboards, status: 'done' })
    } catch {
      setError('分镜生成失败')
    } finally {
      setLoadingBoard(false)
    }
  }

  const saveProject = async (updates) => {
    if (!selectedProject) return
    await fetch(`${API}/projects/${selectedProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, novel_text: novelText }),
    })
    const res = await fetch(`${API}/projects/${selectedProject.id}`)
    if (res.ok) {
      const updated = await res.json()
      setSelectedProject(updated)
      setProjects(projects => projects.map(p => p.id === updated.id ? updated : p))
    }
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', color: S.text }}>
      {/* 顶栏 */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${S.cardBorder}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${S.accent}, ${S.accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📖</div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>小说工作站</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: S.textMuted }}>你好，<span style={{ color: S.accentLight, fontWeight: 500 }}>{user?.displayName}</span></span>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6 }}>退出</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>

        {/* 左侧项目栏 */}
        <div style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>我的项目</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="项目名称..."
                style={{ width: '100%', padding: '10px 12px', background: S.inputBg, border: `1.5px solid rgba(255,255,255,0.06)`, borderRadius: 10, color: S.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = S.accent}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
              />
              <button onClick={createProject} disabled={creatingProject || !projectName.trim()}
                style={{ width: '100%', padding: '9px', background: S.accent, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!projectName.trim()) ? 0.5 : 1 }}>
                {creatingProject ? '创建中...' : '+ 新建项目'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {projects.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', color: S.textMuted, fontSize: 13 }}>暂无项目 ✨</div>}
              {projects.map(p => (
                <div key={p.id} onClick={() => selectProject(p)}
                  style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: selectedProject?.id === p.id ? 'rgba(124,92,252,0.08)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${selectedProject?.id === p.id ? S.accent : 'transparent'}`, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{new Date(p.updated_at).toLocaleDateString('zh-CN')}</div>
                    </div>
                    <button onClick={e => deleteProject(p.id, e)} style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: p.status === 'done' ? 'rgba(34,197,94,0.1)' : 'rgba(124,92,252,0.1)', color: p.status === 'done' ? '#22c55e' : S.accent }}>
                      {p.status === 'done' ? '✓ 已完成' : p.status === 'script_done' ? '📄 剧本' : p.status === 'characters_done' ? '👥 角色' : p.status === 'scenes_done' ? '🎬 场景' : '📝 草稿'}
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
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>选择或创建一个项目</div>
              <div style={{ fontSize: 13, color: S.textMuted }}>在左侧选择项目，或创建新项目开始创作</div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* 小说输入 */}
              <Card>
                <SectionTitle icon="📖">小说文本</SectionTitle>
                <textarea value={novelText} onChange={e => { setNovelText(e.target.value); setTotalChars(e.target.value.length) }}
                  placeholder="在这里粘贴你的小说文本..."
                  style={{ width: '100%', height: 160, padding: 12, background: S.inputBg, border: `1.5px solid rgba(255,255,255,0.06)`, borderRadius: 10, color: S.text, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: S.textMuted }}>{totalChars} 字</span>
                  <ActionBtn onClick={handleExtractScenes} loading={loadingScenes} disabled={!novelText.trim()}>
                    ① 提取场景
                  </ActionBtn>
                </div>
              </Card>

              {error && <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(252,92,92,0.08)', color: S.error, fontSize: 13, border: '1px solid rgba(252,92,92,0.2)' }}>⚠ {error}</div>}

              {/* 场景结果 */}
              {scenes.length > 0 && (
                <Card>
                  <SectionTitle icon="🎬">场景列表 ({scenes.length})</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                    {scenes.map((s, i) => (
                      <div key={i} style={{ background: S.inputBg, borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: S.text, marginBottom: 4 }}>
                          {i + 1}. {s.location} - {s.time}
                        </div>
                        <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 4 }}>{s.summary}</div>
                        {s.characters?.length > 0 && (
                          <div style={{ fontSize: 11, color: S.accentLight }}>👥 {s.characters.join('、')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                    <ActionBtn onClick={handleGenerateCharacters} loading={loadingChars} disabled={!scenes.length}>
                      ② 生成角色详情
                    </ActionBtn>
                    <ActionBtn onClick={handleGenerateScript} loading={loadingScript} disabled={!scenes.length} variant="secondary">
                      ③ 生成剧本
                    </ActionBtn>
                    <ActionBtn onClick={handleGenerateStoryboard} loading={loadingBoard} disabled={!scenes.length} variant="secondary">
                      ④ 生成分镜
                    </ActionBtn>
                  </div>
                </Card>
              )}

              {/* 角色结果 */}
              {characters.length > 0 && (
                <Card>
                  <SectionTitle icon="👥">角色详情 ({characters.length})</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {characters.map((c, i) => (
                      <div key={i} style={{ background: S.inputBg, borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{c.name}</span>
                            {c.role && <span style={{ fontSize: 11, color: S.accentLight, marginLeft: 8 }}>{c.role}</span>}
                          </div>
                        </div>
                        {c.age_appearance && <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 4 }}>外貌：{c.age_appearance}</div>}
                        {c.personality && <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 6 }}>性格：{c.personality}</div>}
                        {c.visual_prompt && (
                          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: 'monospace', color: S.accentLight, wordBreak: 'break-all' }}>
                            🎨 {c.visual_prompt}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                    <ActionBtn onClick={handleGenerateScript} loading={loadingScript} disabled={!characters.length}>
                      ③ 生成剧本
                    </ActionBtn>
                    <ActionBtn onClick={handleGenerateStoryboard} loading={loadingBoard} disabled={!characters.length} variant="secondary">
                      ④ 生成分镜
                    </ActionBtn>
                  </div>
                </Card>
              )}

              {/* 剧本结果 */}
              {script && (
                <Card>
                  <SectionTitle icon="📄">生成的剧本</SectionTitle>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: S.inputBg, borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7, color: S.text, fontFamily: 'monospace', maxHeight: 400, overflowY: 'auto', margin: 0 }}>
                    {script}
                  </pre>
                  <div style={{ marginTop: 16 }}>
                    <ActionBtn onClick={handleGenerateStoryboard} loading={loadingBoard} disabled={!script}>
                      ④ 生成分镜
                    </ActionBtn>
                  </div>
                </Card>
              )}

              {/* 分镜结果 */}
              {storyboards.length > 0 && (
                <Card>
                  <SectionTitle icon="🎞️">分镜提示词 ({storyboards.length})</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {storyboards.map((sb, i) => (
                      <div key={i} style={{ background: S.inputBg, borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>🎬</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: S.text, marginBottom: 4 }}>
                              场景 {sb.scene_id || i + 1}：{sb.visual_description}
                            </div>
                            <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 8 }}>
                              镜头：{sb.camera_angle} · 氛围：{sb.mood}
                            </div>
                            {sb.jimeng_prompt && (
                              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'monospace', color: S.accentLight, wordBreak: 'break-all' }}>
                                🎨 {sb.jimeng_prompt}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  )
}
