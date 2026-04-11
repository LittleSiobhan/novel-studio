# 网站更新 SOP

## 原则
每次更新前先确认，更新后写文档，用户验收后再正式部署。

---

## 标准流程

### 第 0 步：确认需求
收到修改指令后，先理解需求，有疑问立刻问，**不要边做边猜**。

### 第 1 步：本地测试
所有改动在服务器上本地测试通过（curl 验证 API + 浏览器控制台确认无报错）。

### 第 2 步：写更新文档
把以下内容发给用户，等待确认：

```
📋 本次更新内容

【改动】
- [具体改动1]
- [具体改动2]

【效果】
- [改动前 → 改动后]

【测试结果】
- [测试命令/截图]

⚠️ 改动较大，建议等 5 分钟再访问网站

确认发布吗？回复"发布"即部署，回复其他内容继续调整。
```

### 第 3 步：用户确认后才部署
- 用户回复"发布" → 执行构建 + 重启
- 用户有修改意见 → 调整后再发确认文档

---

## 常用命令

```bash
# 后端
systemctl restart novel-studio-api    # 重启后端
systemctl status novel-studio-api     # 查看状态

# 前端
cd /root/.openclaw/workspace/novel-studio/frontend
npm run build                         # 构建（无需清缓存）
systemctl restart novel-studio-web     # 重启前端

# 测试
curl -s http://127.0.0.1:8001/health  # 后端健康检查
curl -s https://littleee.cloud/       # 前端访问检查
```

---

## 注意事项
- 不确定的不乱改，先问
- 每次 commit message 写清楚做了什么
- 用户没确认不擅自部署
