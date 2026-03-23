# Project Taskboard Skill

## 概述

DDHD 项目管理系统 - 项目看板是一个面向营销项目的全生命周期协作看板，支持项目→里程碑→任务→子任务链的四级结构。

## 技术栈

- **框架**: Next.js 16 + React 19 + TypeScript
- **样式**: TailwindCSS 4 + shadcn/ui (base-nova 风格)
- **数据库**: SQLite + Prisma ORM
- **UI组件**: @base-ui/react

## 核心功能

### 1. 项目管理
- 项目 CRUD 操作
- 项目类型：营销/活动/内容制作/开发
- 项目成员管理

### 2. 里程碑管理
- 里程碑 CRUD
- 截止日期设置
- 进度追踪

### 3. 任务管理
- 任务 CRUD
- 子任务链支持（修改v1→v2→v3）
- 优先级：P0(紧急)/P1(高)/P2(中)
- 状态：待开始/进行中/已完成/有风险/已延期/暂停
- 完成说明字段

### 4. 日历视图
- 日/周/月三视图切换
- 显示任务和日历事件
- 支持新建日程

### 5. 人员看板
- 人员任务统计
- 近3条待推进任务显示
- 头像颜色自动分配

### 6. 优先级看板
- 四象限视图（重要紧急/重要不紧急/紧急不重要/不重要不紧急）

## API 接口

### 项目 API
```
GET    /api/projects              # 项目列表
POST   /api/projects              # 创建项目
GET    /api/projects/[id]         # 项目详情
PUT    /api/projects/[id]         # 更新项目
DELETE /api/projects/[id]         # 删除项目
```

### 里程碑 API
```
GET    /api/projects/[id]/milestones
POST   /api/projects/[id]/milestones
PUT    /api/milestones/[id]
DELETE /api/milestones/[id]
```

### 任务 API
```
GET    /api/milestones/[id]/tasks
POST   /api/tasks
GET    /api/tasks/[id]
PUT    /api/tasks/[id]
DELETE /api/tasks/[id]
```

### 日历 API
```
GET    /api/calendar?start=&end=   # 全局日历事件
POST   /api/projects/[id]/calendar # 创建日历事件
```

### Agent 快照 API
```
GET    /api/snapshot/dashboard     # 仪表盘数据
GET    /api/snapshot/project/[id]  # 项目完整快照
```

## 数据库模型

### Task
- id, title, description
- status: 待开始/进行中/已完成/有风险/已延期/暂停
- priority: P0/P1/P2
- plannedDate, actualDate
- completionNote: 任务完成说明
- milestoneId, parentTaskId

### CalendarEvent
- id, title, eventType
- eventDate, duration
- projectId, attendees

## 常用操作

### 创建项目
```bash
POST /api/projects
{
  "name": "项目名称",
  "type": "营销",
  "client": "客户名称",
  "description": "项目描述"
}
```

### 创建任务
```bash
POST /api/tasks
{
  "title": "任务名称",
  "milestoneId": "里程碑ID",
  "priority": "P1",
  "status": "待开始"
}
```

### 更新任务状态
```bash
PUT /api/tasks/[id]
{
  "status": "已完成",
  "completionNote": "任务完成说明"
}
```

## 注意事项

1. **头像颜色**: 使用 `getAvatarColor(userId)` 获取用户头像颜色
2. **主题切换**: 支持深色/浅色模式，使用 `dark:` 前缀
3. **构建验证**: 每次修改后运行 `npm run lint` 和 `npm run build`
4. **数据库**: 使用 `npx prisma db seed` 重置演示数据
