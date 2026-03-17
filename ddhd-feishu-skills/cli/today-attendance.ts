#!/usr/bin/env ts-node
/**
 * 今日考勤报告 CLI
 * 
 * 业务场景：快速获取当日考勤概况，包括迟到人员统计
 * 
 * 用法：
 *   npx today-attendance
 *   npx today-attendance --late-only
 *   npx today-attendance --output ./report.json
 */

import { 
  getTodayAttendanceInfo, 
  printAttendanceReport 
} from '../scripts/feishu-attendance-today';
import * as fs from 'fs';
import * as path from 'path';

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
    }
  }
  return result;
}

function printUsage() {
  console.log(`
今日考勤报告

用法: npx today-attendance [选项]

选项:
  --late-only         只显示迟到人员
  --output, -o        输出文件路径（JSON 格式）
  --group-id, -g      指定考勤组 ID（默认使用默认考勤组）
  --all-members       包含所有成员列表
  -h, --help          显示帮助信息

示例:
  npx today-attendance                    # 显示完整报告
  npx today-attendance --late-only        # 只看迟到人员
  npx today-attendance -o ./report.json   # 保存到文件
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
