/**
 * 报销表管理模块
 * 
 * 功能：
 * 1. 读取/管理报销表历史记录（caches/reimbursement_bittable_history.json）
 * 2. 自动创建当月报销表
 * 3. 设置权限（管理、编辑）
 * 4. 报销记录的增、改、查
 * 
 * 数据结构：
 * {
 *    manage_user_ids: [''],     // 管理员 User ID 列表
 *    edit_user_ids: [''],       // 编辑者 User ID 列表
 *    bittable: [
 *      { date: '2026-03', app_token: '', link_href: '' }
 *    ]
 * }
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  createExpenseBitable,
  addExpenseRecord,
  listAppTables,
  listTableRecords,
  BitableTableInfo,
  RecordInfo,
} from './bitable';
import { ReimbursementInfo } from './invoice-extractor';
import {
  createAdminRole,
  createEditorRole,
  getOrCreateRole,
} from './bitable-role';
import {
  addCollaboratorsToRole,
} from './bitable-collaborator';

// ============ 类型定义 ============

/**
 * 报销表历史记录项
 */
export interface BittableHistoryItem {
  /** 年月（格式：yyyy-MM） */
  date: string;
  /** 应用 Token */
  app_token: string;
  /** 表格链接 */
  link_href: string;
  /** 表格 ID（可选，用于后续操作） */
  table_id?: string;
}

/**
 * 报销表历史数据结构
 */
export interface ReimbursementHistory {
  /** 管理员 User ID 列表 */
  manage_user_ids: string[];
  /** 编辑者 User ID 列表 */
  edit_user_ids: string[];
  /** 报销表列表 */
  bittable: BittableHistoryItem[];
}

/**
 * 当月报销表信息
 */
export interface CurrentMonthBitable {
  /** 是否存在 */
  exists: boolean;
  /** 年月 */
  date: string;
  /** 应用 Token */
  app_token?: string;
  /** 表格 ID */
  table_id?: string;
  /** 表格链接 */
  link_href?: string;
  /** 是否是新创建的 */
  isNew?: boolean;
}

/**
 * 报销记录（带序号和记录 ID）
 */
export interface ReimbursementRecord {
  /** 记录 ID */
  record_id: string;
  /** 序号（显示用） */
  serial_no: string;
  /** 费用类型 */
  expense_type: string;
  /** 发票金额 */
  invoice_amount: number;
  /** 报销金额 */
  reimbursement_amount: number;
  /** 报销人 */
  submitter: string;
  /** 用途说明 */
  purpose?: string;
  /** 发票抬头 */
  invoice_title?: string;
  /** 销方名称 */
  seller_name?: string;
  /** 税号 */
  tax_number?: string;
  /** 开票日期 */
  invoice_date?: string;
  /** 提交状态 */
  status?: string;
  /** 创建时间 */
  created_time?: string;
  /** 原始字段数据 */
  fields?: Record<string, any>;
}

/**
 * 修改结果
 */
export interface ModifyResult {
  /** 是否成功 */
  success: boolean;
  /** 记录 ID */
  record_id: string;
  /** 修改后的数据 */
  updated_fields?: Record<string, any>;
  /** 错误信息 */
  error?: string;
}

// ============ 常量 ============

const HISTORY_FILE_PATH = path.join(process.cwd(), 'caches', 'reimbursement_bittable_history.json');

// 默认管理员和编辑者（可以从环境变量读取）
const DEFAULT_MANAGE_USERS = process.env.REIMBURSEMENT_MANAGE_USERS?.split(',') || [];
const DEFAULT_EDIT_USERS = process.env.REIMBURSEMENT_EDIT_USERS?.split(',') || [];

// ============ 历史记录管理 ============

/**
 * 读取报销表历史记录
 * 
 * @returns 历史记录数据
 */
export function loadReimbursementHistory(): ReimbursementHistory {
  try {
    if (fs.existsSync(HISTORY_FILE_PATH)) {
      const content = fs.readFileSync(HISTORY_FILE_PATH, 'utf-8');
      const data = JSON.parse(content);
      console.log(`[lib/reimbursement-manager] 已加载历史记录，共 ${data.bittable?.length || 0} 个报销表`);
      return {
        manage_user_ids: data.manage_user_ids || DEFAULT_MANAGE_USERS,
        edit_user_ids: data.edit_user_ids || DEFAULT_EDIT_USERS,
        bittable: data.bittable || [],
      };
    }
  } catch (error: any) {
    console.error(`[lib/reimbursement-manager] 读取历史记录失败: ${error.message}`);
  }

  // 返回默认结构
  return {
    manage_user_ids: DEFAULT_MANAGE_USERS,
    edit_user_ids: DEFAULT_EDIT_USERS,
    bittable: [],
  };
}

/**
 * 保存报销表历史记录
 * 
 * @param history - 历史记录数据
 */
export function saveReimbursementHistory(history: ReimbursementHistory): void {
  try {
    // 确保目录存在
    const dir = path.dirname(HISTORY_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(history, null, 2), 'utf-8');
    console.log(`[lib/reimbursement-manager] 历史记录已保存: ${HISTORY_FILE_PATH}`);
  } catch (error: any) {
    console.error(`[lib/reimbursement-manager] 保存历史记录失败: ${error.message}`);
    throw error;
  }
}

/**
 * 获取当前年月字符串
 * 
 * @returns 格式：yyyy-MM
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 查找当月报销表
 * 
 * @param history - 历史记录
 * @param month - 年月（可选，默认为当前月）
 * @returns 找到的报销表信息或 null
 */
export function findMonthBitable(
  history: ReimbursementHistory,
  month?: string
): BittableHistoryItem | null {
  const targetMonth = month || getCurrentMonth();
  return history.bittable.find(item => item.date === targetMonth) || null;
}

// ============ 报销表生命周期管理 ============

/**
 * 获取或创建当月报销表
 * 
 * 流程：
 * 1. 检查历史记录中是否已有当月报销表
 * 2. 如果有，直接返回
 * 3. 如果没有，创建新表 → 设置权限 → 保存历史记录
 * 
 * @param options - 选项
 * @returns 当月报销表信息
 */
export async function getOrCreateMonthBitable(
  options: {
    /** 指定年月（格式：yyyy-MM） */
    month?: string;
    /** 管理员 User ID 列表（可选，覆盖配置） */
    manageUsers?: string[];
    /** 编辑者 User ID 列表（可选，覆盖配置） */
    editUsers?: string[];
  } = {}
): Promise<CurrentMonthBitable> {
  const month = options.month || getCurrentMonth();
  
  console.log(`\n[lib/reimbursement-manager] ========== 获取/创建 ${month} 报销表 ==========`);

  // 1. 读取历史记录
  const history = loadReimbursementHistory();

  // 2. 查找当月报销表
  const existing = findMonthBitable(history, month);
  if (existing) {
    console.log(`[lib/reimbursement-manager] 找到已有报销表: ${existing.app_token}`);
    
    // 获取表格 ID（如果没有保存）
    let tableId = existing.table_id;
    if (!tableId) {
      try {
        const tables = await listAppTables(existing.app_token);
        if (tables.length > 0) {
          tableId = tables[0].table_id;
        }
      } catch (e) {
        console.warn(`[lib/reimbursement-manager] 获取表格列表失败`);
      }
    }

    return {
      exists: true,
      date: month,
      app_token: existing.app_token,
      table_id: tableId,
      link_href: existing.link_href,
      isNew: false,
    };
  }

  // 3. 创建新报销表
  console.log(`[lib/reimbursement-manager] 未找到 ${month} 报销表，创建新表...`);
  
  const monthName = month.replace('-', '年') + '月';
  const result = await createExpenseBitable(monthName);

  // 4. 设置权限
  const manageUsers = options.manageUsers || history.manage_user_ids;
  const editUsers = options.editUsers || history.edit_user_ids;

  if (manageUsers.length > 0 || editUsers.length > 0) {
    console.log(`\n[lib/reimbursement-manager] 设置权限...`);
    await setupBitablePermissions(
      result.app_token,
      result.table_id,
      manageUsers,
      editUsers
    );
  }

  // 5. 保存到历史记录
  const newItem: BittableHistoryItem = {
    date: month,
    app_token: result.app_token,
    link_href: result.table_url,
    table_id: result.table_id,
  };

  history.bittable.push(newItem);
  saveReimbursementHistory(history);

  console.log(`\n[lib/reimbursement-manager] ========== 报销表创建完成 ==========`);
  console.log(`[lib/reimbursement-manager] 表格链接: ${result.table_url}`);

  return {
    exists: true,
    date: month,
    app_token: result.app_token,
    table_id: result.table_id,
    link_href: result.table_url,
    isNew: true,
  };
}

/**
 * 设置报销表权限
 * 
 * @param appToken - 应用 Token
 * @param tableId - 表格 ID
 * @param manageUsers - 管理员 User ID 列表
 * @param editUsers - 编辑者 User ID 列表
 */
async function setupBitablePermissions(
  appToken: string,
  tableId: string,
  manageUsers: string[],
  editUsers: string[]
): Promise<void> {
  try {
    // 创建管理员角色并添加用户
    if (manageUsers.length > 0) {
      console.log(`[lib/reimbursement-manager] 创建管理员角色并添加 ${manageUsers.length} 个用户...`);
      const adminRole = await createAdminRole(appToken, '报销管理员');
      
      if (adminRole.success && adminRole.role_id) {
        const members = manageUsers.map(id => ({ memberId: id, memberType: 'open_id' as const }));
        await addCollaboratorsToRole(appToken, adminRole.role_id, members);
      }
    }

    // 创建编辑者角色并添加用户
    if (editUsers.length > 0) {
      console.log(`[lib/reimbursement-manager] 创建编辑者角色并添加 ${editUsers.length} 个用户...`);
      const editorRole = await createEditorRole(appToken, '报销编辑者');
      
      if (editorRole.success && editorRole.role_id) {
        const members = editUsers.map(id => ({ memberId: id, memberType: 'open_id' as const }));
        await addCollaboratorsToRole(appToken, editorRole.role_id, members);
      }
    }
  } catch (error: any) {
    console.error(`[lib/reimbursement-manager] 设置权限失败: ${error.message}`);
    // 权限设置失败不影响主流程，仅记录错误
  }
}

// ============ 报销记录操作 ============

/**
 * 添加报销记录
 * 
 * @param info - 报销信息
 * @param appToken - 应用 Token（可选，默认使用当月表）
 * @param tableId - 表格 ID（可选，默认使用当月表）
 * @returns 添加结果
 */
export async function addReimbursementRecord(
  info: ReimbursementInfo,
  appToken?: string,
  tableId?: string
): Promise<{
  success: boolean;
  record_id?: string;
  serial_no?: string;
  error?: string;
}> {
  // 如果没有指定表，获取当月表
  let targetAppToken = appToken;
  let targetTableId = tableId;

  if (!targetAppToken || !targetTableId) {
    const currentMonth = await getOrCreateMonthBitable();
    targetAppToken = currentMonth.app_token!;
    targetTableId = currentMonth.table_id!;
  }

  // 生成序号
  const serialNo = await generateSerialNo(targetAppToken, targetTableId);

  try {
    const record = await addExpenseRecord(targetAppToken, targetTableId, {
      serialNo,
      expenseType: info.expenseType,
      invoiceAmount: info.invoiceAmount,
      reimbursementAmount: info.reimbursementAmount,
      submitterUserId: info.submitterUserId,
      purpose: info.purpose,
      invoiceTitle: info.invoiceTitle,
      sellerName: info.sellerName,
      taxNumber: info.taxNumber,
      invoiceDate: info.invoiceDate,
      invoiceAttachment: info.attachments,
      deductionNote: info.deductionNote,
      status: '待审核',
    });

    console.log(`[lib/reimbursement-manager] 报销记录添加成功: ${record.record_id}`);

    return {
      success: true,
      record_id: record.record_id,
      serial_no: serialNo,
    };
  } catch (error: any) {
    console.error(`[lib/reimbursement-manager] 添加报销记录失败: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 生成序号（格式：年月-序号，如 202603-001）
 * 
 * @param appToken - 应用 Token
 * @param tableId - 表格 ID
 * @returns 序号
 */
async function generateSerialNo(appToken: string, tableId: string): Promise<string> {
  const month = getCurrentMonth().replace('-', ''); // 202603
  
  try {
    // 获取当前记录数量（使用较大的 pageSize 获取所有记录）
    const records = await listTableRecords(appToken, tableId, 1000);
    const count = records.length;
    const seq = String(count + 1).padStart(3, '0');
    return `${month}-${seq}`;
  } catch (e) {
    // 如果获取失败，使用时间戳
    const timestamp = Date.now().toString().slice(-6);
    return `${month}-${timestamp}`;
  }
}

/**
 * 查询用户的报销记录
 * 
 * @param userId - 用户 ID
 * @param options - 查询选项
 * @returns 报销记录列表
 */
export async function queryUserReimbursementRecords(
  userId: string,
  options: {
    /** 指定年月 */
    month?: string;
    /** 限制数量 */
    limit?: number;
  } = {}
): Promise<ReimbursementRecord[]> {
  const history = loadReimbursementHistory();
  const month = options.month || getCurrentMonth();
  const bitable = findMonthBitable(history, month);

  if (!bitable) {
    return [];
  }

  try {
    // 获取表格 ID
    let tableId = bitable.table_id;
    if (!tableId) {
      const tables = await listAppTables(bitable.app_token);
      if (tables.length > 0) {
        tableId = tables[0].table_id;
      } else {
        return [];
      }
    }

    // 查询记录
    const records = await listTableRecords(bitable.app_token, tableId, options.limit || 100);

    // 过滤用户的记录并格式化
    return records
      .filter((r: RecordInfo) => {
        // 检查报销人字段是否匹配
        const submitter = r.fields['报销人'];
        if (Array.isArray(submitter)) {
          return submitter.some((s: any) => s.id === userId);
        }
        return false;
      })
      .map((r: RecordInfo) => formatRecord(r))
      .reverse(); // 最新的在前
  } catch (error: any) {
    console.error(`[lib/reimbursement-manager] 查询记录失败: ${error.message}`);
    return [];
  }
}

/**
 * 获取单条报销记录
 * 
 * @param recordId - 记录 ID
 * @param appToken - 应用 Token
 * @param tableId - 表格 ID
 * @returns 报销记录或 null
 */
export async function getReimbursementRecord(
  recordId: string,
  appToken?: string,
  tableId?: string
): Promise<ReimbursementRecord | null> {
  // 如果没有指定表，使用当月表
  let targetAppToken = appToken;
  let targetTableId = tableId;

  if (!targetAppToken || !targetTableId) {
    const currentMonth = await getOrCreateMonthBitable();
    targetAppToken = currentMonth.app_token!;
    targetTableId = currentMonth.table_id!;
  }

  try {
    // 使用 client 直接查询（需要在 bitable.ts 中添加 getRecord 函数）
    const { client } = await import('./client');
    const res: any = await client.bitable.v1.appTableRecord.get({
      path: {
        app_token: targetAppToken,
        table_id: targetTableId,
        record_id: recordId,
      },
    });

    if (res.code !== 0 || !res.data?.record) {
      return null;
    }

    return formatRecord({
      record_id: res.data.record.record_id,
      fields: res.data.record.fields,
    });
  } catch (error: any) {
    console.error(`[lib/reimbursement-manager] 获取记录失败: ${error.message}`);
    return null;
  }
}

/**
 * 修改报销记录
 * 
 * 注意：不允许修改的字段（序号、报销人、报销提交时间）
 * 
 * @param recordId - 记录 ID
 * @param updates - 要更新的字段
 * @param appToken - 应用 Token（可选）
 * @param tableId - 表格 ID（可选）
 * @returns 修改结果
 */
export async function updateReimbursementRecord(
  recordId: string,
  updates: Partial<ReimbursementInfo>,
  appToken?: string,
  tableId?: string
): Promise<ModifyResult> {
  // 如果没有指定表，使用当月表
  let targetAppToken = appToken;
  let targetTableId = tableId;

  if (!targetAppToken || !targetTableId) {
    const currentMonth = await getOrCreateMonthBitable();
    targetAppToken = currentMonth.app_token!;
    targetTableId = currentMonth.table_id!;
  }

  try {
    console.log(`[lib/reimbursement-manager] 正在修改记录: ${recordId}`);

    // 构建更新字段
    const fields: Record<string, any> = {};

    if (updates.expenseType !== undefined) fields['费用类型'] = updates.expenseType;
    if (updates.invoiceAmount !== undefined) fields['发票金额'] = updates.invoiceAmount;
    if (updates.reimbursementAmount !== undefined) fields['报销金额'] = updates.reimbursementAmount;
    if (updates.purpose !== undefined) fields['用途说明'] = updates.purpose;
    if (updates.invoiceTitle !== undefined) fields['发票抬头'] = updates.invoiceTitle;
    if (updates.sellerName !== undefined) fields['销方名称'] = updates.sellerName;
    if (updates.taxNumber !== undefined) fields['税号'] = updates.taxNumber;
    if (updates.deductionNote !== undefined) fields['抵扣说明'] = updates.deductionNote;
    
    if (updates.invoiceDate !== undefined) {
      fields['开票日期'] = new Date(updates.invoiceDate).getTime();
    }

    if (updates.attachments !== undefined) {
      fields['发票附件'] = updates.attachments.map(token => ({ file_token: token }));
    }

    const { client } = await import('./client');
    const res: any = await client.bitable.v1.appTableRecord.update({
      path: {
        app_token: targetAppToken,
        table_id: targetTableId,
        record_id: recordId,
      },
      data: { fields },
    });

    if (res.code !== 0) {
      throw new Error(`${res.code} - ${res.msg}`);
    }

    console.log(`[lib/reimbursement-manager] 记录修改成功: ${recordId}`);

    return {
      success: true,
      record_id: recordId,
      updated_fields: fields,
    };
  } catch (error: any) {
    console.error(`[lib/reimbursement-manager] 修改记录失败: ${error.message}`);
    return {
      success: false,
      record_id: recordId,
      error: error.message,
    };
  }
}

/**
 * 格式化记录数据
 * 
 * @param record - 原始记录
 * @returns 格式化后的记录
 */
function formatRecord(record: RecordInfo): ReimbursementRecord {
  const fields = record.fields || {};

  // 辅助函数：解析文本字段（处理数组格式 [{text: 'xxx', type: 'text'}]）
  const parseTextField = (field: any): string => {
    if (Array.isArray(field) && field.length > 0) {
      if (field[0].text !== undefined) {
        return field[0].text;
      }
      return String(field[0]);
    }
    return field || '';
  };

  // 解析报销人
  let submitter = '';
  const submitterField = fields['报销人'];
  if (Array.isArray(submitterField) && submitterField.length > 0) {
    submitter = submitterField[0].name || submitterField[0].id || '';
  }

  // 解析日期
  let invoiceDate = '';
  if (fields['开票日期']) {
    const date = new Date(fields['开票日期']);
    invoiceDate = date.toISOString().split('T')[0];
  }

  return {
    record_id: record.record_id,
    serial_no: parseTextField(fields['序号']),
    expense_type: fields['费用类型'] || '',
    invoice_amount: fields['发票金额'] || 0,
    reimbursement_amount: fields['报销金额'] || 0,
    submitter,
    purpose: parseTextField(fields['用途说明']),
    invoice_title: parseTextField(fields['发票抬头']),
    seller_name: parseTextField(fields['销方名称']),
    tax_number: parseTextField(fields['税号']),
    invoice_date: invoiceDate,
    status: fields['提交状态'] || '',
    created_time: record.created_time,
    fields,
  };
}

/**
 * 更新历史记录中的权限配置
 * 
 * @param manageUsers - 管理员列表
 * @param editUsers - 编辑者列表
 */
export function updatePermissionConfig(
  manageUsers: string[],
  editUsers: string[]
): void {
  const history = loadReimbursementHistory();
  history.manage_user_ids = manageUsers;
  history.edit_user_ids = editUsers;
  saveReimbursementHistory(history);
  console.log(`[lib/reimbursement-manager] 权限配置已更新`);
}

/**
 * 获取报销表统计信息
 * 
 * @param month - 年月（可选）
 * @returns 统计信息
 */
export async function getBitableStats(
  month?: string
): Promise<{
  total_records: number;
  total_amount: number;
  pending_count: number;
  approved_count: number;
}> {
  const history = loadReimbursementHistory();
  const targetMonth = month || getCurrentMonth();
  const bitable = findMonthBitable(history, targetMonth);

  if (!bitable) {
    return {
      total_records: 0,
      total_amount: 0,
      pending_count: 0,
      approved_count: 0,
    };
  }

  try {
    let tableId = bitable.table_id;
    if (!tableId) {
      const tables = await listAppTables(bitable.app_token);
      if (tables.length > 0) {
        tableId = tables[0].table_id;
      } else {
        return {
          total_records: 0,
          total_amount: 0,
          pending_count: 0,
          approved_count: 0,
        };
      }
    }

    const records = await listTableRecords(bitable.app_token, tableId, 1000);

    let totalAmount = 0;
    let pendingCount = 0;
    let approvedCount = 0;

    records.forEach((r: RecordInfo) => {
      const amount = r.fields['报销金额'] || 0;
      totalAmount += amount;

      const status = r.fields['提交状态'];
      if (status === '待审核' || status === '审核中') {
        pendingCount++;
      } else if (status === '已通过') {
        approvedCount++;
      }
    });

    return {
      total_records: records.length,
      total_amount: totalAmount,
      pending_count: pendingCount,
      approved_count: approvedCount,
    };
  } catch (error: any) {
    console.error(`[lib/reimbursement-manager] 获取统计失败: ${error.message}`);
    return {
      total_records: 0,
      total_amount: 0,
      pending_count: 0,
      approved_count: 0,
    };
  }
}
