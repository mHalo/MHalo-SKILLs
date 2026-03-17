/**
 * [API_NAME]
 * 
 * 飞书 API: [API_DOC_URL]
 * SDK Method: [SDK_METHOD]
 * 
 * 所需权限:
 * [PERMISSIONS_LIST]
 * 
 * 使用示例：
 * ```typescript
 * import { [functionName] } from './[category]';
 * 
 * const result = await [functionName]([params]);
 * ```
 */

import { client } from './client';

/**
 * [API_NAME] 请求参数
 */
export interface [FunctionName]Request {
  // 根据实际 API 文档填写
}

/**
 * [API_NAME] 响应数据
 */
export interface [FunctionName]Response {
  // 根据实际 API 文档填写
}

/**
 * [API_NAME]
 * 
 * @param request - 请求参数
 * @returns 响应数据
 * @throws 调用失败时抛出错误
 * 
 * @example
 * ```typescript
 * const result = await [functionName]({
 *   // 参数
 * });
 * ```
 */
export async function [functionName](
  request: [FunctionName]Request
): Promise<[FunctionName]Response> {
  try {
    const res = await [SDK_METHOD]({
      // 根据 API 文档填写参数
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    return res.data as [FunctionName]Response;
  } catch (error: any) {
    console.error('[lib/[category]] ❌ [API_NAME] 失败:', error.message || error);
    throw new Error(`[API_NAME] 失败: ${error.message || error}`);
  }
}
