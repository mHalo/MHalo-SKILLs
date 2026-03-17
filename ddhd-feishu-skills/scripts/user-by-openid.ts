#!/usr/bin/env ts-node
/**
 * 通过 Open ID 获取用户信息
 * 
 * 场景描述: 使用用户的 open_id 获取详细信息，包括手机号、邮箱、性别等
 * 
 * 使用的基础能力:
 * - lib/contact.ts - getUserInfo
 * 
 * 使用方法:
 * ```bash
 * npx ts-node scripts/user-by-openid.ts -i <open_id>
 * npx ts-node scripts/user-by-openid.ts -i ou_xxxxxxxxxxxxxxxx --output ./user.json
 * ```
 */

import { getUserInfo, UserInfo } from '../lib/contact';
import * as fs from 'fs';
import * as path from 'path';

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace('--', '');
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        result[key] = value;
        i++;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.replace('-', '');
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        result[key] = value;
        i++;
      }
    }
  }
  return result;
}

function printUsage() {
  console.log(`
通过 Open ID 获取用户信息

用法: npx ts-node scripts/user-by-openid.ts [选项]

选项:
  -i, --id            用户的 open_id（必需）
  -o, --output        输出文件路径（JSON 格式）
  -h, --help          显示帮助信息

示例:
  npx ts-node scripts/user-by-openid.ts -i ou_xxxxxxxxxxxxxxxx
  npx ts-node scripts/user-by-openid.ts -i ou_xxxxxxxxxxxxxxxx -o ./user.json
`);
}

function printUserInfo(user: UserInfo) {
  console.log('\n' + '='.repeat(50));
  console.log('👤 用户信息');
  console.log('='.repeat(50));
  console.log(`姓名: ${user.name}`);
  console.log(`英文名: ${user.en_name || '-'}`);
  console.log(`手机号: ${user.mobile || '无权限/未填写'}`);
  console.log(`邮箱: ${user.email || '无权限/未填写'}`);
  console.log(`用户ID: ${user.user_id}`);
  console.log(`部门: ${user.department_names?.join(', ') || '-'}`);
  console.log(`职位: ${user.job_title || '-'}`);
  
  if (user.avatar?.avatar_72) {
    console.log(`头像: ${user.avatar.avatar_72}`);
  }
  
  if (user.status) {
    const status = [];
    if (user.status.is_activated) status.push('已激活');
    if (user.status.is_frozen) status.push('已冻结');
    if (user.status.is_resigned) status.push('已离职');
    console.log(`状态: ${status.join(', ') || '正常'}`);
  }
  
  console.log('='.repeat(50) + '\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);
  const openId = options.i || options.id;
  const outputPath = options.o || options.output;

  if (!openId) {
    console.error('❌ 错误: 请提供用户的 open_id');
    printUsage();
    process.exit(1);
  }

  try {
    console.log(`🔍 正在查询用户: ${openId}...\n`);
    
    const user = await getUserInfo(openId, 'open_id');
    
    if (!user) {
      console.error(`❌ 未找到用户: ${openId}`);
      process.exit(1);
    }

    // 输出到控制台
    printUserInfo(user);

    // 如果需要保存到文件
    if (outputPath) {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath, JSON.stringify(user, null, 2), 'utf-8');
      console.log(`💾 数据已保存到: ${outputPath}\n`);
    }
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
