# 业务场景清单

本文档记录 `scripts/` 目录下的所有业务场景。

## 目录

- [今日考勤报告](#今日考勤报告)
- [素材管理](#素材管理)
- [通讯录查询](#通讯录查询)
- [通过 Open ID 获取用户](#通过-open-id-获取用户)
- [报销及发票管理](#报销及发票管理)
- [多维表格协作者管理](#多维表格协作者管理)

---

## 今日考勤报告

**文件**: `scripts/today-attendance.ts`

**功能**: 快速获取当日考勤概况，包括迟到人员统计和出勤率计算。

### 使用方法

```bash
# 显示完整报告
npx ts-node scripts/today-attendance.ts

# 只看迟到人员
npx ts-node scripts/today-attendance.ts --late-only

# 保存到文件
npx ts-node scripts/today-attendance.ts -o ./report.json

# 指定考勤组
npx ts-node scripts/today-attendance.ts -g <group_id>
```

### 使用的基础能力

- `lib/attendance.ts` - getTodayLateUsers, getAttendanceGroupMembers, getDefaultAttendanceGroupMembers

### 导出函数

本场景导出了以下函数，可供其他场景复用：

- `getTodayAttendanceInfo(groupId?, includeAllMembers?)` - 获取当日考勤信息
- `printAttendanceReport(info)` - 打印考勤报告  
- `TodayAttendanceInfo` - 考勤信息类型定义

---

## 素材管理

**文件**: `scripts/media-manager.ts`

**功能**: 上传文件到飞书云空间或下载素材到本地。

### 使用方法

```bash
# 上传素材
npx ts-node scripts/media-manager.ts upload -f ./image.png -t docx_image -n <token>

# 下载素材
npx ts-node scripts/media-manager.ts download -t <file_token> -o ./image.png

# 获取临时下载链接
npx ts-node scripts/media-manager.ts url --tokens <token1>,<token2>
```

### 使用的基础能力

- `lib/drive.ts` - uploadMedia, downloadMedia, batchGetMediaDownloadUrls

---

## 通讯录查询

**文件**: `scripts/contact-query.ts`

**功能**: 查询员工信息，支持单人和批量查询。

### 使用方法

```bash
# 查询单个用户
npx ts-node scripts/contact-query.ts -i <user_id>

# 批量查询
npx ts-node scripts/contact-query.ts --ids <id1>,<id2>,<id3>

# 使用 open_id
npx ts-node scripts/contact-query.ts -i <open_id> -t open_id
```

### 使用的基础能力

- `lib/contact.ts` - getUserInfo, batchGetUserInfo

---

## 通过 Open ID 获取用户

**文件**: `scripts/user-by-openid.ts`

**功能**: 使用用户的 open_id 获取详细信息，包括手机号、邮箱、部门等。

### 使用方法

```bash
# 查询单个用户
npx ts-node scripts/user-by-openid.ts -i <open_id>

# 保存到文件
npx ts-node scripts/user-by-openid.ts -i <open_id> -o ./user.json
```

### 使用的基础能力

- `lib/contact.ts` - getUserInfo

### 输出示例

```
==================================================
👤 用户信息
==================================================
姓名: 张三
英文名: San Zhang
手机号: 138****1234
邮箱: zhangsan@company.com
用户ID: ou_xxxxxxxxxxxxxxxx
部门: 技术部, 研发中心
职位: 高级工程师
状态: 已激活
==================================================
```

---

## 报销及发票管理

**文件**: `scripts/expense-reimbursement.ts`

**功能**: 创建飞书多维表格用于报销及发票管理，支持发票附件上传和报销记录添加。

### 使用方法

```bash
# 创建报销表格
npx ts-node scripts/expense-reimbursement.ts create
npx ts-node scripts/expense-reimbursement.ts create --month "2024年03月"

# 上传发票并添加报销记录
npx ts-node scripts/expense-reimbursement.ts upload-and-add \
  --app-token bascxxxxxxxx \
  --type "差旅" \
  --amount 1250.50 \
  --submitter "张三" \
  --purpose "北京出差" \
  --invoice-file ./invoice.pdf

# 添加报销记录（已上传发票）
npx ts-node scripts/expense-reimbursement.ts add \
  --app-token bascxxxxxxxx \
  --table-id tblxxxxxxxx \
  --type "办公用品" \
  --amount 156.00 \
  --submitter "李四" \
  --invoice-files "boxcnxxxxx,boxcnyyyyy"

# 查看表格信息
npx ts-node scripts/expense-reimbursement.ts info --app-token bascxxxxxxxx
```

### 表格字段

创建的表格包含以下 13 个字段：

| 序号 | 字段名 | 字段类型 | 说明 |
|------|--------|----------|------|
| 1 | 序号 | 自动编号 | 自增数字 |
| 2 | 费用类型 | 单选 | 差旅、办公用品、业务招待、交通费、餐补、项目垫付、其它 |
| 3 | 金额 | 货币 | CNY |
| 4 | 报销人 | 文本 | - |
| 5 | 提交日期 | 日期 | yyyy/MM/dd |
| 6 | 用途说明 | 文本 | - |
| 7 | 发票抬头 | 文本 | - |
| 8 | 发票附件 | 附件 | 支持发票文件上传 |
| 9 | 抬头是否正确 | 复选框 | - |
| 10 | 税号 | 文本 | - |
| 11 | 开票日期 | 日期 | yyyy/MM/dd |
| 12 | 抵扣说明 | 文本 | - |
| 13 | 提交状态 | 单选 | 待审核、审核中、已通过、已驳回 |

### 使用的基础能力

- `lib/bitable.ts` - createExpenseBitable, addExpenseRecord, listAppTables, listTableFields
- `lib/drive.ts` - uploadMedia（用于上传发票附件）

---

## 多维表格自定义角色协作者管理

**文件**: `scripts/collaborator-manager.ts`

**⚠️ 重要说明**: 本脚本用于管理【自定义角色】的协作者，不是管理整个多维表格的协作者。使用本脚本前，需要先在多维表格中创建自定义角色，获取 role_id。

**功能**: 管理多维表格自定义角色的协作者，支持添加、删除、批量操作和列表查询。

### 使用方法

```bash
# 列出所有自定义角色
npx ts-node scripts/collaborator-manager.ts roles --app-token bascxxxxxxxx

# 列出角色的所有协作者
npx ts-node scripts/collaborator-manager.ts list \
  --app-token bascxxxxxxxx \
  --role-id rol_xxxxxxxx

# 添加单个协作者
npx ts-node scripts/collaborator-manager.ts add \
  --app-token bascxxxxxxxx \
  --role-id rol_xxxxxxxx \
  --user-id ou_da073ce51bb1f01ca80226f92570c9d0

# 批量添加协作者（从JSON文件）
npx ts-node scripts/collaborator-manager.ts batch-add \
  --app-token bascxxxxxxxx \
  --role-id rol_xxxxxxxx \
  --file ./collaborators.json

# 删除协作者
npx ts-node scripts/collaborator-manager.ts remove \
  --app-token bascxxxxxxxx \
  --role-id rol_xxxxxxxx \
  --user-id ou_xxxxxxxx
```

### JSON文件格式

**collaborators.json**（批量添加）:
```json
[
  { "memberId": "ou_xxx", "memberType": "open_id" },
  { "memberId": "ou_yyy", "memberType": "open_id" }
]
```

### 成员类型

- `open_id` - 用户的 open_id（默认）
- `union_id` - 用户的 union_id
- `user_id` - 用户的 user_id
- `chat_id` - 群组 ID
- `department_id` - 部门 ID
- `open_department_id` - 部门的 open_department_id

### 使用的基础能力

- `lib/bitable-collaborator.ts` - listCollaborators, addCollaborator, batchAddCollaborators, removeCollaborator, batchRemoveCollaborators, addCollaboratorsToRole, listAppRoles

---

## 多维表格管理员角色设置

**文件**: `scripts/bitable-admin-role.ts`

**功能**: 为指定的多维表格创建管理员角色，并将指定用户添加为该角色的协作者。管理员拥有表格的完全管理权限（table_perm = 4）。

### 使用方法

```bash
# 添加单个用户为管理员（使用 open_id）
npx ts-node scripts/bitable-admin-role.ts \
  --app-token TXjubgZxOagBfOs0eMgctRPZnhf \
  --user-id ou_da073ce51bb1f01ca80226f92570c9d0

# 使用 union_id
npx ts-node scripts/bitable-admin-role.ts \
  --app-token TXjubgZxOagBfOs0eMgctRPZnhf \
  --user-id on_xxxxxxxx \
  --member-type union_id
```

### 使用的基础能力

- `lib/bitable-role.ts` - createAppRole
- `lib/bitable-collaborator.ts` - addCollaborator

---

## 多维表格编辑者角色设置

**文件**: `scripts/bitable-editor-role.ts`

**功能**: 为指定的多维表格创建编辑者角色，并将指定用户添加为该角色的协作者。编辑者拥有表格的编辑权限（table_perm = 2）。

### 使用方法

```bash
# 添加单个用户为编辑者（使用 open_id）
npx ts-node scripts/bitable-editor-role.ts \
  --app-token TXjubgZxOagBfOs0eMgctRPZnhf \
  --user-id ou_da073ce51bb1f01ca80226f92570c9d0

# 使用 union_id
npx ts-node scripts/bitable-editor-role.ts \
  --app-token TXjubgZxOagBfOs0eMgctRPZnhf \
  --user-id on_xxxxxxxx \
  --member-type union_id
```

### 使用的基础能力

- `lib/bitable-role.ts` - createAppRole
- `lib/bitable-collaborator.ts` - addCollaborator

---

## 智能报销助手

**文件**: `scripts/reimbursement-assistant.ts`

**功能**: 员工通过飞书 Agent 提交报销，支持发票/图片自动识别、智能费用分类、报销记录管理和修改。

### 核心特性

1. **智能发票识别**: 优先使用大模型（LLM）分析发票/图片，提取结构化信息
2. **自动建表**: 当月报销表不存在时自动创建多维表格
3. **权限管理**: 自动配置管理员和编辑者权限
4. **记录管理**: 支持新增、查询、修改报销记录（不允许删除）
5. **历史追踪**: 自动维护报销表历史记录

### Agent 使用指南

#### 1. 新增报销流程

```
用户发送: 报销打车费 50 元，发票见附件
Agent 处理:
  1. 调用 extract 命令检查是否需要 LLM
  2. 如需 LLM，调用 LLM 分析发票图片
  3. 合并用户输入和提取信息
  4. 调用 add 命令添加记录
  5. 向用户展示结果和表格链接
```

#### 2. 查询报销流程

```
用户发送: 查看我的报销
Agent 调用: npx ts-node scripts/reimbursement-assistant.ts list --user-id <id>
Agent 回复: 展示用户的报销记录列表
```

#### 3. 修改报销流程

```
用户发送: 把序号 202603-001 的报销金额改成 80 元
Agent 处理:
  1. 调用 get 命令获取记录详情
  2. 向用户展示当前记录，要求确认修改
  3. 用户确认后，调用 update 命令
  4. 回复修改结果
```

### 使用方法

#### 初始化权限配置
```bash
npx ts-node scripts/reimbursement-assistant.ts init \
  --manage-users ou_xxx,ou_yyy \
  --edit-users ou_zzz
```

#### 提取发票信息（供 LLM 使用）
```bash
npx ts-node scripts/reimbursement-assistant.ts extract --file ./invoice.pdf
```

#### 新增报销记录（直接提交数据）
```bash
npx ts-node scripts/reimbursement-assistant.ts add \
  --user-id ou_xxx \
  --files ./invoice.pdf \
  --data '{"expenseType":"差旅","invoiceAmount":100,"reimbursementAmount":100}'
```

#### 查询报销记录
```bash
npx ts-node scripts/reimbursement-assistant.ts list --user-id ou_xxx
```

#### 获取单条记录
```bash
npx ts-node scripts/reimbursement-assistant.ts get --record-id rec_xxx
```

#### 修改报销记录
```bash
npx ts-node scripts/reimbursement-assistant.ts update \
  --record-id rec_xxx \
  --data '{"reimbursementAmount":80}'
```

#### 获取报销表信息
```bash
npx ts-node scripts/reimbursement-assistant.ts info
```

### 数据结构

#### 历史记录文件 (caches/reimbursement_bittable_history.json)
```json
{
  "manage_user_ids": ["ou_xxx"],
  "edit_user_ids": ["ou_yyy"],
  "bittable": [
    {
      "date": "2026-03",
      "app_token": "OL0IbX5HraMbU2so0nCcBi51nlh",
      "link_href": "https://xxx.feishu.cn/base/xxx"
    }
  ]
}
```

#### 报销记录字段
| 字段 | 类型 | 说明 |
|------|------|------|
| 序号 | 文本 | 格式：yyyyMM-001 |
| 费用类型 | 单选 | 差旅/办公用品/业务招待/交通费/餐补/项目垫付/其它 |
| 发票金额 | 数字 | 发票上的原始金额 |
| 报销金额 | 数字 | 实际报销金额（可能小于发票金额） |
| 报销人 | 人员 | 飞书用户 |
| 用途说明 | 文本 | 费用说明 |
| 发票抬头 | 文本 | 购方名称 |
| 销方名称 | 文本 | 销售方名称 |
| 税号 | 文本 | 纳税人识别号 |
| 开票日期 | 日期 | 发票日期 |
| 报销提交时间 | 日期 | 系统生成 |
| 提交状态 | 单选 | 待审核/审核中/已通过/已驳回 |
| 发票附件 | 附件 | PDF/图片 |

### 使用的基础能力

- `lib/invoice-extractor.ts` - 发票信息提取
- `lib/reimbursement-manager.ts` - 报销表管理和记录操作
- `lib/bitable.ts` - 多维表格基础操作
- `lib/drive.ts` - 上传发票附件
- `lib/bitable-role.ts` - 角色权限管理
- `lib/bitable-collaborator.ts` - 协作者管理

---

## 创建新业务场景

1. 复制 `scripts/_template.ts` 创建新文件
2. 根据业务需求调用 `lib/` 中的基础能力
3. 实现 CLI 参数解析和输出
4. 创建对应的测试文件 `tests/[场景名].test.ts`
5. 更新本文档
