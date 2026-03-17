---
name: ddhd-feishu-skills
description: 飞书开放平台 SDK 封装技能，提供通讯录用户管理、考勤管理和云空间素材管理功能。当需要获取飞书用户信息、查询考勤组、获取考勤统计、查询迟到记录、上传下载云空间素材等场景时使用此skill。
---

# 飞书开发 Skill

## 概述

基于 `@larksuiteoapi/node-sdk` 封装的飞书开发技能，提供以下核心功能：
- **通讯录管理**：获取用户信息（支持单用户和批量获取）
- **考勤管理**：考勤组查询、班次管理、考勤统计、迟到查询
- **素材管理**：上传素材到云空间、下载素材、获取临时下载链接

## 使用场景

- **获取员工信息**：根据用户 ID 获取姓名、头像、部门等信息
- **考勤组管理**：查询考勤组列表、获取考勤组详情、设置默认考勤组
- **班次查询**：获取班次详细信息（上下班时间、打卡规则等）
- **考勤统计**：查询月度考勤统计、缺勤情况、实际出勤时长
- **迟到查询**：查询当日迟到人员、当月迟到记录明细
- **考勤明细**：获取包含请假、迟到等详细信息的考勤报表
- **素材上传**：上传图片、文件等素材到云空间（最大20MB）
- **素材下载**：下载云空间素材到本地
- **临时链接**：批量获取素材的24小时临时下载链接

## 环境配置

### 1. 配置 .env 文件

在项目根目录创建 `.env` 文件，填写飞书应用凭证：

```env
# 飞书应用配置（从飞书开放平台获取）
FEISHU_APP_ID=cli_xxxxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 可选：平台域名（默认国内版）
FEISHU_DOMAIN=https://open.feishu.cn
```

**获取凭证步骤**：
1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 创建「企业自建应用」
3. 进入「凭证与基础信息」页面
4. 复制 `App ID` 和 `App Secret`
5. 在「权限管理」中开通所需 API 权限

**权限配置**：

| 功能模块 | 所需权限 |
|---------|---------|
| 通讯录管理 | `contact:user.base:readonly`、`contact:user.department:readonly` |
| 考勤管理 | `attendance:attendance:readonly`、`attendance:group:readonly`、`attendance:shift:readonly` |
| **素材管理** | `drive:media:upload`、`drive:media:download`、`drive:drive` |
| 云文档 | `docs:document` 或 `sheets:spreadsheet` 或 `bitable:app`（根据使用场景） |

**注意**：开通权限后需要发布应用版本才能生效。

### 2. 安装依赖

```bash
pnpm install
```

## 目录结构

```
ddhd-feishu-skills/
├── .env                           # 环境变量配置文件
├── package.json                   # 项目依赖配置
├── SKILL.md                       # 本文件：技能使用文档
├── scripts/                       # 核心功能脚本目录（TS源码）
│   ├── index.ts                  # 统一导出入口
│   ├── feishu-client.ts          # 飞书 SDK 客户端初始化
│   ├── feishu-contact.ts         # 通讯录用户管理模块
│   ├── feishu-attendance.ts      # 考勤管理模块
│   ├── feishu-attendance-today.ts # 当日考勤快捷查询
│   └── feishu-media.ts           # 云空间素材管理模块
├── cli/                           # CLI 业务场景脚本目录
│   ├── today-attendance.ts       # 今日考勤报告 CLI
│   ├── media-manager.ts          # 素材管理 CLI
│   └── contact-query.ts          # 通讯录查询 CLI
├── generate-scripts/              # 生成/增强 SKILL 的脚本目录
├── tests/                         # 测试文件目录
├── caches/                        # 缓存文件目录
└── references/                    # 参考资料目录
```

## 使用方法

### 方式1：作为模块导入使用

```typescript
// 统一导入所有功能
import { getUserInfo, uploadMedia, fetchAttendanceGroups } from '@ddhd/feishu-skills';

// 按需导入子模块
import { getUserInfo } from '@ddhd/feishu-skills/contact';
import { uploadMedia } from '@ddhd/feishu-skills/media';
import { fetchAttendanceGroups } from '@ddhd/feishu-skills/attendance';
```

### 方式2：命令行直接调用（CLI）

**今日考勤报告**：
```bash
# 获取今日考勤概况
npx ts-node cli/today-attendance.ts

# 只看迟到人员
npx ts-node cli/today-attendance.ts --late-only

# 保存到文件
npx ts-node cli/today-attendance.ts -o ./today-attendance.json
```

**素材管理**：
```bash
# 上传素材
npx ts-node cli/media-manager.ts upload -f ./image.png -t docx_image -n <token>

# 下载素材
npx ts-node cli/media-manager.ts download -t <file_token> -o ./image.png

# 获取临时下载链接
npx ts-node cli/media-manager.ts url --tokens <token1>,<token2>
```

**通讯录查询**：
```bash
# 查询单个用户
npx ts-node cli/contact-query.ts -i <user_id>

# 批量查询
npx ts-node cli/contact-query.ts --ids <id1>,<id2>
```

## 扩展 SKILL

如需生成代码文件以增强本 SKILL，请遵循以下规范：

1. **存放位置**：所有生成的代码文件必须放在 `generate-scripts/` 文件夹中
2. **CLI 规范**：生成的代码需要符合 CLI 调用方式，即可以直接通过 `npx ts-node generate-scripts/xxx.ts` 执行
3. **业务场景**：CLI 脚本应当针对具体的业务场景，而不是简单的功能封装
4. **代码风格**：遵循现有代码风格，使用 TypeScript，包含完整的类型定义和 JSDoc 注释

示例：
```typescript
// generate-scripts/my-custom-script.ts
#!/usr/bin/env ts-node
import { getUserInfo } from '../scripts/feishu-contact';

async function main() {
  // 业务逻辑
}

main();
```

## 核心功能

### 一、通讯录管理 (`feishu-contact.ts`)

#### 1. 获取单个用户信息

```typescript
import { getUserInfo } from '@ddhd/feishu-skills/contact';

const user = await getUserInfo('user_id_xxx', 'user_id');
if (user) {
  console.log('姓名:', user.name);
  console.log('头像:', user.avatar?.avatar_72);
}
```

#### 2. 批量获取用户信息

```typescript
import { batchGetUserInfo } from '@ddhd/feishu-skills/contact';

const users = await batchGetUserInfo(['user_xxx', 'user_yyy'], 'user_id');
users.forEach(user => {
  console.log(`${user.name}: ${user.email}`);
});
```

### 二、考勤组管理 (`feishu-attendance.ts`)

#### 1. 获取所有考勤组

```typescript
import { fetchAttendanceGroups } from '@ddhd/feishu-skills/attendance';

const groups = await fetchAttendanceGroups();
console.log(`共 ${groups.length} 个考勤组`);
```

#### 2. 设置默认考勤组

```typescript
import { setDefaultAttendanceGroup } from '@ddhd/feishu-skills/attendance';

await setDefaultAttendanceGroup('7414010894549975043');
```

#### 3. 获取考勤组成员

```typescript
import { getAttendanceGroupMembers } from '@ddhd/feishu-skills/attendance';

const members = await getAttendanceGroupMembers('7414010894549975043');
members.members.forEach(m => {
  console.log(`${m.userInfo?.name}: ${m.userInfo?.avatar?.avatar_72}`);
});
```

### 三、班次管理 (`feishu-attendance.ts`)

#### 1. 获取班次详情

```typescript
import { getShiftDetail } from '@ddhd/feishu-skills/attendance';

const shift = await getShiftDetail('8');
console.log('班次名称:', shift?.shift_name);
console.log('上班时间:', shift?.punch_time_rule[0]?.on_time);
console.log('下班时间:', shift?.punch_time_rule[0]?.off_time);
```

#### 2. 读取默认考勤组班次缓存

```typescript
import { readDefaultGroupShifts } from '@ddhd/feishu-skills/attendance';

const shiftsData = await readDefaultGroupShifts();
shiftsData?.shifts.forEach(shift => {
  console.log(`${shift.shift_name}: ${shift.punch_time_rule[0]?.on_time}-${shift.punch_time_rule[0]?.off_time}`);
});
```

### 四、考勤统计与查询 (`feishu-attendance.ts`)

#### 1. 查询考勤统计数据

```typescript
import { queryAttendanceStats } from '@ddhd/feishu-skills/attendance';

const stats = await queryAttendanceStats('20250301', '20250331', ['user_xxx']);
stats.user_datas?.forEach(user => {
  console.log('姓名:', user.name);
  user.datas?.forEach(item => {
    console.log(`${item.title}: ${item.value}`);
  });
});
```

#### 2. 获取当日迟到人员

```typescript
import { getTodayLateUsers } from '@ddhd/feishu-skills/attendance';

const lateUsers = await getTodayLateUsers();
lateUsers.forEach(user => {
  console.log(`${user.name} 迟到，打卡时间: ${user.punchInTime}`);
});
```

#### 3. 获取当日考勤概况（快捷功能）

```typescript
import { getTodayAttendanceInfo, printAttendanceReport } from '@ddhd/feishu-skills';

const info = await getTodayAttendanceInfo();
printAttendanceReport(info);
```

#### 4. 获取当月考勤明细

```typescript
import { getMonthlyAttendanceDetail } from '@ddhd/feishu-skills/attendance';

const details = await getMonthlyAttendanceDetail();
details.forEach(user => {
  console.log(`${user.name}:`);
  console.log(`  迟到 ${user.beLateInfo.lateTimes} 次`);
  user.leaveInfo.forEach(leave => {
    console.log(`  请假: ${leave.leaveType} ${leave.leaveDays}天`);
  });
});
```

### 五、素材管理 (`feishu-media.ts`)

#### 1. 上传素材

```typescript
import { uploadMedia } from '@ddhd/feishu-skills/media';

const result = await uploadMedia(
  '/path/to/image.png',
  'docx_image',
  'docxnXxxxxx'
);
console.log('素材token:', result.file_token);
```

**支持的父类型**：
- `doc_image` / `docx_image` / `sheet_image` / `bitable_image` - 图片
- `doc_file` / `docx_file` / `sheet_file` / `bitable_file` - 文件
- `vc_virtual_background` - 视频会议虚拟背景
- `whiteboard` - 白板
- `moments` - 同事圈
- `calendar` - 日历

#### 2. 下载素材

```typescript
import { downloadMedia } from '@ddhd/feishu-skills/media';

const result = await downloadMedia(
  'boxcnXxxxxx',
  '/path/to/save/image.png'
);
console.log('保存路径:', result.filePath);
console.log('文件大小:', result.size);
```

#### 3. 批量获取临时下载链接

```typescript
import { batchGetMediaDownloadUrls } from '@ddhd/feishu-skills/media';

const urls = await batchGetMediaDownloadUrls(['boxcnXxxxxx', 'boxcnYyyyyy']);
urls.forEach(item => {
  console.log(`${item.file_token}: ${item.tmp_download_url}`);
});
```

## 缓存文件说明

### 1. attendance-group-list.json
考勤组列表，包含所有考勤组的基本信息。

### 2. attendance-defaultGroup-detail.json
默认考勤组详情，包含考勤组的完整配置信息。

### 3. attendance-defaultGroup-user.json
默认考勤组成员列表，包含成员的用户信息和头像。

### 4. attendance-defaultGroup-shifts.json
默认考勤组的班次信息，包含班次的上下班时间规则。

## 类型定义

### 通讯录相关

```typescript
interface UserInfo {
  user_id: string;
  name: string;
  email?: string;
  mobile?: string;
  avatar?: { avatar_72?: string; avatar_240?: string; avatar_640?: string };
  job_title?: string;
  department_names?: string[];
}
```

### 考勤相关

```typescript
interface AttendanceGroup {
  group_id: string;
  group_name: string;
  isDefault: boolean;
  punch_day_shift_ids?: string[];
}

interface Shift {
  shift_id: string;
  shift_name: string;
  punch_times: number;
  punch_time_rule: Array<{
    on_time: string;
    off_time: string;
    late_minutes_as_late: number;
  }>;
}

interface UserAttendanceDetail {
  name: string;
  leaveInfo: Array<{ leaveType: string; leaveDays: string }>;
  beLateInfo: {
    lateTimes: number;
    detail: Array<{ date: string; punchInTime: string }>;
  };
}
```

### 素材相关

```typescript
interface UploadMediaResult {
  file_token: string;
  file_name: string;
  size: number;
}

interface MediaTmpDownloadUrl {
  file_token: string;
  tmp_download_url: string;
}

type MediaParentType =
  | 'doc_image' | 'docx_image' | 'sheet_image' | 'bitable_image'
  | 'doc_file' | 'docx_file' | 'sheet_file' | 'bitable_file'
  | 'vc_virtual_background' | 'whiteboard' | 'moments' | 'calendar';
```

### 当日考勤相关

```typescript
interface TodayAttendanceInfo {
  date: string;
  group: { group_id: string; group_name: string };
  totalCount: number;
  lateCount: number;
  lateRate: string;
  normalRate: string;
  lateUsers: Array<{ name: string; punchInTime: string }>;
}
```

## 工作流程

使用此 skill 时，遵循以下步骤：

1. **环境准备**：配置 `.env` 文件，确保凭证正确
2. **首次使用**：调用 `fetchAttendanceGroups()` 获取考勤组列表
3. **获取成员**：调用 `getDefaultAttendanceGroupMembers()` 获取成员
4. **获取详情**：调用 `getDefaultAttendanceGroupDetail()` 获取班次信息
5. **查询统计**：使用 `getMonthlyAttendanceDetail()` 或 `getTodayLateUsers()` 查询考勤情况

## 最佳实践

1. **错误处理**
   ```typescript
   try {
     const users = await batchGetUserInfo(userIds);
   } catch (error) {
     console.error('获取用户信息失败:', error);
   }
   ```

2. **利用缓存**
   ```typescript
   // 首次调用会写入缓存
   await getDefaultAttendanceGroupMembers();
   
   // 后续直接从缓存读取
   const cached = await readDefaultGroupMembers();
   ```

3. **批量操作**
   ```typescript
   // 批量获取用户信息（自动分批处理）
   const users = await batchGetUserInfo(userIds, 'user_id');
   ```

## 注意事项

- ⚠️ **安全**：切勿将 `.env` 文件提交到代码仓库
- ⚠️ **权限**：确保飞书应用已开通通讯录和考勤相关权限
- ⚠️ **频率限制**：注意飞书 API 的调用频率限制
  - 素材相关接口：5 QPS
- ⚠️ **日期格式**：所有日期参数格式为 `yyyyMMdd`，如 `20250301`
- ⚠️ **素材大小**：`uploadMedia` 接口限制文件大小不超过 20MB，超过请使用分片上传
- ⚠️ **素材时效**：临时下载链接有效期为 24 小时

## 参考链接

- [飞书开放平台文档](https://open.feishu.cn/document/home/index)
- [Node.js SDK GitHub](https://github.com/larksuite/node-sdk)
- [API 调试工具](https://open.feishu.cn/api-explorer)
