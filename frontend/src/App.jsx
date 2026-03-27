import { useState, useRef } from 'react'

const API_BASE = '/api'

// ─── Helpers ───────────────────────────────────────────────
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API错误 ${res.status}: ${err}`)
  }
  return res.json()
}

// ─── Step Indicator ───────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['输入小说', '场景提取', '剧本生成', '分镜生成']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((name, i) => {
        const num = i + 1
        const isDone = step > num
        const isCurrent = step === num
        return (
          <div key={name} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              isDone ? 'bg-primary text-white' : isCurrent ? 'bg-primary/30 text-primary border border-primary' : 'bg-surface text-gray-600 border border-border'
            }`}>
              {isDone ? '✓' : num}
            </div>
            <span className={`text-sm hidden sm:block ${isCurrent ? 'text-gray-200' : 'text-gray-600'}`}>{name}</span>
            {i < steps.length - 1 && <div className={`w-8 h-px ${isDone ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────
function Header() {
  return (
    <header className="border-b border-border px-6 py-4 flex items-center gap-3">
      <span className="text-2xl">📚</span>
      <div>
        <h1 className="font-bold text-lg text-gray-100">小说工作站</h1>
        <p className="text-xs text-gray-600">小说 → 剧本 → 分镜 · 一站式创作工具</p>
      </div>
    </header>
  )
}

// ─── Step 1: Novel Input ──────────────────────────────────
function NovelInput({ onStart }) {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setText(ev.target.result)
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    if (!text.trim()) return setError('请输入或上传小说文本')
    setLoading(true)
    setError('')
    try {
      await onStart({ text, title: title || '未命名小说' })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">📖 输入小说文本</h2>
      
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1.5">作品标题（可选）</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：《星际穿越》"
          className="input-area w-full"
        />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm text-gray-400">小说正文</label>
          <label className="text-xs text-primary hover:text-primary/80 cursor-pointer">
            📎 上传 .txt 文件
            <input type="file" accept=".txt" onChange={handleFile} className="hidden" />
          </label>
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴小说文本到这里...&#10;&#10;支持直接粘贴整本小说的文本内容，系统会自动识别场景、角色，并生成剧本和分镜。"
          className="input-area w-full h-80 font-mono text-sm leading-relaxed"
        />
        <div className="text-right text-xs text-gray-600 mt-1">
          {text.length.toLocaleString()} 字
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>}

      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={loading || !text.trim()} className="btn-primary flex items-center gap-2">
          {loading ? (
            <>
              <span className="animate-spin">⟳</span>
              <span>处理中...</span>
            </>
          ) : (
            <>🚀 开始处理</>
          )}
        </button>
        <span className="text-xs text-gray-600">AI 将自动提取场景、生成剧本和分镜</span>
      </div>
    </div>
  )
}

// ─── Step 2: Scenes ───────────────────────────────────────
function ScenesView({ data, onNext }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">🎬 场景提取结果</h2>
        <button onClick={onNext} className="btn-primary">📄 生成剧本 →</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary">{data.characters?.length ?? 0}</div>
          <div className="text-xs text-gray-500">角色</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-accent">{data.scenes?.length ?? 0}</div>
          <div className="text-xs text-gray-500">场景</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-300">{data.total_chars?.toLocaleString() ?? 0}</div>
          <div className="text-xs text-gray-500">总字数</div>
        </div>
      </div>

      {data.characters?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">👥 角色列表</h3>
          <div className="flex flex-wrap gap-2">
            {data.characters.map((c) => (
              <span key={c} className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-sm text-primary">{c}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">🎞️ 场景列表</h3>
        <div className="space-y-3">
          {(data.scenes || []).map((s) => (
            <div key={s.scene_id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                  {s.scene_id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-surface rounded border border-border text-gray-500">
                      {s.location} · {s.time}
                    </span>
                    {s.characters?.map((c) => (
                      <span key={c} className="text-xs text-primary/80">{c}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 mb-1">{s.summary}</p>
                  {s.key_dialogue && (
                    <p className="text-sm italic text-gray-500">"{s.key_dialogue}"</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Script ───────────────────────────────────────
function ScriptView({ data, onNext }) {
  const handleExport = () => {
    const blob = new Blob([data.script], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.title || '剧本'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">🎬 剧本</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm">📥 导出剧本</button>
          <button onClick={onNext} className="btn-primary">🖼️ 生成分镜 →</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="text-sm text-gray-500 mb-3">
          {data.script_scene_count} 个场景 · {data.characters?.length ?? 0} 个角色
        </div>
        <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed bg-bg rounded-lg p-4 border border-border overflow-auto max-h-[60vh]">
          {data.script}
        </pre>
      </div>
    </div>
  )
}

// ─── Step 4: Storyboard ────────────────────────────────────
function StoryboardView({ data }) {
  const handleExportCSV = () => {
    const header = "scene_id,visual_description,camera_angle,mood,jimeng_prompt\n"
    const rows = data.storyboards.map((sb) =>
      [sb.scene_id, sb.visual_description, sb.camera_angle, sb.mood, `"${sb.jimeng_prompt}"`].join(",")
    ).join("\n")
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = "分镜表.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">🖼️ 分镜</h2>
        <button onClick={handleExportCSV} className="btn-secondary text-sm">📥 导出 CSV</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data.storyboards || []).map((sb) => (
          <div key={sb.scene_id} className="card">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent font-bold flex-shrink-0">
                {sb.scene_id}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 mb-2">{sb.visual_description}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-xs px-2 py-0.5 bg-surface rounded border border-border text-gray-500">{sb.camera_angle}</span>
                  <span className="text-xs px-2 py-0.5 bg-surface rounded border border-border text-gray-500">{sb.mood}</span>
                </div>
              </div>
            </div>
            <div className="bg-bg rounded-lg p-3 border border-border">
              <div className="text-xs text-gray-600 mb-1">🎨 即梦提示词</div>
              <p className="text-xs font-mono text-primary/90 leading-relaxed">{sb.jimeng_prompt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(1)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async ({ text, title }) => {
    setLoading(true)
    setError('')
    try {
      const data = await apiPost('/full-pipeline', { text, title })
      setResult(data)
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="px-6 py-6">
        {result ? (
          <>
            <StepIndicator step={step} />
            {step === 2 && <ScenesView data={result} onNext={() => setStep(3)} />}
            {step === 3 && <ScriptView data={result} onNext={() => setStep(4)} />}
            {step === 4 && <StoryboardView data={result} />}
          </>
        ) : (
          <NovelInput onStart={handleStart} />
        )}

        {error && (
          <div className="max-w-4xl mx-auto mt-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            ❌ {error}
          </div>
        )}
      </main>
    </div>
  )
}
