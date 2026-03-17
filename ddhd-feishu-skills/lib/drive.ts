/**
 * 云空间（素材）API 基础能力
 * 
 * 飞书文档: https://open.feishu.cn/document/server-docs/docs/drive-v1/media/introduction
 */

import { client } from './client';
import * as fs from 'fs';
import * as path from 'path';

export type MediaParentType =
  | 'doc_image' | 'docx_image' | 'sheet_image' | 'bitable_image'
  | 'doc_file' | 'docx_file' | 'sheet_file' | 'bitable_file'
  | 'vc_virtual_background' | 'whiteboard' | 'moments' | 'calendar'
  | 'ccm_import_open' | 'base_global' | 'lark_ai_media_analysis';

export interface UploadMediaResult {
  file_token: string;
  file_name: string;
  size: number;
}

export interface DownloadMediaResult {
  filePath: string;
  size: number;
  headers: any;
}

export interface MediaTmpDownloadUrl {
  file_token: string;
  tmp_download_url: string;
}

/**
 * 上传素材
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/drive-v1/media/upload_all
 */
export async function uploadMedia(
  filePath: string,
  parentType: MediaParentType,
  parentNode: string,
  options?: { fileName?: string; extra?: string; checksum?: string }
): Promise<UploadMediaResult> {
  if (!fs.existsSync(filePath)) throw new Error(`文件不存在: ${filePath}`);

  const stats = fs.statSync(filePath);
  const size = stats.size;
  const fileName = options?.fileName || path.basename(filePath);

  if (size > 20 * 1024 * 1024) throw new Error('文件大小超过 20MB，请使用分片上传');

  console.log(`[lib/drive] 正在上传: ${fileName} (${(size / 1024).toFixed(2)} KB)`);

  const res = await client.drive.v1.media.uploadAll({
    data: {
      file_name: fileName,
      parent_type: parentType,
      parent_node: parentNode,
      size,
      file: fs.createReadStream(filePath),
      ...(options?.extra && { extra: options.extra }),
      ...(options?.checksum && { checksum: options.checksum }),
    },
  });

  if (!res?.file_token) throw new Error('上传失败：未返回 file_token');

  console.log(`[lib/drive] 上传成功: ${res.file_token}`);
  return { file_token: res.file_token, file_name: fileName, size };
}

/**
 * 下载素材
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/drive-v1/media/download
 */
export async function downloadMedia(
  fileToken: string,
  savePath: string,
  options?: { extra?: string; range?: string }
): Promise<DownloadMediaResult> {
  const saveDir = path.dirname(savePath);
  if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

  console.log(`[lib/drive] 正在下载: ${fileToken}`);

  const res = await client.drive.v1.media.download({
    path: { file_token: fileToken },
    ...(options?.extra && { params: { extra: options.extra } }),
  });

  await res.writeFile(savePath);
  const stats = fs.statSync(savePath);

  console.log(`[lib/drive] 下载成功: ${savePath} (${(stats.size / 1024).toFixed(2)} KB)`);
  return { filePath: savePath, size: stats.size, headers: res.headers };
}

/**
 * 批量获取素材临时下载链接
 * 
 * API: https://open.feishu.cn/document/server-docs/docs/drive-v1/media/batch_get_tmp_download_url
 */
export async function batchGetMediaDownloadUrls(fileTokens: string[], extra?: string): Promise<MediaTmpDownloadUrl[]> {
  if (!fileTokens.length) throw new Error('素材 token 列表不能为空');

  const res = await client.drive.v1.media.batchGetTmpDownloadUrl({
    params: { file_tokens: fileTokens, ...(extra && { extra }) },
  });

  if (res.code !== 0) throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);

  return res.data?.tmp_download_urls || [];
}

/**
 * 获取素材流
 */
export async function getMediaStream(fileToken: string, extra?: string): Promise<NodeJS.ReadableStream> {
  const res = await client.drive.v1.media.download({
    path: { file_token: fileToken },
    ...(extra && { params: { extra } }),
  });
  return res.getReadableStream();
}
