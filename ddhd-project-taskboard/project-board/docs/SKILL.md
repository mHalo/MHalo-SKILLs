# DDHD 项目看板 - Agent 技能使用指南

**版本**: v1.0  
**适用 Agent**: 总指挥虾、策划虾、创作虾、技术虾、运营虾  
**更新日期**: 2026-03-23

---

## 1. 技能概述

本技能用于让 OpenClaw Agent 与 **DDHD 项目看板系统** 进行交互，实现：

- 📊 **查询项目状态** - 获取项目完整信息、任务进度、里程碑状态
- 📝 **创建/更新任务** - 在看板中创建新任务、更新任务状态
- 📅 **管理里程碑** - 创建里程碑、更新截止日期
- 📞 **记录沟通** - 添加电话/会议纪要
- 📋 **获取快照** - 一键获取项目全貌用于汇报

### 1.1 基础信息

| 属性 | 值 |
|------|-----|
| API 基础地址 | `http://localhost:3000/api` (开发环境) |
| 认证方式 | 无需认证（内网环境） |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 1.2 核心概念

```
Project (项目)
├── Milestone (里程碑) - 如"前期沟通与方案"
│   └── Task (任务) - 如"主视觉设计"
│       └── SubTask (子任务) - 如"方案修改v2"
├── CalendarEvent (日历事件) - 如"客户拜访 3月28日"
└── Communication (沟通记录) - 如"电话录音摘要"
```

---

## 2. 核心 API 端点速查

### 2.1 项目 API

```bash
# 获取所有项目
GET /api/projects

# 获取项目详情
GET /api/projects/{projectId}

# 创建项目
POST /api/projects
Body: { name, description, type, client, startDate, endDate }

# 更新项目
PUT /api/projects/{projectId}
Body: { name, description, type, status, client, ... }

# 删除项目
DELETE /api/projects/{projectId}
```

### 2.2 里程碑 API

```bash
# 获取项目里程碑列表
GET /api/projects/{projectId}/milestones

# 创建里程碑
POST /api/projects/{projectId}/milestones
Body: { name, description, deadline, order }

# 更新里程碑
PUT /api/milestones/{milestoneId}
Body: { name, description, deadline, status, order }

# 删除里程碑
DELETE /api/milestones/{milestoneId}
```

### 2.3 任务 API

```bash
# 获取里程碑任务树
GET /api/milestones/{milestoneId}/tasks

# 创建任务
POST /api/milestones/{milestoneId}/tasks
Body: { 
  title, description, assigneeRole, assigneeName, 
  deliverableType, priority, plannedDate 
}

# 获取任务详情
GET /api/tasks/{taskId}

# 更新任务
PUT /api/tasks/{taskId}
Body: { title, description, assigneeRole, status, priority, ... }

# 删除任务
DELETE /api/tasks/{taskId}

# 创建子任务（任务链）
POST /api/tasks/{taskId}/subtask
Body: { title, description, assigneeRole, priority, plannedDate }

# 快速更新任务状态（自动记录日志）
PUT /api/tasks/{taskId}/status
Body: { status, reason, changedBy }

# 获取任务变更日志
GET /api/tasks/{taskId}/logs

# 添加变更日志
POST /api/tasks/{taskId}/logs
Body: { field, oldValue, newValue, reason, changedBy }
```

### 2.4 日历事件 API

```bash
# 获取项目日历事件
GET /api/projects/{projectId}/calendar

# 创建日历事件
POST /api/projects/{projectId}/calendar
Body: { title, eventType, eventDate, duration, attendees, reminder, notes }

# 更新日历事件
PUT /api/calendar/{eventId}
Body: { title, eventType, eventDate, ... }

# 删除日历事件
DELETE /api/calendar/{eventId}

# 获取全局日历（所有项目）
GET /api/calendar?start=2026-03-01&end=2026-03-31
```

### 2.5 沟通记录 API

```bash
# 获取项目沟通记录
GET /api/projects/{projectId}/communications

# 创建沟通记录
POST /api/projects/{projectId}/communications
Body: { type, date, participants, summary, recordingPath, actionItems }

# 更新沟通记录
PUT /api/communications/{communicationId}

# 删除沟通记录
DELETE /api/communications/{communicationId}
```

---

## 3. 项目快照接口详解 ⭐

### 3.1 获取项目完整快照

**Agent 首选接口** - 一次调用获取项目的所有信息

```bash
GET /api/snapshot/project/{projectId}
```

**响应结构**:

```json
{
  "data": {
    "project": {
      "id": "proj_xxx",
      "name": "XX品牌春季发布会",
      "description": "项目描述",
      "type": "营销",
      "status": "进行中",
      "client": "XX科技",
      "startDate": "2026-03-01T00:00:00Z",
      "endDate": "2026-04-15T00:00:00Z"
    },
    "statistics": {
      "totalMilestones": 4,
      "totalTasks": 12,
      "completedTasks": 5,
      "inProgressTasks": 4,
      "completionRate": 42
    },
    "milestones": [
      {
        "id": "ms_xxx",
        "name": "前期沟通与方案",
        "deadline": "2026-03-15T00:00:00Z",
        "status": "进行中",
        "tasks": [
          {
            "id": "task_xxx",
            "title": "主视觉设计",
            "assigneeRole": "创作虾",
            "assigneeName": "小A",
            "status": "进行中",
            "priority": "P0",
            "plannedDate": "2026-03-25T00:00:00Z",
            "changeLogs": [
              {
                "field": "日期",
                "oldValue": "2026-03-20",
                "newValue": "2026-03-25",
                "reason": "客户要求增加3D元素，需延长设计时间",
                "changedBy": "总指挥虾",
                "changedAt": "2026-03-22T10:30:00Z"
              }
            ],
            "subTasks": []
          }
        ]
      }
    ],
    "upcomingEvents": [
      {
        "id": "evt_xxx",
        "title": "方案汇报",
        "eventType": "会议",
        "eventDate": "2026-03-28T14:00:00Z"
      }
    ],
    "recentCommunications": [
      {
        "id": "comm_xxx",
        "type": "电话",
        "date": "2026-03-22T09:00:00Z",
        "summary": "客户确认主色调使用品牌蓝"
      }
    ]
  }
}
```

### 3.2 获取仪表盘数据

```bash
GET /api/snapshot/dashboard
```

**响应结构**:

```json
{
  "data": {
    "statistics": {
      "projects": {
        "total": 10,
        "active": 5,
        "completed": 3,
        "paused": 2
      },
      "tasks": {
        "total": 50,
        "completed": 20,
        "inProgress": 15,
        "atRisk": 3,
        "completionRate": 40
      }
    },
    "projects": [...],
    "upcomingEvents": [...]
  }
}
```

---

## 4. 营销项目使用场景示例

### 场景 1: 创建新项目（事件营销）

**用户**: "帮我创建一个XX品牌春季发布会项目"

**Agent 执行流程**:

```javascript
// 1. 创建项目
const createProject = async () => {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "XX品牌春季发布会",
      description: "2026年春季新品发布活动，包含线上直播和线下体验",
      type: "营销",
      client: "XX科技",
      startDate: "2026-03-01",
      endDate: "2026-04-15"
    })
  });
  const { data: project } = await res.json();
  return project.id;
};

// 2. 创建里程碑
const createMilestones = async (projectId) => {
  const milestones = [
    { name: "前期沟通与方案", order: 1 },
    { name: "设计与制作", order: 2 },
    { name: "执行与落地", order: 3 },
    { name: "复盘总结", order: 4 }
  ];
  
  for (const ms of milestones) {
    await fetch(`/api/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ms)
    });
  }
};

// 3. 汇报结果
console.log(`✅ 项目创建成功！
📁 项目名称：XX品牌春季发布会
📄 项目ID：${projectId}
🎯 里程碑：4个阶段已创建
➡️ 下一步：在"前期沟通与方案"阶段添加具体任务`);
```

---

### 场景 2: 电话沟通后创建任务

**用户**: "刚跟客户通了电话，需要设计主视觉、出3D效果图，还有准备技术可行性报告"

**Agent 执行流程**:

```javascript
// 1. 先获取项目快照了解当前状态
const snapshot = await fetch('/api/snapshot/project/{projectId}').then(r => r.json());

// 2. 找到"前期沟通与方案"里程碑
const milestone = snapshot.data.milestones.find(m => m.name.includes('前期沟通'));

// 3. 创建任务
const tasks = [
  {
    title: "主视觉设计",
    assigneeRole: "创作虾",
    deliverableType: "平面设计稿",
    priority: "P0",
    plannedDate: "2026-03-25"
  },
  {
    title: "3D效果图",
    assigneeRole: "创作虾", 
    deliverableType: "3D渲染图",
    priority: "P0",
    plannedDate: "2026-03-28"
  },
  {
    title: "技术可行性研判",
    assigneeRole: "技术虾",
    deliverableType: "技术评估报告",
    priority: "P1",
    plannedDate: "2026-03-24"
  }
];

for (const task of tasks) {
  await fetch(`/api/milestones/${milestone.id}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
}

// 4. 记录沟通内容
await fetch(`/api/projects/${projectId}/communications`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: "电话",
    date: new Date().toISOString(),
    participants: "客户方张总、我方总指挥虾",
    summary: "确认活动基调为科技感，主色调使用品牌蓝，需要3D场景渲染",
    actionItems: JSON.stringify(["主视觉设计", "3D效果图", "技术可行性研判"])
  })
});

// 5. 添加日历提醒（下次拜访）
await fetch(`/api/projects/${projectId}/calendar`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "方案汇报",
    eventType: "会议",
    eventDate: "2026-03-28T14:00:00",
    duration: 120,
    attendees: "客户方张总、策划虾、创作虾",
    reminder: 60
  })
});

console.log(`✅ 任务创建完成！
📝 创建任务：3个
📞 沟通记录：已归档
📅 日历提醒：3月28日方案汇报已设置`);
```

---

### 场景 3: 更新任务状态并说明原因

**用户**: "主视觉设计要延期到3月28日，客户要求增加3D元素"

**Agent 执行流程**:

```javascript
// 方案A：使用状态更新接口（推荐）
await fetch('/api/tasks/{taskId}/status', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: "有风险",
    reason: "客户要求增加3D元素，需延长设计时间，从3月25日延期至3月28日",
    changedBy: "总指挥虾"
  })
});

// 方案B：手动记录变更日志
await fetch('/api/tasks/{taskId}/logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    field: "日期",
    oldValue: "2026-03-25",
    newValue: "2026-03-28",
    reason: "客户要求增加3D元素，需延长设计时间",
    changedBy: "总指挥虾"
  })
});

console.log(`⚠️ 任务状态已更新
📋 任务：主视觉设计
🔄 状态：进行中 → 有风险
📝 原因：客户要求增加3D元素
📅 新日期：2026-03-28`);
```

---

### 场景 4: 获取项目状态汇报

**用户**: "XX品牌项目现在进展如何？"

**Agent 执行流程**:

```javascript
// 使用快照接口一次性获取所有信息
const { data: snapshot } = await fetch('/api/snapshot/project/{projectId}').then(r => r.json());

const report = `
📊 **XX品牌春季发布会 - 项目进展**

**整体进度**: ${snapshot.statistics.completionRate}% (${snapshot.statistics.completedTasks}/${snapshot.statistics.totalTasks} 任务完成)

**里程碑状态**:
${snapshot.milestones.map(m => {
  const completed = m.tasks.filter(t => t.status === '已完成').length;
  const total = m.tasks.length;
  return `• ${m.name}: ${m.status} (${completed}/${total} 任务)`;
}).join('\n')}

**进行中任务**:
${snapshot.milestones
  .flatMap(m => m.tasks)
  .filter(t => t.status === '进行中')
  .map(t => `• ${t.title} - ${t.assigneeName || t.assigneeRole} - 截止 ${t.plannedDate?.split('T')[0]}`)
  .join('\n') || '无'}

**即将发生**:
${snapshot.upcomingEvents.map(e => `• ${e.title} - ${e.eventDate.split('T')[0]}`).join('\n') || '无'}

**最近沟通**:
${snapshot.recentCommunications.map(c => `• ${c.type}: ${c.summary.substring(0, 50)}...`).join('\n') || '无'}
`;

console.log(report);
```

---

### 场景 5: 任务链管理（版本迭代）

**用户**: "客户反馈主视觉需要修改，做一版新的"

**Agent 执行流程**:

```javascript
// 1. 标记原任务完成（如果已完成）
await fetch('/api/tasks/{originalTaskId}/status', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: "已完成",
    reason: "已提交v1版本，客户提出修改意见",
    changedBy: "创作虾"
  })
});

// 2. 创建修改任务（作为子任务）
const { data: newTask } = await fetch('/api/tasks/{originalTaskId}/subtask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "主视觉修改 - 客户反馈版",
    description: "根据客户反馈：1.色调加深 2.增加动态元素",
    assigneeRole: "创作虾",
    assigneeName: "小A",
    deliverableType: "平面设计稿",
    priority: "P0",
    plannedDate: "2026-03-30"
  })
}).then(r => r.json());

console.log(`✅ 任务链已更新
📋 原任务：主视觉设计 (v1) - 已完成
🔗 新任务：主视觉修改 - 客户反馈版 (v2) - 已创建
📅 计划完成：2026-03-30`);
```

---

## 5. 最佳实践

### 5.1 任务状态流转

```
待开始 → 进行中 → 已完成
   ↓       ↓
 暂停    有风险 → 已延期
```

**建议**:
- 任务开始时更新为「进行中」
- 遇到问题及时标记「有风险」并说明原因
- 延期必须记录变更日志

### 5.2 优先级定义

| 优先级 | 说明 | 处理时效 |
|--------|------|----------|
| **P0** | 关键路径任务，影响里程碑 | 立即处理 |
| **P1** | 重要任务，影响项目进度 | 本周内完成 |
| **P2** | 一般任务，可灵活调整 | 按需安排 |

### 5.3 变更日志规范

每次日期/负责人/状态变更时，务必记录：

```json
{
  "field": "日期",
  "oldValue": "2026-03-25",
  "newValue": "2026-03-28",
  "reason": "客户要求增加3D元素，需延长设计时间",
  "changedBy": "总指挥虾"
}
```

### 5.4 沟通记录要点

- **电话沟通**: 记录时间、参与人、核心结论、待办事项
- **会议纪要**: 记录议题、决议、Action Items
- **客户反馈**: 关联到具体任务，触发修改流程

### 5.5 日历事件类型

| 类型 | 用途 | 提醒建议 |
|------|------|----------|
| **会议** | 方案汇报、评审会 | 提前1小时 |
| **拜访** | 客户现场沟通 | 提前2小时 |
| **截止日** | 里程碑/任务截止 | 提前1天 |
| **评审** | 内部/客户评审 | 提前30分钟 |

---

## 6. 错误处理

### 6.1 常见错误码

| 状态码 | 含义 | 处理方式 |
|--------|------|----------|
| 200 | 成功 | - |
| 201 | 创建成功 | - |
| 400 | 请求参数错误 | 检查请求体格式 |
| 404 | 资源不存在 | 检查ID是否正确 |
| 500 | 服务器错误 | 稍后重试或联系管理员 |

### 6.2 错误响应格式

```json
{
  "error": "项目不存在"
}
```

---

## 7. 调试技巧

### 7.1 测试 API 连通性

```bash
# 获取仪表盘数据（最轻量）
curl http://localhost:3000/api/snapshot/dashboard
```

### 7.2 验证数据结构

获取项目快照后，检查关键字段：

```javascript
const snapshot = await fetch('/api/snapshot/project/{id}').then(r => r.json());
console.log('项目名称:', snapshot.data.project.name);
console.log('里程碑数:', snapshot.data.milestones.length);
console.log('任务总数:', snapshot.data.statistics.totalTasks);
```

### 7.3 查看变更历史

```bash
# 获取任务变更日志
curl http://localhost:3000/api/tasks/{taskId}/logs
```

---

## 8. 联系与支持

如有问题，请在项目群 @总指挥虾 反馈。

---

**🦐 指挥官提示**: 
1. 获取项目状态优先使用 `/api/snapshot/project/{id}` 接口
2. 任务状态变更务必记录原因，便于追溯
3. 日期格式统一使用 ISO 8601: `2026-03-23T10:00:00Z`
