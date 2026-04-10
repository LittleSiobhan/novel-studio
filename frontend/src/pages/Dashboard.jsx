import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = '/api'

const S = {
  bg: '#0a0a0f', card: 'rgba(18, 18, 26, 0.9)', cardBorder: 'rgba(255,255,255,0.07)',
  inputBg: 'rgba(26, 26, 38, 0.8)', accent: '#7c5cfc', accentLight: '#a78bfa',
  accentGlow: 'rgba(124, 92, 252, 0.15)', text: '#e8e8ed', textMuted: '#6b6b7a',
  error: '#fc5c5c', success: '#22c55e',
}

function Card({ children, style }) {
  return <div style={{ background: S.card, backdropFilter: 'blur(24px)', border: `1px solid ${S.cardBorder}`, borderRadius: 16, padding: 24, ...style }}>{children}</div>
}
function SectionTitle({ icon, children }) {
  return <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><span>{icon}</span> {children}</div>
}
function Btn({ children, onClick, loading, disabled, secondary }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{
        padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        background: loading ? S.textMuted : secondary ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${S.accent}, ${S.accentLight})`,
        border: secondary ? `1px solid ${S.cardBorder}` : 'none', color: '#fff',
        opacity: disabled && !loading ? 0.5 : 1, transition: 'all 0.2s',
        boxShadow: secondary ? 'none' : `0 4px 16px ${S.accentGlow}`,
      }}>
      {loading ? '处理中...' : children}
    </button>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [novelText, setNovelText] = useState('')
  const [script, setScript] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // 提取结果
  const [scenes, setScenes] = useState([])
  const [characters, setCharacters] = useState([])
  const [props, setProps] = useState([])

  // 用户选择（勾选）
  const [selScenes, setSelScenes] = useState({})
  const [selChars, setSelChars] = useState({})
  const [selProps, setSelProps] = useState({})

  // 生成结果（含提示词）
  const [genScenes, setGenScenes] = useState([])
  const [genChars, setGenChars] = useState([])
  const [genProps, setGenProps] = useState([])

  // 加载状态
  const [loadingScript, setLoadingScript] = useState(false)
  const [loadingScenes, setLoadingScenes] = useState(false)
  const [loadingChars, setLoadingChars] = useState(false)
  const [loadingProps, setLoadingProps] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(false)

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    try {
      const r = await fetch(`${API}/projects`)
      if (r.ok) setProjects(await r.json())
    } catch {}
  }

  const createProject = async () => {
    if (!projectName.trim()) return
    setCreating(true)
    try {
      const r = await fetch(`${API}/projects`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      })
      const p = await r.json()
      setProjects([p, ...projects])
      setSelected(p)
      setProjectName('')
      resetWork()
    } catch { setError('创建失败') } finally { setCreating(false) }
  }

  const selectProject = async (p) => {
    setSelected(p)
    setNovelText(p.novel_text || '')
    setScript(p.script || '')
    setScenes(p.scenes || [])
    setCharacters(p.characters || [])
    setProps(p.props || [])
    setSelScenes({})
    setSelChars({})
    setSelProps({})
    setGenScenes([])
    setGenChars([])
    setGenProps([])
  }

  const resetWork = () => {
    setNovelText(''); setScript(''); setScenes([]); setCharacters([]); setProps([])
    setSelScenes({}); setSelChars({}); setSelProps({})
    setGenScenes([]); setGenChars([]); setGenProps([])
  }

  const deleteProject = async (id, e) => {
    e.stopPropagation()
    await fetch(`${API}/projects/${id}`, { method: 'DELETE' })
    setProjects(projects.filter(p => p.id !== id))
    if (selected?.id === id) { setSelected(null); resetWork() }
  }

  const saveProject = async (updates) => {
    if (!selected) return
    await fetch(`${API}/projects/${selected.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, novel_text: novelText, script }),
    })
  }

  // ① 生成剧本
  const handleScript = async () => {
    if (!novelText.trim()) { setError('请先输入小说文本'); return }
    setLoadingScript(true); setError('')
    try {
      const r = await fetch(`${API}/generate-script`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: novelText, title: selected?.name }),
      })
      const d = await r.json()
      setScript(d.script)
      resetExtractions()
      await saveProject({ script: d.script, status: 'script_done' })
    } catch { setError('剧本生成失败') } finally { setLoadingScript(false) }
  }

  const resetExtractions = () => {
    setScenes([]); setCharacters([]); setProps([])
    setSelScenes({}); setSelChars({}); setSelProps({})
    setGenScenes([]); setGenChars([]); setGenProps([])
  }

  // ② 提炼场景
  const handleExtractScenes = async () => {
    if (!script.trim()) { setError('请先生成剧本'); return }
    setLoadingScenes(true)
    try {
      const r = await fetch(`${API}/extract-scenes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script }),
      })
      const d = await r.json()
      setScenes(d.scenes || [])
      setSelScenes({})
      await saveProject({ scenes: d.scenes })
    } catch { setError('场景提取失败') } finally { setLoadingScenes(false) }
  }

  // ③ 提炼人物
  const handleExtractChars = async () => {
    if (!script.trim()) { setError('请先生成剧本'); return }
    setLoadingChars(true)
    try {
      const r = await fetch(`${API}/extract-characters`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script }),
      })
      const d = await r.json()
      setCharacters(d.characters || [])
      setSelChars({})
      await saveProject({ characters: d.characters })
    } catch { setError('人物提取失败') } finally { setLoadingChars(false) }
  }

  // ④ 提炼道具
  const handleExtractProps = async () => {
    if (!script.trim()) { setError('请先生成剧本'); return }
    setLoadingProps(true)
    try {
      const r = await fetch(`${API}/extract-props`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      })
      const d = await r.json()
      setProps(d.props || [])
      setSelProps({})
      await saveProject({ props: d.props })
    } catch { setError('道具提取失败') } finally { setLoadingProps(false) }
  }

  // ⑤ 生成提示词（仅对勾选的项）
  const handleGeneratePrompts = async () => {
    const hasSel = Object.values(selScenes).some(Boolean) ||
      Object.values(selChars).some(Boolean) ||
      Object.values(selProps).some(Boolean)
    if (!hasSel) { setError('请先勾选要生成提示词的项'); return }

    setLoadingPrompts(true)
    try {
      // 准备选中的场景
      const selScenesList = scenes.filter((_, i) => selScenes[i]).map((s, i) => ({
        scene_id: i + 1,
        visual_description: `${s.location} - ${s.time}：${s.summary}`,
      }))

      const selCharsList = characters.filter((_, i) => selChars[i])
      const selPropsList = props.filter((_, i) => selProps[i])

      const r = await fetch(`${API}/generate-prompts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: selScenesList, characters: selCharsList, props: selPropsList }),
      })
      const d = await r.json()

      if (d.scenes) setGenScenes(d.scenes)
      if (d.characters) setGenChars(d.characters)
      if (d.props) setGenProps(d.props)
    } catch { setError('提示词生成失败') } finally { setLoadingPrompts(false) }
  }

  const toggleSel = (setter, state, key) => {
    setter({ ...state, [key]: !state[key] })
  }

  const hasAnySelection = Object.values(selScenes).some(Boolean) ||
    Object.values(selChars).some(Boolean) ||
    Object.values(selProps).some(Boolean)

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
              <button onClick={createProject} disabled={creating || !projectName.trim()}
                style={{ width: '100%', padding: '9px', background: S.accent, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !projectName.trim() ? 0.5 : 1 }}>
                {creating ? '创建中...' : '+ 新建项目'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {projects.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', color: S.textMuted, fontSize: 13 }}>暂无项目 ✨</div>}
              {projects.map(p => (
                <div key={p.id} onClick={() => selectProject(p)}
                  style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: selected?.id === p.id ? 'rgba(124,92,252,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${selected?.id === p.id ? S.accent : 'transparent'}`, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{new Date(p.updated_at).toLocaleDateString('zh-CN')}</div>
                    </div>
                    <button onClick={e => deleteProject(p.id, e)} style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500,
                      background: p.script ? 'rgba(34,197,94,0.1)' : 'rgba(124,92,252,0.1)',
                      color: p.script ? '#22c55e' : S.accent }}>
                      {p.script ? '✓ 有剧本' : '📝 草稿'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 右侧工作区 */}
        <div>
          {!selected ? (
            <Card style={{ textAlign: 'center', padding: '80px 40px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>选择或创建一个项目</div>
              <div style={{ fontSize: 13, color: S.textMuted }}>在左侧选择项目，或创建新项目开始创作</div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* 小说输入 */}
              <Card>
                <SectionTitle icon="📖">第一步：粘贴小说文本</SectionTitle>
                <textarea value={novelText} onChange={e => setNovelText(e.target.value)}
                  placeholder="在这里粘贴你的小说文本..."
                  style={{ width: '100%', height: 120, padding: 12, background: S.inputBg, border: `1.5px solid rgba(255,255,255,0.06)`, borderRadius: 10, color: S.text, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: S.textMuted }}>{novelText.length} 字</span>
                  <Btn onClick={handleScript} loading={loadingScript} disabled={!novelText.trim()}>① 生成剧本</Btn>
                </div>
              </Card>

              {error && <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(252,92,92,0.08)', color: S.error, fontSize: 13, border: '1px solid rgba(252,92,92,0.2)' }}>⚠ {error}</div>}

              {/* 剧本 */}
              {script && (
                <Card>
                  <SectionTitle icon="📄">剧本（可编辑）</SectionTitle>
                  <textarea value={script} onChange={e => setScript(e.target.value)}
                    style={{ width: '100%', minHeight: 200, padding: 12, background: S.inputBg, border: `1.5px solid rgba(255,255,255,0.06)`, borderRadius: 10, color: S.text, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <Btn onClick={() => { setScript(script); saveProject({ script }) }} secondary>保存剧本</Btn>
                  </div>
                </Card>
              )}

              {/* 提炼按钮组 */}
              {script && (
                <Card>
                  <SectionTitle icon="🔍">第二步：从剧本中提炼内容</SectionTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <Btn onClick={handleExtractScenes} loading={loadingScenes}>🎬 提炼场景</Btn>
                    <Btn onClick={handleExtractChars} loading={loadingChars}>👥 提炼人物</Btn>
                    <Btn onClick={handleExtractProps} loading={loadingProps}>🎁 提炼道具</Btn>
                  </div>
                </Card>
              )}

              {/* 场景列表 */}
              {scenes.length > 0 && (
                <Card>
                  <SectionTitle icon="🎬">场景列表（勾选要生成提示词的）</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                    {scenes.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: S.inputBg, borderRadius: 10, padding: 12, border: `1px solid ${selScenes[i] ? S.accent : 'rgba(255,255,255,0.04)'}` }}>
                        <input type="checkbox" checked={!!selScenes[i]} onChange={() => toggleSel(setSelScenes, selScenes, i)}
                          style={{ accentColor: S.accent, marginTop: 2, flexShrink: 0, width: 16, height: 16 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: S.text }}>{i + 1}. {s.location} - {s.time}</div>
                          <div style={{ fontSize: 12, color: S.textMuted }}>{s.summary}</div>
                          {s.characters?.length > 0 && <div style={{ fontSize: 11, color: S.accentLight, marginTop: 2 }}>👥 {s.characters.join('、')}</div>}
                          {genScenes[i] && (
                            <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: 'monospace', color: S.accentLight, wordBreak: 'break-all' }}>
                              🎨 {genScenes[i].jimeng_prompt}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 人物列表 */}
              {characters.length > 0 && (
                <Card>
                  <SectionTitle icon="👥">人物列表（勾选要生成提示词的）</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                    {characters.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: S.inputBg, borderRadius: 10, padding: 12, border: `1px solid ${selChars[i] ? S.accent : 'rgba(255,255,255,0.04)'}` }}>
                        <input type="checkbox" checked={!!selChars[i]} onChange={() => toggleSel(setSelChars, selChars, i)}
                          style={{ accentColor: S.accent, marginTop: 2, flexShrink: 0, width: 16, height: 16 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: S.text }}>{c.name} {c.role && <span style={{ fontSize: 11, color: S.accentLight }}>({c.role})</span>}</div>
                          {genChars[i] && (
                            <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: 'monospace', color: S.accentLight, wordBreak: 'break-all' }}>
                              🎨 {genChars[i].visual_prompt}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 道具列表 */}
              {props.length > 0 && (
                <Card>
                  <SectionTitle icon="🎁">道具列表（勾选要生成提示词的）</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                    {props.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: S.inputBg, borderRadius: 10, padding: 12, border: `1px solid ${selProps[i] ? S.accent : 'rgba(255,255,255,0.04)'}` }}>
                        <input type="checkbox" checked={!!selProps[i]} onChange={() => toggleSel(setSelProps, selProps, i)}
                          style={{ accentColor: S.accent, marginTop: 2, flexShrink: 0, width: 16, height: 16 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: S.text }}>{p.name}</div>
                          {p.description && <div style={{ fontSize: 12, color: S.textMuted }}>{p.description}</div>}
                          {genProps[i] && (
                            <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: 'monospace', color: S.accentLight, wordBreak: 'break-all' }}>
                              🎨 {genProps[i].visual_prompt}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 生成提示词按钮 */}
              {hasAnySelection && (
                <Card style={{ textAlign: 'center', padding: '20px 24px' }}>
                  <SectionTitle icon="✨">第三步：生成提示词</SectionTitle>
                  <div style={{ fontSize: 13, color: S.textMuted, marginBottom: 16 }}>
                    已选择：{Object.values(selScenes).filter(Boolean).length} 个场景，{Object.values(selChars).filter(Boolean).length} 个人物，{Object.values(selProps).filter(Boolean).length} 个道具
                  </div>
                  <Btn onClick={handleGeneratePrompts} loading={loadingPrompts}>✨ 生成提示词</Btn>
                </Card>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  )
}
