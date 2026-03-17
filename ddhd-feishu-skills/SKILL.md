---
name: ddhd-feishu-skills
description: 飞书开放平台 SDK 封装技能，提供通讯录用户管理和考勤管理功能。当需要获取飞书用户信息、查询考勤组、获取考勤统计、查询迟到记录等场景时使用此skill。
---

# 飞书开发 Skill

## 概述

基于 `@larksuiteoapi/node-sdk` 封装的飞书开发技能，提供以下核心功能：
- **通讯录管理**：获取用户信息（支持单用户和批量获取）
- **考勤管理**：考勤组查询、班次管理、考勤统计、迟到查询

## 使用场景

- **获取员工信息**：根据用户 ID 获取姓名、头像、部门等信息
- **考勤组管理**：查询考勤组列表、获取考勤组详情、设置默认考勤组
- **班次查询**：获取班次详细信息（上下班时间、打卡规则等）
- **考勤统计**：查询月度考勤统计、缺勤情况、实际出勤时长
- **迟到查询**：查询当日迟到人员、当月迟到记录明细
- **考勤明细**：获取包含请假、迟到等详细信息的考勤报表

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
5. 在「权限管理」中开通所需 API 权限（通讯录、考勤等）

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
├── scripts/                       # 功能脚本目录（核心代码）
│   ├── feishu-client.ts          # 飞书 SDK 客户端初始化
│   ├── feishu-contact.ts         # 通讯录用户管理模块
│   └── feishu-attendance.ts      # 考勤管理模块
├── tests/                         # 测试文件目录
├── caches/                        # 缓存文件目录
│   ├── attendance-group-list.json           # 考勤组列表缓存
│   ├── attendance-defaultGroup-detail.json  # 默认考勤组详情缓存
│   ├── attendance-defaultGroup-user.json    # 默认考勤组成员缓存
│   └── attendance-defaultGroup-shifts.json  # 默认考勤组班次缓存
└── references/                    # 参考资料目录
```

## 核心功能

### 一、通讯录管理 (`feishu-contact.ts`)

#### 1. 获取单个用户信息

```typescript
import { getUserInfo } from './feishu-contact';

const user = await getUserInfo('2a3f36c4', 'user_id');
if (user) {
  console.log('姓名:', user.name);
  console.log('头像:', user.avatar?.avatar_72);
}
```

#### 2. 批量获取用户信息

```typescript
import { batchGetUserInfo } from './feishu-contact';

const users = await batchGetUserInfo(['2a3f36c4', '5314294e'], 'user_id');
users.forEach(user => {
  console.log(`${user.name}: ${user.email}`);
});
```

### 二、考勤组管理 (`feishu-attendance.ts`)

#### 1. 获取所有考勤组

```typescript
import { fetchAttendanceGroups } from './feishu-attendance';

const groups = await fetchAttendanceGroups();
// 自动写入 caches/attendance-group-list.json
```

#### 2. 设置默认考勤组

```typescript
import { setDefaultAttendanceGroup } from './feishu-attendance';

await setDefaultAttendanceGroup('7414010894549975043');
```

#### 3. 获取考勤组详情

```typescript
import { getAttendanceGroupDetail } from './feishu-attendance';

const detail = await getAttendanceGroupDetail('7414010894549975043');
console.log('考勤组名称:', detail?.group_name);
console.log('班次ID列表:', detail?.punch_day_shift_ids);
```

#### 4. 获取默认考勤组详情（含班次信息）

```typescript
import { getDefaultAttendanceGroupDetail } from './feishu-attendance';

const detail = await getDefaultAttendanceGroupDetail();
// 自动获取并缓存班次信息到 attendance-defaultGroup-shifts.json
```

### 三、考勤组成员管理

#### 1. 获取考勤组成员

```typescript
import { getAttendanceGroupMembers } from './feishu-attendance';

const members = await getAttendanceGroupMembers('7414010894549975043');
members.members.forEach(m => {
  console.log(`${m.userInfo?.name}: ${m.userInfo?.avatar?.avatar_72}`);
});
```

#### 2. 获取默认考勤组成员

```typescript
import { getDefaultAttendanceGroupMembers } from './feishu-attendance';

const members = await getDefaultAttendanceGroupMembers();
// 自动写入 caches/attendance-defaultGroup-user.json
```

### 四、班次管理

#### 1. 获取班次详情

```typescript
import { getShiftDetail } from './feishu-attendance';

const shift = await getShiftDetail('8');
console.log('班次名称:', shift?.shift_name);
console.log('上班时间:', shift?.punch_time_rule[0]?.on_time);
console.log('下班时间:', shift?.punch_time_rule[0]?.off_time);
```

#### 2. 读取默认考勤组班次缓存

```typescript
import { readDefaultGroupShifts } from './feishu-attendance';

const shiftsData = await readDefaultGroupShifts();
shiftsData?.shifts.forEach(shift => {
  console.log(`${shift.shift_name}: ${shift.punch_time_rule[0]?.on_time}-${shift.punch_time_rule[0]?.off_time}`);
});
```

### 五、考勤统计与查询

#### 1. 查询考勤统计数据

```typescript
import { queryAttendanceStats } from './feishu-attendance';

const stats = await queryAttendanceStats('20250301', '20250331', ['2a3f36c4']);
stats.user_datas?.forEach(user => {
  console.log('姓名:', user.name);
  user.datas?.forEach(item => {
    console.log(`${item.title}: ${item.value}`);
  });
});
```

#### 2. 获取当日迟到人员

```typescript
import { getTodayLateUsers } from './feishu-attendance';

const lateUsers = await getTodayLateUsers();
lateUsers.forEach(user => {
  console.log(`${user.name} 迟到，打卡时间: ${user.punchInTime}`);
});
```

#### 3. 获取当月考勤明细

```typescript
import { getMonthlyAttendanceDetail } from './feishu-attendance';

const details = await getMonthlyAttendanceDetail();
details.forEach(user => {
  console.log(`${user.name}:`);
  console.log(`  迟到 ${user.beLateInfo.lateTimes} 次`);
  user.beLateInfo.detail.forEach(late => {
    console.log(`    - ${late.date} ${late.punchInTime}`);
  });
  user.leaveInfo.forEach(leave => {
    console.log(`  请假: ${leave.leaveType} ${leave.leaveDays}天`);
  });
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
  // ... 其他字段
}

interface Shift {
  shift_id: string;
  shift_name: string;
  punch_times: number;
  punch_time_rule: Array<{
    on_time: string;
    off_time: string;
    late_minutes_as_late: number;
    // ... 其他字段
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
- ⚠️ **日期格式**：所有日期参数格式为 `yyyyMMdd`，如 `20250301`

## 参考链接

- [飞书开放平台文档](https://open.feishu.cn/document/home/index)
- [Node.js SDK GitHub](https://github.com/larksuite/node-sdk)
- [API 调试工具](https://open.feishu.cn/api-explorer)
