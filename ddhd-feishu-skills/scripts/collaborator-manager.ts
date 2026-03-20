#!/usr/bin/env ts-node
/**
 * 多维表格自定义角色协作者管理
 * 
 * ⚠️ 重要说明：
 * 本脚本用于管理【自定义角色】的协作者，不是管理整个多维表格的协作者。
 * 使用本脚本前，需要先在多维表格中创建自定义角色，获取 role_id。
 * 
 * 场景描述: 为指定的多维表格自定义角色添加、查看、删除协作者，支持批量操作
 * 
 * 使用的基础能力:
 * - lib/bitable-collaborator.ts - listCollaborators, addCollaborator, batchAddCollaborators, 
 *   removeCollaborator, batchRemoveCollaborators, listAppRoles
 * 
 * 使用方法:
 * ```bash
 * # 列出所有自定义角色
 * npx ts-node scripts/collaborator-manager.ts roles --app-token bascxxxxxxxx
 * 
 * # 列出角色的所有协作者
 * npx ts-node scripts/collaborator-manager.ts list \
 *   --app-token bascxxxxxxxx \
 *   --role-id rol_xxxxxxxx
 * 
 * # 添加单个协作者
 * npx ts-node scripts/collaborator-manager.ts add \
 *   --app-token bascxxxxxxxx \
 *   --role-id rol_xxxxxxxx \
 *   --user-id ou_xxxxxxxx
 * 
 * # 批量添加协作者（从JSON文件）
 * npx ts-node scripts/collaborator-manager.ts batch-add \
 *   --app-token bascxxxxxxxx \
 *   --role-id rol_xxxxxxxx \
 *   --file ./collaborators.json
 * 
 * # 删除协作者
 * npx ts-node scripts/collaborator-manager.ts remove \
 *   --app-token bascxxxxxxxx \
 *   --role-id rol_xxxxxxxx \
 *   --user-id ou_xxxxxxxx
 * ```
 */

import {
  listCollaborators,
  addCollaborator,
  batchAddCollaborators,
  removeCollaborator,
  batchRemoveCollaborators,
  addCollaboratorsToRole,
  listAppRoles,
  type CollaboratorMemberType,
  type CollaboratorResult,
} from '../lib/bitable-collaborator';
import * as fs from 'fs';
import * as path from 'path';

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
多维表格自定义角色协作者管理

⚠️  本脚本用于管理【自定义角色】的协作者，不是管理整个多维表格的协作者。
    使用本脚本前，需要先在多维表格中创建自定义角色，获取 role_id。

用法: npx ts-node scripts/collaborator-manager.ts <命令> [选项]

命令:
  roles               列出所有自定义角色
  list                列出角色的所有协作者
  add                 添加单个协作者
  batch-add           批量添加协作者
  remove              删除单个协作者
  batch-remove        批量删除协作者

roles 选项:
  --app-token, -a     应用 token（必需）

list 选项:
  --app-token, -a     应用 token（必需）
  --role-id, -r       角色 ID（必需）
  --output, -o        输出到文件（JSON格式）

add 选项:
  --app-token, -a     应用 token（必需）
  --role-id, -r       角色 ID（必需）
  --user-id, -u       用户 ID（必需）
  --type, -t          成员类型：open_id/union_id/user_id/chat_id/department_id/open_department_id，默认：open_id

batch-add 选项:
  --app-token, -a     应用 token（必需）
  --role-id, -r       角色 ID（必需）
  --file, -f          协作者列表 JSON 文件路径（必需）
  
  JSON 文件格式示例:
  [
    { "memberId": "ou_xxx", "memberType": "open_id" },
    { "memberId": "ou_yyy", "memberType": "open_id" }
  ]

remove 选项:
  --app-token, -a     应用 token（必需）
  --role-id, -r       角色 ID（必需）
  --user-id, -u       用户 ID（必需）
  --type, -t          成员类型，默认：open_id

batch-remove 选项:
  --app-token, -a     应用 token（必需）
  --role-id, -r       角色 ID（必需）
  --file, -f          要删除的协作者列表 JSON 文件路径（必需）

成员类型说明:
  open_id          - 用户的 open_id（默认）
  union_id         - 用户的 union_id
  user_id          - 用户的 user_id
  chat_id          - 群组 ID
  department_id    - 部门 ID
  open_department_id - 部门的 open_department_id

示例:
  # 列出所有自定义角色
  npx ts-node scripts/collaborator-manager.ts roles --app-token bascxxxxxxxx

  # 列出角色的所有协作者
  npx ts-node scripts/collaborator-manager.ts list \\
    --app-token bascxxxxxxxx \\
    --role-id rol_xxxxxxxx

  # 添加单个用户
  npx ts-node scripts/collaborator-manager.ts add \\
    --app-token bascxxxxxxxx \\
    --role-id rol_xxxxxxxx \\
    --user-id ou_da073ce51bb1f01ca80226f92570c9d0

  # 批量添加协作者
  npx ts-node scripts/collaborator-manager.ts batch-add \\
    --app-token bascxxxxxxxx \\
    --role-id rol_xxxxxxxx \\
    --file ./collaborators.json

  # 删除协作者
  npx ts-node scripts/collaborator-manager.ts remove \\
    --app-token bascxxxxxxxx \\
    --role-id rol_xxxxxxxx \\
    --user-id ou_xxxxxxxx
`);
}

// ============ 命令实现 ============

/**
 * 列出自定义角色
 */
async function handleRoles(appToken: string): Promise<void> {
  console.log('\n📋 获取自定义角色列表...\n');
  
  const result = await listAppRoles(appToken);
  
  console.log('='.repeat(60));
  console.log(`共 ${result.items.length} 个自定义角色\n`);
  
  if (result.items.length === 0) {
    console.log('暂无自定义角色');
    console.log('提示：请在多维表格的「设置」-「高级权限」-「自定义角色」中创建角色');
  } else {
    result.items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.role_name}`);
      console.log(`   角色 ID: ${item.role_id}`);
      console.log(`   表格权限数: ${item.table_roles?.length || 0}`);
      console.log();
    });
  }
  
  console.log('='.repeat(60));
}

/**
 * 列出协作者
 */
async function handleList(appToken: string, roleId: string, outputPath?: string): Promise<void> {
  console.log(`\n📋 获取角色 ${roleId} 的协作者列表...\n`);
  
  const result = await listCollaborators(appToken, roleId);
  
  console.log('='.repeat(60));
  console.log(`共 ${result.items.length} 个协作者\n`);
  
  if (result.items.length === 0) {
    console.log('暂无协作者');
  } else {
    result.items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.member_name || item.member_id}`);
      console.log(`   成员 ID: ${item.member_id}`);
      console.log(`   类型: ${item.member_type}`);
      if (item.member_en_name) {
        console.log(`   英文名: ${item.member_en_name}`);
      }
      console.log();
    });
  }
  
  if (result.has_more) {
    console.log('⚠️ 还有更多协作者，可使用分页获取');
  }
  
  console.log('='.repeat(60));
  
  // 输出到文件
  if (outputPath) {
    const outputData = {
      app_token: appToken,
      role_id: roleId,
      total: result.total || result.items.length,
      items: result.items,
    };
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
    console.log(`\n💾 结果已保存到: ${outputPath}`);
  }
}

/**
 * 添加单个协作者
 */
async function handleAdd(
  appToken: string,
  roleId: string,
  userId: string,
  memberType: string
): Promise<void> {
  console.log(`\n➕ 添加协作者到角色 ${roleId}...\n`);
  
  const validTypes = ['open_id', 'union_id', 'user_id', 'chat_id', 'department_id', 'open_department_id'];
  
  if (!validTypes.includes(memberType)) {
    console.error(`❌ 无效的成员类型: ${memberType}`);
    console.error('有效类型: open_id, union_id, user_id, chat_id, department_id, open_department_id');
    process.exit(1);
  }
  
  const result = await addCollaborator(
    appToken,
    roleId,
    userId,
    memberType as CollaboratorMemberType
  );
  
  console.log('='.repeat(60));
  if (result.success) {
    console.log('✅ 协作者添加成功！');
    console.log(`成员 ID: ${result.member_id}`);
    console.log(`成员类型: ${result.member_type}`);
  } else {
    console.log('❌ 协作者添加失败！');
    console.log(`成员 ID: ${result.member_id}`);
    console.log(`错误: ${result.error}`);
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * 批量添加协作者
 */
async function handleBatchAdd(appToken: string, roleId: string, filePath: string): Promise<void> {
  console.log(`\n➕ 批量添加协作者到角色 ${roleId}...\n`);
  
  // 读取文件
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }
  
  let members: {
    memberId: string;
    memberType: CollaboratorMemberType;
  }[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('文件内容必须是数组');
    }
    
    members = data.map((item: any) => ({
      memberId: item.memberId || item.member_id || item.id,
      memberType: item.memberType || item.member_type || item.type || 'open_id',
    }));
  } catch (err: any) {
    console.error(`❌ 读取文件失败: ${err.message}`);
    process.exit(1);
  }
  
  console.log(`从文件读取到 ${members.length} 个协作者`);
  console.log('开始批量添加...\n');
  
  const result = await addCollaboratorsToRole(appToken, roleId, members);
  
  console.log('\n' + '='.repeat(60));
  console.log('批量添加结果');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${result.success.length}`);
  console.log(`❌ 失败: ${result.failed.length}`);
  
  if (result.failed.length > 0) {
    console.log('\n失败的协作者:');
    result.failed.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.member_id}: ${item.error}`);
    });
  }
  
  console.log('='.repeat(60) + '\n');
}

/**
 * 删除协作者
 */
async function handleRemove(
  appToken: string,
  roleId: string,
  userId: string,
  memberType: string
): Promise<void> {
  console.log(`\n🗑️  从角色 ${roleId} 删除协作者...\n`);
  
  const validTypes = ['open_id', 'union_id', 'user_id', 'chat_id', 'department_id', 'open_department_id'];
  
  if (!validTypes.includes(memberType)) {
    console.error(`❌ 无效的成员类型: ${memberType}`);
    console.error('有效类型: open_id, union_id, user_id, chat_id, department_id, open_department_id');
    process.exit(1);
  }
  
  const success = await removeCollaborator(
    appToken,
    roleId,
    userId,
    memberType as CollaboratorMemberType
  );
  
  console.log('='.repeat(60));
  if (success) {
    console.log('✅ 协作者删除成功！');
    console.log(`成员 ID: ${userId}`);
  } else {
    console.log('❌ 协作者删除失败！');
    console.log(`成员 ID: ${userId}`);
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * 批量删除协作者
 */
async function handleBatchRemove(appToken: string, roleId: string, filePath: string): Promise<void> {
  console.log(`\n🗑️  批量删除角色 ${roleId} 的协作者...\n`);
  
  // 读取文件
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }
  
  let members: {
    memberId: string;
    memberType: CollaboratorMemberType;
  }[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('文件内容必须是数组');
    }
    
    members = data.map((item: any) => ({
      memberId: item.memberId || item.member_id || item.id,
      memberType: item.memberType || item.member_type || item.type || 'open_id',
    }));
  } catch (err: any) {
    console.error(`❌ 读取文件失败: ${err.message}`);
    process.exit(1);
  }
  
  console.log(`从文件读取到 ${members.length} 个协作者`);
  console.log('开始批量删除...\n');
  
  const results = await batchRemoveCollaborators(appToken, roleId, members);
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log('\n' + '='.repeat(60));
  console.log('批量删除结果');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\n失败的协作者:');
    results.filter(r => !r.success).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.member_id}: ${item.error}`);
    });
  }
  
  console.log('='.repeat(60) + '\n');
}

// ============ 主程序 ============

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);
  const command = options.command as string;

  // 获取 app-token（多个命令都需要）
  const appToken = options['app-token'] as string || options.a as string;
  const roleId = options['role-id'] as string || options.r as string;

  try {
    switch (command) {
      case 'roles': {
        if (!appToken) {
          console.error('❌ 错误: 缺少必需参数 --app-token');
          printUsage();
          process.exit(1);
        }
        await handleRoles(appToken);
        break;
      }

      case 'list': {
        if (!appToken || !roleId) {
          console.error('❌ 错误: 缺少必需参数 --app-token 或 --role-id');
          printUsage();
          process.exit(1);
        }
        const outputPath = options.output as string || options.o as string;
        await handleList(appToken, roleId, outputPath);
        break;
      }

      case 'add': {
        if (!appToken || !roleId) {
          console.error('❌ 错误: 缺少必需参数 --app-token 或 --role-id');
          printUsage();
          process.exit(1);
        }
        const userId = options['user-id'] as string || options.u as string;
        if (!userId) {
          console.error('❌ 错误: 缺少必需参数 --user-id');
          printUsage();
          process.exit(1);
        }
        const memberType = (options.type as string) || (options.t as string) || 'open_id';
        await handleAdd(appToken, roleId, userId, memberType);
        break;
      }

      case 'batch-add': {
        if (!appToken || !roleId) {
          console.error('❌ 错误: 缺少必需参数 --app-token 或 --role-id');
          printUsage();
          process.exit(1);
        }
        const filePath = options.file as string || options.f as string;
        if (!filePath) {
          console.error('❌ 错误: 缺少必需参数 --file');
          printUsage();
          process.exit(1);
        }
        await handleBatchAdd(appToken, roleId, filePath);
        break;
      }

      case 'remove': {
        if (!appToken || !roleId) {
          console.error('❌ 错误: 缺少必需参数 --app-token 或 --role-id');
          printUsage();
          process.exit(1);
        }
        const userId = options['user-id'] as string || options.u as string;
        if (!userId) {
          console.error('❌ 错误: 缺少必需参数 --user-id');
          printUsage();
          process.exit(1);
        }
        const memberType = (options.type as string) || (options.t as string) || 'open_id';
        await handleRemove(appToken, roleId, userId, memberType);
        break;
      }

      case 'batch-remove': {
        if (!appToken || !roleId) {
          console.error('❌ 错误: 缺少必需参数 --app-token 或 --role-id');
          printUsage();
          process.exit(1);
        }
        const filePath = options.file as string || options.f as string;
        if (!filePath) {
          console.error('❌ 错误: 缺少必需参数 --file');
          printUsage();
          process.exit(1);
        }
        await handleBatchRemove(appToken, roleId, filePath);
        break;
      }

      default:
        console.error(`❌ 错误: 未知命令 "${command}"`);
        printUsage();
        process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

// 执行
main();
