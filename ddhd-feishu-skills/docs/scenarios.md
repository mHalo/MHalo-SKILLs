# 业务场景清单

本文档记录 `scripts/` 目录下的所有业务场景。

## 目录

- [今日考勤报告](#今日考勤报告)
- [素材管理](#素材管理)
- [通讯录查询](#通讯录查询)
- [通过 Open ID 获取用户](#通过-open-id-获取用户)

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

## 创建新业务场景

1. 复制 `scripts/_template.ts` 创建新文件
2. 根据业务需求调用 `lib/` 中的基础能力
3. 实现 CLI 参数解析和输出
4. 创建对应的测试文件 `tests/[场景名].test.ts`
5. 更新本文档
