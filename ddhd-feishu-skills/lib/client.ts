/**
 * 飞书客户端初始化模块
 * 
 * 该模块负责读取 .env 文件中的配置，创建并导出飞书 SDK 客户端实例。
 * 这是整个 SKILL 中唯一创建 client 的地方，所有 lib/ 和 scripts/ 中的代码
 * 都应该从这个模块导入 client。
 * 
 * 使用示例：
 * ```typescript
 * import { client } from '../lib/client';
 * 
 * // 调用飞书 API
 * const result = await client.contact.v3.users.get({
 *   user_id: 'ou_xxx'
 * });
 * ```
 */

import * as lark from '@larksuiteoapi/node-sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 加载 .env 文件（从项目根目录读取）
const envPath = path.resolve(process.cwd(), '.env');

// 检查 .env 文件是否存在
if (!fs.existsSync(envPath)) {
  console.warn(`[lib/client] 警告: 未找到 .env 文件，路径: ${envPath}`);
  console.warn('[lib/client] 提示: 请复制 .env.example 为 .env 并填写您的飞书应用凭证');
}

// 加载环境变量
dotenv.config({ path: envPath });

// 从环境变量读取配置
const appId = process.env.FEISHU_APP_ID;
const appSecret = process.env.FEISHU_APP_SECRET;
const domain = process.env.FEISHU_DOMAIN || 'https://open.feishu.cn';

// 验证必要配置
if (!appId || appId === 'your_app_id_here') {
  throw new Error(
    '[lib/client] 错误: 未配置 FEISHU_APP_ID\n' +
    '请检查 .env 文件是否正确配置，或在飞书开放平台获取应用凭证:\n' +
    'https://open.feishu.cn/app'
  );
}

if (!appSecret || appSecret === 'your_app_secret_here') {
  throw new Error(
    '[lib/client] 错误: 未配置 FEISHU_APP_SECRET\n' +
    '请检查 .env 文件是否正确配置'
  );
}

/**
 * 飞书 SDK 客户端实例
 * 
 * 该实例已完成认证配置，可直接用于调用飞书开放平台的各项 API。
 * SDK 会自动处理 access_token 的获取和刷新。
 * 
 * ⚠️ 重要：所有基础能力实现都应该使用这个 client，不要创建新的实例
 */
export const client = new lark.Client({
  appId,
  appSecret,
  appType: lark.AppType.SelfBuild, // 企业自建应用
  domain,
  // 可选：启用 token 缓存
  // enableTokenCache: true,
});

/**
 * 飞书客户端配置信息（只读）
 * 用于调试或展示当前连接的应用信息（已脱敏）
 */
export const clientConfig = {
  appId: appId.slice(0, 8) + '****' + appId.slice(-4),
  domain,
  isConfigured: true,
};

// 客户端初始化成功日志（仅在非测试环境输出）
if (process.env.NODE_ENV !== 'test') {
  console.log(`[lib/client] 飞书客户端初始化成功`);
  console.log(`[lib/client] 应用 ID: ${clientConfig.appId}`);
  console.log(`[lib/client] 平台域名: ${domain}`);
}

export default client;
