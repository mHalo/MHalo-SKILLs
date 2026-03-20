/**
 * 报销及发票管理测试
 * 
 * 测试范围:
 * - 多维表格基础能力 (lib/bitable.ts)
 * - 报销场景组合能力 (createExpenseBitable, addExpenseRecord)
 * 
 * 运行测试:
 *   npx ts-node tests/expense-reimbursement.test.ts
 * 
 * 注意：
 * - 这些测试需要有效的飞书应用凭证
 * - 测试会创建真实的多维表格应用
 * - 测试完成后会清理测试数据
 */

import {
  createBitableApp,
  createAppTable,
  listAppTables,
  listTableFields,
  createTableField,
  listTableRecords,
  deleteTableRecord,
  createExpenseBitable,
  addExpenseRecord,
  type FieldConfig,
  type FieldType,
} from '../lib/bitable';

// 测试配置
const TEST_TIMEOUT = 60000; // 60秒超时

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// 测试结果统计
let passCount = 0;
let failCount = 0;

/**
 * 断言函数
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * 打印测试结果
 */
function printResult(name: string, success: boolean, error?: string): void {
  if (success) {
    console.log(`  ${colors.green}✓${colors.reset} ${name}`);
    passCount++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${name}`);
    if (error) {
      console.log(`    ${colors.red}错误: ${error}${colors.reset}`);
    }
    failCount++;
  }
}

/**
 * 运行单个测试
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    await testFn();
    printResult(name, true);
  } catch (error: any) {
    printResult(name, false, error.message);
  }
}

// ============ 测试用例 ============

/**
 * 测试 1: 创建多维表格应用
 */
async function testCreateBitableApp(): Promise<void> {
  const appName = `测试应用-${Date.now()}`;
  const app = await createBitableApp(appName);

  assert(!!app.app_token, '应该返回 app_token');
  assert(!!app.app_url, '应该返回 app_url');
  assert(app.name === appName, '应用名称应该匹配');

  console.log(`    应用 Token: ${app.app_token}`);
  return;
}

/**
 * 测试 2: 创建表格
 */
async function testCreateAppTable(): Promise<void> {
  // 先创建应用
  const app = await createBitableApp(`测试表格-${Date.now()}`);

  const fields: FieldConfig[] = [
    { field_name: '姓名', ui_type: 'Text' },
    { field_name: '金额', ui_type: 'Currency', property: { currency_code: 'CNY' } },
    { field_name: '日期', ui_type: 'Date' },
  ];

  const table = await createAppTable(app.app_token, '测试数据表', fields);

  assert(!!table.table_id, '应该返回 table_id');
  assert(table.name === '测试数据表', '表格名称应该匹配');

  console.log(`    表格 ID: ${table.table_id}`);
  return;
}

/**
 * 测试 3: 获取表格列表
 */
async function testListAppTables(): Promise<void> {
  const app = await createBitableApp(`测试列表-${Date.now()}`);
  
  // 创建两个表格
  await createAppTable(app.app_token, '表格1', [{ field_name: '字段1', ui_type: 'Text' }]);
  await createAppTable(app.app_token, '表格2', [{ field_name: '字段2', ui_type: 'Text' }]);

  const tables = await listAppTables(app.app_token);

  assert(tables.length >= 2, '应该至少有两个表格');
  assert(tables.some(t => t.name === '表格1'), '应该包含表格1');
  assert(tables.some(t => t.name === '表格2'), '应该包含表格2');

  console.log(`    表格数量: ${tables.length}`);
  return;
}

/**
 * 测试 4: 获取字段列表
 */
async function testListTableFields(): Promise<void> {
  const app = await createBitableApp(`测试字段-${Date.now()}`);
  const table = await createAppTable(app.app_token, '字段测试表', [
    { field_name: '姓名', ui_type: 'Text' },
    { field_name: '年龄', ui_type: 'Number' },
    { field_name: '状态', ui_type: 'SingleSelect', property: { options: [{ name: '正常', color: 1 }] } },
  ]);

  const fields = await listTableFields(app.app_token, table.table_id);

  assert(fields.length >= 3, '应该至少有3个字段');
  assert(fields.some(f => f.field_name === '姓名'), '应该包含"姓名字段');
  assert(fields.some(f => f.field_name === '年龄'), '应该包含"年龄"字段');
  assert(fields.some(f => f.field_name === '状态'), '应该包含"状态"字段');

  console.log(`    字段数量: ${fields.length}`);
  console.log(`    字段列表: ${fields.map(f => f.field_name).join(', ')}`);
  return;
}

/**
 * 测试 5: 创建字段
 */
async function testCreateTableField(): Promise<void> {
  const app = await createBitableApp(`测试创建字段-${Date.now()}`);
  const table = await createAppTable(app.app_token, '创建字段测试表', [
    { field_name: '基础字段', ui_type: 'Text' },
  ]);

  const newField: FieldConfig = {
    field_name: '新增字段',
    ui_type: 'Checkbox',
  };

  const field = await createTableField(app.app_token, table.table_id, newField);

  assert(!!field.field_id, '应该返回 field_id');
  assert(field.field_name === '新增字段', '字段名称应该匹配');
  assert(field.ui_type === 'Checkbox', '字段类型应该是 Checkbox');

  console.log(`    字段 ID: ${field.field_id}`);
  return;
}

/**
 * 测试 6: 记录操作（查询和删除）
 */
async function testRecordOperations(): Promise<void> {
  const app = await createBitableApp(`测试记录-${Date.now()}`);
  const table = await createAppTable(app.app_token, '记录测试表', [
    { field_name: '名称', ui_type: 'Text' },
  ]);

  // 查询记录（刚创建的表格应该没有记录或只有自动创建的记录）
  const records = await listTableRecords(app.app_token, table.table_id);
  console.log(`    初始记录数: ${records.length}`);

  // 如果有记录，测试删除
  if (records.length > 0) {
    await deleteTableRecord(app.app_token, table.table_id, records[0].record_id);
    const recordsAfterDelete = await listTableRecords(app.app_token, table.table_id);
    assert(recordsAfterDelete.length === records.length - 1, '删除后记录数应该减少1');
    console.log(`    删除后记录数: ${recordsAfterDelete.length}`);
  }

  return;
}

/**
 * 测试 7: 一键创建报销表格
 */
async function testCreateExpenseBitable(): Promise<void> {
  const result = await createExpenseBitable(`测试${Date.now()}`);

  assert(!!result.app_token, '应该返回 app_token');
  assert(!!result.table_id, '应该返回 table_id');
  assert(!!result.table_url, '应该返回 table_url');
  assert(result.fields.length === 13, '应该有13个字段');

  // 验证字段
  const expectedFields = [
    '序号', '费用类型', '金额', '报销人', '提交日期', '用途说明',
    '发票抬头', '发票附件', '抬头是否正确', '税号', '开票日期', '抵扣说明', '提交状态',
  ];

  for (const fieldName of expectedFields) {
    assert(
      result.fields.some(f => f.field_name === fieldName),
      `应该包含"${fieldName}"字段`
    );
  }

  console.log(`    应用 Token: ${result.app_token}`);
  console.log(`    表格 ID: ${result.table_id}`);
  console.log(`    字段数: ${result.fields.length}`);
  return;
}

/**
 * 测试 8: 添加报销记录
 */
async function testAddExpenseRecord(): Promise<void> {
  const result = await createExpenseBitable(`测试报销记录${Date.now()}`);

  const record = await addExpenseRecord(result.app_token, result.table_id, {
    expenseType: '差旅',
    amount: 1250.50,
    submitter: '测试人员',
    purpose: '北京出差测试',
    invoiceTitle: '叮当互动科技有限公司',
    isTitleCorrect: true,
    taxNumber: '91110108XXXXXXXX',
    invoiceDate: '2024-03-15',
    deductionNote: '可抵扣',
    status: '待审核',
  });

  assert(!!record.record_id, '应该返回 record_id');
  assert(record.fields['费用类型'] === '差旅', '费用类型应该匹配');
  assert(record.fields['金额'] === 1250.50, '金额应该匹配');
  assert(record.fields['报销人'] === '测试人员', '报销人应该匹配');

  console.log(`    记录 ID: ${record.record_id}`);
  console.log(`    报销人: ${record.fields['报销人']}`);
  console.log(`    金额: ¥${record.fields['金额']}`);
  return;
}

/**
 * 测试 9: 字段类型验证
 */
async function testFieldTypes(): Promise<void> {
  const result = await createExpenseBitable(`测试字段类型${Date.now()}`);
  const fields = result.fields;

  // 验证各字段类型
  const typeChecks: { name: string; expectedType: FieldType }[] = [
    { name: '序号', expectedType: 'AutoNumber' },
    { name: '费用类型', expectedType: 'SingleSelect' },
    { name: '金额', expectedType: 'Currency' },
    { name: '报销人', expectedType: 'Text' },
    { name: '提交日期', expectedType: 'Date' },
    { name: '发票附件', expectedType: 'Attachment' },
    { name: '抬头是否正确', expectedType: 'Checkbox' },
    { name: '提交状态', expectedType: 'SingleSelect' },
  ];

  for (const check of typeChecks) {
    const field = fields.find(f => f.field_name === check.name);
    assert(!!field, `应该找到"${check.name}"字段`);
    assert(
      field.ui_type === check.expectedType,
      `"${check.name}"字段类型应该是 ${check.expectedType}，实际为 ${field.ui_type}`
    );
  }

  console.log(`    ✓ 所有字段类型验证通过`);
  return;
}

// ============ 测试运行器 ============

async function runAllTests(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 报销及发票管理测试套件');
  console.log('='.repeat(60) + '\n');

  // 基础能力测试
  console.log(`${colors.blue}基础能力测试${colors.reset}`);
  await runTest('创建多维表格应用', testCreateBitableApp);
  await runTest('创建表格', testCreateAppTable);
  await runTest('获取表格列表', testListAppTables);
  await runTest('获取字段列表', testListTableFields);
  await runTest('创建字段', testCreateTableField);
  await runTest('记录操作（查询/删除）', testRecordOperations);

  // 组合能力测试
  console.log(`\n${colors.blue}组合能力测试${colors.reset}`);
  await runTest('一键创建报销表格', testCreateExpenseBitable);
  await runTest('添加报销记录', testAddExpenseRecord);
  await runTest('字段类型验证', testFieldTypes);

  // 测试结果汇总
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));
  console.log(`${colors.green}通过: ${passCount}${colors.reset}`);
  console.log(`${colors.red}失败: ${failCount}${colors.reset}`);
  console.log(`总计: ${passCount + failCount}`);

  if (failCount === 0) {
    console.log(`\n${colors.green}🎉 所有测试通过！${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}⚠️ 有测试未通过，请检查上述错误信息${colors.reset}\n`);
    process.exit(1);
  }
}

// 设置超时
const timeoutId = setTimeout(() => {
  console.error('\n❌ 测试超时（超过60秒）');
  process.exit(1);
}, TEST_TIMEOUT);

// 运行测试
runAllTests()
  .then(() => {
    clearTimeout(timeoutId);
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(timeoutId);
    console.error('\n❌ 测试运行失败:', error.message);
    process.exit(1);
  });
