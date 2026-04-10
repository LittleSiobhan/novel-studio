"""
小说 → 剧本 → 分镜 工作站后端
完整版：AI处理 + 项目存储
"""
import os
import json
import re
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
import httpx

from models import engine, Base, Project, SessionLocal, init_db

# ─── Lifespan ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()  # 启动时创建表
    yield

app = FastAPI(title="📚 小说工作站 API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ────────────────────────────────────────────────
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = "https://api.minimaxi.com/anthropic"


# ─── DB Helpers ────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Pydantic Models ───────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    novel_text: Optional[str] = ""
    settings: Optional[dict] = {}

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    novel_text: Optional[str] = None
    script: Optional[str] = None
    storyboards: Optional[list] = None
    characters: Optional[list] = None
    scenes: Optional[list] = None
    props: Optional[list] = None
    settings: Optional[dict] = None
    status: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    novel_text: Optional[str]
    script: Optional[str]
    storyboards: Optional[list]
    characters: Optional[list]
    scenes: Optional[list]
    props: Optional[list]
    settings: Optional[dict]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NovelInput(BaseModel):
    text: str
    title: Optional[str] = "未命名小说"

class SceneExtractResult(BaseModel):
    scenes: list[dict]
    total_chars: int

class CharactersRequest(BaseModel):
    characters: list[str]

class PropsRequest(BaseModel):
    script: str

class PromptRequest(BaseModel):
    """用户选择的待生成提示词的项目"""
    scenes: Optional[list[dict]] = None   # 选中的场景 [{scene_id, visual_prompt}]
    characters: Optional[list[dict]] = None  # 选中的角色 [{name, visual_prompt}]
    props: Optional[list[dict]] = None   # 选中的道具 [{name, visual_prompt}]

class ScriptGenerateResult(BaseModel):
    script: str
    scene_count: int

class StoryboardResult(BaseModel):
    storyboards: list[dict]
    total_scenes: int

class FullPipelineRequest(BaseModel):
    text: str
    title: Optional[str] = "未命名小说"

# ─── AI Helper ─────────────────────────────────────────────
async def call_minimax(system: str, user: str) -> str:
    if not MINIMAX_API_KEY:
        raise HTTPException(500, "MINIMAX_API_KEY 未配置")
    
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{MINIMAX_BASE_URL}/v1/messages",
            headers={
                "Authorization": f"Bearer {MINIMAX_API_KEY}",
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "MiniMax-M2.7",
                "max_tokens": 4096,
                "system": system,
                "messages": [{"role": "user", "content": user}],
            },
        )
        if resp.status_code != 200:
            raise HTTPException(500, f"AI API 错误: {resp.status_code} - {resp.text}")
        data = resp.json()
        for item in data.get("content", []):
            if item.get("type") == "text":
                return item["text"]
        raise HTTPException(500, f"AI 返回格式异常：{json.dumps(data.get('content', []), ensure_ascii=False)[:300]}")


# ─── API Routes ────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "📚 小说工作站 API 正常运行", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok", "ai_configured": bool(MINIMAX_API_KEY)}


# ─── 项目管理 CRUD ─────────────────────────────────────────
@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects(db: Session = Depends(get_db)):
    """列出所有项目"""
    projects = db.query(Project).order_by(Project.updated_at.desc()).all()
    return projects

@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    return project

@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(
        name=project.name,
        description=project.description or "",
        novel_text=project.novel_text or "",
        settings=project.settings or {},
        status="draft",
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: int, update: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return project

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    db.delete(project)
    db.commit()
    return {"message": "删除成功"}


# ─── 1. 场景提取 ───────────────────────────────────────────
@app.post("/api/extract-scenes", response_model=SceneExtractResult)
async def extract_scenes(input: NovelInput):
    system_prompt = """你是一个专业的影视编剧助手。

收到小说文本后：
1. 提取所有出现的角色名字（按出现顺序列出）
2. 将小说切割成独立场景（基于：时间变化、地点变化、人物变化）
3. 每个场景输出 JSON 格式：
   - scene_id: 场景编号
   - location: 室内/室外 + 具体地点
   - time: 时间（白天/夜晚/凌晨等）
   - characters: 出场的角色列表
   - summary: 30字以内的场景概要
   - key_dialogue: 最能代表这场戏的一句对话（无对话则省略）

最终输出一个完整的 JSON 对象，格式如下：
{
  "characters": ["角色1", "角色2", ...],
  "scenes": [场景1, 场景2, ...]
}

只输出 JSON，不要其他文字。"""

    raw = await call_minimax(system_prompt, f"小说标题：{input.title}\n\n{input.text[:8000]}")
    
    try:
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
        else:
            data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI 返回格式错误，无法解析场景: {e}\n\n原始输出:\n{raw[:500]}")

    return SceneExtractResult(
        scenes=data.get("scenes", []),
        total_chars=len(input.text),
    )


# ─── 1.5 角色提取（从剧本） ─────────────────────────────────
@app.post("/api/extract-characters")
async def extract_characters(input: NovelInput):
    """
    从剧本中提取角色列表
    """
    system_prompt = """你是一个专业的影视编剧助手。

分析以下剧本，提取所有出现的角色。

输出 JSON 数组，每个角色包含：
- name: 角色姓名
- role: 角色定位（例：男主角、女主角、反派、配角等）

只输出 JSON 数组，不要其他文字。"""

    raw = await call_minimax(system_prompt, f"剧本：\n{input.text[:8000]}")
    try:
        match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw, re.DOTALL)
        data = json.loads(match.group(1)) if match else json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI 返回格式错误: {e}\n\n{raw[:300]}")
    return {"characters": data, "total": len(data)}


# ─── 1.6 道具提取（从剧本） ─────────────────────────────────
@app.post("/api/extract-props")
async def extract_props(req: PropsRequest):
    """
    从剧本中提取重要道具/物品
    """
    system_prompt = """你是一个专业的影视美术指导。

分析以下剧本，提取所有重要的道具、物品、场景元素。

输出 JSON 数组，每个道具包含：
- name: 道具名称
- description: 道具的外观和用途描述
- scene_where: 出现在哪场戏

只输出 JSON 数组，不要其他文字。"""

    raw = await call_minimax(system_prompt, f"剧本：\n{req.script[:8000]}")
    try:
        match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw, re.DOTALL)
        data = json.loads(match.group(1)) if match else json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI 返回格式错误: {e}\n\n{raw[:300]}")
    return {"props": data, "total": len(data)}


# ─── 1.7 统一生成提示词 ────────────────────────────────────
@app.post("/api/generate-prompts")
async def generate_prompts(req: PromptRequest):
    """
    为用户选中的场景/角色/道具生成视觉提示词
    """
    results = {}

    # 场景提示词
    if req.scenes:
        system_prompt = """你是一个专业的影视分镜师和AI绘图提示词工程师。

收到场景列表后，为每个场景生成视觉提示词。

每个场景输出 JSON：
- scene_id: 场景编号
- visual_description: 画面描述
- camera_angle: 摄影角度（鸟瞰/仰角/过肩/正面中景等）
- mood: 氛围关键词（冷色调/暖色调/暗光等）
- jimeng_prompt: 即梦(Jimeng)风格英文提示词，格式：
  客观描述 + 整体风格 + 光影细节 + 细节补充 + 电影级画面质感，高清摄影风格，专业摄影作品，8K超高清，无噪点，杰作

只输出 JSON 数组。"""
        raw = await call_minimax(system_prompt, f"场景列表：\n{json.dumps(req.scenes, ensure_ascii=False, indent=2)}")
        try:
            match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw, re.DOTALL)
            results["scenes"] = json.loads(match.group(1)) if match else json.loads(raw)
        except:
            results["scenes"] = req.scenes

    # 角色提示词
    if req.characters:
        system_prompt = """你是一个专业的影视美术设计师和人物设定专家。

收到角色列表后，为每个角色生成视觉提示词。

每个角色输出 JSON：
- name: 角色姓名
- role: 角色定位
- age_appearance: 外貌年龄描述
- personality: 性格特点
- visual_prompt: AI绘图英文提示词（格式：人物类型 + 外貌 + 服装 + 光影 + 电影级质感，专业摄影作品，8K超高清，无噪点，杰作）

只输出 JSON 数组。"""
        raw = await call_minimax(system_prompt, f"角色列表：\n{json.dumps(req.characters, ensure_ascii=False, indent=2)}")
        try:
            match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw, re.DOTALL)
            results["characters"] = json.loads(match.group(1)) if match else json.loads(raw)
        except:
            results["characters"] = req.characters

    # 道具提示词
    if req.props:
        system_prompt = """你是一个专业的影视美术指导。

收到道具列表后，为每个道具生成视觉提示词。

每个道具输出 JSON：
- name: 道具名称
- description: 道具外观描述
- scene_where: 出现场景
- visual_prompt: AI绘图英文提示词（格式：道具类型 + 外观 + 材质 + 光影 + 电影级质感，专业摄影作品，8K超高清，无噪点，杰作）

只输出 JSON 数组。"""
        raw = await call_minimax(system_prompt, f"道具列表：\n{json.dumps(req.props, ensure_ascii=False, indent=2)}")
        try:
            match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw, re.DOTALL)
            results["props"] = json.loads(match.group(1)) if match else json.loads(raw)
        except:
            results["props"] = req.props

    return results


# ─── 2. 剧本生成 ───────────────────────────────────────────
@app.post("/api/generate-script", response_model=ScriptGenerateResult)
async def generate_script(input: NovelInput):
    system_prompt = """你是一个专业电影剧本作家。

收到小说文本后，将其改编为标准中文剧本格式。

剧本格式规范：
- 大写场景标题：内景/外景 地点 - 时间（例：内景 咖啡厅 - 白天）
- 场景描述：用1-3句话描写镜头画面（文学但不冗长）
- 角色名：大写后跟冒号（例：李明：）
- 对话：不加引号
- 括号：表示动作或语气（如（温柔地））

全部使用中文输出，包括场景标题、描述、角色名、对话。

输出完整剧本，保持叙事张力，适度删减冗余描写。

只输出剧本正文，不要额外说明。"""

    script = await call_minimax(system_prompt, input.text[:8000])
    scene_count = len(re.findall(r"^(INT\.|EXT\.)", script, re.MULTILINE))
    
    return ScriptGenerateResult(
        script=script.strip(),
        scene_count=scene_count,
    )


# ─── 3. 分镜生成 ───────────────────────────────────────────
@app.post("/api/generate-storyboard", response_model=StoryboardResult)
async def generate_storyboard(scenes: list[dict]):
    system_prompt = """你是一个专业的影视分镜师和AI绘图提示词工程师。

收到场景列表后，为每个场景生成一个分镜卡片，包含：
- 画面描述：详细的镜头画面描写（适合转译为AI绘图提示词）
- 摄影角度：如鸟瞰、仰角、过肩、正面中景等
- 氛围关键词：冷色调/暖色调/暗光等
- jimeng_prompt：即梦(Jimeng)风格的英文提示词，格式：
  客观描述 + 整体风格 + 光影细节 + 细节补充 + 电影级画面质感，高清摄影风格，专业摄影作品，8K超高清，无噪点，杰作

输出 JSON 数组格式：
[
  {
    "scene_id": 1,
    "visual_description": "...",
    "camera_angle": "...",
    "mood": "...",
    "jimeng_prompt": "..."
  },
  ...
]

只输出 JSON。"""

    scenes_text = json.dumps(scenes[:20], ensure_ascii=False, indent=2)
    raw = await call_minimax(system_prompt, f"场景列表：\n{scenes_text}")
    
    try:
        match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
        else:
            data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI 返回格式错误: {e}\n\n原始输出:\n{raw[:500]}")
    
    return StoryboardResult(
        storyboards=data if isinstance(data, list) else data.get("storyboards", []),
        total_scenes=len(scenes),
    )


# ─── 4. 完整流程 ───────────────────────────────────────────
@app.post("/api/full-pipeline")
async def full_pipeline(req: FullPipelineRequest):
    scenes_result = await extract_scenes(NovelInput(text=req.text, title=req.title))
    script_result = await generate_script(NovelInput(text=req.text, title=req.title))
    storyboard_result = await generate_storyboard(scenes_result.scenes)
    
    return {
        "title": req.title,
        "total_chars": scenes_result.total_chars,
        "characters": scenes_result.characters,
        "scenes": scenes_result.scenes,
        "script": script_result.script,
        "script_scene_count": script_result.scene_count,
        "storyboards": storyboard_result.storyboards,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
