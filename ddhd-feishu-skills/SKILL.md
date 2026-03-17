# DDHD 飞书 SKILL - 自进化开发指南

这是一个**自进化 SKILL**，旨在通过组合基础能力快速构建业务场景。

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

## 目录规范

| 目录 | 用途 | 规范 |
|------|------|------|
| `lib/` | 基础 API 能力 | 每个文件对应一类 API，纯函数，无 CLI 逻辑 |
| `scripts/` | 业务场景 | 组合 lib 能力，实现 CLI，命名清晰 |
| `tests/` | 测试 | 与 scripts 一一对应 |
| `docs/` | 文档 | capabilities.md, scenarios.md |
| `caches/` | 缓存 | 运行时生成，不提交 git |

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
