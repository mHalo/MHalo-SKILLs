/**
 * 多维表格（Bitable）API 基础能力
 * 
 * 飞书文档: https://open.feishu.cn/document/server-docs/docs/bitable-v1/overview
 */

import { client } from './client';

// ============ 类型定义 ============

/**
 * 多维表格应用信息
 */
export interface BitableAppInfo {
  /** 应用标识 */
  app_token: string;
  /** 应用名称 */
  name: string;
  /** 应用访问链接 */
  app_url: string;
  /** 时区 */
  time_zone?: string;
}

/**
 * 表格信息
 */
export interface BitableTableInfo {
  /** 表格标识 */
  table_id: string;
  /** 表格名称 */
  name: string;
  /** 是否默认视图 */
  is_default?: boolean;
}

/**
 * 字段配置
 */
export interface FieldConfig {
  /** 字段名称 */
  field_name: string;
  /** 字段类型 */
  ui_type: FieldType;
  /** 字段属性（根据类型不同而变化） */
  property?: any;
}

/**
 * 字段信息
 */
export interface FieldInfo {
  /** 字段标识 */
  field_id: string;
  /** 字段名称 */
  field_name: string;
  /** 字段类型 */
  ui_type: FieldType;
  /** 字段属性 */
  property?: any;
  /** 是否主字段 */
  is_primary?: boolean;
}

/**
 * 字段类型
 */
export type FieldType =
  | 'Text'           // 文本 (type=1)
  | 'Number'         // 数字 (type=2)
  | 'Currency'       // 货币 (type=2)
  | 'DateTime'       // 日期时间 (type=5)
  | 'SingleSelect'   // 单选 (type=3)
  | 'MultiSelect'    // 多选 (type=4)
  | 'Checkbox'       // 复选框 (type=7)
  | 'Attachment'     // 附件 (type=17)
  | 'AutoNumber'     // 自动编号 (type=1005)
  | 'User'           // 人员 (type=11)
  | 'Phone'          // 电话 (type=13)
  | 'Url'            // 超链接 (type=15)
  | 'Link'           // 超链接(别名)
  | 'Rating'         // 评分 (type=2)
  | 'Formula'        // 公式 (type=20)
  | 'Lookup'         // 查找引用 (type=19)
  | 'CreatedTime'    // 创建时间 (type=1001)
  | 'ModifiedTime'   // 最后修改时间 (type=1002)
  | 'CreatedUser'    // 创建人 (type=1003)
  | 'ModifiedUser'   // 最后修改人 (type=1004)
  | 'Barcode'        // 条码 (type=1)
  | 'Progress'       // 进度 (type=2)
  | 'SingleLink'     // 单向关联 (type=18)
  | 'DuplexLink'     // 双向关联 (type=21)
  | 'Location'       // 地理位置 (type=22)
  | 'GroupChat';     // 群组 (type=23)

/**
 * 记录信息
 */
export interface RecordInfo {
  /** 记录标识 */
  record_id: string;
  /** 字段数据 */
  fields: Record<string, any>;
  /** 创建时间 */
  created_time?: string;
  /** 最后修改时间 */
  modified_time?: string;
}

/**
 * 报销表格创建结果
 */
export interface ExpenseBitableResult {
  /** 应用标识 */
  app_token: string;
  /** 表格标识 */
  table_id: string;
  /** 应用名称 */
  name: string;
  /** 应用访问链接 */
  app_url: string;
  /** 表格访问链接 */
  table_url: string;
  /** 字段列表 */
  fields: FieldInfo[];
}

// ============ 基础 API 封装 ============

/**
 * 创建多维表格应用
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app/create
 * 
 * @param name - 应用名称
 * @param folderToken - 文件夹 token（可选，默认为根目录）
 * @returns 应用信息
 */
export async function createBitableApp(
  name: string,
  folderToken?: string
): Promise<BitableAppInfo> {
  console.log(`[lib/bitable] 正在创建多维表格应用: ${name}...`);

  const res: any = await client.bitable.v1.app.create({
    data: {
      name,
      folder_token: folderToken,
      time_zone: 'Asia/Shanghai',
    },
  });

  if (res.code !== 0) {
    throw new Error(`创建多维表格应用失败: ${res.code} - ${res.msg}`);
  }

  const app = res.data?.app;
  if (!app?.app_token) {
    throw new Error('创建多维表格应用失败: 未返回 app_token');
  }

  const result: BitableAppInfo = {
    app_token: app.app_token,
    name: app.name,
    app_url: app.url,
    time_zone: app.time_zone,
  };

  console.log(`[lib/bitable] 应用创建成功: ${result.app_token}`);
  return result;
}

/**
 * 创建数据表（创建时直接定义所有字段）
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/create
 * 
 * @param appToken - 应用标识
 * @param name - 表格名称
 * @param fields - 字段配置列表（可选）
 * @param defaultViewName - 默认视图名称
 * @returns 表格信息
 */
export async function createAppTable(
  appToken: string,
  name: string,
  fields?: FieldConfig[],
  defaultViewName: string = '表格视图'
): Promise<BitableTableInfo> {
  console.log(`[lib/bitable] 正在创建表格: ${name}...`);

  // 构建请求数据
  const requestData: any = {
    table: {
      name,
      ...(defaultViewName && { default_view_name: defaultViewName }),
    },
  };

  // 如果有字段配置，转换为 API 格式
  if (fields && fields.length > 0) {
    requestData.table.fields = fields.map(field => {
      const fieldData: any = {
        field_name: field.field_name,
        type: fieldTypeToNumber(field.ui_type),
      };
      if (field.ui_type) {
        fieldData.ui_type = field.ui_type;
      }
      if (field.property) {
        fieldData.property = field.property;
      }
      return fieldData;
    });
  }

  const res: any = await client.bitable.v1.appTable.create({
    path: { app_token: appToken },
    data: requestData,
  });

  if (res.code !== 0) {
    throw new Error(`创建表格失败: ${res.code} - ${res.msg}`);
  }

  const table_id = res.data?.table_id;
  if (!table_id) {
    throw new Error('创建表格失败: 未返回 table_id');
  }

  const result: BitableTableInfo = {
    table_id,
    name,
    is_default: true,
  };

  console.log(`[lib/bitable] 表格创建成功: ${result.table_id}`);
  return result;
}

/**
 * 字段类型转数字编码
 */
function fieldTypeToNumber(uiType: FieldType): number {
  const typeMap: Record<string, number> = {
    'Text': 1,
    'Barcode': 1,
    'Number': 2,
    'Progress': 2,
    'Currency': 2,
    'Rating': 2,
    'SingleSelect': 3,
    'MultiSelect': 4,
    'DateTime': 5,
    'Date': 5,
    'Checkbox': 7,
    'User': 11,
    'GroupChat': 23,
    'Phone': 13,
    'Url': 15,
    'Link': 15,
    'Attachment': 17,
    'SingleLink': 18,
    'Formula': 20,
    'DuplexLink': 21,
    'Lookup': 19,
    'Location': 22,
    'CreatedTime': 1001,
    'ModifiedTime': 1002,
    'CreatedUser': 1003,
    'ModifiedUser': 1004,
    'AutoNumber': 1005,
  };
  return typeMap[uiType] || 1;
}

// ============ 组合能力：报销表格 ============

/**
 * 费用类型选项
 */
const EXPENSE_TYPE_OPTIONS = [
  { name: '差旅', color: 1 },
  { name: '办公用品', color: 2 },
  { name: '业务招待', color: 3 },
  { name: '交通费', color: 4 },
  { name: '餐补', color: 5 },
  { name: '项目垫付', color: 6 },
  { name: '其它', color: 7 },
];

/**
 * 提交状态选项
 */
const SUBMIT_STATUS_OPTIONS = [
  { name: '待审核', color: 1 },
  { name: '审核中', color: 2 },
  { name: '已通过', color: 3 },
  { name: '已驳回', color: 4 },
];

/**
 * 报销表格字段配置（API格式）
 */
function getExpenseTableFields(): any[] {
  return [
    // 1. 序号 - 文本类型
    {
      field_name: '序号',
      type: 1,
      ui_type: 'Text',
    },
    // 2. 费用类型 - 单选
    {
      field_name: '费用类型',
      type: 3,
      ui_type: 'SingleSelect',
      property: {
        options: EXPENSE_TYPE_OPTIONS,
      },
    },
    // 3. 发票金额 - 数字（发票上的原始金额）
    {
      field_name: '发票金额',
      type: 2,
      ui_type: 'Number',
    },
    // 4. 报销金额 - 数字（实际报销金额，可能小于发票金额）
    {
      field_name: '报销金额',
      type: 2,
      ui_type: 'Number',
    },
    // 5. 报销人 - 人员字段
    {
      field_name: '报销人',
      type: 11,
      ui_type: 'User',
    },
    // 6. 用途说明 - 文本
    {
      field_name: '用途说明',
      type: 1,
      ui_type: 'Text',
    },
    // 7. 发票抬头 - 文本（购方信息，固定为叮当或填写无）
    {
      field_name: '发票抬头',
      type: 1,
      ui_type: 'Text',
    },
    // 8. 销方名称 - 文本（销售方/服务提供方）
    {
      field_name: '销方名称',
      type: 1,
      ui_type: 'Text',
    },
    // 9. 税号 - 文本
    {
      field_name: '税号',
      type: 1,
      ui_type: 'Text',
    },
    // 10. 开票日期 - 日期
    {
      field_name: '开票日期',
      type: 5,
      ui_type: 'DateTime',
    },
    // 11. 报销提交时间 - 日期（系统生成）
    {
      field_name: '报销提交时间',
      type: 5,
      ui_type: 'DateTime',
    },
    // 12. 抵扣说明 - 文本
    {
      field_name: '抵扣说明',
      type: 1,
      ui_type: 'Text',
    },
    // 13. 提交状态 - 单选
    {
      field_name: '提交状态',
      type: 3,
      ui_type: 'SingleSelect',
      property: {
        options: SUBMIT_STATUS_OPTIONS,
      },
    },
    // 14. 发票附件 - 附件
    {
      field_name: '发票附件',
      type: 17,
      ui_type: 'Attachment',
    },
  ];
}

/**
 * 创建报销统计表格（一键完成）
 * 
 * 优化后流程：
 * 1. 创建多维表格应用
 * 2. 创建表格（直接带所有字段）
 * 3. 返回表格链接
 * 
 * @param month - 月份（可选，默认为当前月份）
 * @returns 报销表格信息
 */
export async function createExpenseBitable(
  month?: string
): Promise<ExpenseBitableResult> {
  // 生成月份字符串
  const now = new Date();
  const monthStr = month || `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`;
  
  // 应用名称
  const appName = `叮当互动-${monthStr}-发票报销统计表`;
  
  console.log(`\n[lib/bitable] ========== 开始创建报销表格 ==========`);
  console.log(`[lib/bitable] 应用名称: ${appName}`);

  try {
    // Step 1: 创建应用
    console.log(`\n[Step 1/2] 创建多维表格应用...`);
    const app = await createBitableApp(appName);

    // Step 2: 创建表格（直接带所有字段）
    console.log(`\n[Step 2/2] 创建表格并配置字段...`);
    const fields = getExpenseTableFields();
    
    const res: any = await client.bitable.v1.appTable.create({
      path: { app_token: app.app_token },
      data: {
        table: {
          name: '发票报销明细',
          default_view_name: '全部报销记录',
          fields: fields,
        },
      },
    });

    if (res.code !== 0) {
      throw new Error(`创建表格失败: ${res.code} - ${res.msg}`);
    }

    const table_id = res.data.table_id;
    const tableUrl = `${app.app_url}?table=${table_id}`;

    // 获取字段列表
    const fieldsRes: any = await client.bitable.v1.appTableField.list({
      path: { app_token: app.app_token, table_id: table_id },
    });

    const result: ExpenseBitableResult = {
      app_token: app.app_token,
      table_id: table_id,
      name: app.name,
      app_url: app.app_url,
      table_url: tableUrl,
      fields: fieldsRes.data?.items || [],
    };

    console.log(`\n[lib/bitable] ========== 报销表格创建成功 ==========`);
    console.log(`[lib/bitable] 应用名称: ${result.name}`);
    console.log(`[lib/bitable] 表格链接: ${result.table_url}`);
    console.log(`[lib/bitable] 字段数量: ${result.fields.length}`);

    return result;
  } catch (error: any) {
    console.error(`\n[lib/bitable] ❌ 创建报销表格失败: ${error.message}`);
    throw error;
  }
}

/**
 * 添加报销记录
 * 
 * 字段写入格式：
 * - 文本字段: 字符串
 * - 数字字段: 数字
 * - 单选字段: 选项名称字符串
 * - 日期字段: 毫秒时间戳
 * - 附件字段: [{ file_token: "xxx" }]
 * - 人员字段: [{ id: "user_id" }]
 * 
 * @param appToken - 应用标识
 * @param tableId - 表格标识
 * @param record - 记录数据
 * @returns 记录信息
 */
export async function addExpenseRecord(
  appToken: string,
  tableId: string,
  record: {
    /** 序号（字符串） */
    serialNo: string;
    /** 费用类型 */
    expenseType: string;
    /** 发票金额（发票上的原始金额） */
    invoiceAmount: number;
    /** 报销金额（实际报销金额，可能小于发票金额） */
    reimbursementAmount: number;
    /** 报销人UserID（如：ou_da073ce51bb1f01ca80226f92570c9d0） */
    submitterUserId: string;
    /** 用途说明（可选） */
    purpose?: string;
    /** 发票抬头（购方信息，如：河南叮当品牌策划有限公司；非发票可填"无"） */
    invoiceTitle?: string;
    /** 销方名称（销售方/服务提供方，可选） */
    sellerName?: string;
    /** 发票附件FileToken数组（可选） */
    invoiceAttachment?: string[];
    /** 税号（可选） */
    taxNumber?: string;
    /** 开票日期（格式：yyyy-MM-dd，可选） */
    invoiceDate?: string;
    /** 报销提交时间（格式：yyyy-MM-dd，可选，默认当前时间） */
    submitTime?: string;
    /** 抵扣说明（可选） */
    deductionNote?: string;
    /** 提交状态（默认：待审核） */
    status?: string;
  }
): Promise<RecordInfo> {
  console.log(`[lib/bitable] 正在添加报销记录...`);

  // 构建字段数据
  const fields: Record<string, any> = {
    '序号': record.serialNo,
    '费用类型': record.expenseType,
    '发票金额': record.invoiceAmount,
    '报销金额': record.reimbursementAmount,
    '报销人': [{ id: record.submitterUserId }],  // 人员字段格式
  };

  // 可选字段
  if (record.purpose) fields['用途说明'] = record.purpose;
  if (record.invoiceTitle) fields['发票抬头'] = record.invoiceTitle;
  if (record.sellerName) fields['销方名称'] = record.sellerName;
  if (record.taxNumber) fields['税号'] = record.taxNumber;
  if (record.deductionNote) fields['抵扣说明'] = record.deductionNote;
  if (record.status) fields['提交状态'] = record.status;

  // 日期字段转换为毫秒时间戳
  if (record.invoiceDate) {
    fields['开票日期'] = new Date(record.invoiceDate).getTime();
  }
  
  // 报销提交时间（默认当前时间）
  const submitTime = record.submitTime || new Date().toISOString().split('T')[0];
  fields['报销提交时间'] = new Date(submitTime).getTime();

  // 附件字段转换为对象数组格式
  if (record.invoiceAttachment && record.invoiceAttachment.length > 0) {
    fields['发票附件'] = record.invoiceAttachment.map(token => ({ file_token: token }));
  }

  const res: any = await client.bitable.v1.appTableRecord.create({
    path: { app_token: appToken, table_id: tableId },
    data: { fields },
  });

  if (res.code !== 0) {
    throw new Error(`添加报销记录失败: ${res.code} - ${res.msg}`);
  }

  const result: RecordInfo = {
    record_id: res.data?.record?.record_id,
    fields: res.data?.record?.fields,
    created_time: res.data?.record?.created_time,
  };

  console.log(`[lib/bitable] 报销记录添加成功: ${result.record_id}`);
  return result;
}

/**
 * 获取应用中的表格列表
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/list
 * 
 * @param appToken - 应用标识
 * @returns 表格列表
 */
export async function listAppTables(appToken: string): Promise<BitableTableInfo[]> {
  console.log(`[lib/bitable] 正在获取表格列表...`);

  const res: any = await client.bitable.v1.appTable.list({
    path: { app_token: appToken },
  });

  if (res.code !== 0) {
    throw new Error(`获取表格列表失败: ${res.code} - ${res.msg}`);
  }

  const items = (res.data?.items || []).map((item: any) => ({
    table_id: item.table_id,
    name: item.name,
    is_default: item.is_default,
  }));

  console.log(`[lib/bitable] 获取到 ${items.length} 个表格`);
  return items;
}

/**
 * 获取表格字段列表
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-field/list
 * 
 * @param appToken - 应用标识
 * @param tableId - 表格标识
 * @returns 字段列表
 */
export async function listTableFields(
  appToken: string,
  tableId: string
): Promise<FieldInfo[]> {
  console.log(`[lib/bitable] 正在获取字段列表...`);

  const res: any = await client.bitable.v1.appTableField.list({
    path: { app_token: appToken, table_id: tableId },
  });

  if (res.code !== 0) {
    throw new Error(`获取字段列表失败: ${res.code} - ${res.msg}`);
  }

  const items = (res.data?.items || []).map((item: any) => ({
    field_id: item.field_id,
    field_name: item.field_name,
    ui_type: item.ui_type,
    property: item.property,
    is_primary: item.is_primary,
  }));

  console.log(`[lib/bitable] 获取到 ${items.length} 个字段`);
  return items;
}

/**
 * 查询表格记录
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/search
 * 
 * @param appToken - 应用标识
 * @param tableId - 表格标识
 * @param pageSize - 每页数量
 * @returns 记录列表
 */
export async function listTableRecords(
  appToken: string,
  tableId: string,
  pageSize: number = 500
): Promise<RecordInfo[]> {
  console.log(`[lib/bitable] 正在查询记录...`);

  const res: any = await client.bitable.v1.appTableRecord.search({
    path: { app_token: appToken, table_id: tableId },
    data: {},
    params: {
      page_size: pageSize,
    },
  });

  if (res.code !== 0) {
    throw new Error(`查询记录失败: ${res.code} - ${res.msg}`);
  }

  const items = (res.data?.items || []).map((item: any) => ({
    record_id: item.record_id,
    fields: item.fields,
    created_time: item.created_time,
    modified_time: item.modified_time,
  }));

  console.log(`[lib/bitable] 查询到 ${items.length} 条记录`);
  return items;
}

/**
 * 删除表格记录
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/delete
 * 
 * @param appToken - 应用标识
 * @param tableId - 表格标识
 * @param recordId - 记录标识
 */
export async function deleteTableRecord(
  appToken: string,
  tableId: string,
  recordId: string
): Promise<void> {
  console.log(`[lib/bitable] 正在删除记录: ${recordId}...`);

  const res: any = await client.bitable.v1.appTableRecord.delete({
    path: { 
      app_token: appToken, 
      table_id: tableId,
      record_id: recordId,
    },
  });

  if (res.code !== 0) {
    throw new Error(`删除记录失败: ${res.code} - ${res.msg}`);
  }

  console.log(`[lib/bitable] 记录删除成功: ${recordId}`);
}

/**
 * 创建字段
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-field/create
 * 
 * @param appToken - 应用标识
 * @param tableId - 表格标识
 * @param field - 字段配置
 * @returns 字段信息
 */
export async function createTableField(
  appToken: string,
  tableId: string,
  field: FieldConfig
): Promise<FieldInfo> {
  console.log(`[lib/bitable] 正在创建字段: ${field.field_name}...`);

  const res: any = await client.bitable.v1.appTableField.create({
    path: { app_token: appToken, table_id: tableId },
    data: {
      field_name: field.field_name,
      type: fieldTypeToNumber(field.ui_type),
      ...(field.property && { property: field.property }),
    },
  });

  if (res.code !== 0) {
    throw new Error(`创建字段失败: ${res.code} - ${res.msg}`);
  }

  const result: FieldInfo = {
    field_id: res.data?.field?.field_id,
    field_name: res.data?.field?.field_name,
    ui_type: res.data?.field?.ui_type,
    property: res.data?.field?.property,
    is_primary: res.data?.field?.is_primary,
  };

  console.log(`[lib/bitable] 字段创建成功: ${result.field_id}`);
  return result;
}
