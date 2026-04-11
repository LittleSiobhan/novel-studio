import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = '/api'

const S = {
  bg: '#0a0a0f', card: 'rgba(18, 18, 26, 0.9)', cardBorder: 'rgba(255,255,255,0.07)',
  inputBg: 'rgba(26, 26, 38, 0.8)', accent: '#7c5cfc', accentLight: '#a78bfa',
  accentGlow: 'rgba(124, 92, 252, 0.15)', text: '#e8e8ed', textMuted: '#6b6b7a',
  error: '#fc5c5c', success: '#22c55e', warn: '#f59e0b',
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

// ── 角色详细表格 ──────────────────────────────────────────
function CharacterTable({ characters }) {
  const [expanded, setExpanded] = useState({})
  if (!characters?.length) return null
  return (
    <Card style={{ marginTop: 16 }}>
      <SectionTitle icon="👥">角色汇总表（{characters.length}）</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.cardBorder}` }}>
              {['角色名','定位','性别','年龄','身高','体型','发型','发色','脸型','眼睛','肤色','服装','饰品','性格','文生图描述词'].map(h => (
                <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: S.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {characters.map((c, i) => (
              <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                {[
                  <span style={{ color: S.accentLight, fontWeight: 600 }}>{c.name}</span>,
                  c.role || '-',
                  c.gender || '-',
                  c.age || '-',
                  c.height || '-',
                  c.body_type || '-',
                  c.hairstyle || '-',
                  c.hair_color || '-',
                  c.face_shape || '-',
                  c.eyes || '-',
                  c.skin || '-',
                  c.outfit || '-',
                  c.accessories || '无',
                  c.personality || '-',
                  <span style={{ maxWidth: 280, display: 'block', whiteSpace: 'normal', lineHeight: 1.5, fontSize: 11 }}>{c.visual_prompt || '-'}</span>,
                ].map((val, j) => (
                  <td key={j} style={{ padding: '10px 6px', color: S.text, verticalAlign: 'top', lineHeight: 1.5 }}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: S.textMuted, marginTop: 8 }}>
        共 {characters.length} 个角色（含配角/路人）
      </p>
    </Card>
  )
}

// ── 场景详细表格 ──────────────────────────────────────────
function SceneTable({ scenes }) {
  if (!scenes?.length) return null
  return (
    <Card style={{ marginTop: 16 }}>
      <SectionTitle icon="🎬">场景汇总表（{scenes.length}）</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {scenes.map((s, i) => {
          // 合成一段完整的文生图描述
          const parts = [
            s.scene_name ? `${s.scene_name}，` : '',
            s.space_scale ? `面积${s.space_scale}，` : '',
            s.height ? `层高${s.height}，` : '',
            s.time ? `${s.time}，` : '',
            s.weather && s.weather !== '室内无天气影响' ? `${s.weather}，` : '',
            s.light_source ? `光源为${s.light_source}，` : '',
            s.style ? `整体风格为${s.style}，` : '',
            s.main_elements ? `主体陈设为${s.main_elements}，` : '',
            s.foreground ? `前景为${s.foreground}，` : '',
            s.mood ? `氛围${s.mood}，` : '',
            s.space_type ? `${s.space_type}，` : '',
            s.shot_type ? `建议${s.shot_type}，` : '',
            s.camera_angle ? `拍摄${s.camera_angle}。` : '',
          ].filter(Boolean)

          const combined = parts.join('')

          return (
            <div key={i} style={{
              border: `1px solid ${S.cardBorder}`,
              borderRadius: 12,
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span style={{ color: S.accent, fontWeight: 700, fontSize: 13, minWidth: 20 }}>#{s.scene_id || i + 1}</span>
                <span style={{ color: S.text, fontWeight: 600, fontSize: 13 }}>{s.scene_name || '未命名场景'}</span>
                <span style={{ color: S.textMuted, fontSize: 11 }}>{s.appearances || '-'}</span>
                <span style={{ color: S.textMuted, fontSize: 11 }}>{s.time || '-'}</span>
                <span style={{ color: S.textMuted, fontSize: 11 }}>{s.space_type || '-'}</span>
              </div>
              <p style={{
                fontSize: 12.5,
                color: S.accentLight,
                fontFamily: 'monospace',
                lineHeight: 1.8,
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
                margin: 0,
                padding: '10px 12px',
                background: 'rgba(124,92,252,0.06)',
                borderRadius: 8,
                border: '1px solid rgba(124,92,252,0.12)',
              }}>
                {combined || s.visual_prompt_no_chars || '（无描述词）'}
              </p>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 11, color: S.textMuted, marginTop: 10 }}>
        共 {scenes.length} 个场景，场景描述词已去除所有人物元素
      </p>
    </Card>
  )
}

// ── 道具详细表格 ──────────────────────────────────────────
function PropTable({ props }) {
  if (!props?.length) return null
  return (
    <Card style={{ marginTop: 16 }}>
      <SectionTitle icon="🎁">道具汇总表（{props.length}）</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.cardBorder}` }}>
              {['道具名称','出场','变化','文生图描述词','备注'].map(h => (
                <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: S.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                {[
                  <span style={{ color: S.accentLight, fontWeight: 600 }}>{p.name}</span>,
                  p.appearances || '-',
                  p.changes || '无变化',
                  <span style={{ maxWidth: 300, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 10, color: S.accentLight }} title={p.visual_prompt}>{p.visual_prompt || '-'}</span>,
                  p.notes || '-',
                ].map((val, j) => (
                  <td key={j} style={{ padding: '10px 6px', color: S.text, verticalAlign: 'top', lineHeight: 1.5 }}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: S.textMuted, marginTop: 8 }}>
        共 {props.length} 个道具
      </p>
    </Card>
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

  // 详细素材
  const [assetData, setAssetData] = useState(null) // {characters, scenes, props}

  // 加载状态
  const [loadingScript, setLoadingScript] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(false)

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
    setAssetData(p.characters ? { characters: p.characters, scenes: p.scenes || [], props: p.props || [] } : null)
  }

  const resetWork = () => {
    setNovelText(''); setScript(''); setAssetData(null)
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
      setAssetData(null)
      await saveProject({ script: d.script, status: 'script_done' })
    } catch { setError('剧本生成失败') } finally { setLoadingScript(false) }
  }

  // ② 提炼素材（详细版）
  const handleExtractAssets = async () => {
    if (!script.trim()) { setError('请先生成剧本'); return }
    setLoadingAssets(true); setError('')
    try {
      const r = await fetch(`${API}/extract-full-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      })
      const d = await r.json()
      setAssetData({ characters: d.characters || [], scenes: d.scenes || [], props: d.props || [] })
      await saveProject({ characters: d.characters, scenes: d.scenes, props: d.props, status: 'assets_done' })
    } catch { setError('素材提取失败') } finally { setLoadingAssets(false) }
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', color: S.text }}>
      {/* 顶栏 */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${S.cardBorder}` }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>

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
                      background: p.status === 'assets_done' ? 'rgba(34,197,94,0.1)' : p.script ? 'rgba(124,92,252,0.1)' : 'rgba(255,255,255,0.04)',
                      color: p.status === 'assets_done' ? '#22c55e' : p.script ? S.accent : S.textMuted }}>
                      {p.status === 'assets_done' ? '✓ 素材完整' : p.script ? '✓ 有剧本' : '📝 草稿'}
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
                  <Btn onClick={() => saveProject({ script })} secondary>保存剧本</Btn>
                  <Btn onClick={handleExtractAssets} loading={loadingAssets}>② 提炼素材（详细版）</Btn>
                </div>
              </Card>
            )}

            {/* 素材统计概览 */}
            {assetData && (
              <Card>
                <SectionTitle icon="📊">素材概览</SectionTitle>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: '角色', count: assetData.characters?.length || 0, icon: '👥', color: S.accent },
                    { label: '场景', count: assetData.scenes?.length || 0, icon: '🎬', color: S.accent },
                    { label: '道具', count: assetData.props?.length || 0, icon: '🎁', color: S.accent },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      padding: '16px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${S.cardBorder}`, textAlign: 'center', minWidth: 100,
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.count}</div>
                      <div style={{ fontSize: 12, color: S.textMuted }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: S.textMuted, marginTop: 12 }}>
                  💡 下方三张表格已自动保存，可直接复制文生图描述词用于 AI 生图
                </p>
              </Card>
            )}

            {/* 角色表 */}
            <CharacterTable characters={assetData?.characters} />

            {/* 场景表 */}
            <SceneTable scenes={assetData?.scenes} />

            {/* 道具表 */}
            <PropTable props={assetData?.props} />

          </div>
          )}
        </div>
      </main>
    </div>
  )
}
