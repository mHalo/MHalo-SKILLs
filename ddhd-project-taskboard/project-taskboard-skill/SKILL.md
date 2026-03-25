# Project Taskboard Skill

## 项目概述

DDHD 项目管理系统 - 项目看板是一个面向营销项目的全生命周期协作看板，支持项目→里程碑→任务→子任务链的四级结构。

### 系统功能

- **Dashboard**: 项目统计卡片、风险预警、最近项目列表
- **Priority**: 四象限优先级看板（P0/P1/P2/P3）
- **Calendar**: 日/周/月三视图切换，显示任务和日历事件
- **People**: 团队成员任务统计和分配情况
- **Projects List**: 所有项目概览，支持归档管理
- **Project Detail**: 项目详情、里程碑列表、任务看板（Kanban）

### baseUrl 配置说明

系统 API baseUrl 配置在环境变量中，正式环境需根据部署地址配置。

## 技术栈

- **框架**: Next.js 16 + React 19 + TypeScript
- **样式**: TailwindCSS 4 + shadcn/ui (base-nova 风格)
- **数据库**: SQLite + Prisma ORM
- **UI组件**: @base-ui/react
- **图标**: Lucide Icons
- **拖拽**: @hello-pangea/dnd
- **通知**: Sonner (toast)

## 数据模型

### User (用户/团队成员)
- 角色类型: `策划虾` / `创作虾` / `技术虾` / `运营虾` / `总指挥虾`
- 关联: assignedTasks, projects

### Project (项目)
- 类型: `营销` / `活动` / `开发` / `内容制作`
- 状态: `进行中` / `已完成` / `暂停`
- 关联: milestones, calendarEvents, communications, members

### Milestone (里程碑)
- 状态: `待开始` / `进行中` / `已完成`
- 关联: project, tasks

### Task (任务)
- **优先级 (priority)**: `P0` / `P1` / `P2` / `P3`
- **状态 (status)**: `待开始` / `进行中` / `已完成` / `有风险` / `已延期` / `暂停`
- 支持子任务链 (parentTaskId)
- 关联: milestone, parentTask, subTasks, assignees, changeLogs, deliverables

### CalendarEvent (日历事件)
- 类型: `会议` / `拜访` / `评审` / `截止日`

### Communication (沟通记录)
- 类型: `电话` / `会议` / `邮件` / `微信`

---

## 项目管理

### 1.1 创建新项目
- **API**: `POST /api/projects`
- **必填项**: name
- **可选项**: description, type, client, startDate, endDate
- **用户确认项**: 项目名称、类型、客户

```bash
POST /api/projects
{
  "name": "项目名称",
  "type": "营销",
  "client": "客户名称",
  "description": "项目描述"
}
```

### 1.2 创建里程碑
- **API**: `POST /api/projects/{id}/milestones` 或 `POST /api/milestones`
- **必填项**: name, projectId
- **可选项**: description, deadline, status, order
- **用户确认项**: 里程碑名称、截止日期

```bash
POST /api/projects/{id}/milestones
{
  "name": "里程碑名称",
  "deadline": "2026-04-01",
  "status": "待开始"
}
```

### 1.3 创建节点任务
- **API**: `POST /api/milestones/{id}/tasks` 或 `POST /api/tasks`
- **必填项**: title, milestoneId
- **可选项**: description, priority, plannedDate, assignees, assigneeRole
- **用户确认项**: 任务名称、优先级、责任人、计划日期

```bash
POST /api/tasks
{
  "title": "任务名称",
  "milestoneId": "里程碑ID",
  "priority": "P1",
  "status": "待开始",
  "plannedDate": "2026-04-01"
}
```

---

## 任务管理

### 2.1 更新任务状态
- **API**: `PUT /api/tasks/{id}/status`
- **可选状态**: "待开始" / "进行中" / "已完成" / "有风险" / "已延期" / "暂停"
- **禁止自行创建其他状态**

```bash
PUT /api/tasks/{id}/status
{
  "status": "已完成"
}
```

### 2.2 更新任务信息
- **API**: `PATCH /api/tasks`
- **可更新项**: title, description, priority, status, plannedDate, milestoneId, assignees

```bash
PATCH /api/tasks
{
  "id": "任务ID",
  "title": "新标题",
  "priority": "P0",
  "status": "有风险"
}
```

### 2.3 任务状态说明
| 状态 | 说明 |
|------|------|
| 待开始 | 任务创建后默认状态 |
| 进行中 | 任务开始执行 |
| 已完成 | 任务完成 |
| 有风险 | 任务可能无法按期完成 |
| 已延期 | 任务已超过计划日期 |
| 暂停 | 任务暂停执行 |

### 2.4 任务优先级说明
| 优先级 | 说明 |
|--------|------|
| P0 | 紧急重要 - 红色高亮，需要立即处理 |
| P1 | 重要不紧急 - 绿色，需要关注 |
| P2 | 紧急不重要 - 蓝色，常规任务 |
| P3 | 不紧急不重要 - 灰色，可延后 |

---

## 日程管理

### 3.1 日程类型
| 类型 | 说明 |
|------|------|
| 会议 | 团队会议 |
| 拜访 | 客户拜访 |
| 评审 | 项目评审 |
| 截止日 | 重要截止日期 |

### 3.2 创建日程
- **API**: `POST /api/projects/{id}/calendar`
- **必填项**: title, eventType, eventDate
- **可选项**: duration, attendees, reminder, notes

```bash
POST /api/projects/{id}/calendar
{
  "title": "项目启动会议",
  "eventType": "会议",
  "eventDate": "2026-04-01T10:00:00Z",
  "notes": "讨论项目计划和分工"
}
```

---

## 用户管理

### 4.1 创建用户
- **API**: `POST /api/users`
- **必填项**: userName
- **可选项**: role, openId, avatar, email, phone

```bash
POST /api/users
{
  "userName": "张三",
  "role": "技术虾",
  "openId": "wechat_openid_xxx"
}
```

### 4.2 更新用户
- **API**: `PUT /api/users/{id}`
- **可更新项**: userName, role, openId, avatar, avatarColorBg, avatarColorText, email, phone, status

```bash
PUT /api/users/{id}
{
  "userName": "张三",
  "role": "技术虾",
  "avatarColorBg": "bg-blue-500",
  "avatarColorText": "text-white"
}
```

---

## API 接口总览

### 项目 API
```
GET    /api/projects              # 项目列表 (支持 includeDetails=true 获取完整数据)
POST   /api/projects              # 创建项目
GET    /api/projects/[id]         # 项目详情
PUT    /api/projects/[id]         # 更新项目
DELETE /api/projects/[id]         # 删除项目
PATCH  /api/projects              # 归档/取消归档项目
```

### 里程碑 API
```
GET    /api/projects/[id]/milestones   # 获取项目里程碑列表
POST   /api/projects/[id]/milestones   # 创建里程碑
PUT    /api/milestones/[id]           # 更新里程碑
DELETE /api/milestones/[id]           # 删除里程碑
PATCH  /api/milestones                # 批量更新里程碑排序
```

### 任务 API
```
GET    /api/tasks                    # 任务列表 (limit=200返回完整数据)
POST   /api/tasks                    # 创建任务
GET    /api/tasks/[id]               # 任务详情
PUT    /api/tasks/[id]               # 更新任务
DELETE /api/tasks/[id]               # 删除任务
PUT    /api/tasks/[id]/status        # 更新任务状态
GET    /api/tasks/[id]/logs          # 任务变更日志
GET    /api/tasks/[id]/subtask       # 子任务列表
```

### 用户 API
```
GET    /api/users                    # 用户列表 (支持 includeDetails=true 获取完整任务数据)
POST   /api/users                    # 创建用户
GET    /api/users/[id]               # 用户详情
PUT    /api/users/[id]               # 更新用户
DELETE /api/users/[id]               # 删除用户
GET    /api/users/[id]/projects      # 用户参与的项目
```

### 日历 API
```
GET    /api/calendar?start=&end=          # 全局日历事件
POST   /api/projects/[id]/calendar         # 创建日程事件
DELETE /api/calendar/[id]                  # 删除日程事件
```

### 快照 API
```
GET    /api/snapshot/dashboard     # 仪表盘数据
GET    /api/snapshot/project/[id]  # 项目完整快照
```

---

## 常用操作示例

### 创建完整项目流程
1. 创建项目: `POST /api/projects`
2. 创建里程碑: `POST /api/projects/{id}/milestones`
3. 创建任务: `POST /api/tasks`
4. 分配任务负责人: `PATCH /api/tasks` with assignees

### 更新任务状态流程
1. 使用 `PUT /api/tasks/{id}/status` 更新状态
2. 系统自动记录变更日志
3. 如状态变为"已完成"，自动设置 actualDate

### 查询用户任务统计
使用 `GET /api/users?includeDetails=true` 可获取用户完整任务数据，包含：
- 用户基本信息
- 所有进行中的任务
- 任务所属的里程碑和项目信息

---

## 注意事项

1. **头像颜色**: 使用 `getAvatarColor(userId)` 获取用户头像颜色
2. **主题切换**: 支持深色/浅色模式，使用 `dark:` 前缀
3. **构建验证**: 每次修改后运行 `npm run lint` 和 `npm run build`
4. **数据库**: 使用 `npx prisma db seed` 重置演示数据
5. **自动刷新**: 页面支持5分钟自动刷新数据，大屏看板场景下自动更新
6. **N+1优化**: API支持 `includeDetails=true` 参数避免循环请求
