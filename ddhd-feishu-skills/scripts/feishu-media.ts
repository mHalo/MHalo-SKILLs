/**
 * 飞书云空间素材管理模块
 * 
 * 提供素材文件的上传和下载功能，包括：
 * - 上传素材到云空间（支持图片、文件等，最大20MB）
 * - 下载素材到本地
 * - 批量获取素材临时下载链接
 * 
 * 使用示例：
 * ```typescript
 * import { uploadMedia, downloadMedia, batchGetMediaDownloadUrls } from './feishu-media';
 * ```
 */

import { client } from './feishu-client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 素材父类型
 * 定义素材所属的云文档类型
 */
export type MediaParentType =
  | 'doc_image'      // 旧版文档图片
  | 'docx_image'     // 新版文档图片
  | 'sheet_image'    // 表格图片
  | 'doc_file'       // 旧版文档文件
  | 'docx_file'      // 新版文档文件
  | 'sheet_file'     // 表格文件
  | 'vc_virtual_background'  // 视频会议虚拟背景
  | 'bitable_image'  // 多维表格图片
  | 'bitable_file'   // 多维表格文件
  | 'moments'        // 同事圈
  | 'ccm_import_open' // CCM导入
  | 'calendar'       // 日历
  | 'base_global'    // 基础全局
  | 'lark_ai_media_analysis' // Lark AI媒体分析
  | 'whiteboard';    // 白板

/**
 * 上传素材结果
 */
export interface UploadMediaResult {
  /** 素材的唯一标识 */
  file_token: string;
  /** 素材名称 */
  file_name: string;
  /** 素材大小（字节） */
  size: number;
}

/**
 * 下载素材结果
 */
export interface DownloadMediaResult {
  /** 本地保存路径 */
  filePath: string;
  /** 素材大小（字节） */
  size: number;
  /** 响应头信息 */
  headers: any;
}

/**
 * 临时下载链接信息
 */
export interface MediaTmpDownloadUrl {
  /** 素材token */
  file_token: string;
  /** 临时下载链接（24小时有效） */
  tmp_download_url: string;
}

/**
 * 上传素材到云空间
 * 
 * 将本地文件上传到飞书云空间作为素材使用。素材在云空间中不会直接显示，
 * 只会显示在对应的云文档（如文档、表格等）中。
 * 
 * ⚠️ 注意：
 * - 文件大小不能超过 20MB，超过请使用分片上传
 * - 调用频率上限为 5QPS
 * 
 * @param filePath - 本地文件路径
 * @param parentType - 素材父类型，指定素材用途（如 'docx_image' 表示新版文档图片）
 * @param parentNode - 父节点token（如文档token）
 * @param options - 可选参数
 * @returns 上传结果，包含素材token
 * @throws 文件不存在、文件过大或上传失败时抛出错误
 */
export async function uploadMedia(
  filePath: string,
  parentType: MediaParentType,
  parentNode: string,
  options?: {
    /** 自定义文件名，不传则使用原文件名 */
    fileName?: string;
    /** 额外信息 */
    extra?: string;
    /** 文件校验和 */
    checksum?: string;
  }
): Promise<UploadMediaResult> {
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  // 获取文件信息
  const stats = fs.statSync(filePath);
  const size = stats.size;
  const fileName = options?.fileName || path.basename(filePath);

  // 检查文件大小（不能超过20MB）
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
  if (size > MAX_SIZE) {
    throw new Error(
      `文件大小超过限制: ${(size / 1024 / 1024).toFixed(2)}MB > 20MB，请使用分片上传`
    );
  }

  console.log(`[feishu-media] 正在上传素材: ${fileName}`);
  console.log(`[feishu-media] 文件大小: ${(size / 1024).toFixed(2)} KB`);
  console.log(`[feishu-media] 父类型: ${parentType}`);

  try {
    // 创建文件流
    const fileStream = fs.createReadStream(filePath);

    // 调用飞书API上传素材
    const res = await client.drive.v1.media.uploadAll({
      data: {
        file_name: fileName,
        parent_type: parentType,
        parent_node: parentNode,
        size: size,
        file: fileStream,
        ...(options?.extra && { extra: options.extra }),
        ...(options?.checksum && { checksum: options.checksum }),
      },
    });

    if (!res?.file_token) {
      throw new Error('上传素材失败：未返回 file_token');
    }

    console.log(`[feishu-media] ✅ 素材上传成功`);
    console.log(`[feishu-media] 素材token: ${res.file_token}`);

    return {
      file_token: res.file_token,
      file_name: fileName,
      size: size,
    };
  } catch (error: any) {
    console.error('[feishu-media] ❌ 上传素材失败:', error.message || error);
    throw new Error(`上传素材失败: ${error.message || error}`);
  }
}

/**
 * 下载素材到本地
 * 
 * 根据素材token下载素材文件到本地指定路径。
 * 
 * ⚠️ 注意：
 * - 该接口不支持太高的并发，调用频率上限为 5QPS
 * - 支持 Range 下载（可用于断点续传）
 * 
 * @param fileToken - 素材token（如 boxcnXxxxxx）
 * @param savePath - 本地保存路径
 * @param options - 可选参数
 * @returns 下载结果
 * @throws 下载失败时抛出错误
 */
export async function downloadMedia(
  fileToken: string,
  savePath: string,
  options?: {
    /** 额外参数 */
    extra?: string;
    /** Range 请求头，用于断点续传 */
    range?: string;
  }
): Promise<DownloadMediaResult> {
  if (!fileToken) {
    throw new Error('素材token不能为空');
  }

  // 确保保存目录存在
  const saveDir = path.dirname(savePath);
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  console.log(`[feishu-media] 正在下载素材: ${fileToken}`);
  console.log(`[feishu-media] 保存路径: ${savePath}`);

  try {
    // 调用飞书API下载素材
    const res = await client.drive.v1.media.download({
      path: {
        file_token: fileToken,
      },
      ...(options?.extra && {
        params: { extra: options.extra },
      }),
    });

    // 保存文件到本地
    await res.writeFile(savePath);

    // 获取文件大小
    const stats = fs.statSync(savePath);
    const size = stats.size;

    console.log(`[feishu-media] ✅ 素材下载成功`);
    console.log(`[feishu-media] 保存路径: ${savePath}`);
    console.log(`[feishu-media] 文件大小: ${(size / 1024).toFixed(2)} KB`);

    return {
      filePath: savePath,
      size: size,
      headers: res.headers,
    };
  } catch (error: any) {
    console.error('[feishu-media] ❌ 下载素材失败:', error.message || error);
    throw new Error(`下载素材失败: ${error.message || error}`);
  }
}

/**
 * 批量获取素材临时下载链接
 * 
 * 通过素材token批量获取临时下载链接，链接时效性为24小时，过期失效。
 * 
 * ⚠️ 注意：
 * - 该接口不支持太高的并发，调用频率上限为 5QPS
 * - 临时链接有效期为24小时
 * 
 * @param fileTokens - 素材token数组
 * @param extra - 可选的额外参数
 * @returns 临时下载链接数组
 * @throws 调用失败时抛出错误
 */
export async function batchGetMediaDownloadUrls(
  fileTokens: string[],
  extra?: string
): Promise<MediaTmpDownloadUrl[]> {
  if (!Array.isArray(fileTokens) || fileTokens.length === 0) {
    throw new Error('素材token列表不能为空');
  }

  console.log(`[feishu-media] 正在获取 ${fileTokens.length} 个素材的临时下载链接...`);

  try {
    const res = await client.drive.v1.media.batchGetTmpDownloadUrl({
      params: {
        file_tokens: fileTokens,
        ...(extra && { extra }),
      },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    const urls = res.data?.tmp_download_urls || [];

    console.log(`[feishu-media] ✅ 成功获取 ${urls.length} 个临时下载链接`);
    console.log(`[feishu-media] 链接有效期: 24小时`);

    return urls;
  } catch (error: any) {
    console.error('[feishu-media] ❌ 获取临时下载链接失败:', error.message || error);
    throw new Error(`获取临时下载链接失败: ${error.message || error}`);
  }
}

/**
 * 获取素材可读流
 * 
 * 获取素材的可读流，适用于需要直接处理文件内容而不保存到本地的场景。
 * 
 * @param fileToken - 素材token
 * @param extra - 可选的额外参数
 * @returns 可读流对象
 * @throws 获取失败时抛出错误
 */
export async function getMediaStream(
  fileToken: string,
  extra?: string
): Promise<NodeJS.ReadableStream> {
  if (!fileToken) {
    throw new Error('素材token不能为空');
  }

  console.log(`[feishu-media] 正在获取素材流: ${fileToken}`);

  try {
    const res = await client.drive.v1.media.download({
      path: {
        file_token: fileToken,
      },
      ...(extra && {
        params: { extra },
      }),
    });

    console.log(`[feishu-media] ✅ 成功获取素材流`);

    return res.getReadableStream();
  } catch (error: any) {
    console.error('[feishu-media] ❌ 获取素材流失败:', error.message || error);
    throw new Error(`获取素材流失败: ${error.message || error}`);
  }
}
