#!/usr/bin/env ts-node
/**
 * 报销及发票管理
 * 
 * 场景描述: 创建飞书多维表格用于报销及发票管理，支持发票附件上传和报销记录添加
 * 
 * 使用的基础能力:
 * - lib/bitable.ts - createExpenseBitable, addExpenseRecord
 * - lib/drive.ts - uploadMedia (用于上传发票附件)
 * 
 * 使用方法:
 * ```bash
 * # 创建报销表格
 * npx ts-node scripts/expense-reimbursement.ts create
 * npx ts-node scripts/expense-reimbursement.ts create --month "2024年03月"
 * 
 * # 上传发票并添加报销记录（一步完成）
 * npx ts-node scripts/expense-reimbursement.ts add \
 *   --app-token bascxxxxxxxx \
 *   --table-id tblxxxxxxxx \
 *   --serial-no "001" \
 *   --type "其它" \
 *   --amount 1250.50 \
 *   --submitter "张三" \
 *   --purpose "北京出差" \
 *   --invoice-file ./invoice.pdf
 * 
 * # 查看表格信息
 * npx ts-node scripts/expense-reimbursement.ts info --app-token bascxxxxxxxx
 * ```
 */

import {
  createExpenseBitable,
  addExpenseRecord,
  listAppTables,
  listTableFields,
  ExpenseBitableResult,
} from '../lib/bitable';
import { uploadMedia } from '../lib/drive';
import { getUserInfo } from '../lib/contact';
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
报销及发票管理

用法: npx ts-node scripts/expense-reimbursement.ts <命令> [选项]

命令:
  create              创建新的报销统计表格
  add                 添加报销记录（支持上传发票附件）
  info                查看表格信息

create 选项:
  --month, -m         指定月份（格式: 2024年03月，默认为当前月份）
  --output, -o        输出结果到文件

add 选项:
  --app-token, -a     应用 token（必需）
  --table-id, -t      表格 ID（如果不提供，使用默认表格）
  --user-id, -u       报销人用户ID（默认使用聚恒）
  --serial-no, -s     序号（默认：001）
  --type, -T          费用类型（默认：其它）
  --amount, -A        金额（必需）
  --submitter         报销人姓名（如果不提供，根据user-id获取）
  --purpose, -p       用途说明
  --invoice-title     发票抬头
  --tax-number        税号
  --invoice-date      开票日期 (yyyy-MM-dd)
  --deduction-note    抵扣说明
  --status            提交状态（默认：待审核）
  --invoice-file, -f  发票文件路径（可选，会上传并关联）

info 选项:
  --app-token, -a     应用 token（必需）

示例:
  # 创建报销表格
  npx ts-node scripts/expense-reimbursement.ts create
  npx ts-node scripts/expense-reimbursement.ts create --month "2024年03月"

  # 添加报销记录（自动上传发票）
  npx ts-node scripts/expense-reimbursement.ts add \\
    --app-token bascxxxxxxxx \\
    --invoice-amount 110.00 \\
    --reimbursement-amount 100.00 \\
    --purpose "AI技术服务费用" \\
    --seller-name "杭州深度求索人工智能基础技术研究有限公司" \\
    --invoice-file ./invoice.pdf

  # 查看表格信息
  npx ts-node scripts/expense-reimbursement.ts info --app-token bascxxxxxxxx
`);
}

// ============ 命令实现 ============

/**
 * 创建报销表格
 */
async function handleCreate(month?: string): Promise<ExpenseBitableResult> {
  console.log('\n📋 创建报销统计表格...\n');
  
  const result = await createExpenseBitable(month);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 报销表格创建成功！');
  console.log('='.repeat(60));
  console.log(`📊 应用名称: ${result.name}`);
  console.log(`🔗 表格链接: ${result.table_url}`);
  console.log(`📌 App Token: ${result.app_token}`);
  console.log(`📌 Table ID: ${result.table_id}`);
  console.log(`📋 字段数量: ${result.fields.length}`);
  console.log('\n📑 字段列表:');
  result.fields.forEach((field, index) => {
    console.log(`   ${index + 1}. ${field.field_name}`);
  });
  console.log('='.repeat(60) + '\n');
  
  return result;
}

/**
 * 添加报销记录
 */
async function handleAdd(options: Record<string, string | boolean>): Promise<void> {
  const appToken = options['app-token'] as string || options.a as string;
  
  if (!appToken) {
    throw new Error('缺少必需参数: --app-token');
  }

  // 如果没有提供table-id，尝试获取默认表格
  let tableId = options['table-id'] as string || options.t as string;
  if (!tableId) {
    console.log('🔍 未指定表格ID，正在获取默认表格...');
    const tables = await listAppTables(appToken);
    if (tables.length === 0) {
      throw new Error('该应用中暂无表格');
    }
    tableId = tables[0].table_id;
    console.log(`✅ 使用表格: ${tables[0].name} (${tableId})\n`);
  }

  // 获取报销人信息
  let submitter = options.submitter as string;
  const userId = options['user-id'] as string || options.u as string || 'ou_da073ce51bb1f01ca80226f92570c9d0';
  
  if (!submitter) {
    console.log('🔍 正在获取报销人信息...');
    const user = await getUserInfo(userId, 'open_id');
    submitter = user ? user.name : '未知用户';
    console.log(`✅ 报销人: ${submitter}\n`);
  }

  // 解析其他参数
  const serialNo = (options['serial-no'] as string) || (options.s as string) || '001';
  const expenseType = (options.type as string) || (options.T as string) || '其它';
  const invoiceAmount = parseFloat(options['invoice-amount'] as string);
  const reimbursementAmount = parseFloat(options['reimbursement-amount'] as string) || invoiceAmount;
  const purpose = options.purpose as string || options.p as string;
  const invoiceTitle = options['invoice-title'] as string || '河南叮当品牌策划有限公司';  // 默认叮当
  const sellerName = options['seller-name'] as string;  // 销方名称
  const taxNumber = options['tax-number'] as string;
  const invoiceDate = options['invoice-date'] as string;
  const submitTime = options['submit-time'] as string;
  const deductionNote = options['deduction-note'] as string;
  const status = (options.status as string) || '待审核';

  if (isNaN(invoiceAmount)) {
    throw new Error('缺少必需参数: --invoice-amount (发票金额)');
  }

  // 上传发票附件（如果提供了文件）
  let invoiceAttachment: string[] | undefined;
  const invoiceFile = options['invoice-file'] as string || options.f as string;
  
  if (invoiceFile) {
    if (!fs.existsSync(invoiceFile)) {
      throw new Error(`发票文件不存在: ${invoiceFile}`);
    }
    
    console.log('📤 正在上传发票附件...');
    const uploadResult = await uploadMedia(
      invoiceFile,
      'bitable_file',
      appToken
    );
    invoiceAttachment = [uploadResult.file_token];
    console.log(`✅ 发票上传成功: ${uploadResult.file_token}\n`);
  }

  // 添加报销记录
  console.log('📝 正在添加报销记录...');
  const record = await addExpenseRecord(appToken, tableId, {
    serialNo,
    expenseType,
    invoiceAmount,
    reimbursementAmount,
    submitterUserId: userId,
    purpose,
    invoiceTitle,
    sellerName,
    invoiceAttachment,
    taxNumber,
    invoiceDate,
    submitTime,
    deductionNote,
    status,
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ 报销记录添加成功！');
  console.log('='.repeat(60));
  console.log(`🆔 记录 ID: ${record.record_id}`);
  console.log(`👤 报销人: ${submitter}`);
  console.log(`📄 发票金额: ¥${invoiceAmount.toFixed(2)}`);
  console.log(`💰 报销金额: ¥${reimbursementAmount.toFixed(2)}`);
  if (invoiceAmount !== reimbursementAmount) {
    console.log(`⚠️ 差额: ¥${(invoiceAmount - reimbursementAmount).toFixed(2)}`);
  }
  console.log(`📂 费用类型: ${expenseType}`);
  console.log(`🏢 发票抬头: ${invoiceTitle}`);
  if (sellerName) {
    console.log(`🏪 销方名称: ${sellerName}`);
  }
  if (invoiceAttachment) {
    console.log(`📎 发票附件: 已上传`);
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * 查看表格信息
 */
async function handleInfo(appToken: string): Promise<void> {
  console.log('\n📊 获取表格信息...\n');
  
  const tables = await listAppTables(appToken);
  
  if (tables.length === 0) {
    console.log('⚠️ 该应用中暂无表格\n');
    return;
  }

  console.log('='.repeat(60));
  console.log(`📋 应用包含 ${tables.length} 个表格:\n`);
  
  for (const table of tables) {
    console.log(`📌 ${table.name}`);
    console.log(`   Table ID: ${table.table_id}`);
    
    const fields = await listTableFields(appToken, table.table_id);
    console.log(`   字段数: ${fields.length}`);
    console.log(`   字段列表: ${fields.map(f => f.field_name).join(', ')}`);
    console.log();
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

  try {
    switch (command) {
      case 'create': {
        const month = options.month as string || options.m as string;
        const result = await handleCreate(month);
        
        // 如果需要输出到文件
        const outputPath = options.output as string || options.o as string;
        if (outputPath) {
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
          console.log(`💾 结果已保存到: ${outputPath}\n`);
        }
        break;
      }

      case 'add': {
        await handleAdd(options);
        break;
      }

      case 'info': {
        const appToken = options['app-token'] as string || options.a as string;
        if (!appToken) {
          console.error('❌ 错误: 缺少必需参数 --app-token');
          printUsage();
          process.exit(1);
        }
        await handleInfo(appToken);
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
