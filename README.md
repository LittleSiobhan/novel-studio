# 📚 小说工作站

> 小说 → 剧本 → 分镜，一站式 AI 创作工具

## 快速启动

### 方式一：Docker（推荐）

```bash
cd novel-studio

# 填入你的 MiniMax API Key
export MINIMAX_API_KEY="your_api_key_here"

# 启动
docker compose up -d

# 打开浏览器
open http://localhost:5173
```

### 方式二：本地开发

**后端：**
```bash
cd backend
pip install -r requirements.txt
export MINIMAX_API_KEY="your_api_key_here"
uvicorn main:app --reload --port 8000
```

**前端：**
```bash
cd frontend
npm install
npm run dev
```

---

## 功能流程

1. **📖 输入小说** — 粘贴文本或上传 .txt 文件
2. **🎬 场景提取** — AI 自动切割场景，识别角色
3. **📄 生成剧本** — 标准剧本格式输出
4. **🖼️ 生成分镜** — 每场对应画面描述 + 即梦绘图提示词

---

## 技术栈

- **前端**: React 18 + Vite + Tailwind CSS
- **后端**: Python FastAPI
- **AI**: MiniMax GLM-5
- **部署**: Docker Compose

---

## 项目结构

```
novel-studio/
├── frontend/          # React 前端
│   ├── src/
│   └── Dockerfile
├── backend/          # FastAPI 后端
│   ├── main.py        # 核心AI处理
│   └── Dockerfile
├── docker-compose.yml
├── SPEC.md            # 设计规格
└── README.md
```
