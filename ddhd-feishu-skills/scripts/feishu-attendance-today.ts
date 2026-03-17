/**
 * 获取当日考勤信息快捷模块
 * 
 * 整合功能：
 * - 获取今日迟到人员
 * - 获取考勤组成员列表
 * - 计算出勤率和迟到率
 * 
 * 使用示例：
 * ```typescript
 * import { getTodayAttendanceInfo, printAttendanceReport } from './feishu-attendance-today';
 * 
 * const info = await getTodayAttendanceInfo();
 * printAttendanceReport(info);
 * ```
 */

import { 
  getTodayLateUsers, 
  getAttendanceGroupMembers,
  getDefaultAttendanceGroupMembers,
  AttendanceGroupMembersData,
  TodayLateUser 
} from './feishu-attendance';

/**
 * 当日考勤信息
 */
export interface TodayAttendanceInfo {
  /** 查询日期 */
  date: string;
  /** 考勤组信息 */
  group: {
    group_id: string;
    group_name: string;
  };
  /** 应到人数 */
  totalCount: number;
  /** 迟到人数 */
  lateCount: number;
  /** 迟到率 */
  lateRate: string;
  /** 正常出勤率 */
  normalRate: string;
  /** 迟到人员列表 */
  lateUsers: TodayLateUser[];
  /** 所有成员（可选） */
  allMembers?: string[];
}

/**
 * 获取当日考勤信息
 * 
 * @param groupId - 考勤组 ID，不传则使用默认考勤组
 * @param includeAllMembers - 是否包含所有成员列表
 * @returns 当日考勤信息
 */
export async function getTodayAttendanceInfo(
  groupId?: string,
  includeAllMembers: boolean = false
): Promise<TodayAttendanceInfo> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  console.log(`[attendance-today] 正在获取 ${dateStr} 考勤信息...`);

  // 1. 获取考勤组成员
  let membersData: AttendanceGroupMembersData;
  if (groupId) {
    membersData = await getAttendanceGroupMembers(groupId);
  } else {
    membersData = await getDefaultAttendanceGroupMembers();
  }

  console.log(`[attendance-today] 考勤组: ${membersData.group_name}`);
  console.log(`[attendance-today] 应到人数: ${membersData.total_count}`);

  // 2. 获取今日迟到人员
  const memberUserIds = membersData.members.map(m => m.user_id).filter(Boolean);
  const lateUsers = await getTodayLateUsers(memberUserIds);

  console.log(`[attendance-today] 迟到人数: ${lateUsers.length}`);

  // 3. 计算统计
  const totalCount = membersData.total_count;
  const lateCount = lateUsers.length;
  const lateRate = totalCount > 0 ? ((lateCount / totalCount) * 100).toFixed(1) : '0.0';
  const normalRate = totalCount > 0 ? (((totalCount - lateCount) / totalCount) * 100).toFixed(1) : '0.0';

  const result: TodayAttendanceInfo = {
    date: dateStr,
    group: {
      group_id: membersData.group_id,
      group_name: membersData.group_name,
    },
    totalCount,
    lateCount,
    lateRate: `${lateRate}%`,
    normalRate: `${normalRate}%`,
    lateUsers,
  };

  if (includeAllMembers) {
    result.allMembers = membersData.members.map(m => m.userInfo?.name || m.user_id);
  }

  console.log(`[attendance-today] ✅ 获取完成`);
  console.log(`[attendance-today] 迟到率: ${lateRate}%`);
  console.log(`[attendance-today] 正常出勤率: ${normalRate}%`);

  return result;
}

/**
 * 打印考勤报告（人类友好格式）
 */
export function printAttendanceReport(info: TodayAttendanceInfo) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 当日考勤报告');
  console.log('='.repeat(50));
  console.log(`📅 日期: ${info.date}`);
  console.log(`👥 考勤组: ${info.group.group_name}`);
  console.log('-'.repeat(50));
  console.log(`👤 应到人数: ${info.totalCount}`);
  console.log(`⏰ 迟到人数: ${info.lateCount}`);
  console.log(`📈 迟到率: ${info.lateRate}`);
  console.log(`✅ 正常出勤率: ${info.normalRate}`);
  console.log('-'.repeat(50));

  if (info.lateUsers.length > 0) {
    console.log('\n⏰ 迟到人员:');
    info.lateUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} - 打卡时间: ${user.punchInTime}`);
    });
  } else {
    console.log('\n🎉 今日无人迟到！');
  }

  console.log('='.repeat(50) + '\n');
}
