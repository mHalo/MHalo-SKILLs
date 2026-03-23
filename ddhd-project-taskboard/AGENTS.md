# AGENTS.md - 项目看板开发文档

**项目**: DDHD项目管理系统 - 项目看板  
**创建日期**: 2026-03-23  
**最后更新**: 2026-03-23  
**状态**: 🟢 需求确认完成，开发启动

---

## 1. 项目背景与目标

### 1.1 背景
- 已有一套完整的项目管理SOP体系（project-management-sop/）
- 多Agent协作模式：总指挥虾 + 策划虾/创作虾/技术虾/运营虾
- **项目类型**：以营销、内容制作、线上线下活动为主，开发类为辅

### 1.2 核心使用场景（已明确）

**事件营销项目典型流程：**
```
1. 前期沟通 → 电话录音
2. Agent拆解 → 生成待办清单：
   - 反馈方案（文案/平面/3D）
   - 技术可行性研判
   - 风格参考搜集
   - 下次沟通日期（拜访节点）
3. 每个待办作为一个【任务/子任务】
4. 任务频繁更新日期（需记录变更原因）
5. Agent每次介入 → 调用API获取项目完整状态
```

### 1.3 目标
开发一个**面向营销项目的全生命周期协作看板**：
1. ✅ 支持项目→里程碑→任务→子任务链 四级结构
2. ✅ 任务日期变更完整审计日志
3. ✅ 项目日历（独立管理时间节点）
4. ✅ 沟通记录与任务联动
5. ✅ 完整的RESTful API（Agent获取完整项目快照）

---

## 2. 技术方案与技能支持

### 2.0 已安装的Agent Skills

| 技能名称 | 来源 | 用途 |
|----------|------|------|
| **frontend-ui-ux-engineer** | 404kidwiz/claude-supercode-skills | 专业UI设计、微交互、动画、可访问性 |
| **nextjs-app-router-patterns** | wshobson/agents | Next.js App Router架构、Server Components、API Routes |
| **prisma-database-setup** | prisma/skills (官方) | Prisma ORM配置、SQLite设置 |
| **webapp-testing** | anthropics/skills (官方) | 前端测试策略 |
| **shadcn** | kimi-cli内置 | shadcn/ui组件管理 |

### 2.1 核心技术栈

### 2.1 核心技术栈
| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | React全栈框架 |
| 语言 | TypeScript | 类型安全 |
| 样式 | TailwindCSS + shadcn/ui | 现代化UI |
| 数据库 | SQLite + Prisma | 轻量级ORM |
| API | RESTful (Next.js API Routes) | 供Agent调用 |
| 状态 | React Query / SWR | 数据获取 |

### 2.2 项目结构
```
project-board/
├── app/
│   ├── (dashboard)/          # 仪表盘布局
│   ├── api/                  # REST API
│   │   ├── projects/
│   │   ├── milestones/
│   │   ├── tasks/
│   │   ├── calendar/         # 项目日历事件
│   │   ├── communications/   # 沟通记录
│   │   └── snapshot/         # 项目完整快照
│   ├── projects/[id]/        # 项目详情页
│   └── calendar/             # 日历视图
├── components/
│   ├── ui/                   # shadcn/ui组件
│   ├── board/                # 看板组件
│   ├── project/              # 项目组件
│   ├── task/                 # 任务组件
│   └── calendar/             # 日历组件
├── lib/
│   ├── db/                   # Prisma client
│   └── api/                  # API utilities
├── prisma/
│   └── schema.prisma         # 数据库模型
├── docs/
│   └── SKILL.md              # Agent技能文档
└── public/
```

---

## 3. 数据库模型设计

### 3.1 核心实体关系
```
Project (项目)
├── id, name, description
├── type (营销/活动/开发/内容制作)
├── status (进行中/已完成/暂停)
├── client (客户名称)
├── startDate, endDate
├── createdAt, updatedAt
├── milestones[]              # 里程碑
├── calendarEvents[]          # 日历事件（拜访/会议节点）
└── communications[]          # 沟通记录

Milestone (里程碑)
├── id, projectId
├── name, description
├── deadline                  # 里程碑截止日期（可调整）
├── status (待开始/进行中/已完成)
├── order                     # 排序
└── tasks[]                   # 任务

Task (任务/子任务)
├── id, milestoneId
├── parentTaskId?             # 父任务ID（支持子任务链）
├── title, description
├── assigneeRole              # 指派角色（策划虾/创作虾等）
├── assigneeName              # 具体执行人
├── deliverableType           # 输出物类型标签（自由填写）
├── status (待开始/进行中/已完成/有风险/已延期/暂停)
├── priority (P0/P1/P2)
├── plannedDate               # 计划日期
├── actualDate?               # 实际完成日期
├── changeLogs[]              # 日期变更日志
└── nextTaskId?               # 链式：修改第一轮→修改第二轮

TaskChangeLog (任务变更日志)
├── id, taskId
├── field (日期/负责人/状态)
├── oldValue, newValue
├── reason                    # 变更原因（必填）
├── changedBy                 # 操作人
└── changedAt

CalendarEvent (日历事件)
├── id, projectId
├── title (如"客户拜访""方案汇报")
├── eventType (会议/拜访/评审/截止日)
├── eventDate
├── duration                  # 持续时间（分钟）
├── attendees                 # 参与人
├── reminder?                 # 提前提醒
└── relatedTaskId?            # 关联任务（可选）

Communication (沟通记录)
├── id, projectId
├── type (电话/会议/邮件/微信)
├── date
├── participants              # 参与人员
├── summary                   # 内容摘要
├── recordingPath?            # 录音/附件路径
└── actionItems[]             # 触发的待办事项
```

### 3.2 状态流转
```
Task 状态:
⏳ 待开始 → 🎨 进行中 → ✅ 已完成
              ↓
         ⚠️ 有风险 / ⏸️ 暂停 / ❌ 已延期

Milestone 状态:
⏳ 待开始 → 🎨 进行中 → ✅ 已完成

子任务链示例:
方案设计(v1) → 客户反馈 → 方案修改(v2) → 客户确认 → 方案定稿
```

---

## 4. RESTful API 设计

### 4.1 核心API

```bash
# ===== 项目 API =====
GET    /api/projects                    # 项目列表（支持筛选）
POST   /api/projects                    # 创建项目
GET    /api/projects/[id]               # 项目详情（含里程碑、日历事件）
PUT    /api/projects/[id]               # 更新项目
DELETE /api/projects/[id]               # 删除项目

# ===== 里程碑 API =====
GET    /api/projects/[id]/milestones
POST   /api/projects/[id]/milestones
PUT    /api/milestones/[id]
DELETE /api/milestones/[id]

# ===== 任务 API =====
GET    /api/milestones/[id]/tasks       # 里程碑下的任务树
POST   /api/milestones/[id]/tasks       # 创建任务
POST   /api/tasks/[id]/subtask          # 创建子任务/后续任务
GET    /api/tasks/[id]                  # 任务详情（含变更日志）
PUT    /api/tasks/[id]                  # 更新任务
DELETE /api/tasks/[id]

# 任务状态快捷更新
PUT    /api/tasks/[id]/status           # 仅更新状态
PUT    /api/tasks/[id]/date             # 更新日期（需传reason）
PUT    /api/tasks/[id]/assign           # 更新负责人

# 变更日志
GET    /api/tasks/[id]/logs             # 获取变更历史

# ===== 日历事件 API =====
GET    /api/projects/[id]/calendar      # 项目日历事件
POST   /api/projects/[id]/calendar
PUT    /api/calendar/[id]
DELETE /api/calendar/[id]

GET    /api/calendar                    # 全局日历视图（所有项目）

# ===== 沟通记录 API =====
GET    /api/projects/[id]/communications
POST   /api/projects/[id]/communications
POST   /api/communications/[id]/extract # 从录音提取待办

# ===== Agent专用 API =====
GET    /api/snapshot/project/[id]       # 项目完整快照（Agent首选）
GET    /api/snapshot/dashboard          # 仪表盘数据（所有项目概览）
GET    /api/snapshot/assignee/[name]    # 某人的所有待办
```

### 4.2 项目快照 API 响应示例

```json
{
  "project": {
    "id": "proj_001",
    "name": "XX品牌春季发布会",
    "status": "进行中",
    "client": "XX科技",
    "milestones": [
      {
        "id": "ms_001",
        "name": "前期沟通与方案",
        "deadline": "2026-04-01",
        "tasks": [
          {
            "id": "task_001",
            "title": "主视觉设计",
            "assigneeRole": "创作虾",
            "assigneeName": "小A",
            "status": "进行中",
            "plannedDate": "2026-03-25",
            "changeLogs": [
              {
                "field": "日期",
                "oldValue": "2026-03-20",
                "newValue": "2026-03-25",
                "reason": "客户要求增加3D元素，需延长设计时间"
              }
            ]
          }
        ]
      }
    ],
    "upcomingEvents": [
      {
        "title": "方案汇报",
        "date": "2026-03-28T14:00:00"
      }
    ],
    "recentCommunications": [
      {
        "type": "电话",
        "summary": "客户确认主色调使用品牌蓝"
      }
    ]
  }
}
```

---

## 5. 功能模块规划

### 5.1 P0 - 核心功能（初版）

| 模块 | 功能 | 说明 |
|------|------|------|
| **Dashboard** | 项目卡片总览 | 客户/状态/进度筛选 |
| **项目管理** | 项目CRUD | 类型、客户、起止时间 |
| **里程碑** | 里程碑管理 | 截止日期、进度条 |
| **任务看板** | Kanban视图 | 拖拽状态变更 |
| **任务管理** | 任务CRUD | 子任务链、日期变更记录原因 |
| **日历视图** | 项目日历 | 拜访/会议节点 |
| **沟通记录** | 记录管理 | 关联任务、提取待办 |
| **REST API** | 完整API | Agent项目快照接口 |

### 5.2 P1 - 重要功能（第二版）

| 模块 | 功能 |
|------|------|
| **人员视图** | 按执行人筛选任务，工作负载统计 |
| **甘特图** | 里程碑时间线可视化 |
| **变更审计** | 完整的日期/负责人变更历史 |
| **提醒通知** | 临近日期提醒 |

---

## 6. 开发里程碑

### M1 - 项目初始化与数据库（1天）
- [ ] Next.js 15 + TypeScript 项目初始化
- [ ] TailwindCSS + shadcn/ui 配置
- [ ] Prisma + SQLite 配置
- [ ] 数据库 Schema 设计（Project/Milestone/Task/CalendarEvent/Communication/TaskChangeLog）
- [ ] 基础布局组件

**Git提交**: 【Web-Commit】M1: 项目初始化与数据库设计

### M2 - 核心API开发（1天）
- [ ] Project CRUD API
- [ ] Milestone CRUD API
- [ ] Task CRUD API（含子任务链）
- [ ] Task变更日志API
- [ ] CalendarEvent API
- [ ] Communication API
- [ ] `/api/snapshot/project/[id]` Agent快照接口

**Git提交**: 【Web-Commit】M2: 核心RESTful API实现

### M3 - 前端页面开发（2天）
- [ ] Dashboard 项目总览页
- [ ] 项目详情页（里程碑+任务树）
- [ ] 任务看板页（Kanban拖拽）
- [ ] 日历视图页
- [ ] 任务创建/编辑弹窗（含日期变更原因输入）
- [ ] 沟通记录页面

**Git提交**: 【Web-Commit】M3: 前端核心页面实现

### M4 - Agent技能文档（0.5天）
- [ ] `docs/SKILL.md` 编写
- [ ] API调用示例
- [ ] 营销项目使用场景示例
- [ ] 项目快照接口说明

**Git提交**: 【Web-Commit】M4: Agent技能文档

### M5 - 测试与部署（0.5天）
- [ ] API测试
- [ ] UI优化
- [ ] 部署脚本

**Git提交**: 【Web-Commit】M5: 测试优化与部署

**总工期**: 5天

---

## 7. 关键设计决策总结

| 问题 | 决策 |
|------|------|
| **项目类型** | 以营销、活动、内容为主，支持开发类 |
| **任务层级** | 项目 → 里程碑 → 任务 → 子任务链（支持修改v1/v2/v3） |
| **任务分配** | 角色（策划虾/创作虾）+ 具体执行人双轨制 |
| **日期变更** | 完整变更日志，必须填写原因 |
| **时间节点** | 独立CalendarEvent（拜访/会议/截止日） |
| **沟通记录** | 项目级记录，可提取为待办任务 |
| **Agent状态** | 完整项目快照API，一次获取所有信息 |
| **输出物类型** | 自由标签（3D渲染/文案/方案/会议纪要等） |

---

## 8. 风险与注意事项

1. **SQLite并发**: 多Agent同时写入需控制，初期使用简单队列
2. **变更日志体积**: 任务频繁变更可能产生大量日志，需定期归档
3. **子任务链深度**: 限制任务链深度（建议最大5层），避免过度嵌套
4. **日期计算**: 里程碑deadline变更时，检查关联任务日期合理性

---

**🦐 指挥官提示**: 本AGENTS.md已完整记录面向营销项目的看板设计，可作为开发和迭代的基准。需求已冻结，准备进入开发阶段。
