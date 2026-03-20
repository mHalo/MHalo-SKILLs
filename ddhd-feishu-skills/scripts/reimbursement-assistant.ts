#!/usr/bin/env ts-node
/**
 * 智能报销助手
 * 
 * 业务场景：员工通过飞书 Agent 提交报销
 * 
 * 核心功能：
 * 1. 新增报销 - 员工发送报销信息和发票/图片，自动提取信息并录入
 * 2. 查询报销 - 员工查询自己的报销记录
 * 3. 修改报销 - 员工修改已提交的报销记录（需确认）
 * 
 * Agent 使用指南：
 * 1. 新增报销流程：
 *    - 用户发送：报销信息 + 发票/图片
 *    - Agent 调用：npx ts-node scripts/reimbursement-assistant.ts add [参数]
 *    - Agent 向用户展示提取的信息，要求确认
 *    - 用户确认后，正式提交
 * 
 * 2. 查询报销流程：
 *    - 用户发送："查看我的报销"
 *    - Agent 调用：npx ts-node scripts/reimbursement-assistant.ts list --user-id <id>
 *    - Agent 向用户展示报销列表
 * 
 * 3. 修改报销流程：
 *    - 用户发送："修改序号为 X 的报销金额为 Y"
 *    - Agent 调用：npx ts-node scripts/reimbursement-assistant.ts get --record-id <id>
 *    - Agent 向用户展示当前记录，要求确认修改
 *    - 用户确认后，Agent 调用：npx ts-node scripts/reimbursement-assistant.ts update [参数]
 * 
 * 使用的基础能力：
 * - lib/invoice-extractor.ts - 发票/图片信息提取
 * - lib/reimbursement-manager.ts - 报销表管理和记录操作
 * - lib/bitable.ts - 多维表格基础操作
 * - lib/drive.ts - 上传发票附件
 * 
 * 使用方法：
 * ```bash
 * # 新增报销（需要大模型提取信息时）
 * npx ts-node scripts/reimbursement-assistant.ts add --user-id <user_id> --files <file1,file2>
 * 
 * # 新增报销（已提取信息）
 * npx ts-node scripts/reimbursement-assistant.ts add --user-id <user_id> --data '{...}'
 * 
 * # 查询报销记录
 * npx ts-node scripts/reimbursement-assistant.ts list --user-id <user_id>
 * 
 * # 获取单条记录
 * npx ts-node scripts/reimbursement-assistant.ts get --record-id <id>
 * 
 * # 修改报销记录
 * npx ts-node scripts/reimbursement-assistant.ts update --record-id <id> --data '{...}'
 * 
 * # 提取发票信息（供 Agent 调用 LLM 前使用）
 * npx ts-node scripts/reimbursement-assistant.ts extract --file <file_path>
 * 
 * # 获取当月报销表信息
 * npx ts-node scripts/reimbursement-assistant.ts info
 * 
 * # 初始化配置（设置管理员和编辑者）
 * npx ts-node scripts/reimbursement-assistant.ts init --manage-users <id1,id2> --edit-users <id3,id4>
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  extractInvoiceInfo,
  parseLLMResult,
  mergeReimbursementInfo,
  validateReimbursementInfo,
  formatReimbursementInfo,
  ExtractedInvoiceInfo,
  ReimbursementInfo,
} from '../lib/invoice-extractor';
import {
  getOrCreateMonthBitable,
  addReimbursementRecord,
  queryUserReimbursementRecords,
  getReimbursementRecord,
  updateReimbursementRecord,
  updatePermissionConfig,
  getBitableStats,
  loadReimbursementHistory,
  CurrentMonthBitable,
} from '../lib/reimbursement-manager';
import { uploadMedia } from '../lib/drive';

// ============ 类型定义 ============

/**
 * 命令类型
 */
type Command = 'add' | 'list' | 'get' | 'update' | 'extract' | 'info' | 'init' | 'help';

/**
 * 操作结果
 */
interface OperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// ============ 参数解析 ============

function parseArgs(args: string[]): {
  command: Command;
  options: Record<string, any>;
} {
  const result: Record<string, any> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
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

  const command = (args[0] as Command) || 'help';
  return { command, options: result };
}

function printUsage() {
  console.log(`
智能报销助手

用法: npx ts-node scripts/reimbursement-assistant.ts <命令> [选项]

命令:
  add       新增报销记录
  list      查询用户的报销记录
  get       获取单条报销记录详情
  update    修改报销记录
  extract   提取发票/图片信息（供 LLM 使用）
  info      获取当月报销表信息
  init      初始化权限配置
  help      显示帮助信息

选项（add 命令）:
  --user-id, -u     报销人 User ID（必填）
  --files, -f       发票/图片文件路径，多个用逗号分隔
  --data, -d        报销信息 JSON 字符串（已提取的信息）
  --month, -m       指定月份（格式：yyyy-MM，默认当前月）

选项（list 命令）:
  --user-id, -u     用户 ID（必填）
  --month, -m       指定月份（格式：yyyy-MM，默认当前月）
  --limit, -l       返回记录数量限制（默认 50）

选项（get 命令）:
  --record-id, -r   记录 ID（必填）

选项（update 命令）:
  --record-id, -r   记录 ID（必填）
  --data, -d        要更新的字段 JSON 字符串（必填）

选项（extract 命令）:
  --file            文件路径（必填）
  --force-local     强制使用本地提取（不使用 LLM）

选项（init 命令）:
  --manage-users    管理员 User ID 列表，逗号分隔
  --edit-users      编辑者 User ID 列表，逗号分隔

示例:
  # 新增报销（需要 LLM 提取）
  npx ts-node scripts/reimbursement-assistant.ts add --user-id ou_xxx --files ./invoice.pdf

  # 新增报销（已有数据）
  npx ts-node scripts/reimbursement-assistant.ts add --user-id ou_xxx --data '{"expenseType":"差旅","amount":100}'

  # 查询报销
  npx ts-node scripts/reimbursement-assistant.ts list --user-id ou_xxx

  # 修改报销
  npx ts-node scripts/reimbursement-assistant.ts update --record-id rec_xxx --data '{"reimbursementAmount":200}'

  # 初始化权限
  npx ts-node scripts/reimbursement-assistant.ts init --manage-users ou_xxx,ou_yyy --edit-users ou_zzz
`);
}

// ============ 命令处理 ============

/**
 * 新增报销记录
 * 
 * 流程：
 * 1. 获取或创建当月报销表
 * 2. 如果有文件，上传附件
 * 3. 合并用户输入和提取信息
 * 4. 验证信息完整性
 * 5. 添加记录到多维表格
 */
async function handleAdd(options: Record<string, any>): Promise<OperationResult> {
  const userId = options['user-id'] || options['u'];
  if (!userId) {
    return { success: false, message: '缺少必要参数: --user-id', error: 'MISSING_USER_ID' };
  }

  console.log(`\n[报销助手] ========== 开始新增报销 ==========`);
  console.log(`[报销助手] 报销人: ${userId}`);

  try {
    // 1. 获取或创建当月报销表
    const month = options['month'] || options['m'];
    const bitable = await getOrCreateMonthBitable({ month });
    console.log(`[报销助手] 报销表: ${bitable.link_href}`);

    // 2. 处理文件上传（如果有）
    let attachmentTokens: string[] = [];
    const filesStr = options['files'] || options['f'];
    
    if (filesStr) {
      const files = filesStr.split(',').map((f: string) => f.trim());
      console.log(`[报销助手] 上传 ${files.length} 个附件...`);

      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          try {
            const uploadResult = await uploadMedia(filePath, 'bitable_file', bitable.app_token!);
            attachmentTokens.push(uploadResult.file_token);
            console.log(`[报销助手] 上传成功: ${path.basename(filePath)} -> ${uploadResult.file_token}`);
          } catch (e: any) {
            console.error(`[报销助手] 上传失败 ${filePath}: ${e.message}`);
          }
        } else {
          console.warn(`[报销助手] 文件不存在: ${filePath}`);
        }
      }
    }

    // 3. 解析用户输入的数据
    let userInput: Partial<ReimbursementInfo> = {};
    const dataStr = options['data'] || options['d'];
    
    if (dataStr) {
      try {
        userInput = JSON.parse(dataStr);
        console.log(`[报销助手] 用户输入数据已解析`);
      } catch (e) {
        return { success: false, message: '数据格式错误，请提供有效的 JSON', error: 'INVALID_JSON' };
      }
    }

    // 4. 如果有附件但没有提取信息，需要提示使用 LLM
    if (attachmentTokens.length > 0 && !dataStr) {
      // 尝试本地提取（仅 PDF）
      const files = filesStr.split(',').map((f: string) => f.trim());
      let extractedInfo: ExtractedInvoiceInfo | null = null;

      for (const filePath of files) {
        if (filePath.toLowerCase().endsWith('.pdf')) {
          extractedInfo = await extractInvoiceInfo(filePath, { forceLocal: true });
          if (extractedInfo.success) {
            console.log(`[报销助手] 本地提取成功: ${filePath}`);
            break;
          }
        }
      }

      if (!extractedInfo || !extractedInfo.success) {
        // 本地提取失败，需要 LLM
        return {
          success: false,
          message: '需要调用大模型提取发票信息。请使用 LLM 分析附件，然后使用 --data 参数传入提取结果。',
          error: 'NEED_LLM_EXTRACTION',
          data: {
            files: filesStr,
            instruction: '请使用大模型分析发票/图片，提取以下字段：invoiceNo, invoiceDate, amount, invoiceTitle, taxNumber, sellerName, expenseType, purpose',
          },
        };
      }

      // 合并提取信息
      userInput = mergeReimbursementInfo(userInput, extractedInfo, userId);
    }

    // 5. 添加附件信息
    if (attachmentTokens.length > 0) {
      userInput.attachments = attachmentTokens;
    }

    // 6. 确保必要字段存在
    if (!userInput.submitterUserId) {
      userInput.submitterUserId = userId;
    }

    // 7. 验证信息完整性
    const validation = validateReimbursementInfo(userInput as ReimbursementInfo);
    if (!validation.valid) {
      return {
        success: false,
        message: `信息不完整，缺少字段: ${validation.missingFields.join(', ')}`,
        error: 'INCOMPLETE_DATA',
        data: { missingFields: validation.missingFields },
      };
    }

    // 8. 显示待提交信息
    const info = userInput as ReimbursementInfo;
    console.log(`\n[报销助手] 待提交信息：`);
    console.log(formatReimbursementInfo(info));

    // 9. 添加到多维表格
    const result = await addReimbursementRecord(info, bitable.app_token, bitable.table_id);

    if (!result.success) {
      return {
        success: false,
        message: `添加报销记录失败: ${result.error}`,
        error: 'ADD_RECORD_FAILED',
      };
    }

    // 10. 获取最新统计
    const stats = await getBitableStats(month);

    return {
      success: true,
      message: '报销记录添加成功',
      data: {
        record_id: result.record_id,
        serial_no: result.serial_no,
        table_link: bitable.link_href,
        stats,
        info,
      },
    };

  } catch (error: any) {
    console.error(`[报销助手] 错误: ${error.message}`);
    return {
      success: false,
      message: `操作失败: ${error.message}`,
      error: 'OPERATION_FAILED',
    };
  }
}

/**
 * 查询用户报销记录
 */
async function handleList(options: Record<string, any>): Promise<OperationResult> {
  const userId = options['user-id'] || options['u'];
  if (!userId) {
    return { success: false, message: '缺少必要参数: --user-id', error: 'MISSING_USER_ID' };
  }

  const month = options['month'] || options['m'];
  const limit = parseInt(options['limit'] || options['l'] || '50');

  console.log(`\n[报销助手] ========== 查询报销记录 ==========`);
  console.log(`[报销助手] 用户: ${userId}`);

  try {
    const records = await queryUserReimbursementRecords(userId, { month, limit });
    const stats = await getBitableStats(month);

    if (records.length === 0) {
      return {
        success: true,
        message: month ? `${month} 月暂无报销记录` : '本月暂无报销记录',
        data: { records: [], stats },
      };
    }

    return {
      success: true,
      message: `查询到 ${records.length} 条记录`,
      data: {
        records,
        stats,
      },
    };

  } catch (error: any) {
    console.error(`[报销助手] 查询失败: ${error.message}`);
    return {
      success: false,
      message: `查询失败: ${error.message}`,
      error: 'QUERY_FAILED',
    };
  }
}

/**
 * 获取单条报销记录
 */
async function handleGet(options: Record<string, any>): Promise<OperationResult> {
  const recordId = options['record-id'] || options['r'];
  if (!recordId) {
    return { success: false, message: '缺少必要参数: --record-id', error: 'MISSING_RECORD_ID' };
  }

  console.log(`\n[报销助手] ========== 获取报销记录详情 ==========`);
  console.log(`[报销助手] 记录 ID: ${recordId}`);

  try {
    const record = await getReimbursementRecord(recordId);

    if (!record) {
      return {
        success: false,
        message: '未找到该报销记录',
        error: 'RECORD_NOT_FOUND',
      };
    }

    return {
      success: true,
      message: '获取记录成功',
      data: { record },
    };

  } catch (error: any) {
    console.error(`[报销助手] 获取失败: ${error.message}`);
    return {
      success: false,
      message: `获取失败: ${error.message}`,
      error: 'GET_FAILED',
    };
  }
}

/**
 * 修改报销记录
 */
async function handleUpdate(options: Record<string, any>): Promise<OperationResult> {
  const recordId = options['record-id'] || options['r'];
  if (!recordId) {
    return { success: false, message: '缺少必要参数: --record-id', error: 'MISSING_RECORD_ID' };
  }

  const dataStr = options['data'] || options['d'];
  if (!dataStr) {
    return { success: false, message: '缺少必要参数: --data', error: 'MISSING_DATA' };
  }

  let updates: Partial<ReimbursementInfo>;
  try {
    updates = JSON.parse(dataStr);
  } catch (e) {
    return { success: false, message: '数据格式错误，请提供有效的 JSON', error: 'INVALID_JSON' };
  }

  console.log(`\n[报销助手] ========== 修改报销记录 ==========`);
  console.log(`[报销助手] 记录 ID: ${recordId}`);
  console.log(`[报销助手] 更新字段: ${Object.keys(updates).join(', ')}`);

  try {
    // 先获取原记录
    const originalRecord = await getReimbursementRecord(recordId);
    if (!originalRecord) {
      return {
        success: false,
        message: '未找到该报销记录',
        error: 'RECORD_NOT_FOUND',
      };
    }

    // 执行更新
    const result = await updateReimbursementRecord(recordId, updates);

    if (!result.success) {
      return {
        success: false,
        message: `修改失败: ${result.error}`,
        error: 'UPDATE_FAILED',
      };
    }

    return {
      success: true,
      message: '报销记录修改成功',
      data: {
        record_id: recordId,
        original: originalRecord,
        updates: result.updated_fields,
      },
    };

  } catch (error: any) {
    console.error(`[报销助手] 修改失败: ${error.message}`);
    return {
      success: false,
      message: `修改失败: ${error.message}`,
      error: 'UPDATE_FAILED',
    };
  }
}

/**
 * 提取发票信息（供 LLM 使用）
 * 
 * 这个命令用于：
 * 1. 先尝试本地提取（仅 PDF）
 * 2. 如果本地提取失败，返回需要 LLM 的信号
 */
async function handleExtract(options: Record<string, any>): Promise<OperationResult> {
  const filePath = options['file'];
  if (!filePath) {
    return { success: false, message: '缺少必要参数: --file', error: 'MISSING_FILE' };
  }

  if (!fs.existsSync(filePath)) {
    return { success: false, message: `文件不存在: ${filePath}`, error: 'FILE_NOT_FOUND' };
  }

  console.log(`\n[报销助手] ========== 提取发票信息 ==========`);
  console.log(`[报销助手] 文件: ${path.basename(filePath)}`);

  try {
    const forceLocal = options['force-local'];
    const result = await extractInvoiceInfo(filePath, { forceLocal });

    if (!result.success) {
      // 如果是需要 LLM 的信号
      if (result.error?.includes('需要调用大模型') || result.error?.includes('大模型')) {
        return {
          success: false,
          message: '需要调用大模型提取',
          error: 'NEED_LLM',
          data: {
            file: filePath,
            hint: '请使用大模型分析此文件，提取发票信息',
          },
        };
      }

      return {
        success: false,
        message: `提取失败: ${result.error}`,
        error: 'EXTRACTION_FAILED',
      };
    }

    return {
      success: true,
      message: '提取成功',
      data: result,
    };

  } catch (error: any) {
    console.error(`[报销助手] 提取失败: ${error.message}`);
    return {
      success: false,
      message: `提取失败: ${error.message}`,
      error: 'EXTRACTION_FAILED',
    };
  }
}

/**
 * 获取当月报销表信息
 */
async function handleInfo(): Promise<OperationResult> {
  console.log(`\n[报销助手] ========== 报销表信息 ==========`);

  try {
    const history = loadReimbursementHistory();
    const bitable = await getOrCreateMonthBitable();
    const stats = await getBitableStats();

    return {
      success: true,
      message: '获取信息成功',
      data: {
        current_month: bitable.date,
        is_new: bitable.isNew,
        bitable,
        stats,
        config: {
          manage_users: history.manage_user_ids,
          edit_users: history.edit_user_ids,
        },
      },
    };

  } catch (error: any) {
    console.error(`[报销助手] 获取信息失败: ${error.message}`);
    return {
      success: false,
      message: `获取信息失败: ${error.message}`,
      error: 'GET_INFO_FAILED',
    };
  }
}

/**
 * 初始化权限配置
 */
async function handleInit(options: Record<string, any>): Promise<OperationResult> {
  console.log(`\n[报销助手] ========== 初始化权限配置 ==========`);

  const manageUsersStr = options['manage-users'];
  const editUsersStr = options['edit-users'];

  const manageUsers = manageUsersStr ? manageUsersStr.split(',').map((u: string) => u.trim()) : [];
  const editUsers = editUsersStr ? editUsersStr.split(',').map((u: string) => u.trim()) : [];

  try {
    updatePermissionConfig(manageUsers, editUsers);

    return {
      success: true,
      message: '权限配置已更新',
      data: {
        manage_users: manageUsers,
        edit_users: editUsers,
      },
    };

  } catch (error: any) {
    console.error(`[报销助手] 配置失败: ${error.message}`);
    return {
      success: false,
      message: `配置失败: ${error.message}`,
      error: 'INIT_FAILED',
    };
  }
}

/**
 * 处理 LLM 提取结果并添加报销
 * 
 * 特殊命令：用于 Agent 在调用 LLM 后提交数据
 */
async function handleAddWithLLM(options: Record<string, any>): Promise<OperationResult> {
  const userId = options['user-id'] || options['u'];
  if (!userId) {
    return { success: false, message: '缺少必要参数: --user-id', error: 'MISSING_USER_ID' };
  }

  const llmResultStr = options['llm-result'];
  if (!llmResultStr) {
    return { success: false, message: '缺少必要参数: --llm-result', error: 'MISSING_LLM_RESULT' };
  }

  // 解析 LLM 结果
  let extractedInfo: ExtractedInvoiceInfo;
  try {
    extractedInfo = parseLLMResult(llmResultStr);
  } catch (e: any) {
    return {
      success: false,
      message: `解析 LLM 结果失败: ${e.message}`,
      error: 'PARSE_LLM_RESULT_FAILED',
    };
  }

  if (!extractedInfo.success) {
    return {
      success: false,
      message: 'LLM 提取结果无效',
      error: 'INVALID_LLM_RESULT',
    };
  }

  // 获取用户输入
  let userInput: Partial<ReimbursementInfo> = {};
  const dataStr = options['data'] || options['d'];
  if (dataStr) {
    try {
      userInput = JSON.parse(dataStr);
    } catch (e) {
      // 忽略解析错误
    }
  }

  // 合并信息
  const info = mergeReimbursementInfo(userInput, extractedInfo, userId);

  // 继续正常的添加流程
  return handleAdd({
    ...options,
    'data': JSON.stringify(info),
  });
}

// ============ 主入口 ============

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '-h' || args[0] === '--help') {
    printUsage();
    process.exit(0);
  }

  const { command, options } = parseArgs(args);

  let result: OperationResult;

  switch (command) {
    case 'add':
      // 如果有 llm-result 参数，使用特殊处理
      if (options['llm-result']) {
        result = await handleAddWithLLM(options);
      } else {
        result = await handleAdd(options);
      }
      break;
    case 'list':
      result = await handleList(options);
      break;
    case 'get':
      result = await handleGet(options);
      break;
    case 'update':
      result = await handleUpdate(options);
      break;
    case 'extract':
      result = await handleExtract(options);
      break;
    case 'info':
      result = await handleInfo();
      break;
    case 'init':
      result = await handleInit(options);
      break;
    default:
      printUsage();
      process.exit(1);
  }

  // 输出 JSON 结果（供 Agent 解析）
  console.log('\n---RESULT_START---');
  console.log(JSON.stringify(result, null, 2));
  console.log('---RESULT_END---');

  process.exit(result.success ? 0 : 1);
}

// 执行
main().catch(error => {
  console.error('[报销助手] 未捕获的错误:', error);
  process.exit(1);
});
