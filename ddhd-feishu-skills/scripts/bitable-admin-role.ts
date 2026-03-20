#!/usr/bin/env ts-node
/**
 * 多维表格管理员角色设置
 * 
 * 场景描述: 为指定的多维表格创建管理员角色，并将指定用户添加为该角色的协作者
 * 
 * 使用的基础能力:
 * - lib/bitable-role.ts - getOrCreateRole, createAppRole
 * - lib/bitable-collaborator.ts - addCollaborator
 * 
 * 使用方法:
 * ```bash
 * # 添加单个用户为管理员
 * npx ts-node scripts/bitable-admin-role.ts \
 *   --app-token TXjubgZxOagBfOs0eMgctRPZnhf \
 *   --user-id ou_da073ce51bb1f01ca80226f92570c9d0
 * 
 * # 指定成员类型
 * npx ts-node scripts/bitable-admin-role.ts \
 *   --app-token TXjubgZxOagBfOs0eMgctRPZnhf \
 *   --user-id ou_da073ce51bb1f01ca80226f92570c9d0 \
 *   --member-type open_id
 * ```
 */

import { getOrCreateRole, createAppRole, type TableRoleConfig } from '../lib/bitable-role';
import { addCollaborator } from '../lib/bitable-collaborator';
import { client } from '../lib/client';

// ============ 参数解析 ============

function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
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
    } else if (!result.command) {
      result.command = arg;
    }
  }
  return result;
}

function printUsage() {
  console.log(`
多维表格管理员角色设置

为指定的多维表格创建管理员角色，并将指定用户添加为该角色的协作者。
管理员拥有表格的完全管理权限（table_perm = 4）。

用法: npx ts-node scripts/bitable-admin-role.ts [选项]

必需选项:
  --app-token, -a     多维表格应用 token（必需）
  --user-id, -u       用户 ID（必需，open_id/union_id/user_id）

可选选项:
  --member-type, -t   成员类型: open_id(默认)/union_id/user_id
  --role-name, -r     角色名称（默认: 管理员）

示例:
  # 添加单个用户为管理员（使用 open_id）
  npx ts-node scripts/bitable-admin-role.ts \\
    --app-token TXjubgZxOagBfOs0eMgctRPZnhf \\
    --user-id ou_da073ce51bb1f01ca80226f92570c9d0

  # 使用 union_id
  npx ts-node scripts/bitable-admin-role.ts \\
    --app-token TXjubgZxOagBfOs0eMgctRPZnhf \\
    --user-id on_xxxxxxxx \\
    --member-type union_id
`);
}

// ============ 主程序 ============

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);

  // 获取参数
  const appToken = options['app-token'] as string || options.a as string;
  const userId = options['user-id'] as string || options.u as string;
  const memberType = (options['member-type'] as string) || (options.t as string) || 'open_id';
  const roleName = (options['role-name'] as string) || (options.r as string) || '管理员';

  // 验证必需参数
  if (!appToken) {
    console.error('❌ 错误: 缺少必需参数 --app-token');
    printUsage();
    process.exit(1);
  }

  if (!userId) {
    console.error('❌ 错误: 缺少必需参数 --user-id');
    printUsage();
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('多维表格管理员角色设置');
  console.log('='.repeat(60));
  console.log(`应用 Token: ${appToken}`);
  console.log(`用户 ID: ${userId}`);
  console.log(`成员类型: ${memberType}`);
  console.log(`角色名称: ${roleName}`);
  console.log('='.repeat(60) + '\n');

  try {
    // 步骤 0: 检查并开启高级权限
    console.log('步骤 0/3: 检查并开启高级权限...\n');
    
    const appInfo: any = await client.bitable.v1.app.get({
      path: { app_token: appToken }
    });
    
    if (!appInfo.data?.app?.is_advanced) {
      console.log('应用未开启高级权限，正在开启...');
      const updateRes: any = await client.bitable.v1.app.update({
        path: { app_token: appToken },
        data: { is_advanced: true }
      });
      
      if (updateRes.code !== 0) {
        console.error('❌ 开启高级权限失败:', updateRes.msg);
        console.log('提示: 请手动在多维表格设置中开启高级权限');
        process.exit(1);
      }
      console.log('✅ 高级权限开启成功\n');
    } else {
      console.log('✅ 高级权限已开启\n');
    }

    // 步骤 1: 创建管理员角色
    console.log('步骤 1/3: 创建/获取管理员角色...\n');
    
    const tableRoles: TableRoleConfig[] = [
      {
        table_perm: 4, // 可管理
        allow_add_record: true,
        allow_delete_record: true,
      }
    ];

    const roleResult = await createAppRole(appToken, roleName, tableRoles);
    
    if (!roleResult.success || !roleResult.role_id) {
      console.error('❌ 创建角色失败:', roleResult.error);
      process.exit(1);
    }

    const roleId = roleResult.role_id;
    console.log(`✅ 角色创建/获取成功: ${roleId}\n`);

    // 步骤 2: 添加用户为角色协作者
    console.log('步骤 2/3: 添加用户为角色协作者...\n');

    const addResult = await addCollaborator(
      appToken,
      roleId,
      userId,
      memberType as any
    );

    if (!addResult.success) {
      console.error('❌ 添加协作者失败:', addResult.error);
      process.exit(1);
    }

    console.log(`✅ 协作者添加成功!\n`);

    // 输出总结
    console.log('='.repeat(60));
    console.log('操作完成');
    console.log('='.repeat(60));
    console.log(`角色 ID: ${roleId}`);
    console.log(`角色名称: ${roleName}`);
    console.log(`用户 ID: ${userId}`);
    console.log(`权限级别: 可管理 (table_perm = 4)`);
    console.log('='.repeat(60) + '\n');

  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ 错误:', error.message);
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// 执行
main();
