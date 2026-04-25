# 📚 小说 → 剧本 → 分镜 创作工作站

## 1. Concept & Vision

创作者的一站式 AI 工具：将小说文本一键转化为分镜头脚本，服务于编剧、短视频创作者、影视策划。

核心体验：干净的创作空间，沉浸式输出，零干扰。

## 2. Design Language

- **Aesthetic**: 深色沉浸风，类 Notion 极简美学，护眼适合长时间创作
- **Colors**:
  - Background: `#0f0f0f` (深黑)
  - Surface: `#1a1a1a` (卡片)
  - Primary: `#7c3aed` (紫色，用于主要按钮)
  - Accent: `#f59e0b` (琥珀色，用于强调)
  - Text: `#e5e5e5` (主文字) / `#737373` (次要)
  - Border: `#2a2a2a`
- **Typography**: Inter (UI) + JetBrains Mono (代码/剧本格式)
- **Motion**: 渐入动画，300ms ease-out，避免花哨转场

## 3. Core Flow

```
[小说输入] → [AI场景提取] → [剧本生成] → [分镜生成] → [导出]
     ↓              ↓              ↓            ↓
  文本粘贴       切割场景       标准剧本格式   画面+提示词
  上传TXT        人物识别       可在线编辑     可导出图片序列
```

## 4. 功能模块

### 4.1 小说输入
- 粘贴文本 / 上传 .txt 文件
- 字数统计
- 角色自动识别

### 4.2 场景提取
- AI 自动切割场景（基于时间/地点/人物变化）
- 输出：场景列表（场景描述 + 涉及人物 + 对话片段）
- 可手动合并/拆分场景

### 4.3 剧本生成
- 标准剧本格式：INT./EXT. · 场景 · 时间
- 格式：场景描述 + 角色名 + 对话 + 括号动作
- 在线编辑器（类似 Markdown 编辑器）
- 可导出 PDF

### 4.4 分镜生成
- 每个场景对应一个分镜卡片
- 输出：场景编号 + 画面描述 + AI 绘图提示词（即梦风格）
- 一键生成配图（调用即梦 API）
- 可导出图片序列 + CSV

### 4.5 项目管理
- 创建/保存/加载项目（本地存储）
- 版本历史（自动保存）
- 导出：PDF剧本 / 图片压缩包 / CSV表格

## 5. 技术架构

### Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS
- Zustand (状态管理)
- ReactMonacoEditor (剧本编辑器)

### Backend
- Python 3.12 + FastAPI
- PostgreSQL (via Supabase 或本地 Docker)
- Redis (缓存)
- MiniMax GLM-5 API (场景分析 + 剧本生成)
- 即梦 API (分镜图生成)

### 部署
- Docker Compose (单机器部署)
- Nginx 反向代理
- 可选：Cloudflare 域名解析

## 6. MVP Scope

第一版只做核心链路：
1. 小说文本输入（粘贴/上传）
2. 本地 AI 处理（调用 MiniMax API）
3. 剧本输出（纯文本格式，可复制）
4. 分镜提示词生成（即梦风格英文提示词）
5. 本地导出 CSV / 文本

暂不接：用户系统、数据库持久化、在线图片生成（提示词阶段先）
