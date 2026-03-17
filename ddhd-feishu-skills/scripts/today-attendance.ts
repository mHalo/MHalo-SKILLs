#!/usr/bin/env ts-node
/**
 * 今日考勤报告
 * 
 * 场景描述: 快速获取当日考勤概况，包括迟到人员统计和出勤率计算
 * 
 * 使用的基础能力:
 * - lib/attendance.ts - getTodayLateUsers, getAttendanceGroupMembers, getDefaultAttendanceGroupMembers
 * 
 * 使用方法:
 * ```bash
 * npx ts-node scripts/today-attendance.ts
 * npx ts-node scripts/today-attendance.ts --late-only
 * npx ts-node scripts/today-attendance.ts -o ./report.json
 * ```
 */

import { 
  getTodayLateUsers, 
  getAttendanceGroupMembers,
  getDefaultAttendanceGroupMembers,
  AttendanceGroupMembersData,
  TodayLateUser 
} from '../lib/attendance';
import * as fs from 'fs';
import * as path from 'path';

// ============ 业务逻辑 ============

export interface TodayAttendanceInfo {
  date: string;
  group: { group_id: string; group_name: string };
  totalCount: number;
  lateCount: number;
  lateRate: string;
  normalRate: string;
  lateUsers: TodayLateUser[];
  allMembers?: string[];
}

/**
 * 获取当日考勤信息
 */
async function getTodayAttendanceInfo(
  groupId?: string,
  includeAllMembers: boolean = false
): Promise<TodayAttendanceInfo> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  console.log(`[today-attendance] 正在获取 ${dateStr} 考勤信息...`);

  const membersData = groupId 
    ? await getAttendanceGroupMembers(groupId)
    : await getDefaultAttendanceGroupMembers();

  const memberIds = membersData.members.map(m => m.user_id).filter(Boolean);
  const lateUsers = await getTodayLateUsers(memberIds);

  const totalCount = membersData.total_count;
  const lateCount = lateUsers.length;
  const lateRate = totalCount > 0 ? ((lateCount / totalCount) * 100).toFixed(1) : '0.0';
  const normalRate = totalCount > 0 ? (((totalCount - lateCount) / totalCount) * 100).toFixed(1) : '0.0';

  const result: TodayAttendanceInfo = {
    date: dateStr,
    group: { group_id: membersData.group_id, group_name: membersData.group_name },
    totalCount,
    lateCount,
    lateRate: `${lateRate}%`,
    normalRate: `${normalRate}%`,
    lateUsers,
  };

  if (includeAllMembers) {
    result.allMembers = membersData.members.map(m => m.userInfo?.name || m.user_id);
  }

  console.log(`[today-attendance] 完成 - 迟到率: ${lateRate}%`);
  return result;
}

/**
 * 打印考勤报告
 */
function printAttendanceReport(info: TodayAttendanceInfo) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 当日考勤报告');
  console.log('='.repeat(50));
  console.log(`📅 日期: ${info.date}`);
  console.log(`👥 考勤组: ${info.group.group_name}`);
  console.log('-'.repeat(50));
  console.log(`📈 迟到率: ${info.lateRate} | ✅ 正常: ${info.normalRate}`);
  console.log('-'.repeat(50));

  if (info.lateUsers.length > 0) {
    console.log('\n⏰ 迟到人员:');
    info.lateUsers.forEach((u, i) => console.log(`  ${i + 1}. ${u.name} - ${u.punchInTime}`));
  } else {
    console.log('\n🎉 今日无人迟到！');
  }

  console.log('='.repeat(50) + '\n');
}

// ============ CLI ============

function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--late-only' || arg === '--all-members') {
      result[arg.replace('--', '')] = true;
    } else if (arg.startsWith('--')) {
      const key = arg.replace('--', '');
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        result[key] = value;
        i++;
      } else {
        result[key] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.replace('-', '');
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        result[key] = value;
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

function printUsage() {
  console.log(`
今日考勤报告

用法: npx ts-node scripts/today-attendance.ts [选项]

选项:
  --late-only         只显示迟到人员
  --output, -o        输出文件路径（JSON 格式）
  --group-id, -g      指定考勤组 ID（默认使用默认考勤组）
  --all-members       包含所有成员列表
  -h, --help          显示帮助信息

示例:
  npx ts-node scripts/today-attendance.ts                    # 显示完整报告
  npx ts-node scripts/today-attendance.ts --late-only        # 只看迟到人员
  npx ts-node scripts/today-attendance.ts -o ./report.json   # 保存到文件
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);
  const groupId = options.g || options['group-id'];
  const outputPath = options.o || options.output;
  const lateOnly = options['late-only'] === true;
  const includeAllMembers = options['all-members'] === true;

  try {
    const info = await getTodayAttendanceInfo(
      groupId as string | undefined,
      includeAllMembers
    );

    if (lateOnly) {
      if (info.lateUsers.length === 0) {
        console.log('\n🎉 今日无人迟到！\n');
      } else {
        console.log(`\n⏰ 今日迟到人员 (${info.lateCount}人):\n`);
        info.lateUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name} - 打卡时间: ${user.punchInTime}`);
        });
        console.log('');
      }
      return;
    }

    printAttendanceReport(info);

    if (outputPath) {
      const outputDir = path.dirname(outputPath as string);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath as string, JSON.stringify(info, null, 2), 'utf-8');
      console.log(`💾 数据已保存到: ${outputPath}\n`);
    }
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
