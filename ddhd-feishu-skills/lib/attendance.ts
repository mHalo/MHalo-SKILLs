/**
 * 考勤 API 基础能力
 * 
 * 飞书文档: https://open.feishu.cn/document/server-docs/docs/attendance-v1/overview
 */

import { client } from './client';
import { batchGetUserInfo, UserInfo } from './contact';
import * as fs from 'fs';
import * as path from 'path';

// ============ 类型定义 ============

export interface AttendanceGroup {
  group_id: string;
  group_name?: string;
  type?: number;
  isDefault: boolean;
  punch_day_shift_ids?: string[];
  [key: string]: any;
}

export interface AttendanceGroupMember {
  user_id: string;
  department_ids?: string[];
  userInfo?: UserInfo;
}

export interface AttendanceGroupMembersData {
  group_id: string;
  group_name: string;
  members: AttendanceGroupMember[];
  total_count: number;
  _cached_at?: string;
}

export interface DefaultGroupShiftsData {
  group_id: string;
  group_name: string;
  shifts: Shift[];
  total_count: number;
  _cached_at?: string;
}

export interface Shift {
  shift_id: string;
  shift_name: string;
  punch_times: number;
  punch_time_rule: {
    on_time: string;
    off_time: string;
    late_minutes_as_late: number;
  }[];
}

export interface AttendanceStatsData {
  user_datas?: {
    name: string;
    user_id: string;
    datas?: {
      code: string;
      value: string;
      title?: string;
    }[];
  }[];
}

export interface TodayLateUser {
  name: string;
  punchInTime: string;
}

export interface LateDetail {
  date: string;
  punchInTime: string;
}

export interface LeaveInfo {
  leaveType: string;
  leaveDays: string;
}

export interface UserAttendanceDetail {
  name: string;
  leaveInfo: LeaveInfo[];
  beLateInfo: {
    lateTimes: number;
    detail: LateDetail[];
  };
}

// ============ 缓存路径 ============

const CACHE_DIR = path.resolve(process.cwd(), 'caches');
const CACHE_FILE_PATH = path.join(CACHE_DIR, 'attendance-group-list.json');
const DEFAULT_GROUP_DETAIL_PATH = path.join(CACHE_DIR, 'attendance-defaultGroup-detail.json');
const DEFAULT_GROUP_SHIFTS_PATH = path.join(CACHE_DIR, 'attendance-defaultGroup-shifts.json');
const DEFAULT_GROUP_MEMBERS_PATH = path.join(CACHE_DIR, 'attendance-defaultGroup-user.json');

// ============ 缓存工具 ============

async function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

async function readCacheFile(): Promise<AttendanceGroup[]> {
  await ensureCacheDir();
  if (!fs.existsSync(CACHE_FILE_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf-8'));
  } catch { return []; }
}

async function writeCacheFile(groups: AttendanceGroup[]): Promise<void> {
  await ensureCacheDir();
  fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(groups, null, 2), 'utf-8');
}

async function writeDefaultGroupDetail(group: AttendanceGroup): Promise<void> {
  await ensureCacheDir();
  fs.writeFileSync(DEFAULT_GROUP_DETAIL_PATH, JSON.stringify({ ...group, _cached_at: new Date().toISOString() }, null, 2), 'utf-8');
}

export async function readDefaultGroupDetail(): Promise<AttendanceGroup | null> {
  if (!fs.existsSync(DEFAULT_GROUP_DETAIL_PATH)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(DEFAULT_GROUP_DETAIL_PATH, 'utf-8'));
    delete data._cached_at;
    return data;
  } catch { return null; }
}

async function writeDefaultGroupShifts(data: DefaultGroupShiftsData): Promise<void> {
  await ensureCacheDir();
  fs.writeFileSync(DEFAULT_GROUP_SHIFTS_PATH, JSON.stringify({ ...data, _cached_at: new Date().toISOString() }, null, 2), 'utf-8');
}

export async function readDefaultGroupShifts(): Promise<DefaultGroupShiftsData | null> {
  if (!fs.existsSync(DEFAULT_GROUP_SHIFTS_PATH)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(DEFAULT_GROUP_SHIFTS_PATH, 'utf-8'));
    delete data._cached_at;
    return data;
  } catch { return null; }
}

async function writeDefaultGroupMembers(data: AttendanceGroupMembersData): Promise<void> {
  await ensureCacheDir();
  fs.writeFileSync(DEFAULT_GROUP_MEMBERS_PATH, JSON.stringify({ ...data, _cached_at: new Date().toISOString() }, null, 2), 'utf-8');
}

export async function readDefaultGroupMembers(): Promise<AttendanceGroupMembersData | null> {
  if (!fs.existsSync(DEFAULT_GROUP_MEMBERS_PATH)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(DEFAULT_GROUP_MEMBERS_PATH, 'utf-8'));
    delete data._cached_at;
    return data;
  } catch { return null; }
}

// ============ 考勤组 API ============

export async function fetchAttendanceGroups(pageSize: number = 50): Promise<AttendanceGroup[]> {
  console.log('[lib/attendance] 正在查询考勤组列表...');
  const res = await client.attendance.v1.group.list({ params: { page_size: pageSize } });
  if (res.code !== 0) throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
  
  const groups = (res.data?.group_list || []).map((g: any, i: number) => ({ ...g, isDefault: i === 0 }));
  await writeCacheFile(groups);
  console.log(`[lib/attendance] 成功获取 ${groups.length} 个考勤组`);
  return groups;
}

export async function setDefaultAttendanceGroup(groupId: string): Promise<AttendanceGroup[]> {
  const groups = await readCacheFile();
  if (groups.length === 0) throw new Error('缓存为空，请先调用 fetchAttendanceGroups()');
  
  const target = groups.find(g => g.group_id === groupId);
  if (!target) throw new Error(`未找到考勤组 ${groupId}`);
  
  groups.forEach(g => g.isDefault = g.group_id === groupId);
  await writeCacheFile(groups);
  console.log(`[lib/attendance] 默认考勤组已更新: "${target.group_name}"`);
  return groups;
}

export async function getAttendanceGroupDetail(groupId: string): Promise<AttendanceGroup | null> {
  const res = await client.attendance.v1.group.get({
    path: { group_id: groupId },
    params: { employee_type: 'employee_id', dept_type: 'open_id' },
  });
  if (res.code !== 0) return null;
  
  const cached = (await readCacheFile()).find(g => g.group_id === groupId);
  const result = { ...res.data, group_id: groupId, isDefault: cached?.isDefault || false };
  
  if (result.isDefault) await writeDefaultGroupDetail(result);
  return result;
}

export async function getDefaultAttendanceGroup(): Promise<AttendanceGroup | null> {
  return (await readCacheFile()).find(g => g.isDefault) || null;
}

export async function getAttendanceGroupMembers(groupId: string, pageSize: number = 50): Promise<AttendanceGroupMembersData> {
  const res = await client.attendance.v1.group.listUser({
    path: { group_id: groupId },
    params: { employee_type: 'employee_id', dept_type: 'open_id', member_clock_type: 1, page_size: pageSize },
  });
  if (res.code !== 0) throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
  
  const users = res.data?.users || [];
  const userIds = users.map((u: any) => u.user_id).filter(Boolean);
  
  let members: AttendanceGroupMember[] = [];
  if (userIds.length > 0) {
    const infos = await batchGetUserInfo(userIds, 'user_id');
    members = users.map((u: any) => ({ user_id: u.user_id, department_ids: u.department_ids, userInfo: infos.find(i => i.user_id === u.user_id) }));
  }
  
  const detail = await getAttendanceGroupDetail(groupId);
  return { group_id: groupId, group_name: detail?.group_name || '', members, total_count: members.length };
}

export async function getDefaultAttendanceGroupMembers(pageSize: number = 50): Promise<AttendanceGroupMembersData> {
  const group = await getDefaultAttendanceGroup();
  if (!group) throw new Error('未找到默认考勤组');
  const data = await getAttendanceGroupMembers(group.group_id, pageSize);
  await writeDefaultGroupMembers(data);
  return data;
}

// ============ 班次 API ============

export async function getShiftDetail(shiftId: string): Promise<Shift | null> {
  try {
    const res = await client.attendance.v1.shift.get({ path: { shift_id: shiftId } });
    if (res.code !== 0) return null;
    return res.data as Shift;
  } catch { return null; }
}

// ============ 统计 API ============

export async function queryAttendanceStats(startDate: string, endDate: string, userIds: string[]): Promise<AttendanceStatsData> {
  const res = await client.attendance.v1.userStatsData.query({
    params: { employee_type: 'employee_id' },
    data: {
      locale: 'zh', stats_type: 'month',
      start_date: parseInt(startDate, 10), end_date: parseInt(endDate, 10),
      user_ids: userIds, current_group_only: true, user_id: userIds[0],
    },
  });
  if (res.code !== 0) throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
  return { user_datas: res.data?.user_datas };
}

export async function getTodayLateUsers(userIds?: string[]): Promise<TodayLateUser[]> {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  
  let targetIds = userIds;
  if (!targetIds) {
    const members = await readDefaultGroupMembers();
    if (!members) return [];
    targetIds = members.members.map(m => m.user_id).filter(Boolean);
  }
  
  const stats = await queryAttendanceStats(dateStr, dateStr, targetIds);
  const lateUsers: TodayLateUser[] = [];
  
  stats.user_datas?.forEach(user => {
    const record = user.datas?.find(d => d.title?.includes(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`));
    if (record) {
      const match = record.value?.match(/迟到\d+分钟\((\d{2}:\d{2})\)/);
      if (match) lateUsers.push({ name: user.name, punchInTime: match[1] });
    }
  });
  
  return lateUsers;
}

export async function getMonthlyAttendanceDetail(userIds?: string[]): Promise<UserAttendanceDetail[]> {
  const now = new Date();
  const startDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}01`;
  const endDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  
  let targetIds = userIds;
  if (!targetIds) {
    const members = await readDefaultGroupMembers();
    if (!members) return [];
    targetIds = members.members.map(m => m.user_id).filter(Boolean);
  }
  
  const stats = await queryAttendanceStats(startDate, endDate, targetIds);
  
  return (stats.user_datas || []).map(user => {
    const leaveInfo: LeaveInfo[] = [];
    const lateDetails: LateDetail[] = [];
    let lateTimes = 0;
    
    user.datas?.forEach(item => {
      const leaveMatch = item.value?.match(/(事假|病假|年假|调休|婚假|产假|丧假)\(([\d.]+)?天?\)/);
      if (leaveMatch && !item.title?.includes('迟到')) {
        leaveInfo.push({ leaveType: leaveMatch[1], leaveDays: leaveMatch[2] || '0' });
      }
      
      const dateMatch = item.title?.match(/(\d{4}-\d{2}-\d{2})/);
      const lateMatch = item.value?.match(/迟到(\d+)分钟\((\d{2}:\d{2})\)/);
      if (dateMatch && lateMatch) {
        lateTimes++;
        lateDetails.push({ date: dateMatch[1], punchInTime: lateMatch[2] });
      }
    });
    
    return { name: user.name, leaveInfo, beLateInfo: { lateTimes, detail: lateDetails } };
  });
}

// ============ 默认考勤组详情及班次 ============

export async function getDefaultAttendanceGroupDetail(): Promise<AttendanceGroup> {
  const group = await getDefaultAttendanceGroup();
  if (!group) throw new Error('未找到默认考勤组');
  
  const detail = await getAttendanceGroupDetail(group.group_id);
  if (!detail) throw new Error('无法获取考勤组详情');
  
  // 获取班次
  const shiftIds = [...new Set((detail.punch_day_shift_ids || []).filter((id: string) => parseInt(id, 10) > 0))];
  const shifts: Shift[] = [];
  for (const id of shiftIds) {
    const shift = await getShiftDetail(id);
    if (shift) shifts.push(shift);
  }
  
  await writeDefaultGroupShifts({ group_id: group.group_id, group_name: group.group_name || '', shifts, total_count: shifts.length });
  return detail;
}
