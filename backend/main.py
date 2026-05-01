"""
小说 → 剧本 → 分镜 工作站后端
完整版：AI处理 + 项目存储
"""
import os
import json
from dotenv import load_dotenv
load_dotenv()
import asyncio
import re
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
import httpx
import jwt

from models import engine, Base, Project, SessionLocal, init_db

# ─── Lifespan ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()  # 启动时创建表
    yield

app = FastAPI(title="📚 小说工作站 API", lifespan=lifespan, docs_url=None, redoc_url=None)

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
# 火山方舟（Coding Plan）
ARK_API_KEY = os.getenv("ARK_API_KEY", "")
ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/coding/v3"
# DeepSeek 官方 API
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

# 可用文字模型
AVAILABLE_MODELS = ["MiniMax-M2.7", "GLM-5.1", "Kimi-K2.6", "DeepSeek-V3.2", "deepseek-v4-flash", "deepseek-v4-pro", "doubao-seed-2.0-pro", "doubao-seed-2.0-code"]
DEFAULT_MODEL = "DeepSeek-V3.2"

# ─── Auth Config ────────────────────────────────────────────
LOGIN_USERNAME = os.getenv("LOGIN_USERNAME", "littleee")
LOGIN_PASSWORD = os.getenv("LOGIN_PASSWORD", "little2026")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-abc123xyz")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 365  # 1年有效期（几乎永久）

def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.utcnow().timestamp() + JWT_EXPIRE_HOURS * 3600,
        "iat": datetime.utcnow().timestamp(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(authorization: str) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "无效的认证格式")
    token = authorization[7:]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token 已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "无效的 Token")

async def require_auth(authorization: str = Header(...)):
    return verify_token(authorization)


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
    workspace_type: Optional[str] = "novel"  # novel | ad

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
    model: Optional[str] = DEFAULT_MODEL  # 可选模型

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

class ExtractAssetsRequest(BaseModel):
    """综合素材提取请求"""
    script: str
    title: Optional[str] = "未命名"
    model: Optional[str] = "MiniMax-M2.7"  # 可选模型

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
async def call_ai(model: str, system: str, user: str) -> str:
    """通用 AI 调用：MiniMax 走 Anthropic API，DeepSeek V4 走 DeepSeek 官方，其他走方舟 Coding Plan"""
    if model == "MiniMax-M2.7":
        # MiniMax 走独立 API
        if not MINIMAX_API_KEY:
            raise HTTPException(500, "MINIMAX_API_KEY 未配置")
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(
                f"{MINIMAX_BASE_URL}/v1/messages",
                headers={
                    "Authorization": f"Bearer {MINIMAX_API_KEY}",
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": "MiniMax-M2.7",
                    "max_tokens": 8192,
                    "system": system,
                    "messages": [{"role": "user", "content": user}],
                },
            )
            if resp.status_code != 200:
                raise HTTPException(500, f"MiniMax API 错误: {resp.status_code} - {resp.text}")
            data = resp.json()
            for item in data.get("content", []):
                if item.get("type") == "text":
                    return item["text"]
            raise HTTPException(500, "MiniMax 返回格式异常")
    elif model in ("deepseek-v4-flash", "deepseek-v4-pro"):
        # DeepSeek V4 走官方 API（OpenAI 兼容）
        if not DEEPSEEK_API_KEY:
            raise HTTPException(500, "DEEPSEEK_API_KEY 未配置")
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(
                f"{DEEPSEEK_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": 8192,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
            )
            if resp.status_code != 200:
                raise HTTPException(500, f"DeepSeek API 错误: {resp.status_code} - {resp.text}")
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0]["message"]["content"]
            raise HTTPException(500, f"DeepSeek 返回格式异常: {json.dumps(data, ensure_ascii=False)[:300]}")
    else:
        # 其他模型走方舟 Coding Plan
        if not ARK_API_KEY:
            raise HTTPException(500, "ARK_API_KEY 未配置")
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(
                f"{ARK_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {ARK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model.lower(),
                    "max_tokens": 8192,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
            )
            if resp.status_code != 200:
                raise HTTPException(500, f"方舟 API 错误: {resp.status_code} - {resp.text}")
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0]["message"]["content"]
            raise HTTPException(500, f"方舟返回格式异常: {json.dumps(data, ensure_ascii=False)[:300]}")


async def call_minimax(system: str, user: str) -> str:
    """调用默认模型（MiniMax-M2.7）"""
    # 只使用 MiniMax-M2.7（ARK 方舟模型已禁用）
    return await call_ai("MiniMax-M2.7", system, user)


# ─── API Routes ────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "📚 小说工作站 API 正常运行", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok", "ai_configured": bool(MINIMAX_API_KEY)}

# ─── 登录 ──────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
async def login(req: LoginRequest):
    if req.username == LOGIN_USERNAME and req.password == LOGIN_PASSWORD:
        token = create_token(req.username)
        return {
            "success": True,
            "token": token,
            "user": {
                "username": req.username,
                "displayName": "创作者",
                "role": "writer"
            }
        }
    raise HTTPException(401, "用户名或密码错误")


# ─── 项目管理 CRUD ─────────────────────────────────────────
@app.get("/api/projects")
async def list_projects(db: Session = Depends(get_db), _=Depends(require_auth)):
    """列出所有项目（只显示 novel 类型）"""
    projects = db.query(Project).filter(Project.workspace_type == "novel").order_by(Project.updated_at.desc()).all()
    # Convert to dict and handle JSON-serializable conversion
    result = []
    for p in projects:
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "novel_text": p.novel_text,
            "script": p.script,
            "storyboards": p.storyboards if isinstance(p.storyboards, list) else ([p.storyboards] if p.storyboards else None),
            "characters": p.characters,
            "scenes": p.scenes,
            "props": p.props,
            "settings": p.settings,
            "status": p.status,
            "workspace_type": p.workspace_type,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })
    return result

@app.get("/api/projects/{project_id}")
async def get_project(project_id: int, db: Session = Depends(get_db), _=Depends(require_auth)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "novel_text": project.novel_text,
        "script": project.script,
        "storyboards": project.storyboards if isinstance(project.storyboards, list) else ([project.storyboards] if project.storyboards else None),
        "characters": project.characters,
        "scenes": project.scenes,
        "props": project.props,
        "settings": project.settings,
        "status": project.status,
        "workspace_type": project.workspace_type,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }

@app.post("/api/projects")
async def create_project(project: ProjectCreate, db: Session = Depends(get_db), _=Depends(require_auth)):
    db_project = Project(
        name=project.name,
        description=project.description or "",
        novel_text=project.novel_text or "",
        settings=project.settings or {},
        workspace_type=project.workspace_type or "novel",
        status="draft",
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.put("/api/projects/{project_id}")
async def update_project(project_id: int, update: ProjectUpdate, db: Session = Depends(get_db), _=Depends(require_auth)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return {
        "id": project.id, "name": project.name, "description": project.description,
        "novel_text": project.novel_text, "script": project.script,
        "storyboards": project.storyboards, "characters": project.characters,
        "scenes": project.scenes, "props": project.props, "settings": project.settings,
        "status": project.status, "workspace_type": project.workspace_type,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: int, db: Session = Depends(get_db), _=Depends(require_auth)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    db.delete(project)
    db.commit()
    return {"message": "删除成功"}


# ─── 1. 场景提取 ───────────────────────────────────────────
@app.post("/api/extract-scenes", response_model=SceneExtractResult)
async def extract_scenes(input: NovelInput, _=Depends(require_auth)):
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
async def extract_characters(input: NovelInput, _=Depends(require_auth)):
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
async def extract_props(req: PropsRequest, _=Depends(require_auth)):
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


# ─── 1.8 综合素材提取（详细版） ───────────────────────────
@app.post("/api/extract-full-assets")
async def extract_full_assets(req: ExtractAssetsRequest, _=Depends(require_auth)):
    """
    详细提取剧本中的角色、场景、道具三大类素材，
    输出完整结构化表格，参照剧本素材库提取标准。
    """
    # Step 1: 提取角色
    chars_prompt = """你是一个专业的影视美术设计师和人物设定专家。

分析以下剧本，提取所有出现的角色（含路人、配角），输出JSON数组。

每个角色必须包含以下16个字段：
1. name: 角色姓名（无名角色标注"配角1""路人2"等，区分不同个体）
2. role: 角色定位（主角/配角/反派/路人等）
3. gender: 性别（从台词/动作/称呼推断男/女/未知）
4. age: 年龄（精确到范围如"18-22岁"，禁用"年轻""年长"等模糊表述，如剧本未明确写"未提及"）
5. height: 身高（精确到范围+体态如"175cm，挺拔修长"，如未明确写"未提及"）
6. body_type: 体型（具体描述如"纤瘦/匀称/微胖/健壮"，可加细节，如未明确写"未提及"）
7. hairstyle: 发型（具体样式+细节如"齐肩直发，发尾微卷，无刘海"，如未明确写"未提及"）
8. hair_color: 发色（精准+光泽感如"乌黑发亮"或"浅棕哑光"，如未明确写"未提及"）
9. face_shape: 脸型（具体脸型+细节如"圆脸，脸颊有婴儿肥"，如未明确写"未提及"）
10. eyes: 眼睛/瞳孔（眼形+瞳色+细节如"杏眼，瞳孔漆黑，眼尾微上挑"，如未明确写"未提及"）
11. skin: 肤色（具体肤色+质感如"冷白皮，细腻无瑕疵"，如未明确写"未提及"）
12. outfit: 服装（款式+颜色+材质+细节，结合角色身份和场景，如未明确写"未提及"）
13. accessories: 饰品（所有佩戴饰品，具体描述每件，无则填"无"）
14. personality: 性格（具体特质+剧本细节佐证）
15. appearances: 出场集数（标注所有出场集数，重复出场列全）
16. visual_prompt: **文生图描述词**：整合以上所有视觉要素，写成**一气呵成的连贯句子**（像小说描写那样流畅），中文，不要列表式罗列

文生图描述词示例（连贯句子，不是列表）：
22岁女性站在窗边，168cm的身高匀称修长，齐肩亚麻灰卷发在午后阳光下泛着柔和光泽，鹅蛋脸线条柔美，杏眼里琥珀色瞳孔清澈透亮，冷白皮细腻无瑕，身穿米白色针织连衣裙服帖修身，银色细项链和珍珠耳环随着呼吸轻轻晃动，气质温柔内敛，整体给人清新温婉的印象，高清写实摄影风格

**关键要求：即使剧本只有少量描述，也必须为每个角色输出完整的16个字段，绝不可返回空数组。visual_prompt 必须写成连贯流畅的一句话，像小说描写那样自然，不能是字段列表。**

只输出JSON数组，不要其他文字。"""


    scenes_prompt = """你是一个专业的影视分镜师和场景美术设计师。

分析以下剧本，逐字逐句通读，提取所有出现的场景，输出JSON数组。同一地点不同空间单独提取（如"客厅"和"卧室"分开）。

每个场景必须包含以下16个字段：
1. scene_id: 场景编号
2. scene_name: 精确场景名称（格式："地点（具体位置/归属）"，如"悬崖峭壁（修仙世界）""客厅（主角家）""咖啡馆（街角）"，无归属可写地点简称）
3. appearances: 出场集数
4. time: 精确时刻（如"清晨6点""深夜11点""阴天午后"）
5. weather: 天气（室外明确天气；室内标"室内无天气影响"，有窗补充窗外天气）
6. light_source: 光源类型+质感+氛围（如"暖黄吊灯，光线柔和有晕，营造温馨感"）
7. space_type: 大类+细分（如"室内住宅-主卧""室外街道-老街区""室外地形-悬崖"）
8. space_scale: 面积估算（如"约15㎡""开阔视野无遮挡""崖壁垂直约30米高"）
9. height: 层高或空间高度（如"层高2.8米""崖壁垂直高度约30米"）
10. main_elements: 核心陈设物+细节描述
11. foreground: 前景元素+具体描述
12. mood: 情绪词+场景细节支撑（如"紧张危急、清冷孤寂"）
13. style: 整体风格+细节（如"武侠玄幻风格，荒野险峻""简约现代都市风"）
14. shot_type: 景别（全景/中景/近景/特写/远景）
15. camera_angle: 视角设定（平视/俯视/仰视/侧视+补充说明）
16. visual_prompt_no_chars: **文生图描述词**，严禁出现任何人物，中文，写成**一气呵成的连贯句子**（像小说描写那样流畅），整合空间+光线+氛围+陈设，不要列表式罗列

文生图描述词示例（连贯句子，不是列表）：
清晨破晓时分，险峻的悬崖峭壁如刀削般矗立眼前，崖壁垂直约三十米，晨光穿透薄雾洒在陡峭岩面上泛出冷冽的光泽，崖缝中一棵老松虬枝横生针叶墨绿，雾气缭绕于山峦之间若隐若现，远处层叠山峦在晨曦中呈现出幽蓝的轮廓，整体氛围紧张中透着清冷孤寂的仙侠意境，高清写实摄影风格，画面中无任何人物元素

只输出JSON数组，不要其他文字。"""

    props_prompt = """你是一个专业的影视美术指导。

分析以下剧本，提取所有出现的道具（哪怕是背景中的），输出JSON数组。

每个道具必须包含以下5个字段：
1. name: 道具精确名称（如"黑色皮质笔记本""陶瓷水杯""旧雨伞""苹果13手机"）
2. appearances: 出场集数
3. changes: 道具变化（如"第1集为新品，第5集封面磨损破旧"，无则填"无变化"）
4. visual_prompt: 外观+颜色+材质+尺寸+细节+状态，精准具体
5. notes: 备注（重复出场次数/特殊情况）

文生图描述词示例：
黑色皮质笔记本，A5尺寸，封面光滑，银色金属搭扣，内页米黄色，边缘无磨损，全新状态，高清写实，光线柔和

只输出JSON数组，不要其他文字。"""

    # 三个AI调用并发执行，全部使用 MiniMax-M2.7
    raw_chars, raw_scenes, raw_props = await asyncio.gather(
        call_ai(req.model, chars_prompt, f"剧本：\n{req.script[:6000]}"),
        call_ai(req.model, scenes_prompt, f"剧本：\n{req.script[:6000]}"),
        call_ai(req.model, props_prompt, f"剧本：\n{req.script[:6000]}"),
    )

    try:
        m = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw_chars, re.DOTALL)
        characters = json.loads(m.group(1)) if m else json.loads(raw_chars)
    except:
        characters = []

    try:
        m = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw_scenes, re.DOTALL)
        scenes = json.loads(m.group(1)) if m else json.loads(raw_scenes)
    except:
        scenes = []

    try:
        m = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", raw_props, re.DOTALL)
        props = json.loads(m.group(1)) if m else json.loads(raw_props)
    except:
        props = []

    return {
        "characters": characters,
        "scenes": scenes,
        "props": props,
        "summary": {
            "total_characters": len(characters),
            "total_scenes": len(scenes),
            "total_props": len(props),
        }
    }


# ─── 1.7 统一生成提示词 ────────────────────────────────────
@app.post("/api/generate-prompts")
async def generate_prompts(req: PromptRequest, _=Depends(require_auth)):
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


# ─── 2. 剧本生成（超级导演版）──────────────────────────────────────────
@app.post("/api/generate-script", response_model=ScriptGenerateResult)
async def generate_script(input: NovelInput, _=Depends(require_auth)):
    system_prompt = """# Role: 小说改编剧本智能体 (Full Style Ver.)

## 🎬 系统设定
你是一位顶级影视导演及分镜编剧。你必须将小说中的抽象描写彻底转化为可拍摄的物理动作。

## 📌 核心转译协议
1. **物理性原则**：严禁心理描写。内心戏 = [微表情] + [肢体语言] + [环境反馈]。
2. **名词视线流**：镜头必须跟随名词。提到"戒指"，必须有戒指特写。
3. **风格滤镜**：根据用户选择的风格（如：赛博朋克、武侠、短剧等），自动调整色调、音效描述及运镜速度。

## ⚠️ 硬性约束
- **格式**：参考《北王刀》极简式（序号+场景+人物+动作+对白）。
- **符号**：每一段动作描写前必须带有符号 ▲，并标注 [景别/运镜]。
- **零遗漏**：核心剧情与关键细节（如道具、象征物）严禁跳过。

## 📋 标准剧本格式
【场景】序号 | 时间 | 地点 | 氛围风格
【人物】姓名（当前状态）
【画面/动作】
▲ [景别/运镜]：具体的动作/微表情/物理细节描述
▲ [音效/BGM]：环境音或音乐建议
【角色名】
（神态/语气）"对话内容"

## 📤 输出要求
- 直接输出剧本，不要解释。
- 默认使用 [🔥短剧爆款] 风格，除非用户另有说明。
- 长文自动拆分集数，结尾保留强钩子。"""

    script = await call_ai(input.model, system_prompt, input.text[:8000])
    scene_count = len(re.findall(r"^(INT\.|EXT\.)", script, re.MULTILINE))
    
    return ScriptGenerateResult(
        script=script.strip(),
        scene_count=scene_count,
    )


# ─── 3. 分镜生成 ───────────────────────────────────────────
@app.post("/api/generate-storyboard", response_model=StoryboardResult)
async def generate_storyboard(scenes: list[dict], _=Depends(require_auth)):
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
async def full_pipeline(req: FullPipelineRequest, _=Depends(require_auth)):
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

# ─── 5. 下载剧本 ───────────────────────────────────────────
class DownloadScriptRequest(BaseModel):
    script: str
    title: Optional[str] = "未命名剧本"


@app.post("/api/download-script")
async def download_script(req: DownloadScriptRequest, _=Depends(require_auth)):
    """生成剧本TXT文件并返回下载信息"""
    import tempfile
    import os
    
    # 清理文件名
    safe_title = re.sub(r'[^\w\u4e00-\u9fa5]', '_', req.title)[:50]
    filename = f"{safe_title}_剧本.txt"
    
    # 写入临时文件
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(req.script)
        temp_path = f.name
    
    return {
        "filename": filename,
        "path": temp_path,
        "size": len(req.script),
    }


@app.get("/api/read-script-file")
async def read_script_file(path: str, _=Depends(require_auth)):
    """读取临时剧本文件"""
    from fastapi.responses import FileResponse
    import os
    
    if not os.path.exists(path):
        raise HTTPException(404, "文件不存在或已过期")
    
    return FileResponse(
        path,
        media_type="text/plain; charset=utf-8",
        filename=os.path.basename(path)
    )

@app.get("/api/script-download/{filename}")
async def script_download(filename: str, _=Depends(require_auth)):
    """下载剧本文件（GET方式）"""
    import os
    from fastapi.responses import FileResponse
    
    # 临时文件目录
    temp_dir = "/tmp/novel_scripts"
    os.makedirs(temp_dir, exist_ok=True)
    
    # 查找文件
    file_path = os.path.join(temp_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "文件不存在或已过期")
    
    return FileResponse(
        file_path,
        media_type="text/plain; charset=utf-8",
        filename=filename
    )
