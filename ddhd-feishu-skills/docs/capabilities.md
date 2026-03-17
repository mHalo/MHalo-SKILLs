# 基础能力清单

本文档记录 `lib/` 目录下的所有基础 API 能力。

## 目录

- [client](#client) - 飞书客户端
- [contact](#contact) - 通讯录
- [attendance](#attendance) - 考勤
- [drive](#drive) - 云空间（素材）

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

## 添加新能力

当需要新的基础能力时：

1. 查看 `lib/api-index.json` 确认 API 信息
2. 复制 `lib/TEMPLATE.ts` 创建新文件
3. 根据飞书文档实现 API 调用
4. 在 `lib/index.ts` 中导出
5. 更新本文档
