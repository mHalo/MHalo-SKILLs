#!/usr/bin/env ts-node
/**
 * 即梦 3.5 Pro 视频生成脚本 - 支持音画同步
 * 基于 OpenAI 兼容接口，支持文生视频/图生视频/首尾帧视频
 * 自动生成音频：环境音效、口型同步、乐器演奏等
 *
 * 用法: ts-node text2video-v35.ts "提示词" [选项]
 *
 * 示例:
 *   # 文生视频（带音频）
 *   ts-node text2video-v35.ts "一只小猫在弹钢琴，优美的旋律"
 *
 *   # 图生视频（带音频）
 *   ts-node text2video-v35.ts "让这只猫咪动起来" --first-frame ./cat.jpg
 *
 *   # 首尾帧视频（带音频）
 *   ts-node text2video-v35.ts "猫咪变身老虎" --first-frame ./cat.jpg --last-frame ./tiger.jpg
 */

import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import axios from 'axios';

// 即梦 3.5 Pro API 配置
const API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/contents/generations';
// 或者用第三方兼容接口
// const API_BASE_URL = 'https://api.sora2.pub/v1';

// 模型映射 - 从方舟平台获取的模型ID
const MODEL_MAP = {
  // 即梦 3.5 Pro / Seedance 1.5 pro - 支持音画同步
  '5s': 'doubao-seedance-1-5-pro-251215',
  '10s': 'doubao-seedance-1-5-pro-251215',
  '12s': 'doubao-seedance-1-5-pro-251215',
  // 其他可选模型:
  // 'doubao-seedance-2-0-260128' - Seedance 2.0
  // 'doubao-seedance-1-0-pro-250528' - Seedance 1.0 Pro
} as const;

type DurationType = '5s' | '10s' | '12s';

interface VideoOptions {
  prompt: string;
  duration: DurationType;
  aspectRatio: string;
  outputDir: string;
  firstFrame?: string;
  lastFrame?: string;
  download: boolean;
  wait: boolean;
  debug: boolean;
}

/**
 * 解析命令行参数
 */
function parseArgs(): VideoOptions {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('用法: ts-node text2video-v35.ts "提示词" [选项]');
    console.error('');
    console.error('选项:');
    console.error('  --duration <5s|10s|12s>   视频时长 (默认: 5s)');
    console.error('  --ratio <宽高比>          视频比例 16:9, 9:16, 1:1 (默认: 16:9)');
    console.error('  --first-frame <图片>      首帧图片路径');
    console.error('  --last-frame <图片>       尾帧图片路径');
    console.error('  --output <目录>           输出目录');
    console.error('  --wait                    等待任务完成');
    console.error('  --debug                   调试模式');
    console.error('');
    console.error('示例:');
    console.error('  ts-node text2video-v35.ts "小猫弹钢琴"');
    console.error('  ts-node text2video-v35.ts "猫咪变身" --first-frame ./cat.jpg --last-frame ./tiger.jpg --duration 5s');
    process.exit(1);
  }

  const prompt = args[0];
  let duration: DurationType = '5s';
  let aspectRatio = '16:9';
  let outputDir = process.env.OPENCLAW_MEDIA_PATH 
    ? path.join(process.env.OPENCLAW_MEDIA_PATH, 'jimeng-generate')
    : './output';
  let firstFrame: string | undefined;
  let lastFrame: string | undefined;
  let download = true;
  let wait = false;
  let debug = false;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--duration':
        const d = args[++i] as DurationType;
        if (!['5s', '10s', '12s'].includes(d)) {
          throw new Error('duration 必须是 5s, 10s 或 12s');
        }
        duration = d;
        break;
      case '--ratio':
        aspectRatio = args[++i];
        break;
      case '--first-frame':
        firstFrame = args[++i];
        break;
      case '--last-frame':
        lastFrame = args[++i];
        break;
      case '--output':
        outputDir = args[++i];
        break;
      case '--wait':
        wait = true;
        break;
      case '--debug':
        debug = true;
        break;
    }
  }

  return {
    prompt,
    duration,
    aspectRatio,
    outputDir,
    firstFrame,
    lastFrame,
    download,
    wait,
    debug,
  };
}

/**
 * 读取图片转为 Base64
 */
function imageToBase64(imagePath: string): string {
  const fullPath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`图片文件不存在: ${fullPath}`);
  }
  const buffer = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 
                   ext === '.gif' ? 'image/gif' : 
                   ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * 获取 API Key
 */
function getApiKey(): string {
  const apiKey = process.env.VOLCENGINE_API_KEY || process.env.ARK_API_KEY;
  if (!apiKey) {
    throw new Error(
      '请设置环境变量 VOLCENGINE_API_KEY 或 ARK_API_KEY\n' +
      '即梦 3.5 Pro 需要使用火山引擎方舟平台的 API Key'
    );
  }
  return apiKey;
}

/**
 * 提交视频生成任务
 */
async function submitVideoTask(options: VideoOptions): Promise<{ taskId: string; data?: any }> {
  const apiKey = getApiKey();
  const model = MODEL_MAP[options.duration];
  
  // 构建请求体 - 使用方舟平台格式
  const content: any[] = [
    { type: 'text', text: options.prompt }
  ];
  
  // 处理参考图
  if (options.firstFrame) {
    content.push({
      type: 'image_url',
      image_url: { url: imageToBase64(options.firstFrame) }
    });
    if (options.lastFrame) {
      content.push({
        type: 'image_url',
        image_url: { url: imageToBase64(options.lastFrame) }
      });
    }
  }

  const requestBody: any = {
    model,
    content,
    ratio: options.aspectRatio,
    duration: parseInt(options.duration), // 转换为数字: 5, 10, 12
    generate_audio: true, // 启用音频生成
  };

  if (options.debug) {
    console.error('请求体:', JSON.stringify(requestBody, null, 2).substring(0, 500) + '...');
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/tasks`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 60000,
      }
    );

    if (options.debug) {
      console.error('响应:', JSON.stringify(response.data, null, 2));
    }

    // 方舟平台返回格式
    if (response.data.id) {
      return { taskId: response.data.id, data: response.data };
    } else {
      throw new Error('无法获取任务ID');
    }
  } catch (err: any) {
    if (err.response) {
      console.error('API 错误:', err.response.status);
      console.error('错误详情:', JSON.stringify(err.response.data, null, 2));
      throw new Error(`API 调用失败: ${err.response.data?.error?.message || err.message}`);
    }
    throw err;
  }
}

/**
 * 查询任务状态
 */
async function queryVideoTask(taskId: string): Promise<any> {
  const apiKey = getApiKey();
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );
    
    return response.data;
  } catch (err: any) {
    if (err.response) {
      console.error('查询失败:', err.response.status, err.response.data);
    }
    throw err;
  }
}

/**
 * 下载视频
 */
async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 120000,
  });

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/**
 * 等待任务完成
 */
async function waitForTask(taskId: string, maxAttempts: number = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    console.error(`[${i + 1}/${maxAttempts}] 查询任务状态...`);
    const result = await queryVideoTask(taskId);
    
    if (result.status === 'succeeded' || result.status === 'completed' || result.status === 'done') {
      return result;
    }
    
    if (result.status === 'failed') {
      throw new Error(`任务执行失败: ${result.error?.message || '未知错误'}`);
    }
    
    await new Promise(r => setTimeout(r, 5000));
  }
  
  throw new Error('任务超时');
}

/**
 * 生成任务文件夹路径
 */
function getTaskFolder(options: VideoOptions): string {
  const hash = crypto.createHash('md5')
    .update(`${options.prompt}_${options.duration}_${options.aspectRatio}_${options.firstFrame || ''}_${options.lastFrame || ''}`)
    .digest('hex');
  
  return path.join(options.outputDir, 'video-v35', hash);
}

/**
 * 保存任务信息
 */
function saveTaskInfo(folder: string, options: VideoOptions, taskId: string, result?: any): void {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  fs.writeFileSync(
    path.join(folder, 'param.json'),
    JSON.stringify({ ...options, timestamp: new Date().toISOString() }, null, 2)
  );
  
  fs.writeFileSync(path.join(folder, 'taskId.txt'), taskId);
  
  if (result) {
    fs.writeFileSync(path.join(folder, 'result.json'), JSON.stringify(result, null, 2));
  }
}

async function main(): Promise<void> {
  try {
    const options = parseArgs();
    const folder = getTaskFolder(options);

    // 检查是否已有任务
    const taskIdPath = path.join(folder, 'taskId.txt');
    if (fs.existsSync(taskIdPath) && options.wait) {
      const taskId = fs.readFileSync(taskIdPath, 'utf8').trim();
      console.error(`发现已有任务: ${taskId}，正在查询...`);
      
      const result = await waitForTask(taskId);
      const videoUrl = result.content?.video_url || result.video_url || result.url;
      
      if (videoUrl && options.download) {
        const videoPath = path.join(folder, 'video.mp4');
        console.error('下载视频...');
        await downloadVideo(videoUrl, videoPath);
        
        console.log(JSON.stringify({
          success: true,
          taskId,
          videoUrl,
          videoPath,
          withAudio: true,
          message: '视频已生成（带音频）',
        }, null, 2));
      } else {
        console.log(JSON.stringify({
          success: true,
          taskId,
          videoUrl,
          withAudio: true,
          message: '视频已生成（带音频）',
        }, null, 2));
      }
      return;
    }

    // 提交新任务
    console.error('提交即梦 3.5 Pro 视频生成任务...');
    console.error('提示词:', options.prompt);
    console.error('时长:', options.duration);
    console.error('比例:', options.aspectRatio);
    if (options.firstFrame) console.error('首帧:', options.firstFrame);
    if (options.lastFrame) console.error('尾帧:', options.lastFrame);

    const { taskId, data } = await submitVideoTask(options);
    console.error(`任务已提交: ${taskId}`);
    
    saveTaskInfo(folder, options, taskId);

    if (options.wait) {
      console.error('等待任务完成...');
      const result = await waitForTask(taskId);
      const videoUrl = result.content?.video_url || result.video_url || result.url;
      const hasAudio = result.content?.has_audio !== false;
      
      saveTaskInfo(folder, options, taskId, result);
      
      if (videoUrl && options.download) {
        const videoPath = path.join(folder, 'video.mp4');
        console.error('下载视频...');
        await downloadVideo(videoUrl, videoPath);
        
        console.log(JSON.stringify({
          success: true,
          taskId,
          videoUrl,
          videoPath,
          withAudio: hasAudio,
          message: hasAudio ? '视频已生成（带音频）' : '视频已生成',
        }, null, 2));
      } else {
        console.log(JSON.stringify({
          success: true,
          taskId,
          videoUrl,
          withAudio: hasAudio,
          message: hasAudio ? '视频已生成（带音频）' : '视频已生成',
        }, null, 2));
      }
    } else {
      console.log(JSON.stringify({
        success: true,
        submitted: true,
        taskId,
        folder,
        withAudio: true,
        message: '任务已提交（带音频生成），请稍后查询',
      }, null, 2));
    }

  } catch (err: any) {
    console.error('错误:', err.message);
    console.log(JSON.stringify({
      success: false,
      error: err.message,
    }, null, 2));
    process.exit(1);
  }
}

main();
