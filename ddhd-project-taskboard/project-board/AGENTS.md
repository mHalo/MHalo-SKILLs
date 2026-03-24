<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md - 项目任务管理系统 (Project Board)

## 项目概述
这是一个 **Next.js 16.2.1 App Router** 项目任务管理系统，用于团队协作和项目管理。系统采用 **Prisma + SQLite** 作为数据层，**Tailwind CSS + shadcn/ui** 作为 UI 框架。

## 技术栈
- **Framework**: Next.js 16.2.1 (App Router)
- **Database**: Prisma + SQLite
- **UI**: Tailwind CSS v4 + shadcn/ui + Lucide Icons
- **State**: React hooks (useState/useEffect)
- **Notifications**: Sonner (toast)
- **Drag & Drop**: @hello-pangea/dnd
- **Language**: TypeScript

## 项目结构
```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── tasks/              # 任务相关 API
│   │   ├── projects/           # 项目相关 API
│   │   ├── milestones/         # 里程碑相关 API
│   │   ├── users/              # 用户相关 API
│   │   ├── calendar/           # 日历相关 API
│   │   ├── communications/    # 沟通记录 API
│   │   └── snapshot/           # 数据快照 API
│   ├── pages/                  # 页面组件
│   │   ├── dashboard/          # 仪表盘
│   │   ├── priority/           # 优先级看板 (四象限)
│   │   ├── calendar/           # 日历视图
│   │   ├── people/             # 团队成员
│   │   ├── projects-list/      # 项目列表
│   │   └── projects/[id]/      # 项目详情
│   ├── layout.tsx              # 根布局
│   └── globals.css             # 全局样式
├── components/
│   ├── ui/                     # shadcn/ui 组件
│   └── layout/                 # 布局组件 (header, sidebar, main-layout)
└── lib/
    ├── utils.ts                # 工具函数
    ├── db.ts                   # Prisma 客户端
    └── avatar-colors.ts        # 头像颜色配置
```

## 数据模型 (Prisma Schema)

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
- **优先级 (priority)**: `P0` / `P1` / `P2`
- **状态 (status)**: `待开始` / `进行中` / `已完成` / `有风险` / `已延期` / `暂停`
- 支持子任务链 (parentTaskId)
- 关联: milestone, parentTask, subTasks, assignees, changeLogs, deliverables

### TaskAssignee (任务负责人)
- 多对多关系: Task ↔ User

### TaskChangeLog (任务变更日志)
- 记录字段变更历史

### CalendarEvent (日历事件)
- 类型: `会议` / `拜访` / `评审` / `截止日`

### Communication (沟通记录)
- 类型: `电话` / `会议` / `邮件` / `微信`

## 页面功能

### Dashboard (仪表盘)
- 项目统计卡片 (总数/进行中/已完成/完成率)
- 风险预警提示
- 最近项目列表 (带进度条)

### Priority (优先级看板 - 四象限)
- **P0 - 重要且紧急**: 红色高亮
- **P1 - 重要不紧急**: 绿色
- **风险任务 (P2+有风险)**: 蓝色
- **普通任务 (P2)**: 灰色
- 支持添加新任务到指定象限

### Calendar (日历)
- 项目日历事件展示
- 支持事件类型筛选

### People (团队成员)
- 团队成员列表
- 角色展示

### Projects List (项目列表)
- 所有项目概览
- 状态/类型筛选

### Project Detail (项目详情)
- 项目信息
- 里程碑列表
- 任务看板 (Kanban)

## 代码风格与规范
1. **组件命名**: PascalCase (如 `TaskCard`, `QuadrantColumn`)
2. **工具函数**: camelCase (如 `fetchTasks`, `getPriorityBadge`)
3. **样式**: 使用 Tailwind CSS 原子类，优先使用 design token 变量
4. **类型**: 使用 TypeScript interface 定义数据模型
5. **状态管理**: 组件内 useState + useEffect 获取 API 数据

## Git 提交规范
- 每次完成里程碑开发后进行 Git 提交
- 提交信息格式: `【Web-Commit】简要说明本次修改内容`
- 提交目录: `../` (项目根目录的父目录)
