# DDHD 项目看板 - Agent 技能使用指南

**版本**: v1.1  
**适用 Agent**: 总指挥虾、策划虾、创作虾、技术虾、运营虾  
**更新日期**: 2026-03-23

---

## 1. 技能概述

本技能用于让 OpenClaw Agent 与 **DDHD 项目看板系统** 进行交互，实现：

- 📊 **查询项目状态** - 获取项目完整信息、任务进度、里程碑状态
- 👤 **负责人管理** - 创建/更新负责人，查询负责人负责的项目
- 📝 **创建/更新任务** - 在看板中创建新任务、分配给多个负责人
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
User (负责人)
├── userId - 系统唯一ID (如: 5314294e)
├── openId - 第三方OpenID
├── userName - 姓名
├── avatar - 头像
└── role - 角色 (策划虾/创作虾/技术虾/运营虾/总指挥虾)

Project (项目)
├── members[] - 项目成员
├── Milestone (里程碑)
│   └── Task (任务)
│       ├── assignees[] - 分配的负责人 (多对多)
│       └── SubTask (子任务)
├── CalendarEvent (日历事件)
└── Communication (沟通记录)
```

---

## 2. 核心 API 端点速查

### 2.1 用户/负责人 API ⭐新增

```bash
# 获取所有用户
GET /api/users

# 按角色筛选用户
GET /api/users?role=创作虾

# 创建用户
POST /api/users
Body: {
  "userId": "5314294e",
  "openId": "ou_d16d474761c1bd2852b7d2f1aeafaadc",
  "userName": "小A",
  "avatar": "https://example.com/avatar.jpg",
  "role": "创作虾",
  "email": "xiaoa@example.com",
  "phone": "13800138000"
}

# 获取用户详情（支持 userId 或 openId）
GET /api/users/{userId}

# 更新用户
PUT /api/users/{userId}
Body: { "userName": "小A", "role": "创作虾", "avatar": "..." }

# 删除用户
DELETE /api/users/{userId}

# 获取用户负责的所有项目 ⭐重要
GET /api/users/{userId}/projects
```

### 2.2 项目成员 API ⭐新增

```bash
# 获取项目成员列表
GET /api/projects/{projectId}/members

# 添加项目成员
POST /api/projects/{projectId}/members
Body: {
  "userId": "5314294e",
  "role": "设计负责人"  // 项目中的角色（可选）
}
```

### 2.3 项目 API

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

### 2.4 里程碑 API

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

### 2.5 任务 API ⭐更新（支持多负责人）

```bash
# 获取里程碑任务树
GET /api/milestones/{milestoneId}/tasks

# 创建任务 ⭐支持多负责人
POST /api/milestones/{milestoneId}/tasks
Body: {
  "title": "主视觉设计",
  "description": "...",
  "assignees": [              // ⭐ 多负责人
    { "userId": "5314294e", "role": "主设计师" },
    { "userId": "abc123", "role": "协助" }
  ],
  "deliverableType": "平面设计稿",
  "priority": "P0",
  "plannedDate": "2026-03-25"
}

# 获取任务详情
GET /api/tasks/{taskId}

# 更新任务 ⭐支持更新负责人
PUT /api/tasks/{taskId}
Body: {
  "title": "...",
  "assignees": [              // ⭐ 更新负责人列表
    { "userId": "5314294e" }
  ],
  "status": "进行中",
  ...
}

# 删除任务
DELETE /api/tasks/{taskId}

# 创建子任务（任务链）
POST /api/tasks/{taskId}/subtask
Body: { title, assignees, priority, plannedDate }

# 快速更新任务状态（自动记录日志）
PUT /api/tasks/{taskId}/status
Body: { status, reason, changedBy }

# 获取任务变更日志
GET /api/tasks/{taskId}/logs
```

### 2.6 日历事件 API

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

### 2.7 沟通记录 API

```bash
# 获取项目沟通记录
GET /api/projects/{projectId}/communications

# 创建沟通记录
POST /api/projects/{projectId}/communications
Body: { type, date, participants, summary, recordingPath, actionItems }
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
      "client": "XX科技"
    },
    "statistics": {
      "totalMilestones": 4,
      "totalTasks": 12,
      "completedTasks": 5,
      "inProgressTasks": 4,
      "completionRate": 42,
      "memberCount": 6
    },
    "members": [              // ⭐ 项目成员列表
      {
        "id": "user_xxx",
        "userId": "5314294e",
        "userName": "小A",
        "avatar": "https://...",
        "role": "创作虾"
      }
    ],
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
            "assignees": [          // ⭐ 多负责人
              {
                "userId": "5314294e",
                "userName": "小A",
                "avatar": "https://...",
                "role": "创作虾",
                "taskRole": "主设计师"
              }
            ],
            "status": "进行中",
            "priority": "P0",
            "plannedDate": "2026-03-25T00:00:00Z",
            "changeLogs": [...],
            "subTasks": [...]
          }
        ]
      }
    ],
    "upcomingEvents": [...],
    "recentCommunications": [...]
  }
}
```

### 3.2 获取用户负责的项目 ⭐新增

```bash
GET /api/users/{userId}/projects
```

**响应结构**:

```json
{
  "data": {
    "user": {
      "id": "user_xxx",
      "userId": "5314294e",
      "userName": "小A",
      "avatar": "https://...",
      "role": "创作虾"
    },
    "stats": {
      "totalProjects": 5,        // 参与的项目总数
      "activeProjects": 3,       // 进行中项目
      "completedProjects": 2,    // 已完成项目
      "totalTasks": 12,          // 分配的任务数
      "completedTasks": 8,       // 已完成任务
      "inProgressTasks": 4       // 进行中任务
    },
    "projects": [
      {
        "id": "proj_xxx",
        "name": "XX品牌春季发布会",
        "status": "进行中",
        "type": "营销",
        "client": "XX科技",
        "memberRole": "设计负责人",  // 在项目中的角色
        "joinedAt": "2026-03-01T00:00:00Z",
        "milestoneCount": 4
      }
    ]
  }
}
```

### 3.3 获取仪表盘数据

```bash
GET /api/snapshot/dashboard
```

---

## 4. 营销项目使用场景示例

### 场景 1: 创建负责人

**用户**: "添加一个创作虾小A，userId是5314294e"

```javascript
const res = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '5314294e',
    openId: 'ou_d16d474761c1bd2852b7d2f1aeafaadc',
    userName: '小A',
    avatar: 'https://example.com/avatar.jpg',
    role: '创作虾',
    email: 'xiaoa@example.com'
  })
});
console.log('✅ 负责人创建成功: 小A (创作虾)');
```

---

### 场景 2: 创建任务并分配给多个负责人

**用户**: "主视觉设计任务需要小A主负责，小B协助"

```javascript
// 创建任务并分配多个负责人
await fetch(`/api/milestones/${milestoneId}/tasks`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '主视觉设计',
    description: '春季发布会主视觉设计',
    assignees: [                      // ⭐ 多负责人
      { userId: '5314294e', role: '主设计师' },
      { userId: 'abc123', role: '协助' }
    ],
    deliverableType: '平面设计稿',
    priority: 'P0',
    plannedDate: '2026-03-25'
  })
});
console.log('✅ 任务创建成功，分配给: 小A(主设计师)、小B(协助)');
```

---

### 场景 3: 查询某人负责的所有项目

**用户**: "小A现在手头有哪些项目？"

```javascript
const { data } = await fetch('/api/users/5314294e/projects')
  .then(r => r.json());

console.log(`📊 小A的项目统计:`);
console.log(`  参与项目: ${data.stats.totalProjects}个`);
console.log(`  进行中: ${data.stats.activeProjects}个`);
console.log(`  分配任务: ${data.stats.totalTasks}个`);
console.log(`  已完成任务: ${data.stats.completedTasks}个`);

data.projects.forEach(p => {
  console.log(`  • ${p.name} (${p.status}) - ${p.memberRole}`);
});
```

---

### 场景 4: 获取项目完整状态（含负责人信息）

```javascript
const { data } = await fetch('/api/snapshot/project/{projectId}')
  .then(r => r.json());

console.log(`📊 ${data.project.name} - 项目快照`);
console.log(`\n项目成员 (${data.members.length}人):`);
data.members.forEach(m => {
  console.log(`  • ${m.userName} (${m.role})`);
});

console.log(`\n任务分配情况:`);
data.milestones.forEach(ms => {
  console.log(`\n${ms.name}:`);
  ms.tasks.forEach(task => {
    const assignees = task.assignees.map(a => a.userName).join(', ');
    console.log(`  • ${task.title} - ${assignees || '未分配'} [${task.status}]`);
  });
});
```

---

### 场景 5: 更新任务负责人

**用户**: "主视觉设计改成小C负责，小A协助"

```javascript
await fetch('/api/tasks/{taskId}', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '主视觉设计',
    assignees: [                    // ⭐ 更新负责人
      { userId: 'userC789', role: '主设计师' },
      { userId: '5314294e', role: '协助' }
    ]
  })
});

// 记录变更日志
await fetch('/api/tasks/{taskId}/logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    field: '负责人',
    oldValue: '小A(主)、小B(协)',
    newValue: '小C(主)、小A(协)',
    reason: '工作调整，小C更适合主设计',
    changedBy: '总指挥虾'
  })
});
```

---

## 5. 数据模型

### 5.1 User (用户/负责人)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 系统内部ID |
| userId | String | 唯一用户ID (如: 5314294e) |
| openId | String | 第三方OpenID (如: ou_xxx) |
| userName | String | 姓名 |
| avatar | String | 头像URL |
| role | String | 角色 (策划虾/创作虾/技术虾/运营虾/总指挥虾) |
| email | String | 邮箱 |
| phone | String | 电话 |
| status | String | active/inactive |

### 5.2 TaskAssignee (任务负责人关联)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 关联ID |
| taskId | String | 任务ID |
| userId | String | 用户ID |
| role | String | 在该任务中的角色 (可选) |

---

## 6. 最佳实践

### 6.1 创建项目流程

```
1. 创建用户 (如果没有) → POST /api/users
2. 创建项目 → POST /api/projects
3. 添加项目成员 → POST /api/projects/{id}/members
4. 创建里程碑 → POST /api/projects/{id}/milestones
5. 创建任务并分配 → POST /api/milestones/{id}/tasks
```

### 6.2 多负责人分配建议

- **主负责人**: 任务的最终负责人，必须完成
- **协作者**: 协助完成任务，可以多人
- **审批者**: 负责验收，通常是总指挥虾

示例:
```json
{
  "assignees": [
    { "userId": "userA", "role": "主设计师" },
    { "userId": "userB", "role": "协助" },
    { "userId": "leader", "role": "审批" }
  ]
}
```

---

## 7. 错误处理

| 状态码 | 含义 | 处理方式 |
|--------|------|----------|
| 200 | 成功 | - |
| 201 | 创建成功 | - |
| 400 | 请求参数错误 | 检查请求体格式 |
| 404 | 资源不存在 | 检查ID是否正确 |
| 409 | 资源冲突 | 如 userId 已存在 |
| 500 | 服务器错误 | 稍后重试或联系管理员 |

---

## 8. 调试技巧

```bash
# 测试用户 API
curl http://localhost:3000/api/users

# 获取某用户负责的项目
curl http://localhost:3000/api/users/5314294e/projects

# 获取项目成员
curl http://localhost:3000/api/projects/{id}/members
```

---

**🦐 指挥官提示**: 
1. 获取项目状态优先使用 `/api/snapshot/project/{id}` 接口
2. 查询某人负责的项目使用 `/api/users/{userId}/projects`
3. 任务可以分配给多个负责人，用 `assignees` 字段
4. 日期格式统一使用 ISO 8601: `2026-03-23T10:00:00Z`
