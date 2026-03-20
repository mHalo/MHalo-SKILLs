---
name: ddhd-feishu-skills
description: 飞书开放平台 SDK 封装技能，当需要获取飞书用户信息，查询考勤组、考勤统计、迟到记录，发票报销等场景时使用此SKILL。同时，这是一个自进化 SKILL，旨在通过组合飞书的基础接口能力快速构建业务场景，若当前已有能力不能满足业务场景时，可以参考SKILL.md中的自进化开发指南，完成相关能力的搭建与开发制作。
---



# DDHD 飞书 SKILL - 自进化开发指南

## 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│  业务场景 (scripts/)                                          │
│  ├── today-attendance.ts    # 今日考勤报告                    │
│  ├── media-manager.ts       # 素材管理                        │
│  └── contact-query.ts       # 通讯录查询                      │
│  └── [你的新场景].ts        # ← 在这里创建新业务              │
├─────────────────────────────────────────────────────────────┤
│  基础能力 (lib/)                                              │
│  ├── client.ts              # 飞书 SDK 客户端                 │
│  ├── contact.ts             # 通讯录 API                      │
│  ├── attendance.ts          # 考勤 API                        │
│  ├── drive.ts               # 云空间 API                      │
│  └── attendance-today.ts    # 当日考勤组合能力                │
│  └── [新能力].ts            # ← 自动或手动创建                │
├─────────────────────────────────────────────────────────────┤
│  能力索引 (lib/api-index.json)                                │
│  └── 记录所有可用的飞书 API 及其实现状态                      │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

### 1. 查看已有能力

```bash
# 查看基础能力清单
cat docs/capabilities.md

# 查看业务场景清单
cat docs/scenarios.md

# 查看 API 索引
cat lib/api-index.json
```

### 2. 使用现有场景

```bash
# 今日考勤报告
npx ts-node scripts/today-attendance.ts --late-only

# 素材上传
npx ts-node scripts/media-manager.ts upload -f ./img.png -t docx_image -n <token>

# 通讯录查询
npx ts-node scripts/contact-query.ts -i <user_id>
```

### 3. 开发新业务场景

复制模板创建新业务：

```bash
cp scripts/_template.ts scripts/my-new-scenario.ts
```

然后编辑 `scripts/my-new-scenario.ts`，根据业务需求调用 `lib/` 中的基础能力。

完成后：
1. 创建测试文件 `tests/my-new-scenario.test.ts`
2. 更新 `docs/scenarios.md`
3. 运行测试确保通过

## 临时验证脚本（重要规范 ⚠️）

**scripts/ 目录只存放最终可用的业务场景脚本，不放临时验证脚本！**

### 验证流程

当现有功能无法满足需求时，按以下流程处理：

```
1. 确认现有能力不支持 → 2. 创建临时验证脚本 → 3. 验证可行 → 4. 整合成正式脚本
```

### 具体步骤

**1. 确认现有能力**
- 检查 `docs/capabilities.md` 确认基础能力
- 检查 `docs/scenarios.md` 确认业务场景
- 如果都不满足，进入验证流程

**2. 创建临时验证脚本**

在 `temp/<guid>/` 目录下创建验证脚本：

```bash
mkdir temp/search-user-001
cat > temp/search-user-001/verify.ts << 'EOF'
#!/usr/bin/env ts-node
import { client } from '../../lib/client';

async function verify() {
  // 验证代码...
}
verify();
EOF
```

**命名规范：**
- 目录：`temp/<场景名>-<序号>/`
- 文件：`verify.ts` 或 `test-xxx.ts`

**3. 运行验证**

```bash
npx ts-node temp/search-user-001/verify.ts
```

**4. 验证成功后**

- ✅ 可行：将代码整理成正式业务场景，放入 `scripts/`
- ❌ 不可行：记录失败原因，删除或保留在 `temp/`

### 示例

```bash
# ❌ 错误做法：直接在 scripts/ 创建临时脚本
cat > scripts/find-user.ts  # 临时查找功能

# ✅ 正确做法：先在 temp/ 验证，可行后再放入 scripts/
mkdir temp/find-user-001
cat > temp/find-user-001/verify.ts  # 验证脚本
npx ts-node temp/find-user-001/verify.ts  # 验证运行
# 验证成功后...
cat > scripts/user-search.ts  # 正式业务场景
```

### 注意事项

- `temp/` 目录下的脚本**不需要测试文件**
- `temp/` 目录下的脚本**不需要更新文档**
- `temp/` 目录**不提交到 git**（已在 .gitignore 中）
- 验证成功后，`temp/` 中的脚本可以删除或保留作为参考

---

## 添加新基础能力

当需要使用未实现的 API 时：

1. **查看索引**: 检查 `lib/api-index.json` 确认 API 信息
2. **复制模板**: `cp lib/TEMPLATE.ts lib/[category].ts`
3. **实现能力**: 根据飞书文档实现 API 调用，使用 `lib/client.ts` 中的 `client`
4. **导出能力**: 在 `lib/index.ts` 中导出
5. **更新文档**: 更新 `docs/capabilities.md` 和 `lib/api-index.json`

## 新增模块说明

### 发票信息提取 (lib/invoice-extractor.ts)

智能发票识别模块，支持从 PDF 发票和图片中提取结构化信息。

**核心特性：**
- 优先使用大模型（LLM）分析，获取更准确的结构化数据
- 本地 PDF 提取作为备选方案（pdfplumber）
- 智能费用分类（差旅、办公用品、业务招待等）

**使用场景：**
- 智能报销助手中的发票自动识别
- 其他需要发票信息提取的业务场景

### 报销表管理 (lib/reimbursement-manager.ts)

报销业务核心模块，管理报销表生命周期和报销记录。

**核心特性：**
- 自动维护报销表历史记录（caches/reimbursement_bittable_history.json）
- 当月报销表不存在时自动创建
- 自动配置管理员和编辑者权限
- 支持报销记录的新增、查询、修改（不允许删除）

**使用场景：**
- 智能报销助手的核心依赖
- 员工自助报销业务流程

### 智能报销助手 (scripts/reimbursement-assistant.ts)

员工通过飞书 Agent 提交报销的完整解决方案。

**Agent 交互流程：**
```
1. 用户发送报销信息 + 发票/图片
2. Agent 调用 extract 提取发票信息（或使用 LLM）
3. Agent 向用户展示提取的信息，要求确认
4. 用户确认后，Agent 调用 add 添加报销记录
5. Agent 回复报销结果和表格链接
```

**文件位置：** `scripts/reimbursement-assistant.ts`

## 目录规范

| 目录 | 用途 | 规范 |
|------|------|------|
| `lib/` | 基础 API 能力 | 每个文件对应一类 API，纯函数，无 CLI 逻辑 |
| `scripts/` | 业务场景 | 组合 lib 能力，实现 CLI，命名清晰 |
| `tests/` | 测试 | 与 scripts 一一对应 |
| `docs/` | 文档 | capabilities.md, scenarios.md |
| `caches/` | 缓存 | 运行时生成，不提交 git |
| `references/` | 参考资料 | API 文档、示例代码等 |

## 关键原则

1. **单一职责**: `lib/` 只做 API 封装，`scripts/` 只做业务组合
2. **复用 client**: 所有 API 调用必须使用 `lib/client.ts` 中的 `client`
3. **类型完整**: 所有函数必须有完整的 TypeScript 类型定义
4. **文档同步**: 新增能力必须同步更新文档
5. **测试覆盖**: 新业务场景必须有对应的测试文件

## 参考链接

- [飞书开放平台文档](https://open.feishu.cn/document/home/index)
- [Node.js SDK GitHub](https://github.com/larksuite/node-sdk)
- [API 调试工具](https://open.feishu.cn/api-explorer)
