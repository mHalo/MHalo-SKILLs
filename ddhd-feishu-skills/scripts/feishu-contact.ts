/**
 * 飞书通讯录用户管理模块
 * 
 * 提供用户信息的查询功能，包括：
 * - 获取单个用户信息
 * - 批量获取用户信息
 * 
 * 使用示例：
 * ```typescript
 * import { getUserInfo, batchGetUserInfo } from './feishu-contact';
 * 
 * // 获取单个用户
 * const user = await getUserInfo('ou_xxxxxxxxxxxxxxxx');
 * 
 * // 批量获取用户
 * const users = await batchGetUserInfo(['ou_xxx1', 'ou_xxx2']);
 * ```
 */

import { client } from './feishu-client';
import * as lark from '@larksuiteoapi/node-sdk';

/**
 * 用户信息（简化版）
 */
export interface UserInfo {
  /** 用户的唯一标识 */
  user_id: string;
  /** 用户的邮箱 */
  email?: string;
  /** 用户的手机号 */
  mobile?: string;
  /** 用户的中文名 */
  name: string;
  /** 用户的英文名 */
  en_name?: string;
  /** 用户所属部门名称列表 */
  department_names?: string[];
  /** 用户的职位 */
  job_title?: string;
  /** 用户头像 */
  avatar?: {
    avatar_72?: string;
    avatar_240?: string;
    avatar_640?: string;
  };
  /** 用户状态 */
  status?: {
    is_activated: boolean;
    is_frozen: boolean;
    is_resigned: boolean;
  };
}

/**
 * 获取单个用户信息
 * 
 * 根据用户的 open_id 或 user_id 获取详细信息
 * 
 * @param userId - 用户 ID（open_id 或 user_id）
 * @param userIdType - 用户 ID 类型，默认为 'user_id'，可选：'open_id' | 'union_id' | 'user_id' | 'employee_id'
 * @returns 用户详细信息，如果用户不存在返回 null
 * @throws 调用失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 使用 open_id 获取用户
 * const user = await getUserInfo('ou_xxxxxxxxxxxxxxxx');
 * if (user) {
 *   console.log('用户名:', user.name);
 *   console.log('邮箱:', user.email);
 * }
 * 
 * // 使用 user_id 获取用户（默认，无需指定）
 * const user = await getUserInfo('2a3f36c4');
 * ```
 */
export async function getUserInfo(
  userId: string,
  userIdType: 'open_id' | 'union_id' | 'user_id' | 'employee_id' = 'user_id'
): Promise<UserInfo | null> {
  try {
    const res = await client.contact.v3.user.get({
      path: {
        user_id: userId,
      },
      params: {
        user_id_type: userIdType,
      },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    if (!res.data?.user) {
      return null;
    }

    return formatUserInfo(res.data.user);
  } catch (error: any) {
    // 处理用户不存在的错误
    if (error?.code === 99991401 || error?.msg?.includes('user not found')) {
      return null;
    }
    throw new Error(`获取用户信息失败: ${error.message || error}`);
  }
}

/**
 * 批量获取用户信息
 * 
 * 根据多个用户 ID 批量获取用户信息，一次最多支持 50 个用户
 * 
 * @param userIds - 用户 ID 数组（open_id 或 user_id）
 * @param userIdType - 用户 ID 类型，默认为 'open_id'，可选：'open_id' | 'union_id' | 'user_id'
 * @returns 用户信息数组，如果某个用户不存在则不会包含在结果中
 * @throws 调用失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 批量获取用户
 * const users = await batchGetUserInfo([
 *   'ou_xxxxxxxxxxxxxxxx1',
 *   'ou_xxxxxxxxxxxxxxxx2'
 * ]);
 * 
 * console.log(`成功获取 ${users.length} 个用户信息`);
 * users.forEach(user => {
 *   console.log(`${user.name}: ${user.email}`);
 * });
 * ```
 */
export async function batchGetUserInfo(
  userIds: string[],
  userIdType: 'open_id' | 'union_id' | 'user_id' = 'user_id'
): Promise<UserInfo[]> {
  // 参数校验
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  if (userIds.length > 50) {
    throw new Error('批量获取用户一次最多支持 50 个用户 ID');
  }

  try {
    const res = await client.contact.v3.user.batch({
      params: {
        user_ids: userIds,
        user_id_type: userIdType,
      },
    });

    if (res.code !== 0) {
      throw new Error(`飞书 API 错误: ${res.code} - ${res.msg}`);
    }

    // 注意：批量接口返回的数据在 items 中，且直接是用户对象（不是 {user: ...} 结构）
    const items = res.data?.items || [];
    if (items.length === 0) {
      return [];
    }

    // 直接格式化用户对象
    return items.map((item: any) => formatUserInfo(item));
  } catch (error: any) {
    throw new Error(`批量获取用户信息失败: ${error.message || error}`);
  }
}

/**
 * 批量获取用户信息（支持分批处理）
 * 
 * 当需要获取超过 50 个用户信息时，自动分批调用 API
 * 
 * @param userIds - 用户 ID 数组
 * @param userIdType - 用户 ID 类型，默认为 'open_id'
 * @returns 所有用户信息数组
 * @throws 调用失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 获取超过 50 个用户的信息
 * const allUserIds = Array.from({ length: 100 }, (_, i) => `ou_xxx${i}`);
 * const allUsers = await batchGetUserInfoWithPaging(allUserIds);
 * ```
 */
export async function batchGetUserInfoWithPaging(
  userIds: string[],
  userIdType: 'open_id' | 'union_id' | 'user_id' | 'employee_id' = 'user_id'
): Promise<UserInfo[]> {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const results: UserInfo[] = [];
  const batchSize = 50;

  // 分批处理
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const users = await batchGetUserInfo(batch, userIdType);
    results.push(...users);
  }

  return results;
}

/**
 * 格式化用户信息
 * 
 * 将飞书 SDK 返回的用户对象转换为更简洁的格式
 * 
 * @param user - 飞书 SDK 返回的用户对象
 * @returns 格式化后的用户信息
 */
function formatUserInfo(user: lark.contact.User): UserInfo {
  return {
    user_id: user.user_id || '',
    email: user.email || undefined,
    mobile: user.mobile || undefined,
    name: user.name || '',
    en_name: user.en_name || undefined,
    department_names: user.department_ids || undefined, // 注意：这里返回的是部门ID列表，如需部门名称需要额外查询
    job_title: user.job_title || undefined,
    avatar: user.avatar ? {
      avatar_72: user.avatar.avatar_72,
      avatar_240: user.avatar.avatar_240,
      avatar_640: user.avatar.avatar_640,
    } : undefined,
    status: user.status ? {
      is_activated: user.status.is_activated || false,
      is_frozen: user.status.is_frozen || false,
      is_resigned: user.status.is_resigned || false,
    } : undefined,
  };
}

// ==================== 本地测试代码 ====================
// 取消下面的注释可以进行本地测试（需要先在 .env 中配置好凭证）

// async function test() {
//   try {
//     // 测试获取单个用户
//     console.log('=== 测试获取单个用户 ===');
//     const singleUser = await getUserInfo('ou_xxxxxxxxxxxxxxxx');
//     console.log('单个用户:', JSON.stringify(singleUser, null, 2));
// 
//     // 测试批量获取用户
//     console.log('\n=== 测试批量获取用户 ===');
//     const batchUsers = await batchGetUserInfo([
//       'ou_xxxxxxxxxxxxxxxx1',
//       'ou_xxxxxxxxxxxxxxxx2',
//     ]);
//     console.log('批量用户:', JSON.stringify(batchUsers, null, 2));
//   } catch (error) {
//     console.error('测试失败:', error);
//   }
// }
// 
// test();
