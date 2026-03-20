# 基础能力清单

本文档记录 `lib/` 目录下的所有基础 API 能力。

## 目录

- [client](#client) - 飞书客户端
- [contact](#contact) - 通讯录
- [attendance](#attendance) - 考勤
- [drive](#drive) - 云空间（素材）
- [bitable](#bitable) - 多维表格
- [bitable-collaborator](#bitable-collaborator) - 多维表格协作者管理

---

## client

**文件**: `lib/client.ts`

### 导出

| 名称 | 类型 | 说明 |
|------|------|------|
| `client` | `lark.Client` | 飞书 SDK 客户端实例 |
| `clientConfig` | `object` | 客户端配置（脱敏） |

### 使用说明

所有基础能力都应该从这个模块导入 `client`，不要创建新的实例。

```typescript
import { client } from '../lib/client';

const res = await client.contact.v3.user.get({...});
```

---

## contact

**文件**: `lib/contact.ts`

**飞书文档**: https://open.feishu.cn/document/server-docs/docs/contact-v3/user/overview

### 函数

#### getUserInfo
```typescript
function getUserInfo(
  userId: string,
  userIdType?: 'open_id' | 'union_id' | 'user_id'
): Promise<UserInfo | null>
```
获取单个用户信息。

#### batchGetUserInfo
```typescript
function batchGetUserInfo(
  userIds: string[],
  userIdType?: 'open_id' | 'union_id' | 'user_id'
): Promise<UserInfo[]>
```
批量获取用户信息（最多 50 个）。

#### batchGetUserInfoWithPaging
```typescript
function batchGetUserInfoWithPaging(
  userIds: string[],
  userIdType?: 'open_id' | 'union_id' | 'user_id'
): Promise<UserInfo[]>
```
批量获取用户信息（支持分页，超过 50 个自动分批）。

---

## attendance

**文件**: `lib/attendance.ts`

**飞书文档**: https://open.feishu.cn/document/server-docs/docs/attendance-v1/overview

### 函数

#### fetchAttendanceGroups
```typescript
function fetchAttendanceGroups(pageSize?: number): Promise<AttendanceGroup[]>
```
获取所有考勤组列表。

#### setDefaultAttendanceGroup
```typescript
function setDefaultAttendanceGroup(groupId: string): Promise<AttendanceGroup[]>
```
设置默认考勤组。

#### getAttendanceGroupDetail
```typescript
function getAttendanceGroupDetail(groupId: string): Promise<AttendanceGroup | null>
```
获取考勤组详情。

#### getAttendanceGroupMembers
```typescript
function getAttendanceGroupMembers(
  groupId: string,
  pageSize?: number
): Promise<AttendanceGroupMembersData>
```
获取考勤组成员列表。

#### getShiftDetail
```typescript
function getShiftDetail(shiftId: string): Promise<Shift | null>
```
获取班次详情。

#### queryAttendanceStats
```typescript
function queryAttendanceStats(
  startDate: string,  // yyyyMMdd
  endDate: string,    // yyyyMMdd
  userIds: string[]
): Promise<AttendanceStatsData>
```
查询考勤统计数据。

#### getTodayLateUsers
```typescript
function getTodayLateUsers(userIds?: string[]): Promise<TodayLateUser[]>
```
获取今日迟到人员列表。

#### getMonthlyAttendanceDetail
```typescript
function getMonthlyAttendanceDetail(userIds?: string[]): Promise<UserAttendanceDetail[]>
```
获取当月考勤明细。

---

## drive

**文件**: `lib/drive.ts`

**飞书文档**: https://open.feishu.cn/document/server-docs/docs/drive-v1/media/introduction

### 函数

#### uploadMedia
```typescript
function uploadMedia(
  filePath: string,
  parentType: MediaParentType,
  parentNode: string,
  options?: { fileName?: string; extra?: string; checksum?: string }
): Promise<UploadMediaResult>
```
上传素材到云空间（最大 20MB）。

**支持的 parentType**:
- `doc_image` / `docx_image` / `sheet_image` / `bitable_image` - 图片
- `doc_file` / `docx_file` / `sheet_file` / `bitable_file` - 文件
- `whiteboard` - 白板
- `vc_virtual_background` - 视频会议虚拟背景

#### downloadMedia
```typescript
function downloadMedia(
  fileToken: string,
  savePath: string,
  options?: { extra?: string; range?: string }
): Promise<DownloadMediaResult>
```
下载素材到本地。

#### batchGetMediaDownloadUrls
```typescript
function batchGetMediaDownloadUrls(
  fileTokens: string[],
  extra?: string
): Promise<MediaTmpDownloadUrl[]>
```
批量获取素材临时下载链接（24小时有效）。

---

## bitable

**文件**: `lib/bitable.ts`

**飞书文档**: https://open.feishu.cn/document/server-docs/docs/bitable-v1/overview

### 函数

#### createBitableApp
```typescript
function createBitableApp(
  name: string,
  folderToken?: string
): Promise<BitableAppInfo>
```
创建多维表格应用。

#### createAppTable
```typescript
function createAppTable(
  appToken: string,
  name: string,
  fields: FieldConfig[],
  defaultViewName?: string
): Promise<BitableTableInfo>
```
创建表格（支持直接定义字段）。

#### listAppTables
```typescript
function listAppTables(appToken: string): Promise<BitableTableInfo[]>
```
获取应用中的表格列表。

#### listTableFields
```typescript
function listTableFields(
  appToken: string,
  tableId: string
): Promise<FieldInfo[]>
```
获取表格字段列表。

#### createTableField
```typescript
function createTableField(
  appToken: string,
  tableId: string,
  field: FieldConfig
): Promise<FieldInfo>
```
创建字段。

#### listTableRecords
```typescript
function listTableRecords(
  appToken: string,
  tableId: string,
  pageSize?: number
): Promise<RecordInfo[]>
```
获取表格记录列表。

#### deleteTableRecord
```typescript
function deleteTableRecord(
  appToken: string,
  tableId: string,
  recordId: string
): Promise<void>
```
删除记录。

#### createExpenseBitable
```typescript
function createExpenseBitable(month?: string): Promise<ExpenseBitableResult>
```
一键创建报销统计表格（组合能力）。

包含以下字段：
- 序号（自动编号）
- 费用类型（单选：差旅、办公用品、业务招待、交通费、餐补、项目垫付、其它）
- 金额（货币）
- 报销人（文本）
- 提交日期（日期）
- 用途说明（文本）
- 发票抬头（文本）
- 发票附件（附件）
- 抬头是否正确（复选框）
- 税号（文本）
- 开票日期（日期）
- 抵扣说明（文本）
- 提交状态（单选：待审核、审核中、已通过、已驳回）

#### addExpenseRecord
```typescript
function addExpenseRecord(
  appToken: string,
  tableId: string,
  record: ExpenseRecord
): Promise<RecordInfo>
```
添加报销记录。

---

## bitable-collaborator

**文件**: `lib/bitable-collaborator.ts`

**⚠️ 重要说明**: SDK 中的 appRoleMember API 是用于管理【自定义角色】的协作者，不是管理整个多维表格的协作者。使用这些 API 需要先通过 appRole.create 创建自定义角色，获取 role_id。

**飞书文档**: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role-member

### 类型定义

```typescript
type CollaboratorMemberType =
  | 'open_id'
  | 'union_id'
  | 'user_id'
  | 'chat_id'
  | 'department_id'
  | 'open_department_id';

type CollaboratorInfo = {
  member_id: string;
  member_type: string;
  member_name?: string;
  member_en_name?: string;
};

type CollaboratorResult = {
  member_id: string;
  member_type: string;
  success: boolean;
  error?: string;
};
```

### 函数

#### listAppRoles
```typescript
function listAppRoles(
  appToken: string,
  pageSize?: number,
  pageToken?: string
): Promise<{
  items: any[];
  has_more: boolean;
  page_token?: string;
  total?: number;
}>
```
列出多维表格的所有自定义角色。

#### listCollaborators
```typescript
function listCollaborators(
  appToken: string,
  roleId: string,
  pageSize?: number,
  pageToken?: string
): Promise<{
  items: CollaboratorInfo[];
  has_more: boolean;
  page_token?: string;
  total?: number;
}>
```
获取自定义角色的协作者列表。

#### addCollaborator
```typescript
function addCollaborator(
  appToken: string,
  roleId: string,
  memberId: string,
  memberType: CollaboratorMemberType
): Promise<CollaboratorResult>
```
添加单个协作者到自定义角色。

#### batchAddCollaborators
```typescript
function batchAddCollaborators(
  appToken: string,
  roleId: string,
  members: {
    memberId: string;
    memberType: CollaboratorMemberType;
  }[]
): Promise<CollaboratorResult[]>
```
批量添加协作者到自定义角色。

#### addCollaboratorsToRole
```typescript
function addCollaboratorsToRole(
  appToken: string,
  roleId: string,
  members: {
    memberId: string;
    memberType: CollaboratorMemberType;
  }[]
): Promise<{
  success: CollaboratorResult[];
  failed: CollaboratorResult[];
}>
```
批量添加协作者到自定义角色（支持分批处理）。

#### removeCollaborator
```typescript
function removeCollaborator(
  appToken: string,
  roleId: string,
  memberId: string,
  memberType: CollaboratorMemberType
): Promise<boolean>
```
从自定义角色删除单个协作者。

#### batchRemoveCollaborators
```typescript
function batchRemoveCollaborators(
  appToken: string,
  roleId: string,
  members: { memberId: string; memberType: CollaboratorMemberType }[]
): Promise<CollaboratorResult[]>
```
从自定义角色批量删除协作者。

### 成员类型说明

| 类型 | 说明 |
|------|------|
| open_id | 用户的 open_id（默认） |
| union_id | 用户的 union_id |
| user_id | 用户的 user_id |
| chat_id | 群组 ID |
| department_id | 部门 ID |
| open_department_id | 部门的 open_department_id |

### 使用示例

```typescript
import { 
  listAppRoles,
  listCollaborators, 
  addCollaborator, 
  removeCollaborator,
  addCollaboratorsToRole 
} from '../lib/bitable-collaborator';

// 列出所有自定义角色
const roles = await listAppRoles('bascxxxxxxxx');

// 列出角色的所有协作者
const collaborators = await listCollaborators('bascxxxxxxxx', 'rol_xxxxxx');

// 添加单个协作者
await addCollaborator('bascxxxxxxxx', 'rol_xxxxxx', 'ou_xxx', 'open_id');

// 批量添加协作者
await addCollaboratorsToRole('bascxxxxxxxx', 'rol_xxxxxx', [
  { memberId: 'ou_xxx', memberType: 'open_id' },
  { memberId: 'ou_yyy', memberType: 'open_id' },
]);

// 删除协作者
await removeCollaborator('bascxxxxxxxx', 'rol_xxxxxx', 'ou_xxx', 'open_id');
```

---

## bitable-role

**文件**: `lib/bitable-role.ts`

**⚠️ 重要说明**: 用于管理多维表格的自定义角色（高级权限功能）。需要先开启多维表格的高级权限才能使用。

**飞书文档**: 
- 新增: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role/create
- 更新: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role/update
- 列表: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role/list
- 删除: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-role/delete

### 类型定义

```typescript
type TablePerm = 1 | 2 | 4;  // 1-可阅读, 2-可编辑, 4-可管理

interface TableRoleConfig {
  table_perm: TablePerm;
  table_name?: string;
  table_id?: string;
  allow_add_record?: boolean;
  allow_delete_record?: boolean;
}

interface RoleInfo {
  role_name: string;
  role_id?: string;
  table_roles: TableRoleConfig[];
}
```

### 函数

#### createAppRole
```typescript
function createAppRole(
  appToken: string,
  roleName: string,
  tableRoles: TableRoleConfig[]
): Promise<CreateRoleResult>
```
创建自定义角色。

#### updateAppRole
```typescript
function updateAppRole(
  appToken: string,
  roleId: string,
  roleName: string,
  tableRoles: TableRoleConfig[]
): Promise<boolean>
```
更新自定义角色。

#### listAppRolesV2
```typescript
function listAppRolesV2(
  appToken: string,
  pageSize?: number,
  pageToken?: string
): Promise<{
  items: RoleInfo[];
  has_more: boolean;
  page_token?: string;
  total?: number;
}>
```
列出自定义角色（使用 v2 API）。

#### deleteAppRole
```typescript
function deleteAppRole(
  appToken: string,
  roleId: string
): Promise<DeleteRoleResult>
```
删除自定义角色。

#### createAdminRole
```typescript
function createAdminRole(
  appToken: string,
  roleName?: string
): Promise<CreateRoleResult>
```
便捷方法：创建管理员角色（table_perm = 4）。

#### createEditorRole
```typescript
function createEditorRole(
  appToken: string,
  roleName?: string
): Promise<CreateRoleResult>
```
便捷方法：创建编辑者角色（table_perm = 2）。

#### getOrCreateRole
```typescript
function getOrCreateRole(
  appToken: string,
  roleName: string,
  tablePerm: TablePerm
): Promise<string | null>
```
获取或创建角色（如果存在则返回现有角色 ID）。

### 使用示例

```typescript
import { 
  createAppRole, 
  updateAppRole, 
  listAppRolesV2, 
  deleteAppRole,
  createAdminRole,
  createEditorRole
} from '../lib/bitable-role';

// 创建管理员角色
const adminResult = await createAdminRole('bascxxxxxxxx', '管理员');

// 创建编辑者角色
const editorResult = await createEditorRole('bascxxxxxxxx', '编辑者');

// 自定义角色配置
const result = await createAppRole('bascxxxxxxxx', '自定义角色', [
  { table_perm: 4, allow_add_record: true, allow_delete_record: true }
]);

// 列出所有角色
const roles = await listAppRolesV2('bascxxxxxxxx');

// 更新角色
await updateAppRole('bascxxxxxxxx', 'rol_xxx', '新名称', [
  { table_perm: 2 }
]);

// 删除角色
await deleteAppRole('bascxxxxxxxx', 'rol_xxx');
```

---

## invoice-extractor

**文件**: `lib/invoice-extractor.ts`

**功能**: 从 PDF 发票或图片中提取结构化信息，支持智能费用分类。

### 核心特性

- **优先大模型**: 优先使用大模型（LLM）分析发票/图片，获取更准确的结构化信息
- **本地备选**: 当大模型不可用时，使用本地 PDF 文本提取作为备选方案
- **智能分类**: 自动识别费用类型（差旅、办公用品、业务招待、交通费、餐补、项目垫付、其它）

### 函数

#### extractInvoiceInfo
```typescript
function extractInvoiceInfo(
  filePath: string,
  options?: { forceLocal?: boolean; fileType?: 'pdf' | 'image' }
): Promise<ExtractedInvoiceInfo>
```
提取发票/图片信息，智能选择提取方法（LLM 优先）。

#### parseLLMResult
```typescript
function parseLLMResult(llmResponse: string | object): ExtractedInvoiceInfo
```
解析 LLM 返回的结果，转换为结构化数据。

#### mergeReimbursementInfo
```typescript
function mergeReimbursementInfo(
  userInput: Partial<ReimbursementInfo>,
  extracted: ExtractedInvoiceInfo,
  submitterUserId: string
): ReimbursementInfo
```
合并用户输入和提取信息，用户输入优先。

#### validateReimbursementInfo
```typescript
function validateReimbursementInfo(
  info: ReimbursementInfo
): { valid: boolean; missingFields: string[] }
```
验证报销信息完整性。

#### formatReimbursementInfo
```typescript
function formatReimbursementInfo(info: ReimbursementInfo): string
```
格式化报销信息用于显示。

### 提取字段

| 字段 | 说明 |
|------|------|
| invoiceNo | 发票号码 |
| invoiceDate | 开票日期（yyyy-MM-dd） |
| amount | 发票金额（含税总价） |
| invoiceTitle | 发票抬头（购方名称） |
| taxNumber | 税号 |
| sellerName | 销方名称（销售方） |
| expenseType | 费用类型（智能分类） |
| purpose | 用途说明 |

---

## reimbursement-manager

**文件**: `lib/reimbursement-manager.ts`

**功能**: 报销表生命周期管理和报销记录操作。

### 核心特性

- **历史管理**: 自动维护 `caches/reimbursement_bittable_history.json`
- **自动建表**: 当月报销表不存在时自动创建
- **权限设置**: 自动配置管理员和编辑者权限
- **记录管理**: 支持新增、查询、修改报销记录

### 数据结构

```typescript
// 历史记录结构
{
  manage_user_ids: [''],  // 管理员 User ID 列表
  edit_user_ids: [''],    // 编辑者 User ID 列表
  bittable: [
    { date: '2026-03', app_token: '', link_href: '' }
  ]
}
```

### 函数

#### getOrCreateMonthBitable
```typescript
function getOrCreateMonthBitable(options?: {
  month?: string;
  manageUsers?: string[];
  editUsers?: string[];
}): Promise<CurrentMonthBitable>
```
获取或创建当月报销表。

#### addReimbursementRecord
```typescript
function addReimbursementRecord(
  info: ReimbursementInfo,
  appToken?: string,
  tableId?: string
): Promise<{ success: boolean; record_id?: string; serial_no?: string; error?: string }>
```
添加报销记录，自动生成序号（格式：yyyyMM-001）。

#### queryUserReimbursementRecords
```typescript
function queryUserReimbursementRecords(
  userId: string,
  options?: { month?: string; limit?: number }
): Promise<ReimbursementRecord[]>
```
查询用户的报销记录列表。

#### getReimbursementRecord
```typescript
function getReimbursementRecord(
  recordId: string,
  appToken?: string,
  tableId?: string
): Promise<ReimbursementRecord | null>
```
获取单条报销记录详情。

#### updateReimbursementRecord
```typescript
function updateReimbursementRecord(
  recordId: string,
  updates: Partial<ReimbursementInfo>,
  appToken?: string,
  tableId?: string
): Promise<ModifyResult>
```
修改报销记录（不允许删除）。

#### updatePermissionConfig
```typescript
function updatePermissionConfig(
  manageUsers: string[],
  editUsers: string[]
): void
```
更新权限配置。

#### getBitableStats
```typescript
function getBitableStats(month?: string): Promise<{
  total_records: number;
  total_amount: number;
  pending_count: number;
  approved_count: number;
}>
```
获取报销表统计信息。

---

## 添加新能力

当需要新的基础能力时：

1. 查看 `lib/api-index.json` 确认 API 信息
2. 复制 `lib/TEMPLATE.ts` 创建新文件
3. 根据飞书文档实现 API 调用
4. 在 `lib/index.ts` 中导出
5. 更新本文档
