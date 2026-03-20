/**
 * 智能报销助手测试
 * 
 * 测试覆盖：
 * 1. 报销表管理（获取/创建）
 * 2. 报销记录增删改查
 * 3. 发票信息提取
 * 4. 统计功能
 */

import {
  getOrCreateMonthBitable,
  addReimbursementRecord,
  queryUserReimbursementRecords,
  getReimbursementRecord,
  updateReimbursementRecord,
  getBitableStats,
  loadReimbursementHistory,
  updatePermissionConfig,
} from '../lib/reimbursement-manager';
import {
  extractInvoiceInfo,
  parseLLMResult,
  mergeReimbursementInfo,
  validateReimbursementInfo,
} from '../lib/invoice-extractor';
import { uploadMedia } from '../lib/drive';

const TEST_USER_ID = 'ou_da073ce51bb1f01ca80226f92570c9d0';
const TEST_FILE = 'tests/test_reimbursement_files/打印标书-dzfp_26412000000829019071_河南叮当品牌策划有限公司_20260310202844(1).pdf';

describe('智能报销助手测试', () => {
  
  // 测试 1: 报销表管理
  describe('报销表管理', () => {
    test('获取或创建当月报销表', async () => {
      const bitable = await getOrCreateMonthBitable();
      
      expect(bitable).toBeDefined();
      expect(bitable.exists).toBe(true);
      expect(bitable.date).toMatch(/^\d{4}-\d{2}$/);
      expect(bitable.app_token).toBeTruthy();
      expect(bitable.table_id).toBeTruthy();
      expect(bitable.link_href).toContain('feishu.cn/base/');
    }, 60000);

    test('历史记录管理', () => {
      const history = loadReimbursementHistory();
      
      expect(history).toHaveProperty('manage_user_ids');
      expect(history).toHaveProperty('edit_user_ids');
      expect(history).toHaveProperty('bittable');
      expect(Array.isArray(history.bittable)).toBe(true);
    });

    test('更新权限配置', () => {
      const testManageUsers = [TEST_USER_ID];
      const testEditUsers = [TEST_USER_ID];
      
      updatePermissionConfig(testManageUsers, testEditUsers);
      
      const history = loadReimbursementHistory();
      expect(history.manage_user_ids).toEqual(testManageUsers);
      expect(history.edit_user_ids).toEqual(testEditUsers);
    });
  });

  // 测试 2: 报销记录操作
  describe('报销记录操作', () => {
    let testRecordId: string;
    let bitable: any;

    beforeAll(async () => {
      bitable = await getOrCreateMonthBitable();
    }, 60000);

    test('添加报销记录', async () => {
      const uploadResult = await uploadMedia(TEST_FILE, 'bitable_file', bitable.app_token);
      
      const result = await addReimbursementRecord({
        expenseType: '办公用品',
        invoiceAmount: 190,
        reimbursementAmount: 190,
        purpose: '打印制作费 - 测试',
        invoiceTitle: '河南叮当品牌策划有限公司',
        sellerName: '郑州新达图文设计有限公司',
        taxNumber: '91410100MA3X8PDY5L',
        invoiceDate: '2026-03-10',
        invoiceNo: '26412000000829019071',
        attachments: [uploadResult.file_token],
        submitterUserId: TEST_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.record_id).toBeTruthy();
      expect(result.serial_no).toMatch(/^\d{6}-\d{3}$/);
      
      testRecordId = result.record_id!;
    }, 60000);

    test('查询用户报销记录', async () => {
      const records = await queryUserReimbursementRecords(TEST_USER_ID);
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
      
      const testRecord = records.find(r => r.record_id === testRecordId);
      expect(testRecord).toBeDefined();
      expect(testRecord?.expense_type).toBe('办公用品');
    }, 30000);

    test('获取单条报销记录', async () => {
      const record = await getReimbursementRecord(testRecordId);
      
      expect(record).toBeDefined();
      expect(record?.record_id).toBe(testRecordId);
      expect(record?.expense_type).toBe('办公用品');
      expect(record?.reimbursement_amount).toBe(190);
    }, 30000);

    test('修改报销记录', async () => {
      const updateResult = await updateReimbursementRecord(testRecordId, {
        reimbursementAmount: 180,
        purpose: '打印制作费 - 已修改',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.record_id).toBe(testRecordId);
      expect(updateResult.updated_fields).toHaveProperty('报销金额');
    }, 30000);

    test('验证修改结果', async () => {
      // 等待数据同步
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const record = await getReimbursementRecord(testRecordId);
      
      expect(record).toBeDefined();
      expect(record?.reimbursement_amount).toBe(180);
      expect(record?.purpose).toContain('已修改');
    }, 30000);
  });

  // 测试 3: 统计功能
  describe('统计功能', () => {
    test('获取报销表统计', async () => {
      const stats = await getBitableStats();
      
      expect(stats).toHaveProperty('total_records');
      expect(stats).toHaveProperty('total_amount');
      expect(stats).toHaveProperty('pending_count');
      expect(stats).toHaveProperty('approved_count');
      
      expect(typeof stats.total_records).toBe('number');
      expect(typeof stats.total_amount).toBe('number');
      expect(stats.total_records).toBeGreaterThanOrEqual(0);
      expect(stats.total_amount).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  // 测试 4: 发票信息提取
  describe('发票信息提取', () => {
    test('本地 PDF 提取', async () => {
      const result = await extractInvoiceInfo(TEST_FILE, { forceLocal: true });
      
      expect(result.success).toBe(true);
      expect(result.extractMethod).toBe('local');
      expect(result.invoiceNo).toBeTruthy();
      expect(result.amount).toBeGreaterThan(0);
    }, 30000);

    test('解析 LLM 结果', () => {
      const llmResponse = {
        invoiceNo: '1234567890',
        invoiceDate: '2026-03-15',
        amount: 100,
        invoiceTitle: '测试公司',
        taxNumber: '91110000123456789X',
        sellerName: '销售方公司',
        expenseType: '办公用品',
        purpose: '测试用途',
      };

      const result = parseLLMResult(llmResponse);

      expect(result.success).toBe(true);
      expect(result.extractMethod).toBe('llm');
      expect(result.invoiceNo).toBe('1234567890');
      expect(result.amount).toBe(100);
      expect(result.expenseType).toBe('办公用品');
    });

    test('合并报销信息', () => {
      const userInput = {
        expenseType: '差旅',
        reimbursementAmount: 80,
      };

      const extracted = {
        success: true,
        invoiceNo: '123456',
        amount: 100,
        expenseType: '办公用品',
        purpose: '测试',
      };

      const result = mergeReimbursementInfo(userInput, extracted, TEST_USER_ID);

      // 用户输入优先
      expect(result.expenseType).toBe('差旅');
      expect(result.reimbursementAmount).toBe(80);
      // 提取信息补充
      expect(result.invoiceAmount).toBe(100);
      expect(result.submitterUserId).toBe(TEST_USER_ID);
    });

    test('验证报销信息', () => {
      const validInfo = {
        expenseType: '差旅',
        invoiceAmount: 100,
        reimbursementAmount: 100,
        submitterUserId: TEST_USER_ID,
        purpose: '测试',
      };

      const invalidInfo = {
        expenseType: '',
        invoiceAmount: 0,
        reimbursementAmount: -1,
        submitterUserId: '',
        purpose: '',
      };

      const validResult = validateReimbursementInfo(validInfo as any);
      const invalidResult = validateReimbursementInfo(invalidInfo as any);

      expect(validResult.valid).toBe(true);
      expect(validResult.missingFields.length).toBe(0);

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.missingFields.length).toBeGreaterThan(0);
    });
  });
});
