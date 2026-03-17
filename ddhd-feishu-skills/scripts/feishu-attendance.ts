/**
 * 飞书考勤管理模块
 * 
 * 提供考勤组管理功能，包括�?
 * - 查询所有考勤�?
 * - 设置默认考勤�?
 * 
 * 使用示例�?
 * ```typescript
 * import { fetchAttendanceGroups, setDefaultAttendanceGroup } from './feishu-attendance';
 * 
 * // 查询所有考勤�?
 * await fetchAttendanceGroups();
 * 
 * // 设置默认考勤�?
 * await setDefaultAttendanceGroup('group_xxx');
 * ```
 */

import { client } from './feishu-client';
import { batchGetUserInfo, UserInfo } from './feishu-contact';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 考勤组信�?
 */
export interface AttendanceGroup {
  /** 考勤�?ID */
  group_id: string;
  /** 考勤组名�?*/
  group_name: string;
  /** 考勤组类型：1-固定班制�?-排班制，3-自由班制 */
  type?: number;
  /** 是否为默认考勤�?*/
  isDefault: boolean;
  /** 其他飞书返回的原始字�?*/
  [key: string]: any;
}

/**
 * 考勤组成员（含用户信息）
 */
export interface AttendanceGroupMember {
  /** 用户 ID */
  user_id: string;
  /** 部门 ID 列表 */
  department_ids?: string[];
  /** 用户详细信息（从通讯录获取） */
  userInfo?: UserInfo;
}

/**
 * 考勤组成员列表数�?
 */
export interface AttendanceGroupMembersData {
  /** 考勤�?ID */
  group_id: string;
  /** 考勤组名�?*/
  group_name: string;
  /** 成员列表 */
  members: AttendanceGroupMember[];
  /** 成员数量 */
  total_count: number;
  /** 缓存时间 */
  _cached_at?: string;
}

/**
 * 默认考勤组班次列表数�?
 */
export interface DefaultGroupShiftsData {
  /** 考勤�?ID */
  group_id: string;
  /** 考勤组名�?*/
  group_name: string;
  /** 班次列表 */
  shifts: Shift[];
  /** 班次数量 */
  total_count: number;
  /** 缓存时间 */
  _cached_at?: string;
}

/**
 * 考勤组列表缓存文件路�?
 */
const CACHE_FILE_PATH = path.resolve(process.cwd(), 'caches', 'attendance-group-list.json');

/**
 * 默认考勤组详情缓存文件路�?
 */
const DEFAULT_GROUP_DETAIL_PATH = path.resolve(process.cwd(), 'caches', 'attendance-defaultGroup-detail.json');

/**
 * 默认考勤组班次列表缓存文件路�?
 */
const DEFAULT_GROUP_SHIFTS_PATH = path.resolve(process.cwd(), 'caches', 'attendance-defaultGroup-shifts.json');

/**
 * 默认考勤组成员列表缓存文件路�?
 */
const DEFAULT_GROUP_MEMBERS_PATH = path.resolve(process.cwd(), 'caches', 'attendance-defaultGroup-user.json');

/**
 * 查询所有考勤�?
 * 
 * 从飞书获取所有考勤组列表，并缓存到本地 JSON 文件�?
 * 首次查询时会自动将第一个考勤组设置为默认�?
 * 
 * @param pageSize - 每页数量，默认为 50
 * @returns 考勤组列�?
 * @throws 调用失败时抛出错�?
 * 
 * @example
 * ```typescript
 * // 获取所有考勤组（默认每页50条）
 * const groups = await fetchAttendanceGroups();
 * console.log(`共获�?${groups.length} 个考勤组`);
 * 
 * // 获取默认考勤�?
 * const defaultGroup = groups.find(g => g.isDefault);
 * console.log('默认考勤�?', defaultGroup?.group_name);
 * ```
 */
export async function fetchAttendanceGroups(pageSize: number = 50): Promise<AttendanceGroup[]> {
  console.log('[feishu-attendance] 正在查询考勤组列�?..');
  
  try {
    // 调用飞书 API 获取考勤组列�?
    const res = await client.attendance.v1.group.list({
      params: {
        page_size: pageSize,
      },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    const rawGroups = res.data?.group_list || [];
    
    if (rawGroups.length === 0) {
      console.log('[feishu-attendance] δ�ҵ��κο�����');
      return [];
    }

    // Ϊÿ������������ isDefault ���ԣ���һ����Ϊ true
    const groups: AttendanceGroup[] = rawGroups.map((group: any, index: number) => ({
      ...group,
      isDefault: index === 0, // 第一个设置为默认
    }));

    // 写入缓存文件
    await writeCacheFile(groups);

    console.log(`[feishu-attendance] 成功获取 ${groups.length} 个考勤组`);
    console.log(`[feishu-attendance] 默认考勤�? ${groups[0]?.group_name}`);
    console.log(`[feishu-attendance] 缓存文件: ${CACHE_FILE_PATH}`);

    return groups;
  } catch (error: any) {
    console.error('[feishu-attendance] 查询考勤组失�?', error.message || error);
    throw new Error(`查询考勤组失�? ${error.message || error}`);
  }
}

/**
 * 设置默认考勤�?
 * 
 * 将指�?ID 的考勤组设置为默认，同时取消其他考勤组的默认状态�?
 * 修改会同步更新到本地缓存文件�?
 * 
 * @param groupId - 要设置为默认的考勤�?ID
 * @returns 更新后的考勤组列�?
 * @throws 当考勤组不存在或操作失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 设置指定考勤组为默认
 * const groups = await setDefaultAttendanceGroup('group_xxx');
 * 
 * // 验证设置结果
 * const defaultGroup = groups.find(g => g.isDefault);
 * console.log('新的默认考勤�?', defaultGroup?.group_name);
 * ```
 */
export async function setDefaultAttendanceGroup(groupId: string): Promise<AttendanceGroup[]> {
  console.log(`[feishu-attendance] 正在设置默认考勤�? ${groupId}`);

  // 读取缓存文件
  const groups = await readCacheFile();

  if (groups.length === 0) {
    throw new Error('�����ļ�Ϊ�գ����ȵ��� fetchAttendanceGroups() ��ȡ�������б�');
  }

  // 查找目标考勤�?
  const targetGroup = groups.find(g => g.group_id === groupId);
  if (!targetGroup) {
    throw new Error(`未找到考勤�? ${groupId}，请确认 ID 是否正确`);
  }

  // 更新 isDefault 状态：只有一个默�?
  let changed = false;
  groups.forEach(group => {
    if (group.group_id === groupId) {
      if (!group.isDefault) {
        group.isDefault = true;
        changed = true;
      }
    } else {
      if (group.isDefault) {
        group.isDefault = false;
        changed = true;
      }
    }
  });

  if (!changed) {
    console.log(`[feishu-attendance] 考勤�?"${targetGroup.group_name}" 已经是默认，无需修改`);
    return groups;
  }

  // 写回缓存文件
  await writeCacheFile(groups);

  console.log(`[feishu-attendance] �?默认考勤组已更新�? "${targetGroup.group_name}" (${groupId})`);
  
  return groups;
}

/**
 * �?ID 查询考勤组详�?
 * 
 * 根据考勤�?ID 获取详细信息，包括考勤规则、考勤范围等�?
 * 
 * @param groupId - 考勤�?ID
 * @returns 考勤组详细信息，如果不存在返�?null
 * @throws 调用失败时抛出错�?
 * 
 * @example
 * ```typescript
 * // 查询考勤组详�?
 * const detail = await getAttendanceGroupDetail('7414010894549975043');
 * if (detail) {
 *   console.log('考勤组名�?', detail.group_name);
 *   console.log('考勤类型:', detail.type);
 *   console.log('考勤人数:', detail.user_count);
 * }
 * ```
 */
export async function getAttendanceGroupDetail(groupId: string): Promise<AttendanceGroup | null> {
  if (!groupId) {
    throw new Error('考勤�?ID 不能为空');
  }

  console.log(`[feishu-attendance] 正在查询考勤组详�? ${groupId}`);

  try {
    const res = await client.attendance.v1.group.get({
      path: {
        group_id: groupId,
      },
      params: {
        employee_type: 'employee_id',
        dept_type: 'open_id',
      },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    if (!res.data) {
      return null;
    }

    // res.data 直接包含考勤组详细信�?
    const group = res.data;
    
    // 尝试从缓存文件中获取 isDefault 状�?
    const cachedGroups = await readCacheFile();
    const cachedGroup = cachedGroups.find(g => g.group_id === groupId);

    const result: AttendanceGroup = {
      ...group,
      group_id: groupId,
      isDefault: cachedGroup?.isDefault || false,
    };

    // 如果是默认考勤组，保存到专属缓存文�?
    if (result.isDefault) {
      await writeDefaultGroupDetail(result);
      console.log(`[feishu-attendance] �?默认考勤组详情已缓存: ${DEFAULT_GROUP_DETAIL_PATH}`);
    }

    console.log(`[feishu-attendance] �?成功获取考勤组详�? "${result.group_name}"`);

    return result;
  } catch (error: any) {
    // 处理考勤组不存在的错�?
    if (error?.code === 99991401 || error?.code === 1220600 || error?.msg?.includes('not exist')) {
      console.log(`[feishu-attendance] ⚠️ 考勤组不存在: ${groupId}`);
      return null;
    }
    throw new Error(`查询考勤组详情失�? ${error.message || error}`);
  }
}

/**
 * 获取当前默认考勤�?
 * 
 * @returns 默认考勤组信息，如果没有则返�?null
 */
export async function getDefaultAttendanceGroup(): Promise<AttendanceGroup | null> {
  const groups = await readCacheFile();
  return groups.find(g => g.isDefault) || null;
}

/**
 * 读取缓存文件
 * 
 * @returns 考勤组列�?
 */
async function readCacheFile(): Promise<AttendanceGroup[]> {
  // 确保缓存目录存在
  const cacheDir = path.dirname(CACHE_FILE_PATH);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // 如果文件不存在，返回空数�?
  if (!fs.existsSync(CACHE_FILE_PATH)) {
    return [];
  }

  try {
    const content = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    console.error('[feishu-attendance] 读取缓存文件失败:', error.message);
    return [];
  }
}

/**
 * 写入缓存文件
 * 
 * @param groups - 考勤组列�?
 */
async function writeCacheFile(groups: AttendanceGroup[]): Promise<void> {
  // 确保缓存目录存在
  const cacheDir = path.dirname(CACHE_FILE_PATH);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(groups, null, 2), 'utf-8');
  } catch (error: any) {
    throw new Error(`写入缓存文件失败: ${error.message}`);
  }
}

/**
 * 写入默认考勤组详情缓存文�?
 * 
 * @param group - 默认考勤组详�?
 */
async function writeDefaultGroupDetail(group: AttendanceGroup): Promise<void> {
  // 确保缓存目录存在
  const cacheDir = path.dirname(DEFAULT_GROUP_DETAIL_PATH);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  try {
    // 添加缓存时间�?
    const data = {
      ...group,
      _cached_at: new Date().toISOString(),
    };
    fs.writeFileSync(DEFAULT_GROUP_DETAIL_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[feishu-attendance] 默认考勤组详情已写入缓存文件`);
  } catch (error: any) {
    console.error(`[feishu-attendance] 写入默认考勤组详情缓存失�? ${error.message}`);
    // 不抛出错误，避免影响主流�?
  }
}

/**
 * 读取默认考勤组详情缓存文�?
 * 
 * @returns 默认考勤组详情，如果不存在返�?null
 */
export async function readDefaultGroupDetail(): Promise<AttendanceGroup | null> {
  if (!fs.existsSync(DEFAULT_GROUP_DETAIL_PATH)) {
    return null;
  }

  try {
    const content = fs.readFileSync(DEFAULT_GROUP_DETAIL_PATH, 'utf-8');
    const data = JSON.parse(content);
    // 移除内部使用的缓存时间戳字段
    delete data._cached_at;
    return data;
  } catch (error: any) {
    console.error('[feishu-attendance] 读取默认考勤组详情缓存失�?', error.message);
    return null;
  }
}

/**
 * 班次信息
 */
export interface Shift {
  /** 班次 ID */
  shift_id: string;
  /** 班次名称 */
  shift_name: string;
  /** 打卡次数�?-单次�?-两次�?-三次 */
  punch_times: number;
  /** 是否弹性打�?*/
  is_flexible?: boolean;
  /** 弹性打卡时长（分钟�?*/
  flexible_minutes?: number;
  /** 弹性打卡规�?*/
  flexible_rule?: {
    flexible_early_minutes: number;
    flexible_late_minutes: number;
  }[];
  /** 无需下班打卡 */
  no_need_off?: boolean;
  /** 上下班时间规�?*/
  punch_time_rule: {
    on_time: string;
    off_time: string;
    late_minutes_as_late: number;
    late_minutes_as_lack: number;
    on_advance_minutes: number;
    early_minutes_as_early: number;
    early_minutes_as_lack: number;
    off_delay_minutes: number;
    late_minutes_as_serious_late?: number;
    no_need_on?: boolean;
    no_need_off?: boolean;
  }[];
  /** 晚走晚到规则 */
  late_off_late_on_rule?: {
    late_off_minutes: number;
    late_on_minutes: number;
  }[];
  /** 休息时间规则 */
  rest_time_rule?: {
    rest_begin_time: string;
    rest_end_time: string;
  }[];
  /** 加班规则 */
  overtime_rule?: {
    on_overtime: string;
    off_overtime: string;
  }[];
  /** 日期类型�?-工作日，2-休息日，3-节假�?*/
  day_type?: number;
  /** 班次负责�?*/
  sub_shift_leader_ids?: string[];
}

/**
 * �?ID 查询班次详情
 * 
 * 根据班次 ID 获取详细信息，包括上下班时间、打卡规则等�?
 * 
 * @param shiftId - 班次 ID
 * @returns 班次详细信息，如果不存在返回 null
 * @throws 调用失败时抛出错�?
 * 
 * @example
 * ```typescript
 * // 查询班次详情
 * const shift = await getShiftDetail('8');
 * if (shift) {
 *   console.log('班次名称:', shift.shift_name);
 *   console.log('打卡次数:', shift.punch_times);
 *   console.log('上班时间:', shift.punch_time_rule[0]?.on_time);
 *   console.log('下班时间:', shift.punch_time_rule[0]?.off_time);
 * }
 * ```
 */
export async function getShiftDetail(shiftId: string): Promise<Shift | null> {
  if (!shiftId) {
    throw new Error('班次 ID 不能为空');
  }

  console.log(`[feishu-attendance] 正在查询班次详情: ${shiftId}`);

  try {
    const res = await client.attendance.v1.shift.get({
      path: {
        shift_id: shiftId,
      },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    if (!res.data) {
      return null;
    }

    const shift: Shift = {
      shift_id: res.data.shift_id,
      shift_name: res.data.shift_name,
      punch_times: res.data.punch_times,
      is_flexible: res.data.is_flexible,
      flexible_minutes: res.data.flexible_minutes,
      flexible_rule: res.data.flexible_rule,
      no_need_off: res.data.no_need_off,
      punch_time_rule: res.data.punch_time_rule,
      late_off_late_on_rule: res.data.late_off_late_on_rule,
      rest_time_rule: res.data.rest_time_rule,
      overtime_rule: res.data.overtime_rule,
      day_type: res.data.day_type,
      sub_shift_leader_ids: res.data.sub_shift_leader_ids,
    };

    console.log(`[feishu-attendance] �?成功获取班次详情: "${shift.shift_name}"`);

    return shift;
  } catch (error: any) {
    // 处理班次不存在的错误
    // Axios 错误格式: error.response.data 包含飞书 API 返回的错误信�?
    const feishuError = error?.response?.data;
    const errorCode = feishuError?.code;
    
    // 1220600 - 规则不存在，1220001 - 参数错误（通常�?ID 格式不正确或不存在）
    if (errorCode === 1220600 || errorCode === 1220001) {
      console.log(`[feishu-attendance] ⚠️ 班次不存在或ID无效: ${shiftId}`);
      return null;
    }
    throw new Error(`查询班次详情失败: ${error.message || error}`);
  }
}

/**
 * 考勤统计数据
 */
export interface AttendanceStatsData {
  /** 用户统计数据列表 */
  user_datas?: {
    /** 用户姓名 */
    name: string;
    /** 用户 ID */
    user_id: string;
    /** 统计字段数据 */
    datas?: {
      /** 字段编码 */
      code: string;
      /** 字段�?*/
      value: string;
      /** 字段特�?*/
      features?: {
        key: string;
        value: string;
      }[];
      /** 字段标题 */
      title?: string;
      /** 时长数�?*/
      duration_num?: {
        day?: string;
        half_day?: string;
        hour?: string;
        half_hour?: string;
        minute?: string;
      };
    }[];
  }[];
  /** 无效用户列表 */
  invalid_user_list?: string[];
}

/**
 * 查询考勤统计数据
 * 
 * 查询指定日期段内指定人员的考勤统计信息（月度统计）�?
 * 
 * @param startDate - 开始日期，格式 yyyyMMdd，如 20250301
 * @param endDate - 结束日期，格�?yyyyMMdd，如 20250331
 * @param userIds - 用户 ID 列表
 * @returns 考勤统计数据
 * @throws 调用失败时抛出错�?
 * 
 * @example
 * ```typescript
 * // 查询 2025�?�?的考勤统计
 * const stats = await queryAttendanceStats('20250301', '20250331', ['2a3f36c4', '5314294e']);
 * 
 * stats.user_datas?.forEach(user => {
 *   console.log(`用户: ${user.name}`);
 *   user.datas?.forEach(item => {
 *     console.log(`  ${item.title}: ${item.value}`);
 *   });
 * });
 * ```
 */
export async function queryAttendanceStats(
  startDate: string,
  endDate: string,
  userIds: string[]
): Promise<AttendanceStatsData> {
  // 参数校验
  if (!startDate || !/^\d{8}$/.test(startDate)) {
    throw new Error('开始日期格式错误，应为 yyyyMMdd，如 20250301');
  }
  if (!endDate || !/^\d{8}$/.test(endDate)) {
    throw new Error('�������ڸ�ʽ����ӦΪ yyyyMMdd���� 20250331');
  }
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('用户 ID 列表不能为空');
  }

  console.log(`[feishu-attendance] 正在查询考勤统计数据...`);
  console.log(`[feishu-attendance] 日期范围: ${startDate} ~ ${endDate}`);
  console.log(`[feishu-attendance] 用户数量: ${userIds.length}`);

  try {
    const res = await client.attendance.v1.userStatsData.query({
      params: {
        employee_type: 'employee_id',
      },
      data: {
        locale: 'zh',
        stats_type: 'month',
        start_date: parseInt(startDate, 10),
        end_date: parseInt(endDate, 10),
        user_ids: userIds,
        current_group_only: true,
        user_id: userIds[0],
      },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    const statsData: AttendanceStatsData = {
      user_datas: res.data?.user_datas,
      invalid_user_list: res.data?.invalid_user_list,
    };

    console.log(`[feishu-attendance] �?成功获取考勤统计数据`);
    console.log(`[feishu-attendance] 有效用户: ${statsData.user_datas?.length || 0} 人`);
    if (statsData.invalid_user_list && statsData.invalid_user_list.length > 0) {
      console.log(`[feishu-attendance] 无效用户: ${statsData.invalid_user_list.length} 人`);
    }

    return statsData;
  } catch (error: any) {
    console.error('[feishu-attendance] 查询考勤统计数据失败:', error.message || error);
    throw new Error(`查询考勤统计数据失败: ${error.message || error}`);
  }
}

/**
 * 当日迟到人员信息
 */
export interface TodayLateUser {
  /** 姓名 */
  name: string;
  /** 打卡时间 */
  punchInTime: string;
}

/**
 * 获取当日迟到人员
 * 
 * 查询今天所有迟到的人员列表，返回姓名和打卡时间。
 * 
 * @param userIds - 用户 ID 列表，可选，不传则从默认考勤组获取
 * @returns 迟到人员列表
 * @throws 调用失败时抛出错误
 * 
 * @example
 * ```typescript
 * const lateUsers = await getTodayLateUsers();
 * lateUsers.forEach(user => {
 *   console.log(`${user.name} 迟到，打卡时间: ${user.punchInTime}`);
 * });
 * ```
 */
export async function getTodayLateUsers(userIds?: string[]): Promise<TodayLateUser[]> {
  // 获取今天的日期
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // 格式化为 yyyyMMdd
  const dateStr = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  
  console.log(`[feishu-attendance] 查询 ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 迟到人员`);

  // 如果没有传入用户ID列表，从默认考勤组获取
  let targetUserIds = userIds;
  if (!targetUserIds || targetUserIds.length === 0) {
    const membersData = await readDefaultGroupMembers();
    if (!membersData || membersData.members.length === 0) {
      console.log('[feishu-attendance] 未找到默认考勤组成员');
      return [];
    }
    targetUserIds = membersData.members
      .map(m => m.user_id)
      .filter((id): id is string => !!id);
  }

  try {
    const stats = await queryAttendanceStats(dateStr, dateStr, targetUserIds);
    const lateUsers: TodayLateUser[] = [];

    if (stats.user_datas) {
      stats.user_datas.forEach(user => {
        // 查找今天的打卡记录
        const todayRecord = user.datas?.find(item => {
          const title = item.title || '';
          return title.includes(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        });

        if (todayRecord) {
          const value = todayRecord.value || '';
          
          // 解析迟到记录，格式如: "迟到9分钟(09:09),正常(18:13)"
          const checkInMatch = value.match(/迟到\d+分钟\((\d{2}:\d{2})\)/);
          
          if (checkInMatch) {
            lateUsers.push({
              name: user.name,
              punchInTime: checkInMatch[1],
            });
          }
        }
      });
    }

    console.log(`[feishu-attendance] 今日迟到人员: ${lateUsers.length} 人`);
    return lateUsers;
  } catch (error: any) {
    console.error('[feishu-attendance] 查询今日迟到人员失败:', error.message);
    throw error;
  }
}

/**
 * 迟到详情
 */
export interface LateDetail {
  /** 迟到日期 */
  date: string;
  /** 打卡时间 */
  punchInTime: string;
}

/**
 * 请假信息
 */
export interface LeaveInfo {
  /** 请假类型 */
  leaveType: string;
  /** 请假天数 */
  leaveDays: string;
}

/**
 * 用户考勤明细
 */
export interface UserAttendanceDetail {
  /** 用户姓名 */
  name: string;
  /** 请假信息列表 */
  leaveInfo: LeaveInfo[];
  /** 迟到信息 */
  beLateInfo: {
    /** 迟到次数 */
    lateTimes: number;
    /** 迟到详情 */
    detail: LateDetail[];
  };
}

/**
 * 获取当月考勤明细
 * 
 * 查询本月所有用户的考勤明细，包括请假信息和迟到详情。
 * 
 * @param userIds - 用户 ID 列表，可选，不传则从默认考勤组获取
 * @returns 用户考勤明细列表
 * @throws 调用失败时抛出错误
 * 
 * @example
 * ```typescript
 * const details = await getMonthlyAttendanceDetail();
 * details.forEach(user => {
 *   console.log(`${user.name}:`);
 *   console.log(`  迟到 ${user.beLateInfo.lateTimes} 次`);
 *   user.leaveInfo.forEach(leave => {
 *     console.log(`  请假: ${leave.leaveType} ${leave.leaveDays}天`);
 *   });
 * });
 * ```
 */
export async function getMonthlyAttendanceDetail(
  userIds?: string[]
): Promise<UserAttendanceDetail[]> {
  // 获取本月日期范围
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const startDate = `${year}${String(month).padStart(2, '0')}01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}${String(month).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;
  
  console.log(`[feishu-attendance] 查询 ${year}年${month}月 考勤明细`);

  // 如果没有传入用户ID列表，从默认考勤组获取
  let targetUserIds = userIds;
  if (!targetUserIds || targetUserIds.length === 0) {
    const membersData = await readDefaultGroupMembers();
    if (!membersData || membersData.members.length === 0) {
      console.log('[feishu-attendance] 未找到默认考勤组成员');
      return [];
    }
    targetUserIds = membersData.members
      .map(m => m.user_id)
      .filter((id): id is string => !!id);
  }

  try {
    const stats = await queryAttendanceStats(startDate, endDate, targetUserIds);
    const attendanceDetails: UserAttendanceDetail[] = [];

    if (stats.user_datas) {
      stats.user_datas.forEach(user => {
        const leaveInfo: LeaveInfo[] = [];
        const lateDetails: LateDetail[] = [];
        let lateTimes = 0;

        user.datas?.forEach(item => {
          const title = item.title || '';
          const value = item.value || '';
          
          // 解析请假信息
          // 格式示例: "事假(下午)"、"病假(1天)"、"年假(0.5天)"
          const leaveMatch = value.match(/(事假|病假|年假|调休|婚假|产假|丧假)\(([\d.]+)?天?\)/);
          if (leaveMatch && !title.includes('迟到') && !title.includes('正常')) {
            leaveInfo.push({
              leaveType: leaveMatch[1],
              leaveDays: leaveMatch[2] || '0',
            });
          }
          
          // 解析每日打卡记录中的迟到信息
          // 格式如: "2025-03-04 星期二: 迟到9分钟(09:09),正常(18:13)"
          const dateMatch = title.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            const lateMatch = value.match(/迟到(\d+)分钟\((\d{2}:\d{2})\)/);
            if (lateMatch) {
              lateTimes++;
              lateDetails.push({
                date: dateMatch[1],
                punchInTime: lateMatch[2],
              });
            }
          }
        });

        // 如果没有从每日记录中解析到迟到次数，尝试从汇总字段获取
        if (lateTimes === 0) {
          const lateCountItem = user.datas?.find(item => 
            item.title?.includes('迟到次数') || item.code?.includes('late_count')
          );
          if (lateCountItem) {
            lateTimes = parseInt(lateCountItem.value, 10) || 0;
          }
        }

        attendanceDetails.push({
          name: user.name,
          leaveInfo,
          beLateInfo: {
            lateTimes,
            detail: lateDetails,
          },
        });
      });
    }

    console.log(`[feishu-attendance] 成功获取 ${attendanceDetails.length} 人考勤明细`);
    return attendanceDetails;
  } catch (error: any) {
    console.error('[feishu-attendance] 查询当月考勤明细失败:', error.message);
    throw error;
  }
}

/**
 * 查询考勤组下所有成�?
 * 
 * 获取指定考勤组中需要打卡的员工列表，并通过通讯录接口获取用户详细信息（头像、昵称等）�?
 * 
 * @param groupId - 考勤�?ID
 * @param pageSize - 每页数量，默认为 50
 * @returns 考勤组成员列表（含用户信息）
 * @throws 调用失败时抛出错�?
 * 
 * @example
 * ```typescript
 * // 获取考勤组成�?
 * const members = await getAttendanceGroupMembers('7414010894549975043');
 * console.log(`�?${members.total_count} 名成员`);
 * members.members.forEach(m => {
 *   console.log(`${m.userInfo?.name}: ${m.userInfo?.avatar?.avatar_72}`);
 * });
 * ```
 */
export async function getAttendanceGroupMembers(
  groupId: string,
  pageSize: number = 50
): Promise<AttendanceGroupMembersData> {
  if (!groupId) {
    throw new Error('考勤�?ID 不能为空');
  }

  console.log(`[feishu-attendance] 正在查询考勤组成�? ${groupId}`);

  try {
    // 1. 调用飞书 API 获取考勤组成员列�?
    const res = await client.attendance.v1.group.listUser({
      path: {
        group_id: groupId,
      },
      params: {
        employee_type: 'employee_id',
        dept_type: 'open_id',
        member_clock_type: 1, // 1-需要打卡的成员
        page_size: pageSize,
      },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    const userList = res.data?.users || [];
    const userIds = userList
      .map(u => u.user_id)
      .filter((id): id is string => !!id);

    console.log(`[feishu-attendance] 获取�?${userIds.length} 个成员ID`);

    // 2. 通过通讯录接口批量获取用户详细信�?
    let members: AttendanceGroupMember[] = [];
    
    if (userIds.length > 0) {
      // 分批获取用户信息（一次最�?50 个）
      const userInfos = await batchGetUserInfo(userIds, 'user_id');
      
      // 构建成员列表
      members = userList.map(user => {
        const userInfo = userInfos.find(u => u.user_id === user.user_id);
        return {
          user_id: user.user_id || '',
          department_ids: user.department_ids,
          userInfo: userInfo,
        };
      });
    }

    // 3. 获取考勤组名�?
    const groupDetail = await getAttendanceGroupDetail(groupId);
    const groupName = groupDetail?.group_name || '';

    const result: AttendanceGroupMembersData = {
      group_id: groupId,
      group_name: groupName,
      members: members,
      total_count: members.length,
    };

    console.log(`[feishu-attendance] �?成功获取考勤组成�? ${result.total_count} 人`);

    return result;
  } catch (error: any) {
    console.error('[feishu-attendance] 查询考勤组成员失�?', error.message || error);
    throw new Error(`查询考勤组成员失�? ${error.message || error}`);
  }
}

/**
 * 查询默认考勤组下所有成�?
 * 
 * 从缓存文件中读取默认考勤�?ID，获取成员列表后缓存到文件�?
 * 
 * @param pageSize - 每页数量，默认为 50
 * @returns 默认考勤组成员列表（含用户信息）
 * @throws 当默认考勤组不存在或调用失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 获取默认考勤组成员并缓存
 * const members = await getDefaultAttendanceGroupMembers();
 * console.log(`默认考勤�?"${members.group_name}" �?${members.total_count} 人`);
 * ```
 */
export async function getDefaultAttendanceGroupMembers(
  pageSize: number = 50
): Promise<AttendanceGroupMembersData> {
  console.log('[feishu-attendance] 正在查询默认考勤组成�?..');

  // 1. 从缓存文件中读取默认考勤�?
  const defaultGroup = await getDefaultAttendanceGroup();
  
  if (!defaultGroup) {
    throw new Error('δ�ҵ�Ĭ�Ͽ����飬���ȵ��� fetchAttendanceGroups() ��ȡ�������б�');
  }

  console.log(`[feishu-attendance] 默认考勤�? "${defaultGroup.group_name}" (${defaultGroup.group_id})`);

  // 2. 获取成员列表
  const membersData = await getAttendanceGroupMembers(defaultGroup.group_id, pageSize);

  // 3. 写入缓存文件
  await writeDefaultGroupMembers(membersData);

  return membersData;
}

/**
 * 获取默认考勤组详情及班次信息
 * 
 * 从缓存文件中读取默认考勤�?ID，获取详情后自动获取班次信息并缓存�?
 * 
 * @returns 考勤组详�?
 * @throws 当默认考勤组不存在或调用失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 获取默认考勤组详情（自动获取班次信息并缓存）
 * const detail = await getDefaultAttendanceGroupDetail();
 * console.log('考勤组名�?', detail.group_name);
 * 
 * // 读取缓存的班次信�?
 * const shiftsData = await readDefaultGroupShifts();
 * console.log('班次数量:', shiftsData?.total_count);
 * ```
 */
export async function getDefaultAttendanceGroupDetail(): Promise<AttendanceGroup> {
  console.log('[feishu-attendance] 正在获取默认考勤组详�?..');

  // 1. 从缓存文件中读取默认考勤�?
  const defaultGroup = await getDefaultAttendanceGroup();
  
  if (!defaultGroup) {
    throw new Error('δ�ҵ�Ĭ�Ͽ����飬���ȵ��� fetchAttendanceGroups() ��ȡ�������б�');
  }

  console.log(`[feishu-attendance] 默认考勤�? "${defaultGroup.group_name}" (${defaultGroup.group_id})`);

  // 2. 获取考勤组详�?
  const groupDetail = await getAttendanceGroupDetail(defaultGroup.group_id);
  
  if (!groupDetail) {
    throw new Error(`无法获取考勤组详�? ${defaultGroup.group_id}`);
  }

  // 3. 获取并缓存班次信�?
  await fetchAndCacheDefaultGroupShifts(groupDetail);

  return groupDetail;
}

/**
 * 获取并缓存默认考勤组的班次信息
 * 
 * 从默认考勤组的 punch_day_shift_ids 中提取班次ID，获取班次详情并缓存�?
 * 
 * @param group - 默认考勤组信�?
 * @returns 班次列表数据
 */
async function fetchAndCacheDefaultGroupShifts(group: AttendanceGroup): Promise<DefaultGroupShiftsData> {
  console.log(`[feishu-attendance] 正在获取默认考勤组的班次信息...`);

  // 1. 从考勤组详情缓存中读取完整�?punch_day_shift_ids
  // 注意：group 参数可能来自简化列表，需要读取详情缓存获取完整数�?
  let shiftIds: string[] = group.punch_day_shift_ids || [];
  
  // 如果 group 中没�?punch_day_shift_ids，尝试从详情缓存中读�?
  if (shiftIds.length === 0) {
    const groupDetail = await readDefaultGroupDetail();
    if (groupDetail && groupDetail.punch_day_shift_ids) {
      shiftIds = groupDetail.punch_day_shift_ids;
    }
  }
  
  // 2. 过滤掉小于等�?的值，并去�?
  const validShiftIds = [...new Set(shiftIds.filter(id => {
    const numId = parseInt(id, 10);
    return !isNaN(numId) && numId > 0;
  }))];

  console.log(`[feishu-attendance] 发现 ${validShiftIds.length} 个有效班次ID: [${validShiftIds.join(', ')}]`);

  // 3. 获取每个班次的详�?
  const shifts: Shift[] = [];
  for (const shiftId of validShiftIds) {
    try {
      const shift = await getShiftDetail(shiftId);
      if (shift) {
        shifts.push(shift);
      }
    } catch (error: any) {
      console.warn(`[feishu-attendance] 获取班次 ${shiftId} 详情失败: ${error.message}`);
    }
  }

  // 4. 构建班次数据
  const shiftsData: DefaultGroupShiftsData = {
    group_id: group.group_id,
    group_name: group.group_name,
    shifts: shifts,
    total_count: shifts.length,
  };

  // 5. 写入缓存文件
  await writeDefaultGroupShifts(shiftsData);

  console.log(`[feishu-attendance] �?成功获取并缓�?${shifts.length} 个班次信息`);

  return shiftsData;
}

/**
 * 写入默认考勤组班次列表缓存文�?
 * 
 * @param data - 班次列表数据
 */
async function writeDefaultGroupShifts(data: DefaultGroupShiftsData): Promise<void> {
  // 确保缓存目录存在
  const cacheDir = path.dirname(DEFAULT_GROUP_SHIFTS_PATH);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  try {
    // 添加缓存时间�?
    const dataToWrite = {
      ...data,
      _cached_at: new Date().toISOString(),
    };
    fs.writeFileSync(DEFAULT_GROUP_SHIFTS_PATH, JSON.stringify(dataToWrite, null, 2), 'utf-8');
    console.log(`[feishu-attendance] 默认考勤组班次列表已写入缓存: ${DEFAULT_GROUP_SHIFTS_PATH}`);
  } catch (error: any) {
    console.error(`[feishu-attendance] 写入默认考勤组班次缓存失�? ${error.message}`);
    // 不抛出错误，避免影响主流�?
  }
}

/**
 * 读取默认考勤组班次列表缓存文�?
 * 
 * @returns 默认考勤组班次数据，如果不存在返�?null
 */
export async function readDefaultGroupShifts(): Promise<DefaultGroupShiftsData | null> {
  if (!fs.existsSync(DEFAULT_GROUP_SHIFTS_PATH)) {
    return null;
  }

  try {
    const content = fs.readFileSync(DEFAULT_GROUP_SHIFTS_PATH, 'utf-8');
    const data = JSON.parse(content);
    // 移除内部使用的缓存时间戳字段
    delete data._cached_at;
    return data;
  } catch (error: any) {
    console.error('[feishu-attendance] 读取默认考勤组班次缓存失�?', error.message);
    return null;
  }
}

/**
 * 写入默认考勤组成员列表缓存文�?
 * 
 * @param data - 考勤组成员数�?
 */
async function writeDefaultGroupMembers(data: AttendanceGroupMembersData): Promise<void> {
  // 确保缓存目录存在
  const cacheDir = path.dirname(DEFAULT_GROUP_MEMBERS_PATH);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  try {
    // 添加缓存时间�?
    const dataToWrite = {
      ...data,
      _cached_at: new Date().toISOString(),
    };
    fs.writeFileSync(DEFAULT_GROUP_MEMBERS_PATH, JSON.stringify(dataToWrite, null, 2), 'utf-8');
    console.log(`[feishu-attendance] 默认考勤组成员列表已写入缓存: ${DEFAULT_GROUP_MEMBERS_PATH}`);
  } catch (error: any) {
    console.error(`[feishu-attendance] 写入默认考勤组成员缓存失�? ${error.message}`);
    // 不抛出错误，避免影响主流�?
  }
}

/**
 * 读取默认考勤组成员列表缓存文�?
 * 
 * @returns 默认考勤组成员数据，如果不存在返�?null
 */
export async function readDefaultGroupMembers(): Promise<AttendanceGroupMembersData | null> {
  if (!fs.existsSync(DEFAULT_GROUP_MEMBERS_PATH)) {
    return null;
  }

  try {
    const content = fs.readFileSync(DEFAULT_GROUP_MEMBERS_PATH, 'utf-8');
    const data = JSON.parse(content);
    // 移除内部使用的缓存时间戳字段
    delete data._cached_at;
    return data;
  } catch (error: any) {
    console.error('[feishu-attendance] 读取默认考勤组成员缓存失�?', error.message);
    return null;
  }
}

// ==================== 本地测试代码 ====================
// 取消下面的注释可以进行本地测试（需要先�?.env 中配置好凭证�?

// async function test() {
//   try {
//     // 测试获取考勤�?
//     console.log('=== 测试获取考勤�?===');
//     const groups = await fetchAttendanceGroups();
//     console.log('考勤组列�?', JSON.stringify(groups, null, 2));
// 
//     // 如果有考勤组，测试切换默认
//     if (groups.length > 1) {
//       console.log('\n=== 测试切换默认考勤�?===');
//       const secondGroupId = groups[1].group_id;
//       await setDefaultAttendanceGroup(secondGroupId);
//       
//       // 读取文件验证
//       const updatedGroups = await readCacheFile();
//       console.log('更新后的默认考勤�?', updatedGroups.find(g => g.isDefault)?.group_name);
//     }
//   } catch (error) {
//     console.error('测试失败:', error);
//   }
// }
// 
// test();
