#!/usr/bin/env ts-node
/**
 * Gemini 图片生成脚本
 * 
 * 使用 Gemini API 生成图片，支持自定义内容描述、图片比例、分辨率和思考等级。
 * 图片必须保存到 OpenClaw 的 media 目录，需要在 .env 文件中配置路径。
 * 
 * 使用方法:
 *    ts-node scripts/generate-image.ts --contents "一只可爱的猫"
 * 
 * 参数:
 *    --contents: 生成图片的内容描述，必填
 *    --aspectRatio: 图片比例，默认 4:3，支持任意比例如 16:9, 1:1, 3:2 等
 *    --imageSize: 分辨率，默认 512，支持 512, 1K, 2K, 4K（K必须大写）
 *    --thinkingLevel: 思考等级，默认 minimal，支持的级别为 minimal 和 high
 * 
 * OpenClaw 配置（必须）:
 *    在技能目录下创建 .env 文件，添加：
 *    OPENCLAW_MEDIA_PATH=C:\path\to\openclaw\media
 *    
 *    如果未配置或配置无效，脚本会报错并退出。
 * 
 * 输出结构:
 *    <OpenClaw>/media/ddhd-nano-banana-images/
 *    └── yyyy-MM-dd/
 *        ├── gemini-banana-{timestamp}.jpg
 *        └── gemini-banana-{timestamp}.txt
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

// OpenClaw media 目录配置
const OPENCLAW_MEDIA_PATH = process.env.OPENCLAW_MEDIA_PATH;
const OPENCLAW_SUBFOLDER = 'ddhd-nano-banana-images';

// 解析命令行参数
function parseArgs(): {
  contents?: string;
  aspectRatio?: string;
  imageSize?: string;
  thinkingLevel?: string;
  editImage?: string;
} {
  const args = process.argv.slice(2);
  const parsed: any = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        parsed[key] = value;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }

  return parsed;
}

// 显示帮助信息
function showHelp() {
  console.log(`
Gemini 图片生成脚本

使用方法:
    ts-node scripts/generate-image.ts --contents "一只可爱的猫" [其他参数]

参数:
    --contents:      生成图片的内容描述，必填
    --aspectRatio:   图片比例，默认 4:3（支持任意比例如 16:9, 1:1, 3:2）
    --imageSize:     分辨率，默认 512，支持 512, 1K, 2K, 4K（K必须大写）
    --thinkingLevel: 思考等级，默认 minimal，支持 minimal 和 high
    --editImage:     图片编辑模式，指定输入图片路径（文本+图片生成新图片）

OpenClaw 配置（必须）:
    本脚本要求必须配置 OpenClaw 的 media 目录路径。
    
    配置步骤：
    1. 在技能目录下创建 .env 文件
    2. 添加以下内容：
       OPENCLAW_MEDIA_PATH=C:\\path\\to\\openclaw\\media
    
    3. 将路径替换为您的 OpenClaw 根目录下的 media 文件夹绝对路径
    
    如果没有配置，脚本会报错并退出。

输出结构:
    <OpenClaw>/media/ddhd-nano-banana-images/
    └── yyyy-MM-dd/
        ├── gemini-banana-{timestamp}.jpg
        └── gemini-banana-{timestamp}.txt

示例:
    # 文本生成图片
    ts-node scripts/generate-image.ts --contents "一只穿着宇航服的猫"
    
    # 图片编辑（文本+图片生成新图片）
    ts-node scripts/generate-image.ts --contents "将这只猫变成赛博朋克风格" --editImage "path/to/image.jpg"
`);
}

// 验证 OpenClaw 配置（在生成图片前调用）
function validateOpenClawConfig(): { valid: boolean; path?: string; error?: string } {
  // 检查是否配置了路径
  if (!OPENCLAW_MEDIA_PATH) {
    return {
      valid: false,
      error: `❌ OpenClaw 未配置

请在技能目录下创建 .env 文件，并添加以下内容：
OPENCLAW_MEDIA_PATH=C:\\path\\to\\openclaw\\media

请将路径替换为您的 OpenClaw 根目录下的 media 文件夹绝对路径。
配置完成后，请重新运行本脚本。`,
    };
  }

  // 检查路径是否存在
  if (!fs.existsSync(OPENCLAW_MEDIA_PATH)) {
    return {
      valid: false,
      error: `❌ OpenClaw 配置无效

配置的目录不存在: ${OPENCLAW_MEDIA_PATH}

请检查 .env 文件中的 OPENCLAW_MEDIA_PATH 配置是否正确，
确保路径指向 OpenClaw 根目录下的 media 文件夹。
修改配置后，请重新运行本脚本。`,
    };
  }

  // 检查是否可写
  try {
    const testFile = path.join(OPENCLAW_MEDIA_PATH, '.write_test');
    fs.writeFileSync(testFile, '');
    fs.unlinkSync(testFile);
  } catch (e) {
    return {
      valid: false,
      error: `❌ OpenClaw 目录不可写

无法写入配置的目录: ${OPENCLAW_MEDIA_PATH}

请检查目录权限，确保当前用户有读写权限。
修改权限后，请重新运行本脚本。`,
    };
  }

  return { valid: true, path: OPENCLAW_MEDIA_PATH };
}

// 生成时间戳 (毫秒级)
function generateTimestamp(): number {
  return Date.now();
}

// 格式化日期为 yyyy-MM-dd
function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 生成参数文件内容
function generateParamsFile(params: {
  contents: string;
  aspectRatio: string;
  imageSize: string;
  thinkingLevel: string;
  timestamp: number;
  generateTime: string;
  outputPath: string;
  editImage?: string;
}): string {
  const mode = params.editImage ? '图片编辑 (Image Editing)' : '文本生成图片 (Text to Image)';
  const editImageInfo = params.editImage ? `- **editImage**: ${params.editImage}
` : '';
  
  return `# Gemini Image Generation Parameters
# Generated at: ${params.generateTime}
# Timestamp: ${params.timestamp}
# Mode: ${mode}

## Request Parameters

- **contents**: ${params.contents}
${editImageInfo}- **aspectRatio**: ${params.aspectRatio}
- **imageSize**: ${params.imageSize}
- **thinkingLevel**: ${params.thinkingLevel}

## Output Location

- **directory**: ${params.outputPath}

## Output Files

- Image: gemini-banana-${params.timestamp}.jpg
- Params: gemini-banana-${params.timestamp}.txt
`;
}

// 读取图片文件并转换为 base64
function readImageAsBase64(imagePath: string): { data: string; mimeType: string } {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`图片文件不存在: ${imagePath}`);
  }
  
  const buffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.gif') mimeType = 'image/gif';
  else if (ext === '.webp') mimeType = 'image/webp';
  
  return {
    data: buffer.toString('base64'),
    mimeType,
  };
}

// 生成图片
async function generateImage(
  contents: string,
  outputDir: string,
  aspectRatio: string = '4:3',
  imageSize: string = '512',
  thinkingLevel: string = 'minimal',
  editImagePath?: string
): Promise<{
  success: boolean;
  imagePath: string;
  paramsPath: string;
  timestamp: number;
  error?: string;
}> {
  const baseUrl = 'http://192.168.1.252:5789/gemini/';
  const model = 'gemini-3.1-flash-image-preview';

  const url = `${baseUrl}v1beta/models/${model}:generateContent`;

  // 构建请求体的 parts
  const parts: any[] = [];
  
  // 如果有编辑图片，先添加图片
  if (editImagePath) {
    const imageData = readImageAsBase64(editImagePath);
    parts.push({
      inlineData: {
        mimeType: imageData.mimeType,
        data: imageData.data,
      },
    });
  }
  
  // 添加文本提示词
  parts.push({
    text: contents,
  });

  // 构建请求体
  const requestBody: any = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  console.log('发送请求到 Gemini API...');
  console.log(`  模式: ${editImagePath ? '图片编辑' : '文本生成图片'}`);
  if (editImagePath) {
    console.log(`  输入图片: ${editImagePath}`);
  }
  console.log(`  内容: ${contents}`);
  console.log(`  比例: ${aspectRatio}`);
  console.log(`  分辨率: ${imageSize}`);
  console.log(`  思考等级: ${thinkingLevel}`);

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 300000, // 5分钟超时
    });

    // 解析响应，提取图片数据
    const candidates = response.data.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('API 返回结果中没有候选内容');
    }

    const parts = candidates[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error('API 返回结果中没有内容部分');
    }

    // 查找图片部分
    const imagePart = parts.find((part: any) => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      // 如果没有图片，检查是否有文本响应
      const textPart = parts.find((part: any) => part.text);
      if (textPart) {
        console.log('API 返回文本响应:', textPart.text);
      }
      throw new Error('API 返回结果中没有图片数据');
    }

    // 解码 base64 图片数据
    const imageData = imagePart.inlineData.data;
    const buffer = Buffer.from(imageData, 'base64');

    // 生成时间戳
    const timestamp = generateTimestamp();
    const dateFolder = formatDate();
    const baseFileName = `gemini-banana-${timestamp}`;

    // 构建输出路径（直接使用传入的 outputDir，即 OpenClaw 目录）
    const targetDir = path.join(outputDir, OPENCLAW_SUBFOLDER, dateFolder);
    const imagePath = path.join(targetDir, `${baseFileName}.jpg`);
    const paramsPath = path.join(targetDir, `${baseFileName}.txt`);

    // 确保输出目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 保存图片
    fs.writeFileSync(imagePath, buffer);

    // 保存参数文件
    const paramsContent = generateParamsFile({
      contents,
      aspectRatio,
      imageSize,
      thinkingLevel,
      timestamp,
      generateTime: new Date(timestamp).toISOString(),
      outputPath: targetDir,
      editImage: editImagePath,
    });
    fs.writeFileSync(paramsPath, paramsContent, 'utf-8');

    return {
      success: true,
      imagePath,
      paramsPath,
      timestamp,
    };
  } catch (error: any) {
    if (error.response) {
      console.error('API 错误响应:', JSON.stringify(error.response.data, null, 2));
      throw new Error(`API 请求失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// 主函数
async function main() {
  const args = parseArgs();

  // 显示帮助
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // 验证必填参数
  if (!args.contents) {
    console.error('错误: --contents 参数是必填的');
    showHelp();
    process.exit(1);
  }

  // 验证 imageSize 参数
  const validImageSizes = ['512', '1K', '2K', '4K'];
  if (args.imageSize && !validImageSizes.includes(args.imageSize)) {
    console.error(`错误: --imageSize 必须是以下值之一: ${validImageSizes.join(', ')}`);
    process.exit(1);
  }

  // 验证 thinkingLevel 参数
  const validThinkingLevels = ['minimal', 'high'];
  if (args.thinkingLevel && !validThinkingLevels.includes(args.thinkingLevel)) {
    console.error(`错误: --thinkingLevel 必须是以下值之一: ${validThinkingLevels.join(', ')}`);
    process.exit(1);
  }

  // 验证 editImage 参数（如果提供）
  if (args.editImage) {
    if (!fs.existsSync(args.editImage)) {
      console.error(`错误: --editImage 指定的图片不存在: ${args.editImage}`);
      process.exit(1);
    }
  }

  // ========== 关键：在生成图片前验证 OpenClaw 配置 ==========
  console.log('检查 OpenClaw 配置...');
  const config = validateOpenClawConfig();
  
  if (!config.valid) {
    console.error('\n' + config.error);
    console.error('\n脚本已退出，未生成图片。');
    process.exit(1);
  }
  
  console.log('   ✅ OpenClaw 配置有效');
  console.log(`   输出目录: ${config.path}`);
  // =========================================================

  try {
    const result = await generateImage(
      args.contents,
      config.path!, // 传入验证过的 OpenClaw 路径
      args.aspectRatio || '4:3',
      args.imageSize || '512',
      args.thinkingLevel || 'minimal',
      args.editImage
    );

    if (result.success) {
      console.log('\n✅ 图片生成成功!');
      console.log(`   时间戳: ${result.timestamp}`);
      console.log(`\n📁 文件路径:`);
      console.log(`   图片: ${path.resolve(result.imagePath)}`);
      console.log(`   参数: ${path.resolve(result.paramsPath)}`);
      console.log(`\n📊 文件大小: ${(fs.statSync(result.imagePath).size / 1024).toFixed(2)} KB`);

      // 生成 AI 友好的 Markdown 输出
      const modeText = args.editImage ? '图片编辑' : '文本生成图片';
      const absoluteImagePath = path.resolve(result.imagePath);
      // 将路径转换为 file:// 协议格式（Windows 路径需要特殊处理）
      const fileUrl = 'file:///' + absoluteImagePath.replace(/\\/g, '/');
      
      const aiOutputMd = `## 图片生成结果
**状态**: ✅ 成功
**模式**: ${modeText}
**生成时间**: ${new Date(result.timestamp).toLocaleString()}
**图片展示**:
![生成的图片](${fileUrl})
**文件信息**:
- 路径: \`${absoluteImagePath}\`
- 大小: ${(fs.statSync(result.imagePath).size / 1024).toFixed(2)} KB
`;

      // 输出 JSON 结果（供 OpenClaw 解析）
      const output = {
        success: true,
        timestamp: result.timestamp,
        mode: args.editImage ? 'imageEditing' : 'textToImage',
        paths: {
          image: result.imagePath,
          params: result.paramsPath,
        },
      };
      
      console.log(`\n📤 输出结果 (JSON):`);
      console.log(JSON.stringify(output, null, 2));
      console.log(`\n📤 调用文件工具读取imagePath，并发送图片给用户`);

    }
  } catch (error: any) {
    console.error('\n❌ 图片生成失败:', error.message);
    
    // 输出错误 JSON
    console.log(JSON.stringify({
      success: false,
      error: error.message,
    }, null, 2));
    
    process.exit(1);
  }
}

main();
