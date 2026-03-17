#!/usr/bin/env ts-node
/**
 * 通讯录查询
 * 
 * 场景描述: 查询员工信息，支持单人和批量查询
 * 
 * 使用的基础能力:
 * - lib/contact.ts - getUserInfo, batchGetUserInfo
 * 
 * 使用方法:
 * ```bash
 * npx ts-node scripts/contact-query.ts -i <user_id>
 * npx ts-node scripts/contact-query.ts --ids <id1>,<id2>,<id3>
 * ```
 */

import { getUserInfo, batchGetUserInfo } from '../lib/contact';

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
通讯录查询

用法: npx ts-node scripts/contact-query.ts [选项]

选项:
  -i, --id            查询单个用户 ID
      --ids           批量查询用户 ID，逗号分隔
  -t, --type          ID 类型: open_id | union_id | user_id（默认: user_id）
  -o, --output        输出文件路径（JSON 格式）
  -h, --help          显示帮助信息

示例:
  npx ts-node scripts/contact-query.ts -i user_xxx                    # 查询单个用户
  npx ts-node scripts/contact-query.ts -i ou_xxx -t open_id           # 使用 open_id 查询
  npx ts-node scripts/contact-query.ts --ids user_xxx,user_yyy        # 批量查询
  npx ts-node scripts/contact-query.ts -i user_xxx -o ./user.json     # 保存到文件
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);
  const id = options.i || options.id;
  const idsStr = options.ids;
  const idType = (options.t || options.type || 'user_id') as 'open_id' | 'union_id' | 'user_id';
  const outputPath = options.o || options.output;

  try {
    let result: any;

    if (id) {
      const user = await getUserInfo(id, idType);
      if (user) {
        result = user;
        console.log('\n✅ 查询成功!');
        console.log(JSON.stringify(user, null, 2));
      } else {
        console.log('\n⚠️ 用户不存在');
        process.exit(1);
      }
    } else if (idsStr) {
      const ids = idsStr.split(',').map((id: string) => id.trim());
      const users = await batchGetUserInfo(ids, idType);
      result = users;
      console.log(`\n✅ 成功查询 ${users.length} 个用户信息!`);
      console.log(JSON.stringify(users, null, 2));
    } else {
      console.error('错误: 请指定 --id 或 --ids 参数');
      printUsage();
      process.exit(1);
    }

    if (outputPath) {
      const fs = require('fs');
      const path = require('path');
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
      console.log(`\n💾 数据已保存到: ${outputPath}`);
    }
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
