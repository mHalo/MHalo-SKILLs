/**
 * 发票/图片信息提取模块
 * 
 * 功能：从 PDF 发票或图片中提取结构化信息
 * 
 * 优先策略：
 * 1. 优先使用大模型分析（通过外部 API 调用）
 * 2. 当大模型不可用时，使用本地 PDF 识别（pdfplumber）
 * 
 * 提取字段：
 * - 发票号码
 * - 开票日期
 * - 发票金额（含税总价）
 * - 发票抬头（购方名称）
 * - 税号（购方税号）
 * - 销方名称
 * - 费用类型（智能分类）
 * - 用途说明
 */

import * as fs from 'fs';
import * as path from 'path';

// ============ 类型定义 ============

/**
 * 提取的发票信息
 */
export interface ExtractedInvoiceInfo {
  /** 是否成功提取 */
  success: boolean;
  /** 发票号码 */
  invoiceNo?: string;
  /** 开票日期（格式：yyyy-MM-dd） */
  invoiceDate?: string;
  /** 发票金额（含税总价） */
  amount?: number;
  /** 发票抬头（购方名称） */
  invoiceTitle?: string;
  /** 税号 */
  taxNumber?: string;
  /** 销方名称（销售方） */
  sellerName?: string;
  /** 费用类型（智能分类） */
  expenseType?: string;
  /** 用途说明 */
  purpose?: string;
  /** 提取方法：'llm' | 'local' | 'manual' */
  extractMethod?: string;
  /** 错误信息（如果失败） */
  error?: string;
  /** 原始文本（用于调试） */
  rawText?: string;
}

/**
 * 报销信息（用户输入+提取信息合并）
 */
export interface ReimbursementInfo {
  /** 费用类型 */
  expenseType: string;
  /** 发票金额 */
  invoiceAmount: number;
  /** 报销金额（用户实际申请的金额，可能小于发票金额） */
  reimbursementAmount: number;
  /** 用途说明 */
  purpose: string;
  /** 发票抬头 */
  invoiceTitle?: string;
  /** 销方名称 */
  sellerName?: string;
  /** 税号 */
  taxNumber?: string;
  /** 开票日期 */
  invoiceDate?: string;
  /** 发票号码 */
  invoiceNo?: string;
  /** 发票附件 FileToken 列表 */
  attachments?: string[];
  /** 报销人 User ID */
  submitterUserId: string;
  /** 抵扣说明 */
  deductionNote?: string;
}

// ============ 大模型提取（优先） ============

/**
 * 调用大模型分析发票/图片
 * 
 * 注意：此函数需要在外部实现具体的 LLM API 调用
 * 这里提供接口定义和模拟实现
 * 
 * @param filePath - 文件路径（PDF 或图片）
 * @param fileType - 文件类型：'pdf' | 'image'
 * @returns 提取的发票信息
 */
export async function extractWithLLM(
  filePath: string,
  fileType: 'pdf' | 'image'
): Promise<ExtractedInvoiceInfo> {
  console.log(`[lib/invoice-extractor] 尝试使用大模型分析: ${path.basename(filePath)}`);

  try {
    // 检查是否为图片文件，如果是则转换为 base64
    const isImage = fileType === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filePath);
    
    // 读取文件内容
    const fileBuffer = fs.readFileSync(filePath);
    const base64Content = fileBuffer.toString('base64');
    
    // 构建文件 URL 或内容（用于传递给 LLM）
    const fileData = {
      type: isImage ? 'image' : 'pdf',
      name: path.basename(filePath),
      base64: base64Content,
      mimeType: isImage ? 'image/jpeg' : 'application/pdf',
    };

    // TODO: 在这里实现具体的 LLM API 调用
    // 示例：调用 Kimi API、OpenAI API 或其他大模型服务
    // 
    // const result = await callLLMAPI({
    //   file: fileData,
    //   prompt: `请从这张发票中提取以下信息，以 JSON 格式返回：
    //     {
    //       "invoiceNo": "发票号码",
    //       "invoiceDate": "开票日期（yyyy-MM-dd）",
    //       "amount": 发票金额（数字）,
    //       "invoiceTitle": "发票抬头（购方名称）",
    //       "taxNumber": "税号",
    //       "sellerName": "销方名称（销售方）",
    //       "expenseType": "费用类型（差旅/办公用品/业务招待/交通费/餐补/项目垫付/其它）",
    //       "purpose": "用途说明"
    //     }`
    // });

    // 目前返回需要 LLM 处理的状态
    // 实际使用时，agent 应该调用 LLM 并将结果传回
    return {
      success: false,
      extractMethod: 'llm',
      error: '需要调用大模型进行提取。请使用 LLM 分析此文件，并按照 ExtractedInvoiceInfo 接口返回结果。',
    };
  } catch (error: any) {
    console.error(`[lib/invoice-extractor] LLM 提取失败: ${error.message}`);
    return {
      success: false,
      extractMethod: 'llm',
      error: `LLM 提取失败: ${error.message}`,
    };
  }
}

/**
 * 解析 LLM 返回的结果
 * 
 * 供 Agent 调用，将 LLM 提取的结果转换为结构化数据
 * 
 * @param llmResponse - LLM 返回的 JSON 字符串或对象
 * @returns 提取的发票信息
 */
export function parseLLMResult(llmResponse: string | object): ExtractedInvoiceInfo {
  try {
    const data = typeof llmResponse === 'string' ? JSON.parse(llmResponse) : llmResponse;
    
    // 映射字段（支持多种字段命名）
    const result: ExtractedInvoiceInfo = {
      success: true,
      extractMethod: 'llm',
    };

    // 发票号码
    if (data.invoiceNo || data.invoice_no || data.发票号码) {
      result.invoiceNo = String(data.invoiceNo || data.invoice_no || data.发票号码).trim();
    }

    // 开票日期
    if (data.invoiceDate || data.invoice_date || data.date || data.开票日期 || data.日期) {
      result.invoiceDate = normalizeDate(String(data.invoiceDate || data.invoice_date || data.date || data.开票日期 || data.日期));
    }

    // 金额（优先使用价税合计/总金额）
    const amountValue = data.amount || data.totalAmount || data.total || data.金额 || data.价税合计 || data.发票金额;
    if (amountValue !== undefined) {
      result.amount = parseFloat(String(amountValue).replace(/[¥,]/g, ''));
    }

    // 发票抬头（购方名称）
    if (data.invoiceTitle || data.buyerName || data. purchaser || data.发票抬头 || data.购方名称 || data.购买方) {
      result.invoiceTitle = String(data.invoiceTitle || data.buyerName || data.purchaser || data.发票抬头 || data.购方名称 || data.购买方).trim();
    }

    // 税号
    if (data.taxNumber || data.tax_no || data.税号 || data.纳税人识别号) {
      result.taxNumber = String(data.taxNumber || data.tax_no || data.税号 || data.纳税人识别号).trim();
    }

    // 销方名称
    if (data.sellerName || data.seller || data.salesName || data.销方名称 || data.销售方 || data.销售方名称) {
      result.sellerName = String(data.sellerName || data.seller || data.salesName || data.销方名称 || data.销售方 || data.销售方名称).trim();
    }

    // 费用类型（智能分类）
    if (data.expenseType || data.category || data.type || data.费用类型 || data.类型) {
      result.expenseType = classifyExpenseType(String(data.expenseType || data.category || data.type || data.费用类型 || data.类型));
    }

    // 用途说明
    if (data.purpose || data.description || data.remark || data.用途 || data.用途说明 || data.备注) {
      result.purpose = String(data.purpose || data.description || data.remark || data.用途 || data.用途说明 || data.备注).trim();
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      extractMethod: 'llm',
      error: `解析 LLM 结果失败: ${error.message}`,
    };
  }
}

// ============ 本地提取（备选） ============

/**
 * 使用本地 pdfplumber 提取 PDF 文本
 * 
 * @param pdfPath - PDF 文件路径
 * @returns 提取的文本内容
 */
async function extractPdfTextLocal(pdfPath: string): Promise<string> {
  // 使用动态导入避免在 Node.js 环境外报错
  const { execSync } = require('child_process');
  
  try {
    // 调用 Python 脚本提取 PDF 文本
    const scriptPath = path.join(__dirname, '..', 'temp', 'extract_pdf.py');
    
    // 确保 Python 脚本存在
    if (!fs.existsSync(scriptPath)) {
      const pythonScript = `
import pdfplumber
import sys

pdf_path = sys.argv[1]
try:
    with pdfplumber.open(pdf_path) as pdf:
        text = []
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
        print('\\n---PAGE_BREAK---\\n'.join(text))
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`;
      fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
      fs.writeFileSync(scriptPath, pythonScript, 'utf-8');
    }

    const result = execSync(`python "${scriptPath}" "${pdfPath}"`, {
      encoding: 'utf-8',
      timeout: 30000,
    });

    return result.trim();
  } catch (error: any) {
    throw new Error(`PDF 提取失败: ${error.message}`);
  }
}

/**
 * 从文本中解析发票信息
 * 
 * @param text - 提取的文本内容
 * @returns 提取的发票信息
 */
function parseInvoiceFromText(text: string): ExtractedInvoiceInfo {
  const result: ExtractedInvoiceInfo = {
    success: true,
    extractMethod: 'local',
    rawText: text.substring(0, 2000), // 只保留前2000字符用于调试
  };

  // 提取发票号码（多种格式）
  const invoiceNoMatch = text.match(/发票号码[：:]\s*(\d+)/) ||
    text.match(/发票代码.*?(\d{10,20})/) ||
    text.match(/号码[：:]\s*(\d{10,20})/) ||
    text.match(/(\d{20})/); // 发票号码通常是20位
  if (invoiceNoMatch) {
    result.invoiceNo = invoiceNoMatch[1].trim();
  }

  // 提取开票日期
  const dateMatch = text.match(/开票日期[：:]\s*(\d{4}[年/-]\d{1,2}[月/-]\d{1,2})/) ||
    text.match(/日期[：:]\s*(\d{4}[年/-]\d{1,2}[月/-]\d{1,2})/);
  if (dateMatch) {
    result.invoiceDate = normalizeDate(dateMatch[1]);
  }

  // 提取金额（优先查找价税合计/大写金额后的数字）
  // 先找 "（小写）¥xxx" 或 "¥xxx" 格式
  const amountMatch = text.match(/价税合计.*?[（(]小写[）)].*?[¥￥]\s*([\d,]+\.?\d*)/) ||
    text.match(/[（(]小写[）)][¥￥]\s*([\d,]+\.?\d*)/) ||
    text.match(/合计.*?[¥￥]\s*([\d,]+\.?\d*)/) ||
    text.match(/[¥￥]\s*([\d,]+\.?\d*)/);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // 提取发票抬头（购方名称）
  // 先查找"名称："后面的内容，通常在"购买方"或"购方"附近
  const buyerMatch = text.match(/购[买方][\s\S]*?名称[：:]\s*([^\n]+)/) ||
    text.match(/购买方[\s\S]*?名称[：:]\s*([^\n]+)/) ||
    text.match(/名称[：:]\s*([^\n]{5,50})/);
  if (buyerMatch) {
    result.invoiceTitle = buyerMatch[1].trim();
  }

  // 提取税号
  const taxMatch = text.match(/纳税人识别号[：:]\s*([A-Z0-9]{15,20})/) ||
    text.match(/统一社会信用代码[：:]\s*([A-Z0-9]{15,20})/) ||
    text.match(/税号[：:]\s*([A-Z0-9]{15,20})/);
  if (taxMatch) {
    result.taxNumber = taxMatch[1].trim();
  }

  // 提取销方名称
  const sellerMatch = text.match(/销[售售]方[\s\S]*?名称[：:]\s*([^\n]+)/) ||
    text.match(/销售方[\s\S]*?名称[：:]\s*([^\n]+)/);
  if (sellerMatch) {
    result.sellerName = sellerMatch[1].trim();
  }

  // 智能识别费用类型
  result.expenseType = classifyExpenseByContent(text, result.sellerName);

  // 生成用途说明
  result.purpose = generatePurpose(result.expenseType, result.sellerName);

  return result;
}

/**
 * 本地提取图片信息（使用 OCR）
 * 
 * 注意：这是一个简化实现，实际使用时可以集成 Tesseract.js 或其他 OCR 服务
 * 
 * @param imagePath - 图片文件路径
 * @returns 提取的发票信息
 */
async function extractImageLocal(imagePath: string): Promise<ExtractedInvoiceInfo> {
  console.log(`[lib/invoice-extractor] 本地图片提取暂未实现: ${path.basename(imagePath)}`);
  
  // 图片的本地 OCR 需要额外依赖（如 Tesseract.js）
  // 建议优先使用大模型处理图片
  return {
    success: false,
    extractMethod: 'local',
    error: '本地图片 OCR 暂未实现，请使用大模型提取图片信息',
  };
}

// ============ 公共函数 ============

/**
 * 提取发票/图片信息（智能选择方法）
 * 
 * 策略：
 * 1. 优先尝试大模型提取（extractWithLLM）
 * 2. 如果大模型不可用且是 PDF，使用本地提取
 * 3. 如果是图片且大模型不可用，返回错误
 * 
 * @param filePath - 文件路径
 * @param options - 选项
 * @returns 提取的发票信息
 */
export async function extractInvoiceInfo(
  filePath: string,
  options: {
    /** 强制使用本地提取（跳过 LLM） */
    forceLocal?: boolean;
    /** 文件类型覆盖 */
    fileType?: 'pdf' | 'image';
  } = {}
): Promise<ExtractedInvoiceInfo> {
  console.log(`[lib/invoice-extractor] 开始提取: ${path.basename(filePath)}`);

  // 判断文件类型
  const ext = path.extname(filePath).toLowerCase();
  const isPdf = ext === '.pdf';
  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);

  if (!isPdf && !isImage) {
    return {
      success: false,
      error: `不支持的文件类型: ${ext}`,
    };
  }

  const fileType = options.fileType || (isPdf ? 'pdf' : 'image');

  // 优先尝试大模型（除非强制使用本地）
  if (!options.forceLocal) {
    const llmResult = await extractWithLLM(filePath, fileType);
    // 如果 LLM 明确返回需要外部处理，则返回此状态
    if (!llmResult.success && llmResult.error?.includes('需要调用大模型')) {
      return llmResult;
    }
    // 如果 LLM 成功提取，直接返回
    if (llmResult.success) {
      return llmResult;
    }
    // LLM 失败，降级到本地提取
    console.log(`[lib/invoice-extractor] LLM 提取失败，降级到本地提取`);
  }

  // 本地提取（仅支持 PDF）
  if (isPdf) {
    try {
      const text = await extractPdfTextLocal(filePath);
      return parseInvoiceFromText(text);
    } catch (error: any) {
      return {
        success: false,
        extractMethod: 'local',
        error: `本地提取失败: ${error.message}`,
      };
    }
  }

  // 图片的本地提取暂未实现
  return {
    success: false,
    extractMethod: 'local',
    error: '图片文件需要大模型提取，请使用 LLM 分析',
  };
}

/**
 * 智能分类费用类型
 * 
 * @param input - 费用类型字符串
 * @returns 标准化的费用类型
 */
function classifyExpenseType(input: string): string {
  const typeMap: Record<string, string[]> = {
    '差旅': ['差旅', '出差', '交通', '机票', '酒店', '住宿', '火车', '飞机'],
    '办公用品': ['办公', '文具', '用品', '打印', '纸', '笔', '设备'],
    '业务招待': ['招待', '餐饮', '餐费', '客户', '宴请', '业务招待'],
    '交通费': ['打车', '出租车', '滴滴', '地铁', '公交', '出行', '停车', '加油', '油费'],
    '餐补': ['餐补', '午餐', '晚餐', '工作餐'],
    '项目垫付': ['项目', '垫付', '垫资', '代付'],
  };

  const normalizedInput = input.toLowerCase();
  
  for (const [type, keywords] of Object.entries(typeMap)) {
    if (keywords.some(k => normalizedInput.includes(k))) {
      return type;
    }
  }

  return '其它';
}

/**
 * 根据内容智能分类费用类型
 * 
 * @param text - 发票文本内容
 * @param sellerName - 销方名称
 * @returns 费用类型
 */
function classifyExpenseByContent(text: string, sellerName?: string): string {
  const content = (text + ' ' + (sellerName || '')).toLowerCase();

  // 餐饮类
  if (/餐饮|餐厅|饭店|酒店|美食|咖啡|奶茶|外卖|肯德基|麦当劳|星巴克/.test(content)) {
    if (/客户|招待|宴请/.test(content)) {
      return '业务招待';
    }
    return '餐补';
  }

  // 交通类
  if (/出租|滴滴|打车|出行|地铁|公交|停车|加油|高速|ETC|运输|运业/.test(content)) {
    if (/出差|差旅/.test(content)) {
      return '差旅';
    }
    return '交通费';
  }

  // 差旅类（机票、酒店、火车票）
  if (/机票|航空|机场|酒店|住宿|旅馆|宾馆|火车|铁路|高铁/.test(content)) {
    return '差旅';
  }

  // 办公类
  if (/办公|文具|用品|打印|复印|纸|墨|设备|电子|科技|软件/.test(content)) {
    return '办公用品';
  }

  return '其它';
}

/**
 * 生成用途说明
 * 
 * @param expenseType - 费用类型
 * @param sellerName - 销方名称
 * @returns 用途说明
 */
function generatePurpose(expenseType?: string, sellerName?: string): string {
  if (!expenseType || !sellerName) {
    return '';
  }

  const purposeMap: Record<string, string> = {
    '差旅': `出差费用 - ${sellerName}`,
    '办公用品': `办公采购 - ${sellerName}`,
    '业务招待': `业务招待 - ${sellerName}`,
    '交通费': `日常交通 - ${sellerName}`,
    '餐补': `工作餐费 - ${sellerName}`,
    '项目垫付': `项目垫付 - ${sellerName}`,
    '其它': `其他费用 - ${sellerName}`,
  };

  return purposeMap[expenseType] || `${expenseType} - ${sellerName}`;
}

/**
 * 标准化日期格式
 * 
 * @param dateStr - 原始日期字符串
 * @returns 标准格式 yyyy-MM-dd
 */
function normalizeDate(dateStr: string): string {
  // 替换中文年月日为标准格式
  const normalized = dateStr
    .replace(/年/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\//g, '-');

  const parts = normalized.split('-').map(p => p.trim());
  if (parts.length >= 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}

/**
 * 合并用户输入和提取信息
 * 
 * 策略：用户输入优先，缺失字段使用提取信息补充
 * 
 * @param userInput - 用户输入的报销信息
 * @param extracted - 提取的发票信息
 * @param submitterUserId - 报销人 User ID
 * @returns 合并后的完整报销信息
 */
export function mergeReimbursementInfo(
  userInput: Partial<ReimbursementInfo>,
  extracted: ExtractedInvoiceInfo,
  submitterUserId: string
): ReimbursementInfo {
  // 确定报销金额（用户输入优先，否则使用发票金额）
  let reimbursementAmount = userInput.reimbursementAmount;
  if (reimbursementAmount === undefined || reimbursementAmount === null) {
    reimbursementAmount = userInput.invoiceAmount || extracted.amount || 0;
  }

  return {
    // 用户输入优先，否则使用提取信息
    expenseType: userInput.expenseType || extracted.expenseType || '其它',
    invoiceAmount: userInput.invoiceAmount || extracted.amount || 0,
    reimbursementAmount,
    purpose: userInput.purpose || extracted.purpose || '',
    invoiceTitle: userInput.invoiceTitle || extracted.invoiceTitle,
    sellerName: userInput.sellerName || extracted.sellerName,
    taxNumber: userInput.taxNumber || extracted.taxNumber,
    invoiceDate: userInput.invoiceDate || extracted.invoiceDate,
    invoiceNo: userInput.invoiceNo || extracted.invoiceNo,
    attachments: userInput.attachments || [],
    submitterUserId,
    deductionNote: userInput.deductionNote,
  };
}

/**
 * 验证报销信息完整性
 * 
 * @param info - 报销信息
 * @returns 验证结果
 */
export function validateReimbursementInfo(
  info: ReimbursementInfo
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  if (!info.expenseType) missingFields.push('费用类型');
  if (!info.invoiceAmount || info.invoiceAmount <= 0) missingFields.push('发票金额');
  if (info.reimbursementAmount === undefined || info.reimbursementAmount < 0) {
    missingFields.push('报销金额');
  }
  if (!info.submitterUserId) missingFields.push('报销人');

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * 格式化报销信息用于显示
 * 
 * @param info - 报销信息
 * @returns 格式化的字符串
 */
export function formatReimbursementInfo(info: ReimbursementInfo): string {
  const lines = [
    `📋 报销信息摘要`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `费用类型: ${info.expenseType}`,
    `发票金额: ¥${info.invoiceAmount.toFixed(2)}`,
    `报销金额: ¥${info.reimbursementAmount.toFixed(2)}`,
    `用途说明: ${info.purpose || '无'}`,
  ];

  if (info.invoiceNo) lines.push(`发票号码: ${info.invoiceNo}`);
  if (info.invoiceDate) lines.push(`开票日期: ${info.invoiceDate}`);
  if (info.invoiceTitle) lines.push(`发票抬头: ${info.invoiceTitle}`);
  if (info.sellerName) lines.push(`销方名称: ${info.sellerName}`);
  if (info.taxNumber) lines.push(`税　　号: ${info.taxNumber}`);
  if (info.deductionNote) lines.push(`抵扣说明: ${info.deductionNote}`);
  if (info.attachments && info.attachments.length > 0) {
    lines.push(`附件数量: ${info.attachments.length} 个`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  return lines.join('\n');
}
