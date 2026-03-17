/**
 * DDHD 飞书技能 - 基础能力库 (lib/)
 * 
 * 本目录包含飞书 API 的原子化封装，每个文件对应一类 API：
 * - client.ts: 飞书 SDK 客户端（核心，所有能力都依赖它）
 * - contact.ts: 通讯录相关 API
 * - attendance.ts: 考勤相关 API
 * - drive.ts: 云空间（素材）相关 API
 * 
 * 当需要新的基础能力时：
 * 1. 查看 api-index.json 确认 API 信息
 * 2. 参考 TEMPLATE.ts 创建新的能力文件
 * 3. 在此文件中导出
 */

// 核心客户端 - 所有能力的基石
export { client, clientConfig } from './client';

// 通讯录能力
export {
  getUserInfo,
  batchGetUserInfo,
  batchGetUserInfoWithPaging,
  type UserInfo,
} from './contact';

// 考勤能力
export {
  fetchAttendanceGroups,
  setDefaultAttendanceGroup,
  getAttendanceGroupDetail,
  getDefaultAttendanceGroup,
  getDefaultAttendanceGroupDetail,
  getAttendanceGroupMembers,
  getDefaultAttendanceGroupMembers,
  getShiftDetail,
  queryAttendanceStats,
  getTodayLateUsers,
  getMonthlyAttendanceDetail,
  readDefaultGroupDetail,
  readDefaultGroupShifts,
  type AttendanceGroup,
  type AttendanceGroupMember,
  type AttendanceGroupMembersData,
  type DefaultGroupShiftsData,
  type Shift,
  type AttendanceStatsData,
  type TodayLateUser,
  type LateDetail,
  type LeaveInfo,
  type UserAttendanceDetail,
} from './attendance';

// 云空间能力
export {
  uploadMedia,
  downloadMedia,
  batchGetMediaDownloadUrls,
  getMediaStream,
  type MediaParentType,
  type UploadMediaResult,
  type DownloadMediaResult,
  type MediaTmpDownloadUrl,
} from './drive';
