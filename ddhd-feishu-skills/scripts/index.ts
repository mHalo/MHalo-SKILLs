/**
 * DDHD 飞书技能包
 * 
 * 提供飞书开放平台常用功能的封装，包括：
 * - 通讯录管理（用户查询）
 * - 考勤管理（考勤组、班次、统计）
 * - 素材管理（上传、下载）
 * 
 * 使用方式：
 * ```typescript
 * // 方式1：统一导入
 * import { getUserInfo, uploadMedia, fetchAttendanceGroups } from '@ddhd/feishu-skills';
 * 
 * // 方式2：按需导入子模块
 * import { getUserInfo } from '@ddhd/feishu-skills/contact';
 * import { uploadMedia } from '@ddhd/feishu-skills/media';
 * import { fetchAttendanceGroups } from '@ddhd/feishu-skills/attendance';
 * ```
 */

// 导出客户端
export { client, clientConfig } from './feishu-client';

// 导出通讯录功能
export {
  getUserInfo,
  batchGetUserInfo,
  batchGetUserInfoWithPaging,
  type UserInfo,
} from './feishu-contact';

// 导出考勤功能
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
} from './feishu-attendance';

// 导出素材功能
export {
  uploadMedia,
  downloadMedia,
  batchGetMediaDownloadUrls,
  getMediaStream,
  type MediaParentType,
  type UploadMediaResult,
  type DownloadMediaResult,
  type MediaTmpDownloadUrl,
} from './feishu-media';

// 导出当日考勤快捷功能
export {
  getTodayAttendanceInfo,
  printAttendanceReport,
  type TodayAttendanceInfo,
} from './feishu-attendance-today';
