# DDHD 项目看板

一个面向营销项目的全生命周期协作看板系统，支持多项目实时进展跟踪、里程碑和子任务管理、以及 Agent API 集成。

## 功能特性

- 📊 **项目总览** - Dashboard 展示所有项目及统计信息
- 📁 **项目管理** - 创建、编辑、删除项目
- 🎯 **里程碑管理** - 按阶段划分项目，跟踪整体进度
- ✅ **任务管理** - 支持任务树（子任务链），变更日志审计
- 📅 **日历视图** - 管理拜访、会议、截止日等时间节点
- 💬 **沟通记录** - 归档电话、会议纪要，提取待办事项
- 🔌 **Agent API** - 完整的 RESTful API，供 OpenClaw Agent 调用

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS + shadcn/ui
- **数据库**: SQLite + Prisma ORM
- **部署**: Node.js + PM2 (推荐)

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
cd project-board
npm install
```

### 数据库初始化

```bash
# 已包含在项目中，如需重置：
npx prisma migrate reset
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm start
```

## 部署

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 日志
pm2 logs project-board
```

### 使用 Docker（可选）

```bash
# 构建镜像
docker build -t project-board .

# 运行容器
docker run -d -p 3000:3000 --name project-board project-board
```

## API 文档

### 核心端点

```
GET    /api/projects              # 项目列表
POST   /api/projects              # 创建项目
GET    /api/projects/[id]         # 项目详情

GET    /api/projects/[id]/milestones      # 里程碑列表
POST   /api/projects/[id]/milestones      # 创建里程碑

GET    /api/milestones/[id]/tasks         # 任务树
POST   /api/milestones/[id]/tasks         # 创建任务

PUT    /api/tasks/[id]/status            # 更新任务状态
POST   /api/tasks/[id]/subtask           # 创建子任务

GET    /api/snapshot/project/[id]        # 项目完整快照（Agent首选）
GET    /api/snapshot/dashboard           # 仪表盘数据
```

完整 API 文档见 [docs/SKILL.md](./docs/SKILL.md)

## Agent 集成

本项目为 OpenClaw Agent 提供完整的 API 支持，Agent 可以：

- 查询项目状态和进度
- 创建和更新任务
- 记录沟通会议纪要
- 管理里程碑和日历事件

详见 [Agent 技能文档](./docs/SKILL.md)

## 项目结构

```
project-board/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # REST API 路由
│   │   ├── projects/       # 项目相关页面
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # Dashboard 首页
│   ├── components/
│   │   └── ui/             # shadcn/ui 组件
│   └── lib/
│       └── db.ts           # Prisma 客户端
├── prisma/
│   └── schema.prisma       # 数据库模型
├── docs/
│   └── SKILL.md            # Agent 技能文档
└── public/                 # 静态资源
```

## 数据模型

```
Project (项目)
├── Milestone (里程碑)
│   └── Task (任务)
│       └── SubTask (子任务)
├── CalendarEvent (日历事件)
└── Communication (沟通记录)
```

## 开发里程碑

| 里程碑 | 内容 | 状态 |
|--------|------|------|
| M1 | 项目初始化与数据库设计 | ✅ |
| M2 | 核心 RESTful API 实现 | ✅ |
| M3 | 前端核心页面实现 | ✅ |
| M4 | Agent 技能文档 | ✅ |
| M5 | 测试优化与部署 | ✅ |

## License

MIT
